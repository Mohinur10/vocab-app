from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, words, quiz, progress
from app.core.database import engine, Base
import app.models  # noqa: F401 - ensure all models are imported for table creation

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Vocabulary Learning API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(words.router, prefix="/api/words", tags=["words"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["quiz"])
app.include_router(progress.router, prefix="/api/progress", tags=["progress"])


@app.get("/")
async def root():
    return {"message": "AI Vocabulary Learning API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
