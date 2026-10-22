import { useState, useEffect } from "react";
import api, { getApiErrorMessage } from "../api/axios.js";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserEntry, setCurrentUserEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/leaderboard")
      .then((res) => {
        setLeaderboard(res.data.leaderboard);
        setCurrentUserEntry(res.data.currentUserEntry);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Could not load the leaderboard")))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Leaderboard</h1>
      <p className="page-subtitle">Points come from quizzes, flashcard reviews, study plan tasks, and notes.</p>

      {loading && <p className="empty-state">Loading leaderboard...</p>}

      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <>
          {currentUserEntry?.outsideTop20 && (
            <div className="your-rank-card">
              <span>Your rank</span>
              <strong>#{currentUserEntry.rank}</strong>
              <span>{currentUserEntry.points} pts</span>
            </div>
          )}

          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Points</th>
                <th>Streak</th>
                <th>Badges</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.userId} className={entry.isCurrentUser ? "current-user-row" : ""}>
                  <td>#{entry.rank}</td>
                  <td>{entry.name}{entry.isCurrentUser ? " (you)" : ""}</td>
                  <td>{entry.points}</td>
                  <td>🔥 {entry.streak}</td>
                  <td>
                    <div className="badge-row">
                      {entry.badges.length === 0 && <span className="empty-state">—</span>}
                      {entry.badges.map((b) => (
                        <span key={b} className="badge-chip">{b}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Leaderboard;
