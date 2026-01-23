from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.call import CallStatus, DispositionType, CRMStatus


class CallCreate(BaseModel):
    phone_number: str
    language: str  # ru, uz, tj, auto
    tts_provider: str = "elevenlabs"  # elevenlabs, openai, yandex
    voice: str  # Voice ID (ElevenLabs ID or OpenAI voice name)
    greeting_message: str
    prompt: str
    funnel_goal: str  # Цель звонка (воронка)
    # Voice settings
    stability: Optional[float] = 0.5  # ElevenLabs only
    speed: Optional[float] = 1.0  # Both ElevenLabs and OpenAI
    similarity_boost: Optional[float] = 0.75  # ElevenLabs only


class CallResponse(BaseModel):
    id: int
    phone_number: str
    language: str
    tts_provider: str = "elevenlabs"
    voice: str
    greeting_message: str
    prompt: str
    funnel_goal: str
    status: CallStatus
    call_id: Optional[str] = None
    voximplant_call_id: Optional[str] = None
    duration: Optional[float] = None
    disposition: Optional[DispositionType] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    followup_message: Optional[str] = None
    customer_interest: Optional[str] = None
    funnel_achieved: Optional[bool] = None
    crm_status: CRMStatus
    telegram_link_sent: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CallListItem(BaseModel):
    id: int
    phone_number: str
    status: CallStatus
    disposition: Optional[DispositionType] = None
    duration: Optional[float] = None
    created_at: datetime
    crm_status: CRMStatus

    class Config:
        from_attributes = True


class CallAnalytics(BaseModel):
    total_calls: int
    talk_rate: float  # percentage
    interest_rate: float  # percentage
    avg_duration: float  # seconds
    funnel: dict  # {called: int, talked: int, interested: int, lead: int}
