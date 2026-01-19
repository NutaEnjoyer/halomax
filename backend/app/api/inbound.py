from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.inbound_config import InboundConfig
from app.schemas.inbound_config import (
    InboundConfigCreate,
    InboundConfigUpdate,
    InboundConfigResponse,
    InboundConfigForVoximplant
)

router = APIRouter(prefix="/inbound", tags=["inbound"])


@router.get("/config", response_model=InboundConfigResponse)
async def get_inbound_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить текущую конфигурацию входящих звонков"""
    config = db.query(InboundConfig).first()

    if not config:
        # Создаём конфиг по умолчанию если его нет
        config = InboundConfig()
        db.add(config)
        db.commit()
        db.refresh(config)

    return config


@router.put("/config", response_model=InboundConfigResponse)
async def update_inbound_config(
    config_update: InboundConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить конфигурацию входящих звонков"""
    config = db.query(InboundConfig).first()

    if not config:
        # Создаём конфиг если его нет
        config = InboundConfig()
        db.add(config)
        db.commit()
        db.refresh(config)

    # Обновляем только переданные поля
    update_data = config_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    db.commit()
    db.refresh(config)

    return config


# Вебхук для Voximplant - получение конфига при входящем звонке
@router.get("/webhook/config", response_model=InboundConfigForVoximplant)
async def get_config_for_voximplant(
    db: Session = Depends(get_db)
):
    """
    Вебхук для Voximplant.
    Возвращает конфигурацию для обработки входящего звонка.
    Не требует авторизации (вызывается из Voximplant сценария).
    """
    config = db.query(InboundConfig).filter(InboundConfig.is_active == True).first()

    if not config:
        # Возвращаем дефолтные значения если конфига нет
        return InboundConfigForVoximplant(
            language="ru",
            voice="3EuKHIEZbSzrHGNmdYsx",
            greeting_message="Здравствуйте! Чем могу помочь?",
            prompt="Ты - полезный ассистент. Помогай клиентам с их вопросами.",
            funnel_goal="Помочь клиенту решить его вопрос",
            elevenlabs_api_key=settings.ELEVENLABS_API_KEY,
            elevenlabs_agent_id=settings.ELEVENLABS_AGENT_ID
        )

    return InboundConfigForVoximplant(
        language=config.language,
        voice=config.voice,
        greeting_message=config.greeting_message,
        prompt=config.prompt,
        funnel_goal=config.funnel_goal,
        elevenlabs_api_key=settings.ELEVENLABS_API_KEY,
        elevenlabs_agent_id=settings.ELEVENLABS_AGENT_ID
    )
