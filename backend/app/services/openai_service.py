from openai import AsyncOpenAI
from app.core.config import settings
from typing import Optional


class OpenAIService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    async def analyze_conversation(
        self,
        transcript: str,
        prompt: str,
        funnel_goal: str = None
    ) -> dict:
        """
        Analyzes conversation and returns:
        - summary
        - disposition
        - followup_message
        - customer_interest
        - crm_status
        - funnel_achieved (if funnel_goal provided)
        """

        funnel_section = ""
        if funnel_goal:
            funnel_section = f"""
ЦЕЛЬ ЗВОНКА (ВОРОНКА):
{funnel_goal}

"""

        analysis_prompt = f"""
Ты анализируешь запись телефонного звонка продаж. На основе транскрипции и оригинального промпта предоставь детальный анализ.

ОРИГИНАЛЬНЫЙ ПРОМПТ:
{prompt}

{funnel_section}ТРАНСКРИПЦИЯ:
{transcript}

Пожалуйста, проанализируй и предоставь следующее в формате JSON (ВСЕ ТЕКСТОВЫЕ ПОЛЯ ДОЛЖНЫ БЫТЬ НА РУССКОМ ЯЗЫКЕ):

1. **disposition**: ВНИМАТЕЛЬНО определи статус по следующим критериям:

"interested" — Клиент выразил интерес или согласился на дальнейшее взаимодействие
• Когда цель воронки в разговоре была достигнута
• Когда в разговоре происходят договорённости о продолжении общения
• Когда клиент согласился получить информацию
• Когда договорились о встрече
• Когда клиент дал согласие на дальнейшие контакты
• Когда клиент задаёт уточняющие вопросы о продукте / услуге
• Когда обсуждаются детали сотрудничества

"rejected" — Клиент явно отказался, разговор прерван без договорённостей
• Когда на вопрос оператора не дают ответ и диалог прерывается
• Когда клиент говорит "Нет, спасибо", "Не интересует", "Не нужно"
• Когда клиент вешает трубку без договорённостей
• Когда клиент явно отказывается от предложения
• Когда нет никаких договорённостей о дальнейших контактах

"continue_in_chat" — Договорились продолжить общение в чате / мессенджере
• Когда обе стороны согласились общаться через чат, Telegram, WhatsApp и т.д.
• Когда оператор предложил перенести разговор в текстовый формат и клиент согласился
• Когда договорились обмениваться информацией через мессенджер

"busy" — Клиент говорит, что сейчас занят и отключается
• Когда человек в диалоге говорит "Я занят", "Мне некогда", "Позвоните позже"
• Когда клиент просит перезвонить в другое время
• Когда клиент говорит "У меня нет времени" и вешает трубку
• Когда договорились о перезвоне в конкретное время

"wrong_number" — Оператор попал не туда
• Когда человек говорит "Вы ошиблись", "Не туда попали", "Это не моё"
• Когда клиент говорит, что это не его номер или не его компания
• Когда номер недействителен или принадлежит другому лицу

"no_answer" — Диалога нет совсем, нечего анализировать
• Когда диалога вообще нет
• Когда транскрипции нет (звонок не состоялся, никто не ответил)
• Когда только гудки, тишина, автоответчик (без реального общения)

2. **summary**: Краткое резюме разговора (1-3 предложения) НА РУССКОМ ЯЗЫКЕ
3. **followup_message**: Короткое последующее сообщение (1-3 предложения + призыв к действию) для отправки клиенту НА РУССКОМ ЯЗЫКЕ
4. **customer_interest**: Краткое описание того, что именно заинтересовало клиента (или "Не заинтересован" если отказался) НА РУССКОМ ЯЗЫКЕ
5. **crm_status**: Одно из: "added" (если заинтересован), "not_created" (если не ответил/занят/неправильный номер), "pending" (другие случаи)"""

        if funnel_goal:
            analysis_prompt += """
6. **funnel_achieved**: Boolean (true/false) - Была ли достигнута цель воронки во время этого звонка? Проанализируй, была ли выполнена указанная выше цель."""

        analysis_prompt += "\n\nВерни ТОЛЬКО валидный JSON, никакого дополнительного текста."

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Ты аналитик телефонных звонков продаж. Всегда отвечай только валидным JSON, без дополнительного текста или форматирования. Все текстовые поля должны быть на русском языке."},
                    {"role": "user", "content": analysis_prompt}
                ],
                temperature=0.7
            )

            content = response.choices[0].message.content.strip()

            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()

            import json
            result = json.loads(content)

            return result

        except Exception as e:
            print(f"OpenAI analysis error: {e}")
            # Return default values on error
            return {
                "disposition": "no_answer",
                "summary": "Анализ не удался",
                "followup_message": "Спасибо за ваше время.",
                "customer_interest": "Неизвестно",
                "crm_status": "not_created"
            }


openai_service = OpenAIService()
