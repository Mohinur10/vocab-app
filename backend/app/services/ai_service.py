import anthropic
from app.core.config import settings
import json


def get_ai_client():
    if not settings.ANTHROPIC_API_KEY:
        return None
    return anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def generate_word_content(english: str, uzbek: str) -> dict:
    """Generate AI content for a word: example, hint, uzbek explanation."""
    client = get_ai_client()
    if not client:
        return {
            "ai_example": f"I learned the word '{english}' today.",
            "ai_hint": f"Think of '{english}' as '{uzbek}' in Uzbek.",
            "ai_uzbek_explanation": f"'{english}' so'zi o'zbek tilida '{uzbek}' degan ma'noni anglatadi.",
        }

    prompt = f"""For the English word "{english}" (Uzbek: "{uzbek}"), generate:
1. A simple, memorable example sentence in English
2. A memory hint to remember the word
3. A brief explanation in Uzbek (2-3 sentences)

Respond ONLY with valid JSON (no markdown, no backticks):
{{
  "ai_example": "...",
  "ai_hint": "...",
  "ai_uzbek_explanation": "..."
}}"""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text.strip()
        # Strip markdown code blocks if present
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return json.loads(text)
    except Exception as e:
        return {
            "ai_example": f"She used the word '{english}' perfectly in her speech.",
            "ai_hint": f"Connect '{english}' with its Uzbek meaning '{uzbek}'.",
            "ai_uzbek_explanation": f"'{english}' ingliz tilida '{uzbek}' ma'nosini beradi. Bu so'zni kundalik hayotda ishlatish mumkin.",
        }


def generate_quiz_explanation(english: str, uzbek: str, is_correct: bool, user_answer: str) -> str:
    """Generate explanation after a quiz answer."""
    client = get_ai_client()

    if not client:
        if is_correct:
            return f"✅ Correct! '{english}' means '{uzbek}' in Uzbek."
        else:
            return f"❌ The correct answer is '{uzbek}'. '{english}' = '{uzbek}' in Uzbek."

    status = "correctly answered" if is_correct else f"answered incorrectly (said '{user_answer}')"
    prompt = f"""A student {status} the word "{english}" = "{uzbek}".
Give a brief, encouraging 1-2 sentence explanation to help them remember.
Be concise and motivating."""

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text.strip()
    except Exception:
        if is_correct:
            return f"Great job! '{english}' means '{uzbek}'. Keep it up! 🌟"
        return f"The word '{english}' means '{uzbek}' in Uzbek. Practice makes perfect! 💪"
