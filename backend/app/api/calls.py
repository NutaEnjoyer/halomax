from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from datetime import datetime
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.call import Call, CallStatus, DispositionType, CRMStatus
from app.schemas.call import CallCreate, CallResponse, CallListItem, CallAnalytics
from app.services.voximplant import voximplant_service
from app.services.openai_service import openai_service
from app.services.mock_transcript import get_mock_transcript, get_mock_duration

router = APIRouter()


async def process_call_background(call_id: int, db: Session):
    """Background task to update call status to CALLING after initiation"""
    import asyncio
    from sqlalchemy.orm import sessionmaker
    from app.core.database import engine

    # Create new session for background task
    SessionLocal = sessionmaker(bind=engine)
    bg_db = SessionLocal()

    try:
        call = bg_db.query(Call).filter(Call.id == call_id).first()
        if not call:
            return

        # Update status to CALLING - real call is happening via Voximplant
        call.status = CallStatus.CALLING
        bg_db.commit()

        print(f"[Background] Call {call_id} status updated to CALLING")
        print(f"[Background] Waiting for webhook to receive transcript...")

    except Exception as e:
        print(f"Background task error: {e}")
        call.status = CallStatus.FAILED
        bg_db.commit()
    finally:
        bg_db.close()


async def process_transcript_analysis(call_id: int, db: Session):
    """Process transcript analysis after receiving it from webhook"""
    import asyncio
    from sqlalchemy.orm import sessionmaker
    from app.core.database import engine

    # Create new session for background task
    SessionLocal = sessionmaker(bind=engine)
    bg_db = SessionLocal()

    try:
        call = bg_db.query(Call).filter(Call.id == call_id).first()
        if not call:
            return

        print(f"[Analysis] Starting analysis for call {call_id}")

        # Step 1: Already in ANALYZING status, analyze with OpenAI
        analysis = await openai_service.analyze_conversation(
            transcript=call.transcript,
            prompt=call.prompt,
            funnel_goal=call.funnel_goal
        )

        call.summary = analysis.get("summary", "")
        call.disposition = DispositionType(analysis.get("disposition", "no_answer"))
        call.customer_interest = analysis.get("customer_interest", "")
        call.funnel_achieved = analysis.get("funnel_achieved", None)
        bg_db.commit()

        print(f"[Analysis] Analysis completed: {call.disposition}")

        # Step 2: Preparing follow-up
        call.status = CallStatus.PREPARING_FOLLOWUP
        bg_db.commit()
        await asyncio.sleep(1)

        call.followup_message = analysis.get("followup_message", "")
        bg_db.commit()

        print(f"[Analysis] Follow-up message prepared")

        # Step 3: Sending SMS (if interested)
        call.status = CallStatus.SENDING_SMS
        bg_db.commit()
        await asyncio.sleep(1)

        if call.disposition == DispositionType.INTERESTED:
            call.telegram_link_sent = True
            bg_db.commit()
            print(f"[Analysis] SMS/Telegram link sent")

        # Step 4: Adding to CRM
        call.status = CallStatus.ADDING_TO_CRM
        bg_db.commit()
        await asyncio.sleep(1)

        # Auto-determine CRM status based on disposition
        crm_status_value = analysis.get("crm_status", "pending")

        # Override: if interested, always add to CRM
        if call.disposition == DispositionType.INTERESTED:
            crm_status_value = "added"
        # If no answer/busy/wrong number, don't create CRM entry
        elif call.disposition in [DispositionType.NO_ANSWER, DispositionType.BUSY, DispositionType.WRONG_NUMBER]:
            crm_status_value = "not_created"

        call.crm_status = CRMStatus(crm_status_value)
        bg_db.commit()

        print(f"[Analysis] CRM status updated: {call.crm_status}")

        # Step 5: Completed
        call.status = CallStatus.COMPLETED
        call.completed_at = datetime.utcnow()
        bg_db.commit()

        print(f"[Analysis] Call {call_id} completed successfully")

    except Exception as e:
        print(f"[Analysis] Error: {e}")
        call.status = CallStatus.FAILED
        bg_db.commit()
    finally:
        bg_db.close()


