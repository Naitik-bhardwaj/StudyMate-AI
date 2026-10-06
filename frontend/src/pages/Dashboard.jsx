import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiErrorMessage } from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const features = [
  {
    to: "/chat",
    kicker: "Ask",
    title: "AI Chat",
    description: "Get clear explanations on any topic in a focused conversation.",
  },
  {
    to: "/quiz",
    kicker: "Practice",
    title: "Quiz Generator",
    description: "Generate custom quizzes on any subject to test what you know.",
  },
  {
    to: "/study-plan",
    kicker: "Plan",
    title: "Study Plan",
    description: "Build a day-by-day plan tuned to your goals and hours.",
  },
  {
    to: "/coding",
    kicker: "Code",
    title: "Coding Assistant",
    description: "Debug, explain, and review code with structured feedback.",
  },
  {
    to: "/flashcards",
    kicker: "Review",
    title: "Flashcards",
    description: "AI decks with spaced-repetition so hard cards return sooner.",
  },
  {
    to: "/notes",
    kicker: "Summarize",
    title: "Notes Summarizer",
    description: "Upload a PDF or paste notes for a concise summary and key points.",
  },
  {
    to: "/leaderboard",
    kicker: "Compete",
    title: "Leaderboard",
    description: "See how your points and streak compare with other learners.",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [freshStats, setFreshStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/quiz").then((res) => setQuizzes(res.data)).catch((err) => setError(getApiErrorMessage(err, "Could not load dashboard data")));
    api.get("/studyplan").then((res) => setPlans(res.data)).catch((err) => setError(getApiErrorMessage(err, "Could not load dashboard data")));
    api.get("/auth/me").then((res) => setFreshStats(res.data.stats)).catch((err) => setError(getApiErrorMessage(err, "Could not load dashboard data")));
  }, []);

  const stats = freshStats || user?.stats || {};
  const accuracy =
    stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;

  return (
    <div className="page">
      <header className="dash-hero">
        <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="page-subtitle">A clear snapshot of your progress — then jump into the next study session.</p>
      </header>

      {error && <div className="alert-error">{error}</div>}

      <p className="section-label">Progress</p>
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.quizzesTaken || 0}</span>
          <span className="stat-label">Quizzes Taken</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{accuracy}%</span>
          <span className="stat-label">Quiz Accuracy</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{plans.length}</span>
          <span className="stat-label">Study Plans</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.points || 0}</span>
          <span className="stat-label">Points</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.studyStreak || 0}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </div>

      {stats.badges?.length > 0 && (
        <div className="recent-section">
          <p className="section-label">Badges</p>
          <div className="badge-row">
            {stats.badges.map((b) => (
              <span key={b} className="badge-chip">{b}</span>
            ))}
          </div>
        </div>
      )}

      <p className="section-label">Study tools</p>
      <div className="feature-grid">
        {features.map((feature) => (
          <Link key={feature.to} to={feature.to} className="feature-card">
            <span className="feature-kicker">{feature.kicker}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </Link>
        ))}
      </div>

      <div className="recent-section">
        <h2>Recent Quizzes</h2>
        {quizzes.length === 0 && <p className="empty-state">No quizzes yet — generate your first one.</p>}
        <ul className="list">
          {quizzes.slice(0, 5).map((q) => (
            <li key={q._id}>
              <span>{q.topic}</span>
              <span className="tag">{q.difficulty}</span>
              {q.attempt?.score !== undefined && (
                <span className="score">{q.attempt.score}/{q.questions.length}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
