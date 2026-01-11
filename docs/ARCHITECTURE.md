# HALO AI - Архитектура проекта

## Обзор системы

HALO AI - это MVP платформа для автоматизации исходящих звонков с использованием искусственного интеллекта. Система состоит из трёх основных компонентов:

1. **Frontend** (React + Tailwind CSS)
2. **Backend** (FastAPI + PostgreSQL)
3. **External Services** (Voximplant + OpenAI)

## Архитектурная диаграмма

```
┌─────────────┐          ┌──────────────┐          ┌─────────────┐
│   Browser   │◄────────►│   Frontend   │◄────────►│   Backend   │
│  (User UI)  │  HTTP    │  React App   │   REST   │  FastAPI    │
└─────────────┘          └──────────────┘   API    └──────┬──────┘
                                                           │
                                                           ├─► PostgreSQL
                                                           │   (Calls DB)
                                                           │
                                                           ├─► OpenAI API
                                                           │   (GPT Analysis)
                                                           │
                                                           └─► Voximplant
                                                               (Voice Calls)
```

## Backend Architecture

### Структура директорий

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py       # Authentication routes
│   │   ├── calls.py      # Call management routes
│   │   └── deps.py       # Dependencies (JWT validation)
│   │
│   ├── core/             # Core configuration
│   │   ├── config.py     # Settings from .env
│   │   ├── database.py   # SQLAlchemy setup
│   │   └── security.py   # JWT, password hashing
│   │
│   ├── models/           # Database models
│   │   ├── user.py       # User model
│   │   └── call.py       # Call model + enums
│   │
│   ├── schemas/          # Pydantic schemas
│   │   ├── auth.py       # Login, Token schemas
│   │   └── call.py       # Call request/response schemas
│   │
│   ├── services/         # Business logic
│   │   ├── voximplant.py      # Voximplant API client
│   │   ├── openai_service.py  # OpenAI GPT integration
│   │   └── mock_transcript.py # Mock data generator
│   │
│   └── main.py           # FastAPI app entry point
│
├── alembic/              # Database migrations
└── create_admin.py       # Admin user creation script
```

### База данных (PostgreSQL)

**Таблица: users**
```sql
- id (PK)
- username (unique)
- hashed_password
- is_active
```

**Таблица: calls**
```sql
- id (PK)
- phone_number
- language (ru, uz, tj, auto)
- voice (male, female, neutral)
- greeting_message
- prompt
- status (enum: initiating → calling → analyzing → ... → completed)
- voximplant_call_id
- duration
- disposition (enum: interested, rejected, no_answer, busy, etc.)
- transcript (text)
- summary (text)
- followup_message (text)
- customer_interest (text)
- crm_status (enum: added, pending, not_created)
- telegram_link_sent (bool)
- created_at
- updated_at
- completed_at
```

### API Endpoints

**Authentication:**
- `POST /api/auth/login` → JWT token

**Calls:**
- `POST /api/calls` → Create call (starts background processing)
- `GET /api/calls/{id}` → Get call details (for polling)
- `GET /api/calls` → List all calls
- `GET /api/analytics` → Get metrics and funnel data

### Background Processing Flow

Когда создаётся звонок через `POST /api/calls`:

1. **Initiating**: Сохраняем звонок в БД
2. **Background Task** запускается:
   - **Calling**: Отправляем запрос в Voximplant API
   - Ждём завершения (в MVP - моковый транскрипт)
   - **Analyzing**: Отправляем транскрипт в OpenAI GPT
   - Получаем: summary, disposition, followup, interest, crm_status
   - **Preparing Follow-up**: Формируем сообщение
   - **Sending SMS**: (mock) Имитируем отправку SMS
   - **Adding to CRM**: Устанавливаем CRM статус
   - **Completed**: Фиксируем время завершения

Фронтенд опрашивает `GET /api/calls/{id}` каждые 2 секунды.

## Frontend Architecture

### Структура директорий

```
frontend/src/
├── components/
│   └── CallDetailsModal.jsx  # Modal with transcript
│
├── pages/
│   ├── Login.jsx             # Login page
│   ├── StartCall.jsx         # Call form
│   ├── CallStatus.jsx        # Status tracker (polling)
│   └── Analytics.jsx         # Dashboard + table
│
├── services/
│   └── api.js                # Axios client + API methods
│
├── utils/
│   └── auth.js               # JWT token helpers
│
├── App.jsx                   # Routes + PrivateRoute
├── index.js                  # React entry point
└── index.css                 # Tailwind imports
```

### User Flow

1. **Login** (`/login`)
   - Ввод admin/admin
   - Получение JWT token
   - Сохранение в localStorage
   - Redirect на `/`

2. **Start Call** (`/`)
   - Форма с полями: phone, language, voice, greeting, prompt
   - Submit → `POST /api/calls`
   - Redirect на `/call-status/{id}`

3. **Call Status** (`/call-status/:callId`)
   - Polling каждые 2 секунды
   - Показ прогресса через 6 этапов
   - По завершению → кнопка "View Analytics"

4. **Analytics** (`/analytics`)
   - Карточки метрик (Total, Talk Rate, Interest Rate, Avg Duration)
   - Воронка (called → talked → interested → lead)
   - Таблица звонков с кнопкой "View Details"

5. **Call Details Modal**
   - Дата, длительность, disposition
   - Summary
   - CRM блок (status, interest, telegram link)
   - Follow-up message
   - Transcript (expandable)

## External Services Integration

### Voximplant

**Сервис:** `backend/app/services/voximplant.py`

**Метод:** `start_call(phone, language, voice, greeting, prompt)`
- Вызывает Voximplant API: `POST /StartScenarios`
- Передаёт `custom_data` в сценарий
- Возвращает `call_id`

**Сценарий:** `VOXIMPLANT_SCENARIO.js`
- Получает customData
- Инициирует звонок через OpenAI Realtime API
- Настраивает голос, язык, приветствие
- Возвращает транскрипт (в будущем)

### OpenAI

**Сервис:** `backend/app/services/openai_service.py`

**Метод:** `analyze_conversation(transcript, prompt)`
- Отправляет промпт + транскрипт в GPT-4
- Запрашивает JSON с полями:
  - `disposition`
  - `summary`
  - `followup_message`
  - `customer_interest`
  - `crm_status`
- Возвращает parsed JSON

## Security

1. **JWT Authentication**
   - Bearer token в заголовках
   - HS256 алгоритм
   - Expiry: 7 дней

2. **Password Hashing**
   - bcrypt через passlib

3. **CORS**
   - Разрешены только localhost:3000, localhost:8000

## Deployment

### Docker Compose Stack

```yaml
services:
  postgres:     # Database
  backend:      # FastAPI app
  frontend:     # React app (dev server)
