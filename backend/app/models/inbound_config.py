from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class InboundConfig(Base):
    """Конфигурация для входящих звонков"""
    __tablename__ = "inbound_configs"

    id = Column(Integer, primary_key=True, index=True)

    # Настройки голоса и языка
    language = Column(String, default="ru")  # ru, uz, tj, auto
    voice = Column(String, default="3EuKHIEZbSzrHGNmdYsx")  # ElevenLabs voice ID

    # Сообщения и промпт
    greeting_message = Column(Text, default="Здравствуйте! Чем могу помочь?")
    prompt = Column(Text, default="Ты - полезный ассистент. Помогай клиентам с их вопросами.")
    funnel_goal = Column(Text, default="Помочь клиенту решить его вопрос")

    # Активность конфига
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
