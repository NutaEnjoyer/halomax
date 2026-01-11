"""
Mock transcript generator for testing purposes.
Will be replaced with actual Voximplant transcript retrieval later.
"""
import random


MOCK_TRANSCRIPTS = [
    """AI: Здравствуйте! Это HALO AI. Меня зовут Алиса. Я звоню, чтобы рассказать о нашей новой платформе для автоматизации звонков. Вам удобно сейчас разговаривать?

Customer: Да, слушаю.

AI: Отлично! HALO AI помогает компаниям автоматизировать исходящие звонки с помощью искусственного интеллекта. Наша система может вести естественные диалоги, отвечать на вопросы клиентов и фиксировать результаты в CRM. Вас интересует автоматизация продаж?

Customer: Звучит интересно. А какая стоимость?

AI: Стоимость зависит от объема звонков. Базовый тариф начинается от 50,000 рублей в месяц за 1000 звонков. Я могу выслать вам детальный прайс-лист и назначить демонстрацию. Какой email удобен для отправки?

Customer: info@example.com

AI: Спасибо! Отправляю информацию. Когда вам удобно посмотреть демо? Могу предложить завтра в 14:00 или послезавтра в 11:00.

Customer: Давайте завтра в 14:00.

AI: Отлично! Записал встречу на завтра в 14:00. Также продублирую детали в Telegram. Спасибо за уделенное время!

Customer: Спасибо, до свидания.""",

    """AI: Good afternoon! This is HALO AI calling. My name is Alex. I'm reaching out to tell you about our AI-powered call automation platform. Is now a good time to talk?

Customer: Not really, I'm busy right now.

AI: I understand. Would it be convenient if I call back later today or tomorrow?

Customer: No thanks, not interested.

AI: I understand. Thank you for your time. Have a great day!

Customer: Bye.""",

    """AI: Здравствуйте! Это HALO AI. Хотел рассказать о нашей платформе для автоматизации звонков.

Customer: [No response - voicemail]

AI: Оставляю сообщение. HALO AI предлагает автоматизацию исходящих звонков. Если интересно, свяжитесь с нами по телефону +7-800-555-1234. Спасибо!""",

    """AI: Hello! This is HALO AI. I'm calling about our automated calling solution for sales teams. Do you have a moment?

Customer: Sure, but make it quick.

AI: Absolutely. HALO AI uses artificial intelligence to make outbound calls, qualify leads, and schedule appointments. It works 24/7 and can handle hundreds of calls simultaneously. Does your company use outbound calling?

Customer: Yes, we have a sales team that makes about 500 calls a week.

AI: Perfect! Our system could handle that volume easily and free up your team for more strategic work. Can I send you a case study showing 40% improvement in conversion rates?

Customer: Yeah, send it over. My email is john@company.com

AI: Excellent! I'm sending the materials now. I'll also include a link to book a demo. Would you prefer a call or chat follow-up?

Customer: Chat is better.

AI: Perfect! I'll send you a Telegram link. Thanks for your time, John!

Customer: Thanks, bye!"""
]


def get_mock_transcript() -> str:
    """Returns a random mock transcript"""
    return random.choice(MOCK_TRANSCRIPTS)


def get_mock_duration() -> float:
    """Returns a random call duration between 30-180 seconds"""
    return round(random.uniform(30.0, 180.0), 2)
