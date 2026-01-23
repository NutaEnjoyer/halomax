import httpx
from app.core.config import settings
from typing import Optional


class VoximplantService:
    BASE_URL = "https://api.voximplant.com/platform_api"

    def __init__(self):
        self.account_id = settings.VOXIMPLANT_ACCOUNT_ID
        self.api_key = settings.VOXIMPLANT_API_KEY
        self.application_id = settings.VOXIMPLANT_APPLICATION_ID
        self.rule_id = settings.VOXIMPLANT_RULE_ID
        self.scenario_id = settings.VOXIMPLANT_SCENARIO_ID
        self.caller_id = settings.VOXIMPLANT_CALLER_ID
        self.webook_url = settings.WEBHOOK_URL
        self.openai_api_key = settings.OPENAI_API_KEY
        self.elevenlabs_api_key = settings.ELEVENLABS_API_KEY
        self.elevenlabs_agent_id = settings.ELEVENLABS_AGENT_ID
        self.yandex_api_key = settings.YANDEX_API_KEY
        self.yandex_folder_id = settings.YANDEX_FOLDER_ID

    # Temporary storage for call data (in production use database)
    _call_data_store = {}

    async def start_call(
        self,
        call_id: str,
        phone_number: str,
        language: str,
        tts_provider: str,
        voice: str,
        greeting_message: str,
        prompt: str,
        funnel_goal: str,
        stability: float = 0.5,
        speed: float = 1.0,
        similarity_boost: float = 0.75
    ) -> Optional[str]:
        """
        Initiates a call via Voximplant using script_custom_data
        TTS providers: elevenlabs, openai, yandex
        Returns: media_session_access_url or None
        """
        import json

        # Prepare custom data for scenario
        custom_data = {
            "call_id": call_id,
            "webhook_url": self.webook_url,
            "phone": phone_number,
            "caller_id": self.caller_id,
            "language": language,
            "tts_provider": tts_provider,
            "voice": voice,
            "greeting_message": greeting_message,
            "prompt": prompt,
            "funnel_goal": funnel_goal,
            "openai_api_key": self.openai_api_key,
            "elevenlabs_api_key": self.elevenlabs_api_key,
            "elevenlabs_agent_id": self.elevenlabs_agent_id,
            "yandex_api_key": self.yandex_api_key,
            "yandex_folder_id": self.yandex_folder_id,
            # Voice settings
            "stability": stability,
            "speed": speed,
            "similarity_boost": similarity_boost
        }

        print(f"[Voximplant] Starting call to {phone_number} with TTS: {tts_provider}")
        print(f"[Voximplant] Custom data: {json.dumps(custom_data)}")

        # Build form data with script_custom_data
        form_data = {
            "account_id": self.account_id,
            "api_key": self.api_key,
            "rule_id": self.rule_id,
            "script_custom_data": json.dumps(custom_data)
        }

        print(f"[Voximplant] Form data keys: {list(form_data.keys())}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/StartScenarios",
                    data=form_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )

                print(f"[Voximplant] Response status: {response.status_code}")
                print(f"[Voximplant] Response body: {response.text}")

                response.raise_for_status()
                result = response.json()

                if result.get("result"):
                    call_id = result.get("media_session_access_url")
                    print(f"[Voximplant] Call started successfully, ID: {call_id}")
                    return call_id
                else:
                    print(f"[Voximplant] API returned no result: {result}")
                    return None 

        except httpx.HTTPStatusError as e:
            print(f"[Voximplant] HTTP error {e.response.status_code}: {e.response.text}")
            return None
        except Exception as e:
            print(f"[Voximplant] API error: {e}")
            return None

    @staticmethod
    def get_call_data(call_id: str) -> Optional[dict]:
        """
        Retrieve stored call data by call_id
        This will be called by the webhook endpoint
        """
        return VoximplantService._call_data_store.get(call_id)

    async def get_call_history(self, call_id: str) -> Optional[dict]:
        """
        Get call history from Voximplant
        """
        params = {
            "account_id": self.account_id,
            "api_key": self.api_key,
            "call_session_history_id": call_id
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/GetCallHistory",
                    params=params
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Voximplant get call history error: {e}")
            return None


voximplant_service = VoximplantService()
