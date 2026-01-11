# Environment Variables Setup Guide

## Структура .env файлов

```
HALO_MAX/
├── .env                    # ← Основной файл (для Docker Compose)
└── backend/
    └── .env               # ← Копия (для локального запуска бэкенда)
```

## Какой файл когда используется?

### 1. Docker Compose запуск (рекомендуется)
```bash
docker-compose up
```
**Использует:** `/.env` (корневой)

Docker Compose читает переменные из корневого `.env` и передаёт их в контейнеры.

### 2. Локальный запуск бэкенда
```bash
cd backend
uvicorn app.main:app --reload
```
**Использует:** `/backend/.env`

FastAPI ищет `.env` в директории `backend/`.

### 3. Локальный запуск фронтенда
```bash
cd frontend
npm start
```
**Использует:** `/frontend/.env.local` (опционально)

Можно создать для переопределения `REACT_APP_API_URL`.

## Обязательные переменные

### Для работы системы нужны:

```env
# Database
DATABASE_URL=postgresql://halo_user:halo_password@postgres:5432/halo_db

# Security
SECRET_KEY=ваш-секретный-ключ-минимум-32-символа

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Voximplant
VOXIMPLANT_ACCOUNT_ID=10042950
VOXIMPLANT_API_KEY=633eadbc-6cb2-447e-a0b1-c40d2c5e4bef
VOXIMPLANT_APPLICATION_ID=47277483
VOXIMPLANT_RULE_ID=8111375
VOXIMPLANT_SCENARIO_ID=2994811
VOXIMPLANT_CALLER_ID=+78652594087
```

## Как обновить .env файлы

Если вы изменили корневой `.env`, обновите backend:

```bash
# Из корня проекта
cp .env backend/.env
```

## Различия для локального/Docker запуска

### DATABASE_URL

**Docker Compose:**
```env
DATABASE_URL=postgresql://halo_user:halo_password@postgres:5432/halo_db
                                                    ^^^^^^^^
                                                    имя сервиса из docker-compose.yml
```

**Локальный запуск:**
```env
DATABASE_URL=postgresql://halo_user:halo_password@localhost:5432/halo_db
                                                    ^^^^^^^^^
                                                    localhost вместо postgres
```

## Проверка переменных

Убедитесь, что все переменные установлены:

```bash
# Backend
docker-compose exec backend python -c "from app.core.config import settings; print(settings.OPENAI_API_KEY[:10])"

# Должен вывести первые 10 символов вашего API ключа
```

## Безопасность

⚠️ **Важно:**

1. Никогда не коммитьте `.env` в Git
2. Используйте `.env.example` для документации
3. В продакшене используйте переменные окружения, а не файлы

**Создайте `.env.example`:**

```bash
# Из корня проекта
cp .env .env.example

# Удалите секретные значения
sed -i 's/=.*/=your-value-here/g' .env.example
```

Тогда в репозитории будет `.env.example` с плейсхолдерами, а реальный `.env` в `.gitignore`.

## Troubleshooting

### "Missing OPENAI_API_KEY"

Проверьте:
1. Файл `.env` существует в нужной директории
2. Переменная записана без пробелов: `OPENAI_API_KEY=sk-...`
3. Файл перечитан после изменений (перезапустите контейнер)

```bash
docker-compose down
docker-compose up --build
```

### "Connection to postgres failed"

Проверьте:
1. `DATABASE_URL` использует `postgres` (не `localhost`) для Docker
2. PostgreSQL контейнер запущен: `docker-compose ps`
3. Дождитесь healthcheck: `docker-compose logs postgres`

### Переменные не подхватываются

```bash
# Пересоздайте контейнеры с новыми переменными
docker-compose up --build --force-recreate
```

## Frontend Environment Variables

Если нужно изменить API URL для фронтенда:

**Создайте** `/frontend/.env.local`:
```env
REACT_APP_API_URL=http://localhost:8000
```

Или измените в `docker-compose.yml`:
```yaml
frontend:
  environment:
    REACT_APP_API_URL: http://localhost:8000
```

## Production Setup

В продакшене **не используйте .env файлы**, используйте переменные окружения:

```bash
# Kubernetes ConfigMap/Secret
# AWS ECS Task Definition
# Docker Swarm secrets
# etc.
```

Пример для production:
```bash
export DATABASE_URL="postgresql://..."
export SECRET_KEY="$(openssl rand -hex 32)"
export OPENAI_API_KEY="sk-..."
# ...

uvicorn app.main:app --host 0.0.0.0 --port 8000
```
