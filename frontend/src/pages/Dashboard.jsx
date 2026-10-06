import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getApiErrorMessage } from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";

const Dashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [freshStats, setFreshStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/quiz").then((res) => setQuizzes(res.data)).catch((err) => setError(getApiErrorMessage(err, "Could not load dashboard data")));
    api.get("/studyplan").then((res) => setPlans(res.data)).catch((err) => setError(getApiErrorMessage(err, "Could not load dashboard data")));
    // Points/streak/badges change often — pull the latest instead of relying
    // on the snapshot cached at login time.
    api.get("/auth/me").then((res) => setFreshStats(res.data.stats)).catch((err) => setError(getApiErrorMessage(err, "Could not load dashboard data")));
  }, []);

  const stats = freshStats || user?.stats || {};
  const accuracy =
    stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;

  const features = [
    { to: "/chat", mark: "Chat", title: "AI Chat", text: "Ask questions and get instant, clear explanations on any topic." },
    { to: "/quiz", mark: "Quiz", title: "Quiz Generator", text: "Generate custom quizzes on any subject to test your knowledge." },
    { to: "/study-plan", mark: "Plan", title: "Study Plan", text: "Get a personalized day-by-day plan based on your goals." },
    { to: "/coding", mark: "Code", title: "Coding Assistant", text: "Debug code, get explanations, and improve your programming." },
    { to: "/flashcards", mark: "Cards", title: "Flashcards", text: "AI-generated flashcards with spaced-repetition review." },
    { to: "/notes", mark: "Notes", title: "Notes Summarizer", text: "Upload a PDF or paste notes to get an instant summary." },
    { to: "/leaderboard", mark: "Ranks", title: "Leaderboard", text: "See how your points and streak stack up against others." },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Today</p>
        <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="page-subtitle">Here's a snapshot of your study progress.</p>
      </header>
      {error && <div className="alert-error">{error}</div>}

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
          <span className="stat-value">🔥 {stats.studyStreak || 0}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </div>

      {stats.badges?.length > 0 && (
        <div className="recent-section">
          <h2>Your Badges</h2>
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
            <span className="feature-mark">{feature.mark}</span>
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </Link>
        ))}
      </div>

      <div className="recent-section">
        <h2>Recent Quizzes</h2>
        {quizzes.length === 0 && <p className="empty-state">No quizzes yet — generate your first one!</p>}
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
