from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Enum, Boolean
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class CallStatus(str, enum.Enum):
    INITIATING = "initiating"
    CALLING = "calling"
    ANALYZING = "analyzing"
    PREPARING_FOLLOWUP = "preparing_followup"
    SENDING_SMS = "sending_sms"
    ADDING_TO_CRM = "adding_to_crm"
    COMPLETED = "completed"
    FAILED = "failed"


class DispositionType(str, enum.Enum):
    INTERESTED = "interested"
    REJECTED = "rejected"
    NO_ANSWER = "no_answer"
    BUSY = "busy"
    WRONG_NUMBER = "wrong_number"
    CONTINUE_IN_CHAT = "continue_in_chat"


class CRMStatus(str, enum.Enum):
    ADDED = "added"
    PENDING = "pending"
    NOT_CREATED = "not_created"


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)

    # Call info
    phone_number = Column(String, nullable=False)
    language = Column(String, nullable=False)  # ru, uz, tj, auto
    tts_provider = Column(String, nullable=False, default="elevenlabs")  # elevenlabs, openai, yandex
    voice = Column(String, nullable=False)  # Voice ID or name
    greeting_message = Column(Text, nullable=False)
    prompt = Column(Text, nullable=False)
    funnel_goal = Column(Text, nullable=False)  # Цель звонка (воронка)

    # Status tracking
    status = Column(Enum(CallStatus), default=CallStatus.INITIATING)

    # Call internal id
    call_id = Column(String, nullable=True)

    # Call results
    voximplant_call_id = Column(String, nullable=True)
    duration = Column(Float, nullable=True)  # in seconds
    disposition = Column(Enum(DispositionType), nullable=True)

    # AI Analysis
    transcript = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    followup_message = Column(Text, nullable=True)
    customer_interest = Column(Text, nullable=True)
    funnel_achieved = Column(Boolean, nullable=True)  # Достигнута ли цель воронки

    # CRM
    crm_status = Column(Enum(CRMStatus), default=CRMStatus.PENDING)
    telegram_link_sent = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
