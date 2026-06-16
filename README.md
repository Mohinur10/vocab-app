# 🧠 LexiLearn — AI Vocabulary Learning App

A full-stack vocabulary learning system with AI-powered hints, spaced repetition, gamification, and a beautiful dark-mode UI.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Authentication** | JWT-based register/login, 7-day sessions |
| **Vocabulary** | Unlimited words, EN/UZ, difficulty, AI content |
| **Smart Quiz** | EN→UZ, UZ→EN, Random mixed, spaced repetition |
| **AI Assistant** | Example sentences, memory hints, Uzbek explanations (via Claude API) |
| **Daily Goals** | Choose N words/day, auto-selects weakest words |
| **Progress** | Mastery tracking, accuracy, XP, levels, streaks |
| **Gamification** | 11 badges, animated XP, levels 1–10, streaks |
| **Dashboard** | Real-time stats, level progress, recent activity |

---

## 🗂 Project Structure

```
vocab-app/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers
│   │   │   ├── auth.py
│   │   │   ├── words.py
│   │   │   ├── quiz.py
│   │   │   └── progress.py
│   │   ├── core/         # Config, DB, security
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # AI service, gamification
│   │   └── main.py
│   ├── alembic/          # DB migrations
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/        # All page components
│   │   ├── components/   # Shared components
│   │   ├── context/      # Auth context
│   │   ├── services/     # API layer
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Option A: Docker Compose (Recommended)

```bash
# Clone and enter the project
cd vocab-app

# Set your Anthropic API key (optional but recommended for AI features)
export ANTHROPIC_API_KEY=your-key-here

# Start everything
docker-compose up --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

### Option B: Manual Setup

#### 1. PostgreSQL Database

**Local PostgreSQL:**
```bash
createdb vocabdb
```

**Neon (free cloud PostgreSQL):**
1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@host/dbname?sslmode=require`)

---

#### 2. Backend Setup

```bash
cd vocab-app/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://user:password@localhost/vocabdb
# For Neon: postgresql://user:pass@host/dbname?sslmode=require
SECRET_KEY=your-very-secret-key-minimum-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ANTHROPIC_API_KEY=sk-ant-...  # Optional: enables AI features
```

```bash
# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

API will be available at http://localhost:8000
Swagger docs at http://localhost:8000/docs

---

#### 3. Frontend Setup

```bash
cd vocab-app/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be at http://localhost:3000

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing key (32+ chars) |
| `ALGORITHM` | ✅ | JWT algorithm (default: HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Token TTL (default: 10080 = 7 days) |
| `ANTHROPIC_API_KEY` | ⚪ | Enables AI-generated word content |

### For Neon Database

Add `?sslmode=require` to your DATABASE_URL:
```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🎮 How It Works

### Spaced Repetition Algorithm

Words you get wrong appear more often in quizzes. The system weights each word:
- Base weight: `(1.0 - mastery_score) × 10`
- Bonus weight: `+ wrong_count`
- Words with lower mastery and more wrong answers appear more frequently

### Mastery Score

Each word has a mastery score (0.0–1.0):
- **Correct answer**: +0.10 mastery
- **Wrong answer**: -0.15 mastery
- **Learned**: mastery ≥ 0.80 AND reviewed ≥ 5 times

### XP & Levels

| Action | XP |
|---|---|
| Add a word | +5 XP |
| Correct answer (easy) | +10 XP |
| Correct answer (medium) | +15 XP |
| Correct answer (hard) | +25 XP |
| Low-mastery word correct | +5 bonus XP |
| Badge earned | +10–250 XP |

Level thresholds: 0 → 100 → 250 → 500 → 1000 → 2000 → 3500 → 5500 → 8000 → 11000 → 15000

### AI Features (requires `ANTHROPIC_API_KEY`)

When you add a word, the backend generates (in background):
- **Example sentence**: Natural English usage
- **Memory hint**: Creative mnemonic device
- **Uzbek explanation**: 2-3 sentence explanation in Uzbek

Without the API key, sensible fallback content is used.

---

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login, get JWT
- `GET /api/auth/me` — Current user

### Words
- `GET /api/words/` — List words (supports ?search=, ?difficulty=)
- `POST /api/words/` — Add word (triggers AI generation)
- `PUT /api/words/{id}` — Update word
- `DELETE /api/words/{id}` — Delete word
- `GET /api/words/daily` — Get daily words
- `POST /api/words/daily/set?target_count=N` — Set daily goal

### Quiz
- `POST /api/quiz/start` — Start quiz session, get all questions
- `POST /api/quiz/answer` — Submit answer, get result + XP
- `POST /api/quiz/complete/{id}` — Finalize session
- `GET /api/quiz/history` — Recent sessions

### Progress
- `GET /api/progress/` — Full stats (words, XP, level, badges)
- `GET /api/progress/badges` — All badges with earned status

---

## 🛠 Database Migrations

```bash
# After changing models:
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head

# Rollback one step:
alembic downgrade -1
```

---

## 🐛 Troubleshooting

**`CORS error` in browser:**
- Make sure backend is on port 8000
- Frontend dev server proxy is configured in `vite.config.js`

**`Database connection refused`:**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running: `pg_isready`

**AI content not appearing:**
- Content is generated in background (takes 1-3 seconds)
- Refresh the word or check if `ANTHROPIC_API_KEY` is set
- App works fully without the API key using fallback content

**`alembic upgrade head` fails:**
- Ensure database exists: `createdb vocabdb`
- Check connection string in `.env`

---

## 🏗 Tech Stack

**Backend:**
- FastAPI — high-performance async Python web framework
- PostgreSQL — relational database
- SQLAlchemy 2.0 — ORM with async support
- Alembic — database migrations
- python-jose — JWT tokens
- passlib/bcrypt — password hashing
- Anthropic Python SDK — Claude AI integration

**Frontend:**
- React 18 — UI framework
- React Router 6 — client-side routing
- Axios — HTTP client
- Framer Motion — animations
- Recharts — progress charts
- react-hot-toast — notifications
- Lucide React — icons
- Vite — build tool
