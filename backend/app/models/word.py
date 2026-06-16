from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    english = Column(String(255), nullable=False)
    uzbek = Column(String(255), nullable=False)
    example_sentence = Column(Text, nullable=True)
    difficulty = Column(String(20), default="medium")  # easy, medium, hard
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    last_reviewed = Column(DateTime, nullable=True)
    mastery_score = Column(Float, default=0.0)  # 0.0 to 1.0
    ai_hint = Column(Text, nullable=True)
    ai_uzbek_explanation = Column(Text, nullable=True)
    ai_example = Column(Text, nullable=True)
    is_learned = Column(Boolean, default=False)
    in_daily = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="words")
    quiz_answers = relationship("QuizAnswer", back_populates="word", cascade="all, delete-orphan")