@router.post("/calls", response_model=CallResponse)
async def create_call(
    call_data: CallCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initiate a new call"""
    # Create call record
    new_call = Call(
        phone_number=call_data.phone_number,
        language=call_data.language,
        voice=call_data.voice,
        greeting_message=call_data.greeting_message,
        prompt=call_data.prompt,
        funnel_goal=call_data.funnel_goal,
        status=CallStatus.INITIATING
    )

    db.add(new_call)
    db.commit()
    db.refresh(new_call)

    # Start Voximplant call (async)
    try:
        call_id = str(uuid.uuid4())
        voximplant_call_id = await voximplant_service.start_call(
            call_id=call_id,
            phone_number=call_data.phone_number,
            language=call_data.language,
            voice=call_data.voice,
            greeting_message=call_data.greeting_message,
            prompt=call_data.prompt,
            funnel_goal=call_data.funnel_goal,
            stability=call_data.stability,
            speed=call_data.speed,
            similarity_boost=call_data.similarity_boost
        )
        new_call.call_id = call_id
        new_call.voximplant_call_id = voximplant_call_id
        db.commit()
    except Exception as e:
        print(f"Voximplant call error: {e}")
        # Continue anyway for MVP

    # Process call in background
    background_tasks.add_task(process_call_background, new_call.id, db)

    return new_call


@router.get("/calls/{call_id}", response_model=CallResponse)
def get_call(
    call_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get call details by ID"""
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.get("/calls", response_model=List[CallListItem])
def list_calls(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all calls"""
    calls = db.query(Call).order_by(Call.created_at.desc()).offset(skip).limit(limit).all()
    return calls


@router.get("/analytics", response_model=CallAnalytics)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get call analytics"""
    total_calls = db.query(Call).count()

    if total_calls == 0:
        return CallAnalytics(
            total_calls=0,
            talk_rate=0.0,
            interest_rate=0.0,
            avg_duration=0.0,
            funnel={"called": 0, "talked": 0, "interested": 0, "lead": 0}
        )

    # Funnel metrics
    called = total_calls

    talked = db.query(Call).filter(
        Call.disposition.in_([
            DispositionType.INTERESTED,
            DispositionType.REJECTED,
            DispositionType.CONTINUE_IN_CHAT
        ])
    ).count()

    interested = db.query(Call).filter(
        Call.disposition == DispositionType.INTERESTED
    ).count()

    lead = db.query(Call).filter(
        Call.crm_status == CRMStatus.ADDED
    ).count()

    # Rates
    talk_rate = (talked / called * 100) if called > 0 else 0.0
    interest_rate = (interested / talked * 100) if talked > 0 else 0.0

    # Average duration
    avg_duration_result = db.query(func.avg(Call.duration)).filter(
        Call.duration.isnot(None)
    ).scalar()
    avg_duration = float(avg_duration_result) if avg_duration_result else 0.0

    return CallAnalytics(
        total_calls=total_calls,
        talk_rate=round(talk_rate, 2),
        interest_rate=round(interest_rate, 2),
        avg_duration=round(avg_duration, 2),
        funnel={
            "called": called,
            "talked": talked,
            "interested": interested,
            "lead": lead
        }
    )

@router.post("/call-transcript")
async def receive_call_transcript(
    call_data: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Receive call transcript from Voximplant webhook
    Expected data: {call_id, phone, transcript, raw_text}
    """
    try:
        import json
        print("=" * 80)
        print("🎯 WEBHOOK RECEIVED - TRANSCRIPT INCOMING!")
        print("=" * 80)
        print(f"[Webhook] Full payload received: {json.dumps(call_data, indent=2)}")

        call_id = call_data.get("call_id")
        phone = call_data.get("phone")
        duration = call_data.get("duration_seconds", 0)
        transcript = call_data.get("transcript", [])
        raw_text = call_data.get("raw_text", "")

        print(f"[Webhook] Received transcript for call_id: {call_id}")
        print(f"[Webhook] Phone: {phone}")
        print(f"[Webhook] Transcript array length: {len(transcript)}")
        print(f"[Webhook] Raw text length: {len(raw_text)}")
        print(f"[Webhook] Raw text: {raw_text[:200] if raw_text else 'EMPTY'}")

        # Find call by call_id
        call = db.query(Call).filter(Call.call_id == call_id).first()

        if not call:
            print(f"[Webhook] Call not found with call_id: {call_id}")
            return {"status": "error", "message": "Call not found"}


        # Update call with transcript
        call.duration = duration
        call.transcript = raw_text
        call.status = CallStatus.ANALYZING

        db.commit()
        db.refresh(call)

        print(f"[Webhook] Transcript saved for call ID: {call.id}")
        print("=" * 80)
        print("✅ TRANSCRIPT SUCCESSFULLY SAVED TO DATABASE")
        print(f"✅ Starting analysis for call ID: {call.id}")
        print("=" * 80)

        # Trigger analysis and full processing in background
        background_tasks.add_task(process_transcript_analysis, call.id, db)

        return {"status": "success", "message": "Transcript received"}

    except Exception as e:
        print("=" * 80)
        print("❌ WEBHOOK ERROR!")
        print("=" * 80)
        print(f"[Webhook] Error processing transcript: {e}")
        import traceback
        print(traceback.format_exc())
        print("=" * 80)
        return {"status": "error", "message": str(e)}
