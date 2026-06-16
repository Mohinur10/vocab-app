from sqlalchemy.orm import Session
from app.models.quiz import Badge, UserBadge
from app.models.user import User
from app.models.word import Word
from datetime import datetime

BADGES = [
    {"name": "First Word", "description": "Added your first word", "icon": "🌱", "requirement_type": "words_added", "requirement_value": 1, "xp_reward": 10},
    {"name": "Word Collector", "description": "Added 10 words", "icon": "📚", "requirement_type": "words_added", "requirement_value": 10, "xp_reward": 25},
    {"name": "Vocabulary Builder", "description": "Added 50 words", "icon": "🏗️", "requirement_type": "words_added", "requirement_value": 50, "xp_reward": 100},
    {"name": "Word Master", "description": "Added 100 words", "icon": "🎓", "requirement_type": "words_added", "requirement_value": 100, "xp_reward": 250},
    {"name": "First Quiz", "description": "Completed your first quiz", "icon": "🎯", "requirement_type": "quizzes_done", "requirement_value": 1, "xp_reward": 15},
    {"name": "Quiz Champion", "description": "Completed 10 quizzes", "icon": "🏆", "requirement_type": "quizzes_done", "requirement_value": 10, "xp_reward": 75},
    {"name": "Streak Starter", "description": "3-day learning streak", "icon": "🔥", "requirement_type": "streak", "requirement_value": 3, "xp_reward": 30},
    {"name": "On Fire", "description": "7-day learning streak", "icon": "⚡", "requirement_type": "streak", "requirement_value": 7, "xp_reward": 100},
    {"name": "Perfect Score", "description": "Got 100% on a quiz", "icon": "⭐", "requirement_type": "perfect_quiz", "requirement_value": 1, "xp_reward": 50},
    {"name": "XP Hunter", "description": "Earned 500 XP", "icon": "💎", "requirement_type": "xp", "requirement_value": 500, "xp_reward": 50},
    {"name": "Accuracy Ace", "description": "90%+ accuracy overall", "icon": "🎯", "requirement_type": "accuracy", "requirement_value": 90, "xp_reward": 100},
]

LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000]


def seed_badges(db: Session):
    if db.query(Badge).count() == 0:
        for b in BADGES:
            db.add(Badge(**b))
        db.commit()


def calculate_level(xp: int) -> int:
    for i, threshold in enumerate(reversed(LEVEL_THRESHOLDS)):
        if xp >= threshold:
            return len(LEVEL_THRESHOLDS) - i
    return 1


def get_level_xp(level: int):
    idx = min(level - 1, len(LEVEL_THRESHOLDS) - 1)
    current = LEVEL_THRESHOLDS[idx]
    next_lvl = LEVEL_THRESHOLDS[min(level, len(LEVEL_THRESHOLDS) - 1)]
    return current, next_lvl


def award_xp(user: User, xp: int, db: Session) -> int:
    user.xp += xp
    new_level = calculate_level(user.xp)
    user.level = new_level
    db.commit()
    return xp


def check_and_award_badges(user: User, db: Session) -> list:
    new_badges = []
    all_badges = db.query(Badge).all()
    earned_ids = {ub.badge_id for ub in user.badges}

    word_count = db.query(Word).filter(Word.user_id == user.id).count()
    quiz_count = len(user.quiz_sessions)
    streak = user.streak

    # Calculate accuracy
    total_correct = sum(w.correct_count for w in user.words)
    total_answered = sum(w.correct_count + w.wrong_count for w in user.words)
    accuracy = (total_correct / total_answered * 100) if total_answered > 0 else 0

    # Perfect quiz check
    perfect_quizzes = sum(
        1 for s in user.quiz_sessions
        if s.completed and s.total_questions > 0 and s.correct_answers == s.total_questions
    )

    for badge in all_badges:
        if badge.id in earned_ids:
            continue
        earned = False
        if badge.requirement_type == "words_added" and word_count >= badge.requirement_value:
            earned = True
        elif badge.requirement_type == "quizzes_done" and quiz_count >= badge.requirement_value:
            earned = True
        elif badge.requirement_type == "streak" and streak >= badge.requirement_value:
            earned = True
        elif badge.requirement_type == "xp" and user.xp >= badge.requirement_value:
            earned = True
        elif badge.requirement_type == "accuracy" and accuracy >= badge.requirement_value:
            earned = True
        elif badge.requirement_type == "perfect_quiz" and perfect_quizzes >= badge.requirement_value:
            earned = True

        if earned:
            ub = UserBadge(user_id=user.id, badge_id=badge.id)
            db.add(ub)
            user.xp += badge.xp_reward
            new_badges.append({"name": badge.name, "icon": badge.icon, "xp_reward": badge.xp_reward})

    if new_badges:
        user.level = calculate_level(user.xp)
        db.commit()

    return new_badges
