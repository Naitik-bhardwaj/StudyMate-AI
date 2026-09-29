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

  return (
    <div className="page">
      <h1>Welcome back, {user?.name?.split(" ")[0]} </h1>
      <p className="page-subtitle">Here's a snapshot of your study progress.</p>
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

      <div className="feature-grid">
        <Link to="/chat" className="feature-card">
          <h3>💬 AI Chat</h3>
          <p>Ask questions and get instant, clear explanations on any topic.</p>
        </Link>
        <Link to="/quiz" className="feature-card">
          <h3>📝 Quiz Generator</h3>
          <p>Generate custom quizzes on any subject to test your knowledge.</p>
        </Link>
        <Link to="/study-plan" className="feature-card">
          <h3>📅 Study Plan</h3>
          <p>Get a personalized day-by-day plan based on your goals.</p>
        </Link>
        <Link to="/coding" className="feature-card">
          <h3>💻 Coding Assistant</h3>
          <p>Debug code, get explanations, and improve your programming.</p>
        </Link>
        <Link to="/flashcards" className="feature-card">
          <h3>🗂️ Flashcards</h3>
          <p>AI-generated flashcards with spaced-repetition review.</p>
        </Link>
        <Link to="/notes" className="feature-card">
          <h3>📄 Notes Summarizer</h3>
          <p>Upload a PDF or paste notes to get an instant summary.</p>
        </Link>
        <Link to="/leaderboard" className="feature-card">
          <h3>🏆 Leaderboard</h3>
          <p>See how your points and streak stack up against others.</p>
        </Link>
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
