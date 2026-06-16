from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.word import Word
from app.schemas.schemas import WordCreate, WordUpdate, WordResponse
from app.services.gamification import check_and_award_badges, award_xp
from app.services.ai_service import generate_word_content

router = APIRouter()


def update_word_ai(word_id: int, english: str, uzbek: str, db_url: str):
    """Background task to generate AI content for a word."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url, pool_pre_ping=True)
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        word = session.query(Word).filter(Word.id == word_id).first()
        if word:
            content = generate_word_content(english, uzbek)
            word.ai_example = content.get("ai_example")
            word.ai_hint = content.get("ai_hint")
            word.ai_uzbek_explanation = content.get("ai_uzbek_explanation")
            session.commit()
    finally:
        session.close()


@router.post("/", response_model=WordResponse)
async def create_word(
    word_data: WordCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    word = Word(
        user_id=current_user.id,
        english=word_data.english.strip(),
        uzbek=word_data.uzbek.strip(),
        example_sentence=word_data.example_sentence,
        difficulty=word_data.difficulty,
    )
    db.add(word)
    db.commit()
    db.refresh(word)

    # Award XP for adding a word
    award_xp(current_user, 5, db)
    check_and_award_badges(current_user, db)

    # Generate AI content in background
    from app.core.config import settings
    background_tasks.add_task(
        update_word_ai, word.id, word.english, word.uzbek, settings.DATABASE_URL
    )

    return word


@router.get("/", response_model=List[WordResponse])
async def get_words(
    skip: int = 0,
    limit: int = 100,
    difficulty: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Word).filter(Word.user_id == current_user.id)
    if difficulty:
        query = query.filter(Word.difficulty == difficulty)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Word.english.ilike(search_term)) | (Word.uzbek.ilike(search_term))
        )
    return query.order_by(Word.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/daily", response_model=List[WordResponse])
async def get_daily_words(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Word).filter(
        Word.user_id == current_user.id,
        Word.in_daily == True
    ).all()


@router.post("/daily/set")
async def set_daily_words(
    target_count: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Reset all daily words
    db.query(Word).filter(Word.user_id == current_user.id).update({"in_daily": False})

    # Prioritize weak words (lower mastery score), then random
    words = (
        db.query(Word)
        .filter(Word.user_id == current_user.id)
        .order_by(Word.mastery_score.asc(), Word.last_reviewed.asc().nullsfirst())
        .limit(target_count)
        .all()
    )

    for word in words:
        word.in_daily = True

    db.commit()
    return {"message": f"Set {len(words)} words for daily learning", "count": len(words)}


@router.get("/{word_id}", response_model=WordResponse)
async def get_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return word


@router.put("/{word_id}", response_model=WordResponse)
async def update_word(
    word_id: int,
    word_data: WordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    for field, value in word_data.model_dump(exclude_unset=True).items():
        setattr(word, field, value)
    db.commit()
    db.refresh(word)
    return word


@router.delete("/{word_id}")
async def delete_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    word = db.query(Word).filter(Word.id == word_id, Word.user_id == current_user.id).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    db.delete(word)
    db.commit()
    return {"message": "Word deleted"}
