# StudyMate AI — AI Study Assistant (Final Year Project)

A full-stack MERN application (MongoDB, Express, React, Node.js) that uses Groq's API
to power an AI study assistant with chat, quiz generation, personalized study plans,
and a coding assistant.

## Features

- **User Authentication** — JWT-based register/login, passwords hashed with bcrypt
- **AI Chat** — Conversational study helper with persistent chat history per user
- **Quiz Generator** — Generates MCQ quizzes on any topic/difficulty, auto-graded, stored history
- **Study Plan Generator** — Day-by-day personalized plan based on subject, goal, and available hours,
  with a progress tracker (checkboxes)
- **Coding Assistant** — Ask coding questions, debug code, or request a structured code review
- **Flashcards** — AI-generated flashcard decks with real spaced-repetition scheduling (SM-2 algorithm) —
  cards you find hard come back sooner, cards you know well come back later
- **Notes Summarizer** — Upload a PDF or paste raw notes and get a concise AI summary + key points
- **Leaderboard & Gamification** — Points for every study activity (quizzes, flashcard reviews, completed
  study-plan tasks, summarized notes), a daily streak counter, and unlockable badges
- **Dashboard** — Stats (quizzes taken, accuracy, study plans, points, streak, badges) and quick links to every feature

## Tech Stack

- **Frontend**: React 18, React Router, Axios, react-markdown, Vite
- **Backend**: Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs, Multer (file uploads), pdf-parse (PDF text extraction)
- **AI**: Groq API (`llama-3.3-70b-versatile` by default, configurable through `GROQ_MODEL`)

## Project Structure

```
study-ai-assistant/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── controllers/              # Route logic (auth, chat, quiz, study plan, coding, flashcards, notes, leaderboard)
│   ├── middleware/                # JWT auth guard + error handler
│   ├── models/                    # Mongoose schemas (User, ChatMessage, Quiz, StudyPlan, FlashcardDeck, Note)
│   ├── routes/                    # Express routers
│   ├── utils/groq.js              # Central Groq client + helper
│   ├── utils/spacedRepetition.js # SM-2 algorithm for flashcard scheduling
│   ├── utils/gamification.js     # Points, streaks, badge logic
│   ├── server.js                  # App entry point
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js          # Axios instance with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/            # Navbar, ProtectedRoute
    │   ├── pages/                 # Login, Register, Dashboard, Chat, QuizGenerator, StudyPlan,
    │   │                          # CodingAssistant, Flashcards, Notes, Leaderboard
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally, or a free MongoDB Atlas cluster
- A Groq API key ([console.groq.com/keys](https://console.groq.com/keys)) — free, no credit card required

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `GROQ_API_KEY` — your Groq API key

> **Getting a free Groq key**: go to [console.groq.com/keys](https://console.groq.com/keys), sign in, and click
> **Create API Key**. No credit card required. Groq's free tier is fast (custom LPU hardware) and generous —
> plenty for a project demo. Check current rate limits in the Groq console if you hit a limit during heavy testing.

```bash
npm run dev
```
Backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend.

### 3. Use the app

> Important: never commit or upload your real `backend/.env` file. If an API key has been exposed publicly, revoke it and create a new one.

For a deployed frontend, set `VITE_API_URL` to the backend origin (for example `https://your-backend.example.com`). The app will automatically append `/api`.
Open `http://localhost:5173`, register an account, and explore the features from the dashboard.

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in, get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/chat` / `/api/chat/:id` | Send chat message |
| GET | `/api/chat` | List conversations |
| POST | `/api/quiz/generate` | Generate a new quiz |
| POST | `/api/quiz/:id/submit` | Submit answers, get score |
| POST | `/api/studyplan/generate` | Generate a study plan |
| PATCH | `/api/studyplan/:id/task/:day` | Toggle task completion |
| POST | `/api/coding/ask` | Ask the coding assistant |
| POST | `/api/coding/review` | Structured code review |
| POST | `/api/flashcards/generate` | Generate an AI flashcard deck |
| GET | `/api/flashcards` | List decks (with due-card counts) |
| POST | `/api/flashcards/:id/review` | Rate recall (0-5), updates SM-2 schedule |
| POST | `/api/notes/summarize` | Summarize a PDF upload or pasted text |
| GET | `/api/notes` | List summarized notes |
| GET | `/api/leaderboard` | Top 20 users by points + your rank |

All routes except register/login require `Authorization: Bearer <token>`.

## Ideas to Extend (great for "future scope" in your report)

- Auto-generate a quiz from a summarized note
- Voice input for the chat assistant
- Export study plan to calendar (.ics)
- Admin analytics dashboard
- Weekly email digest of streak/points progress
- Multiplayer quiz mode (compete live with classmates)

## Notes for Your Report

- Passwords are hashed with bcrypt before storage; never stored in plain text.
- JWTs expire after 30 days; the Axios interceptor auto-logs-out on 401.
- Rate limiting is applied to all Groq-backed routes (20 requests/minute/IP) to control abuse.
- AI responses for quizzes/study plans/flashcards/note summaries are requested in strict JSON format
  (`response_format: json_object`) so they can be reliably parsed and stored in MongoDB.
- **Spaced repetition**: flashcards use a simplified SM-2 algorithm (the same family of algorithm used by
  Anki). Each card tracks an ease factor, interval, and repetition count; rating a card "Again" resets it
  for review tomorrow, while consistently rating "Good"/"Easy" grows the interval exponentially.
- **Gamification**: `utils/gamification.js` centralizes streak/points/badge logic so it's called consistently
  from quiz submission, study-plan task completion, flashcard review, and note summarization — one place to
  extend if you add more point-earning actions.
- **PDF handling**: uploaded PDFs are parsed in-memory with `pdf-parse` and never written to disk — only the
  AI-generated summary is persisted, keeping storage light and avoiding a file-storage/security surface.
