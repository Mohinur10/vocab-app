from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import random
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.word import Word
from app.models.quiz import QuizSession, QuizAnswer
from app.schemas.schemas import (
    QuizSessionCreate, QuizQuestion, QuizAnswerSubmit,
    QuizAnswerResult, QuizSessionResponse
)
from app.services.gamification import award_xp, check_and_award_badges
from app.services.ai_service import generate_quiz_explanation

router = APIRouter()


def calculate_xp(is_correct: bool, difficulty: str, mastery_score: float) -> int:
    if not is_correct:
        return 0
    base = {"easy": 10, "medium": 15, "hard": 25}.get(difficulty, 15)
    # Bonus for low mastery words (harder to get right)
    if mastery_score < 0.3:
        base += 5
    return base


def update_mastery(word: Word, is_correct: bool):
    word.review_count += 1
    if is_correct:
        word.correct_count += 1
        word.mastery_score = min(1.0, word.mastery_score + 0.1)
    else:
        word.wrong_count += 1
        word.mastery_score = max(0.0, word.mastery_score - 0.15)

    word.last_reviewed = datetime.utcnow()
    # Mark as learned if mastery >= 0.8 and reviewed at least 5 times
    if word.mastery_score >= 0.8 and word.review_count >= 5:
        word.is_learned = True
    else:
        word.is_learned = False


def get_smart_words(user_id: int, count: int, daily_mode: bool, db: Session) -> List[Word]:
    """Get words with spaced repetition - weak words appear more often."""
    query = db.query(Word).filter(Word.user_id == user_id)
    if daily_mode:
        query = query.filter(Word.in_daily == True)

    all_words = query.all()
    if not all_words:
        return []

    # Weight words by weakness (lower mastery = higher weight)
    weighted = []
    for word in all_words:
        weight = max(1, int((1.0 - word.mastery_score) * 10) + 1)
        # Extra weight for wrong answers
        weight += word.wrong_count
        weighted.extend([word] * weight)

    random.shuffle(weighted)
    # Deduplicate while preserving smart order
    seen = set()
    result = []
    for word in weighted:
        if word.id not in seen:
            seen.add(word.id)
            result.append(word)
            if len(result) >= count:
                break

    # If not enough, fill with remaining
    if len(result) < count:
        remaining = [w for w in all_words if w.id not in seen]
        result.extend(remaining[:count - len(result)])

    return result[:count]


def make_options(correct: str, all_words: List[Word], mode: str, count: int = 4) -> List[str]:
    """Make multiple choice options."""
    if mode == "en_to_uz":
        pool = [w.uzbek for w in all_words if w.uzbek != correct]
    else:
        pool = [w.english for w in all_words if w.english != correct]

    distractors = random.sample(pool, min(count - 1, len(pool)))
    options = distractors + [correct]
    random.shuffle(options)
    return options


@router.post("/start", response_model=dict)
async def start_quiz(
    quiz_data: QuizSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    words = get_smart_words(current_user.id, quiz_data.word_count, quiz_data.daily_mode, db)
    if len(words) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 words to start a quiz")

    session = QuizSession(
        user_id=current_user.id,
        mode=quiz_data.mode,
        total_questions=len(words),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Build all questions
    all_words = db.query(Word).filter(Word.user_id == current_user.id).all()
    questions = []
    for i, word in enumerate(words):
        if quiz_data.mode == "random":
            mode = random.choice(["en_to_uz", "uz_to_en"])
        else:
            mode = quiz_data.mode

        if mode == "en_to_uz":
            question_text = word.english
            correct = word.uzbek
        else:
            question_text = word.uzbek
            correct = word.english

        options = make_options(correct, all_words, mode)
        correct_idx = options.index(correct)

        questions.append({
            "session_id": session.id,
            "question_number": i + 1,
            "total_questions": len(words),
            "word_id": word.id,
            "question": question_text,
            "mode": mode,
            "options": options,
            "correct_option_index": correct_idx,
        })

    return {"session_id": session.id, "questions": questions}


@router.post("/answer", response_model=QuizAnswerResult)
async def submit_answer(
    answer_data: QuizAnswerSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(QuizSession).filter(
        QuizSession.id == answer_data.session_id,
        QuizSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")

    word = db.query(Word).filter(
        Word.id == answer_data.word_id,
        Word.user_id == current_user.id
    ).first()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")

    is_correct = answer_data.is_correct
    update_mastery(word, is_correct)

    xp = calculate_xp(is_correct, word.difficulty, word.mastery_score)
    if is_correct:
        session.correct_answers += 1

    session.xp_earned += xp

    answer = QuizAnswer(
        session_id=session.id,
        word_id=word.id,
        user_answer=answer_data.user_answer,
        is_correct=is_correct,
        xp_earned=xp,
    )
    db.add(answer)
    db.commit()

    award_xp(current_user, xp, db)
    new_badges = check_and_award_badges(current_user, db)

    explanation = generate_quiz_explanation(
        word.english, word.uzbek, is_correct, answer_data.user_answer
    )

    return QuizAnswerResult(
        is_correct=is_correct,
        correct_answer=answer_data.correct_answer,
        xp_earned=xp,
        explanation=explanation,
        mastery_score=word.mastery_score,
        new_badges=new_badges,
    )


@router.post("/complete/{session_id}", response_model=QuizSessionResponse)
async def complete_quiz(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(QuizSession).filter(
        QuizSession.id == session_id,
        QuizSession.user_id == current_user.id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.completed = True
    session.completed_at = datetime.utcnow()
    db.commit()

    # Update streak
    current_user.last_activity_date = datetime.utcnow()
    db.commit()

    check_and_award_badges(current_user, db)

    accuracy = (session.correct_answers / session.total_questions * 100) if session.total_questions else 0
    return QuizSessionResponse(
        id=session.id,
        mode=session.mode,
        total_questions=session.total_questions,
        correct_answers=session.correct_answers,
        xp_earned=session.xp_earned,
        completed=session.completed,
        accuracy=round(accuracy, 1),
        created_at=session.created_at,
    )


@router.get("/history", response_model=List[QuizSessionResponse])
async def get_quiz_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sessions = (
        db.query(QuizSession)
        .filter(QuizSession.user_id == current_user.id, QuizSession.completed == True)
        .order_by(QuizSession.created_at.desc())
        .limit(20)
        .all()
    )
    result = []
    for s in sessions:
        accuracy = (s.correct_answers / s.total_questions * 100) if s.total_questions else 0
        result.append(QuizSessionResponse(
            id=s.id,
            mode=s.mode,
            total_questions=s.total_questions,
            correct_answers=s.correct_answers,
            xp_earned=s.xp_earned,
            completed=s.completed,
            accuracy=round(accuracy, 1),
            created_at=s.created_at,
        ))
    return result
