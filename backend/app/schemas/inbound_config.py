from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class InboundConfigCreate(BaseModel):
    language: str = "ru"
    voice: str = "3EuKHIEZbSzrHGNmdYsx"
    greeting_message: str = "Здравствуйте! Чем могу помочь?"
    prompt: str = "Ты - полезный ассистент. Помогай клиентам с их вопросами."
    funnel_goal: str = "Помочь клиенту решить его вопрос"
    is_active: bool = True


class InboundConfigUpdate(BaseModel):
    language: Optional[str] = None
    voice: Optional[str] = None
    greeting_message: Optional[str] = None
    prompt: Optional[str] = None
    funnel_goal: Optional[str] = None
    is_active: Optional[bool] = None


class InboundConfigResponse(BaseModel):
    id: int
    language: str
    voice: str
    greeting_message: str
    prompt: str
    funnel_goal: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схема для вебхука Voximplant (получение конфига при входящем звонке)
class InboundConfigForVoximplant(BaseModel):
    language: str
    voice: str
    greeting_message: str
    prompt: str
    funnel_goal: str
    elevenlabs_api_key: str
    elevenlabs_agent_id: str
