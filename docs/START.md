# HALO AI - Быстрый старт

## ✅ Что готово и работает

### Backend + PostgreSQL (в Docker)
```bash
docker-compose up -d
```

Проверка:
- Backend API: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Admin пользователь создан:
- Username: `admin`
- Password: `admin`

## 🚀 Запуск проекта

### Вариант 1: Backend в Docker + Frontend локально (РЕКОМЕНДУЕТСЯ)

**1. Запустить backend и БД:**
```bash
cd C:\Users\user\Desktop\HALO_MAX
docker-compose up -d
```

**2. Запустить frontend локально:**
```bash
cd frontend
npm install
npm start
```

Frontend откроется на http://localhost:3000

### Вариант 2: Только backend (для API тестирования)

```bash
docker-compose up -d
```

Затем используйте:
- Swagger UI: http://localhost:8000/docs
- Curl/Postman для тестирования API

## 📝 API Endpoints

### Authentication
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

Ответ:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### Создание звонка
```bash
curl -X POST http://localhost:8000/api/calls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone_number": "+79999999999",
    "language": "ru",
    "voice": "female",
    "greeting_message": "Здравствуйте! Это HALO AI.",
    "prompt": "You are a helpful sales assistant."
  }'
```

### Получить статус звонка
```bash
curl http://localhost:8000/api/calls/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Аналитика
```bash
curl http://localhost:8000/api/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Если что-то не работает

### Backend не запускается
```bash
docker-compose down
docker-compose up --build -d
docker-compose logs backend
```

### Пересоздать админа
```bash
docker-compose exec backend python create_admin.py
```

### Проверить статус контейнеров
```bash
docker-compose ps
```

Должно быть:
```
halo_backend    Up
halo_postgres   Up (healthy)
```

### Очистить всё и начать заново
```bash
docker-compose down -v
docker-compose up --build -d
docker-compose exec backend python create_admin.py
```

## 📊 Тестирование полного flow

1. **Логин** → получить token
2. **Создать звонок** → получить `call_id`
3. **Опрашивать статус** каждые 2 секунды: `GET /api/calls/{call_id}`
4. **Посмотреть результаты** когда `status = "completed"`
5. **Аналитика**: `GET /api/analytics`

## 🎯 Что работает

- ✅ JWT авторизация (admin/admin)
- ✅ Создание звонков через API
- ✅ Background обработка звонков (6 этапов)
- ✅ Mock транскрипты (4 примера диалогов)
- ✅ Анализ через OpenAI GPT-4
  - Summary
  - Disposition
  - Follow-up message
  - Customer interest
  - CRM status
- ✅ Воронка метрик (called → talked → interested → lead)
- ✅ Статистика (Talk Rate, Interest Rate, Avg Duration)
- ✅ Полная таблица звонков

## 📁 Структура проекта

```
HALO_MAX/
├── backend/              ✅ Работает в Docker
│   ├── app/
│   │   ├── api/         # Auth + Calls endpoints
│   │   ├── core/        # Config, DB, Security
│   │   ├── models/      # User, Call models
│   │   ├── services/    # Voximplant, OpenAI, Mocks
│   │   └── main.py
│   └── create_admin.py
│
├── frontend/             📝 Запускать локально (npm start)
│   ├── src/
│   │   ├── pages/       # Login, StartCall, CallStatus, Analytics
│   │   └── components/  # CallDetailsModal
│   └── package.json
│
└── docker-compose.yml    # Backend + PostgreSQL
```

## 🔥 Что дальше

1. Запустить frontend локально
2. Протестировать полный flow через UI
3. Проверить все экраны из ТЗ
4. Добавить реальную интеграцию Voximplant transcript (когда нужно)

Всё готово к работе! 🚀
