import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chat from "./pages/Chat.jsx";
import QuizGenerator from "./pages/QuizGenerator.jsx";
import StudyPlan from "./pages/StudyPlan.jsx";
import CodingAssistant from "./pages/CodingAssistant.jsx";
import Flashcards from "./pages/Flashcards.jsx";
import Notes from "./pages/Notes.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";

function App() {
  const { pathname } = useLocation();
  const isAuth = pathname === "/login" || pathname === "/register";

  return (
    <>
      <Navbar />
      <main className={isAuth ? "app-main auth-shell" : "app-main"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
          <Route path="/study-plan" element={<ProtectedRoute><StudyPlan /></ProtectedRoute>} />
          <Route path="/coding" element={<ProtectedRoute><CodingAssistant /></ProtectedRoute>} />
          <Route path="/flashcards" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default App;
