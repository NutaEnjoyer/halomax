# HALO AI - AI-Powered Call Automation Platform

HALO AI is an MVP platform for automating outbound sales calls using AI. The system integrates with Voximplant for voice calls and OpenAI for conversation analysis.

## Features

- **AI-Powered Calls**: Automated outbound calls with natural conversation
- **Real-time Status Tracking**: Monitor call progress through multiple stages
- **Conversation Analysis**: Automatic summary, disposition, and follow-up generation
- **Analytics Dashboard**: Track call metrics, conversion rates, and funnel performance
- **CRM Integration Ready**: Automatic lead classification and status tracking

## Tech Stack

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM
- OpenAI API
- Voximplant API

### Frontend
- React 18
- Tailwind CSS
- React Router
- Axios

### Infrastructure
- Docker & Docker Compose
- Alembic (database migrations)

## Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key
- Voximplant account credentials

### Setup

1. **Clone the repository**
   ```bash
   cd HALO_MAX
   ```

2. **Configure environment variables**

   Copy the `.env` file from root and add your credentials:
   ```bash
   cp .env .env.local
   ```

   Update the following in `.env`:
   ```env
   OPENAI_API_KEY=your-openai-key-here
   VOXIMPLANT_ACCOUNT_ID=your-account-id
   VOXIMPLANT_API_KEY=your-api-key
   # ... other Voximplant credentials
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

   This will start:
   - PostgreSQL database (port 5432)
   - Backend API (port 8000)
   - Frontend app (port 3000)

4. **Create admin user**

   In a new terminal:
   ```bash
   docker-compose exec backend python create_admin.py
   ```

   Default credentials:
   - Username: `admin`
   - Password: `admin`

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Manual Setup (without Docker)

### Backend Setup

1. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Setup PostgreSQL database**
   ```bash
   createdb halo_db
   ```

3. **Run migrations**
   ```bash
   alembic upgrade head
   ```

4. **Create admin user**
   ```bash
   python create_admin.py
   ```

5. **Start backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install Node dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**
   ```bash
   npm start
   ```

   Frontend will be available at http://localhost:3000

## Usage

### 1. Login
- Open http://localhost:3000/login
- Use credentials: `admin` / `admin`

### 2. Start a Demo Call
- Fill in the form:
  - **Phone Number**: Target phone number (e.g., +79019433546)
  - **Language**: ru, uz, tj, or auto
  - **Voice**: male, female, or neutral
  - **Greeting Message**: Opening message for the call
  - **AI Prompt**: Instructions for the AI agent's behavior

- Click "Start Demo Call"

### 3. Monitor Call Status
- Watch real-time progress through stages:
  - Calling customer
  - Analyzing conversation
  - Preparing follow-up
  - Sending SMS
  - Adding to CRM

### 4. View Analytics
- Access the analytics dashboard
- View metrics:
  - Total calls
  - Talk rate (% of successful connections)
  - Interest rate (% showing interest)
  - Average call duration
  - Conversion funnel
- Browse call history table
- Click "View Details" to see full call transcript and analysis

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Calls
- `POST /api/calls` - Create new call
- `GET /api/calls/{id}` - Get call details
- `GET /api/calls` - List all calls
- `GET /api/analytics` - Get analytics data

## Project Structure

```
HALO_MAX/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── core/         # Core config, database, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Business logic (Voximplant, OpenAI)
│   ├── alembic/          # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── utils/        # Utilities
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

## Current Limitations (MVP)

- Mock transcript generation (real Voximplant transcript integration pending)
- No Telegram chat integration (planned for future)
- No real SMS sending (status tracking only)
- Single admin user authentication

## Future Enhancements

- [ ] Real Voximplant transcript retrieval
- [ ] Telegram bot integration
- [ ] SMS notifications via provider
- [ ] Multi-user support with roles
- [ ] Prompt templates library
- [ ] Custom funnel configuration
- [ ] Advanced analytics and reporting
- [ ] CRM integrations (Salesforce, HubSpot, etc.)

## Voximplant Integration

The project includes a Voximplant scenario (`VOXIMPLANT_SCENARIO.js`) that handles:
- Call initiation
- OpenAI Realtime API integration
- Bidirectional audio streaming
- Call recording and transcription

To use your own Voximplant scenario:
1. Update `VOXIMPLANT_SCENARIO_ID` in `.env`
2. Ensure the scenario accepts `customData` with: phone_number, language, voice, greeting_message, prompt

## Troubleshooting

### Database connection issues
```bash
# Reset database
docker-compose down -v
docker-compose up --build
```

### Backend not starting
- Check `.env` file has all required variables
- Verify OpenAI API key is valid
- Check PostgreSQL is running

### Frontend can't connect to backend
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/core/config.py`
- Verify `REACT_APP_API_URL` in frontend

## License

Proprietary - HALO AI

## Support

For issues and questions, contact the development team.
