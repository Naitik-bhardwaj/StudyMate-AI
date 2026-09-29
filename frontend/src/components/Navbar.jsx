import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="logo-dot" /> StudyMate AI
      </div>
      <div className="navbar-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/chat">AI Chat</NavLink>
        <NavLink to="/quiz">Quiz Generator</NavLink>
        <NavLink to="/study-plan">Study Plan</NavLink>
        <NavLink to="/coding">Coding Assistant</NavLink>
        <NavLink to="/flashcards">Flashcards</NavLink>
        <NavLink to="/notes">Notes</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </div>
      <div className="navbar-user">
        <span>Hi, {user.name?.split(" ")[0]}</span>
        <button onClick={handleLogout} className="btn-ghost">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
