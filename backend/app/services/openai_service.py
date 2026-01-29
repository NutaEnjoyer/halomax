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

ВНИМАТЕЛЬНО определи статус по следующим критериям:

"interested" — Клиент ПРОЯВИЛ ОСОЗНАННЫЙ ИНТЕРЕС

Используется ТОЛЬКО ЕСЛИ выполнено хотя бы одно из условий ниже:

• Клиент обсуждает продукт, услугу или свою задачу
• Клиент отвечает на вопросы о бизнесе / потребностях
• Клиент задаёт уточняющие вопросы
• Клиент согласился получить информацию о продукте
• Клиент договорился о встрече / звонке / продолжении общения
• Клиент явно подтвердил, что ему это может быть полезно

НЕ СЧИТАЕТСЯ "interested":
«да»
«удобно»
«можно»
«слушаю»
«говорите»

И любые ответы, которые только подтверждают начало разговора

"rejected" — ИНТЕРЕС НЕ ПРОЯВЛЕН

Используется, если разговор завершён или оборвался, и при этом:
• Клиент не проявил интереса к продукту
• Клиент не обсуждал свою задачу или бизнес
• Клиент не дал согласия на получение информации
• С клиентом не было договорённостей о продолжении контакта

В том числе:
• Разговор закончился на этапе приветствия / установления контакта
• Клиент дал только формальные ответы без вовлечения
• Диалог прервался до выявления потребности

 Даже если клиент сказал «удобно», но дальше разговор не развился — это rejected.

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
• Когда только гудки, тишина, автоответчик (без реального общения)"""

        if funnel_goal:
            analysis_prompt += """
6. **funnel_achieved**: Boolean (true/false) - Была ли достигнута цель воронки во время этого звонка? Проанализируй, была ли выполнена указанная выше цель."""

        analysis_prompt += "\n\nВерни ТОЛЬКО валидный JSON, никакого дополнительного текста."

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
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
