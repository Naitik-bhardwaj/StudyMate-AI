import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/chat", label: "Chat" },
  { to: "/quiz", label: "Quiz" },
  { to: "/study-plan", label: "Plan" },
  { to: "/coding", label: "Coding" },
  { to: "/flashcards", label: "Cards" },
  { to: "/notes", label: "Notes" },
  { to: "/leaderboard", label: "Ranks" },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const firstName = user.name?.split(" ")[0] || "there";
  const initial = firstName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <NavLink to="/" end className="navbar-brand" onClick={() => setOpen(false)}>
          <span className="logo-mark">S</span>
          StudyMate
        </NavLink>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`navbar-links ${open ? "open" : ""}`}>
        {LINKS.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="navbar-user">
        <span className="user-chip">
          <span className="user-avatar">{initial}</span>
          {firstName}
        </span>
        <button onClick={handleLogout} className="btn-ghost">Log out</button>
      </div>
    </nav>
  );
};

export default Navbar;
