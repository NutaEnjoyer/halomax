import requests
import os

# API ключ лучше брать из переменных окружения
API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not API_KEY:
    API_KEY = "sk_a21dfb53a9cfb28292d4a94474dc31bf4e4766c8afc59d89"  # ← твой ключ (не публикуй в git!)

headers = {
    "xi-api-key": API_KEY,
    "Content-Type": "application/json"
}

payload = {
    "name": "Test agent",
    "conversation_config": {
        "agent": {
            "language": "ru",
            "prompt": {
                "first_message": "Привет! Я здесь."
            },
            "voice": {
                "voice_id": "21m00Tcm4TlvDq8ikWAM"   # Rachel — поддерживает русский
            }
        },
        "tts": {                               # ← этот блок решает проблему
            "model_id": "eleven_turbo_v2_5"    # или "eleven_flash_v2_5" — если нужна ещё меньшая задержка
        }
        # Можно добавить (опционально):
        # "asr": {...},
        # "turn": {...},
        # "vad": {...}
    }
}

response = requests.post(
    "https://api.elevenlabs.io/v1/convai/agents/create",
    headers=headers,
    json=payload
)

if response.status_code in (200, 201):
    data = response.json()
    agent_id = data.get("agent_id")
    print(f"Агент успешно создан! ID: {agent_id}")
    print("Полный ответ сервера:", data)
else:
    print(f"Ошибка {response.status_code}")
    print("Ответ сервера:", response.text)