```

### Environment Variables

Критические переменные в `.env`:
- `DATABASE_URL`
- `SECRET_KEY`
- `OPENAI_API_KEY`
- `VOXIMPLANT_*` (6 переменных)

## Current Limitations (MVP)

1. **Mock Transcript**: Используются готовые примеры диалогов
   - Реальная интеграция с Voximplant transcript API - в разработке

2. **No Real SMS**: Флаг `telegram_link_sent` устанавливается mock-логикой

3. **Single User**: Только один admin пользователь

4. **No Telegram Bot**: Интеграция запланирована

## Next Steps

### Phase 1: Production Ready
- [ ] Настроить получение реального транскрипта от Voximplant
- [ ] Добавить обработку ошибок Voximplant API
- [ ] Настроить логирование (структурированное)
- [ ] Добавить юнит-тесты
- [ ] Production Docker setup (Nginx, Gunicorn)

### Phase 2: Features
- [ ] Telegram bot для follow-up сообщений
- [ ] SMS отправка через провайдера
- [ ] Библиотека шаблонов промптов
- [ ] Настройка воронки для каждого проекта
- [ ] Multi-user с ролями

### Phase 3: Integrations
- [ ] CRM webhooks (Salesforce, HubSpot)
- [ ] Export отчётов (CSV, Excel)
- [ ] Календарь для scheduled calls
- [ ] A/B тестирование промптов

## Performance Considerations

1. **Polling Optimization**
   - Текущий: каждые 2 секунды
   - Будущее: WebSocket для real-time updates

2. **Database Indexes**
   - created_at (для сортировки)
   - phone_number (для поиска)
   - disposition, crm_status (для аналитики)

3. **Caching**
   - Analytics endpoint можно кэшировать на 10-30 секунд
   - Redis для session storage

## Monitoring & Observability

Рекомендуемый стек:
- **Logs**: Structured logging (JSON) → ELK/Loki
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry → Jaeger
- **Alerts**: Alertmanager

Key metrics:
- Call success rate
- Average processing time
- OpenAI API latency
- Voximplant errors
- Database query performance
