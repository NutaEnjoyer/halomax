# Quick Start Guide - HALO AI

## Быстрый запуск за 5 минут

### 1. Запуск через Docker (рекомендуется)

```bash
# 1. Убедитесь, что Docker запущен
docker --version

# 2. Запустите все сервисы
docker-compose up --build

# 3. В новом терминале создайте админа
docker-compose exec backend python create_admin.py

# 4. Откройте браузер
# Frontend: http://localhost:3000
# Логин: admin / admin
```

### 2. Что вы получаете

**Фронтенд (порт 3000):**
- Страница входа
- Форма запуска звонка
- Мониторинг статуса звонка в реальном времени
- Панель аналитики с метриками и таблицей звонков
- Модальное окно с деталями звонка и транскриптом

**Бэкенд (порт 8000):**
- REST API с JWT авторизацией
- PostgreSQL база данных
- Интеграция с Voximplant API
- Анализ разговоров через OpenAI GPT
- Моковые транскрипты для тестирования

### 3. Тестирование системы

1. **Войдите в систему**
   - Откройте http://localhost:3000
   - Используйте admin/admin

2. **Запустите тестовый звонок**
   - Заполните форму:
     - Phone: +79999999999 (любой номер для теста)
     - Language: Russian
     - Voice: Female
     - Greeting: "Здравствуйте! Это HALO AI..."
     - Prompt: "You are a sales assistant..."
   - Нажмите "Start Demo Call"

3. **Наблюдайте за процессом**
   - Система покажет прогресс через все этапы
   - Процесс занимает ~10 секунд (моковый режим)

4. **Смотрите аналитику**
   - Нажмите "View Analytics"
   - Увидите метрики, воронку и таблицу звонков
   - Кликните "View Details" для просмотра транскрипта

### 4. API Documentation

После запуска откройте:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 5. Остановка

```bash
# Остановить все контейнеры
docker-compose down

# Удалить данные (полная очистка)
docker-compose down -v
```

### 6. Настройка для продакшена

Измените в `.env`:
```env
# Обязательно поменяйте!
SECRET_KEY=your-super-secret-key-here

# Добавьте реальные ключи
OPENAI_API_KEY=sk-proj-...
VOXIMPLANT_API_KEY=...

# База данных в продакшене
DATABASE_URL=postgresql://user:pass@production-db:5432/halo_db
```

### Troubleshooting

**Порт занят?**
```bash
# Измените порты в docker-compose.yml
ports:
  - "3001:3000"  # frontend
  - "8001:8000"  # backend
```

**База не создаётся?**
```bash
docker-compose down -v
docker-compose up --build
docker-compose exec backend python create_admin.py
```

**Фронтенд не подключается к бэкенду?**
- Проверьте, что оба контейнера запущены: `docker-compose ps`
- Проверьте логи: `docker-compose logs backend`
