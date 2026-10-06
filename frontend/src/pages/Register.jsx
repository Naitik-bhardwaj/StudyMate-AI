import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-aside">
          <div>
            <span className="logo-mark">S</span>
            <p className="auth-kicker">StudyMate AI</p>
            <h2>A quieter place to study.</h2>
            <p>One account for chat, quizzes, coding help, notes, and a plan you can tick off.</p>
          </div>
          <ul className="auth-points">
            <li>Ask questions and keep the thread</li>
            <li>Turn notes into a short summary</li>
            <li>Build a streak without a cluttered screen</li>
          </ul>
        </aside>
        <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Start your personalized AI-powered study journey.</p>

        {error && <div className="alert-error">{error}</div>}

        <label>Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
