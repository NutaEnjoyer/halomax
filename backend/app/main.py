from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, calls, inbound

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HALO AI API",
    description="AI-powered call automation platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Note: nginx already adds /api prefix, so we don't add it here
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(calls.router, prefix="", tags=["calls"])
app.include_router(inbound.router, prefix="", tags=["inbound"])


@app.get("/")
def root():
    return {"message": "HALO AI API is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
