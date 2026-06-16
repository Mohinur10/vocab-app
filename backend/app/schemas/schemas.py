from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    xp: int
    level: int
    streak: int
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Word schemas
class WordCreate(BaseModel):
    english: str
    uzbek: str
    example_sentence: Optional[str] = None
    difficulty: str = "medium"


class WordUpdate(BaseModel):
    english: Optional[str] = None
    uzbek: Optional[str] = None
    example_sentence: Optional[str] = None
    difficulty: Optional[str] = None


class WordResponse(BaseModel):
    id: int
    english: str
    uzbek: str
    example_sentence: Optional[str]
    difficulty: str
    correct_count: int
    wrong_count: int
    review_count: int
    last_reviewed: Optional[datetime]
    mastery_score: float
    ai_hint: Optional[str]
    ai_uzbek_explanation: Optional[str]
    ai_example: Optional[str]
    is_learned: bool
    in_daily: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Quiz schemas
class QuizSessionCreate(BaseModel):
    mode: str  # en_to_uz, uz_to_en, random
    word_count: int = 10
    daily_mode: bool = False


class QuizQuestion(BaseModel):
    session_id: int
    question_number: int
    total_questions: int
    word_id: int
    question: str
    mode: str
    options: List[str]
    correct_option_index: int


class QuizAnswerSubmit(BaseModel):
    session_id: int
    word_id: int
    user_answer: str
    correct_answer: str
    is_correct: bool


class QuizAnswerResult(BaseModel):
    is_correct: bool
    correct_answer: str
    xp_earned: int
    explanation: Optional[str]
    mastery_score: float
    new_badges: List[dict] = []


class QuizSessionResponse(BaseModel):
    id: int
    mode: str
    total_questions: int
    correct_answers: int
    xp_earned: int
    completed: bool
    accuracy: float
    created_at: datetime

    class Config:
        from_attributes = True


# Daily goal schemas
class DailyGoalCreate(BaseModel):
    target_count: int


class DailyGoalResponse(BaseModel):
    id: int
    target_count: int
    completed_count: int
    date: datetime

    class Config:
        from_attributes = True


# Progress schemas
class ProgressResponse(BaseModel):
    total_words: int
    learned_words: int
    weak_words: int
    accuracy_percentage: float
    xp: int
    level: int
    streak: int
    next_level_xp: int
    current_level_xp: int
    badges: List[dict]


# Badge schemas
class BadgeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    icon: str
    earned_at: datetime

    class Config:
        from_attributes = True
