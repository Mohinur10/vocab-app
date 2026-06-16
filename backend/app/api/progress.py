from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.word import Word
from app.models.quiz import Badge, UserBadge
from app.schemas.schemas import ProgressResponse
from app.services.gamification import get_level_xp

router = APIRouter()


@router.get("/", response_model=ProgressResponse)
async def get_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    words = db.query(Word).filter(Word.user_id == current_user.id).all()
    total_words = len(words)
    learned_words = sum(1 for w in words if w.is_learned)
    weak_words = sum(1 for w in words if w.mastery_score < 0.3 and w.review_count > 0)

    total_correct = sum(w.correct_count for w in words)
    total_answered = sum(w.correct_count + w.wrong_count for w in words)
    accuracy = round((total_correct / total_answered * 100) if total_answered > 0 else 0, 1)

    current_level_xp, next_level_xp = get_level_xp(current_user.level)

    # Get earned badges
    user_badges = (
        db.query(UserBadge, Badge)
        .join(Badge, UserBadge.badge_id == Badge.id)
        .filter(UserBadge.user_id == current_user.id)
        .all()
    )
    badges = [
        {
            "id": ub.id,
            "name": b.name,
            "icon": b.icon,
            "description": b.description,
            "earned_at": ub.earned_at.isoformat(),
        }
        for ub, b in user_badges
    ]

    return ProgressResponse(
        total_words=total_words,
        learned_words=learned_words,
        weak_words=weak_words,
        accuracy_percentage=accuracy,
        xp=current_user.xp,
        level=current_user.level,
        streak=current_user.streak,
        next_level_xp=next_level_xp,
        current_level_xp=current_level_xp,
        badges=badges,
    )


@router.get("/badges")
async def get_all_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    all_badges = db.query(Badge).all()
    earned_ids = {ub.badge_id for ub in current_user.badges}

    return [
        {
            "id": b.id,
            "name": b.name,
            "icon": b.icon,
            "description": b.description,
            "xp_reward": b.xp_reward,
            "earned": b.id in earned_ids,
        }
        for b in all_badges
    ]
