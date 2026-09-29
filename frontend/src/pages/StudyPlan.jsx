import { useState, useEffect } from "react";
import api, { getApiErrorMessage } from "../api/axios.js";

const StudyPlan = () => {
  const [subject, setSubject] = useState("");
  const [goal, setGoal] = useState("");
  const [durationDays, setDurationDays] = useState(7);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPlans = () => {
    api.get("/studyplan").then((res) => setPlans(res.data)).catch((err) => setError(getApiErrorMessage(err, "Could not load your study plans")));
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/studyplan/generate", {
        subject,
        goal,
        durationDays,
        hoursPerDay,
      });
      setActivePlan(data);
      loadPlans();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to generate study plan"));
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState("");

  const toggleTask = async (day) => {
    try {
      const { data } = await api.patch(`/studyplan/${activePlan._id}/task/${day}`);
      setActivePlan(data.plan);
      if (data.gamification?.newlyUnlocked?.length) {
        setToast(`🏅 Badge unlocked: ${data.gamification.newlyUnlocked.join(", ")}`);
        setTimeout(() => setToast(""), 4000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update this task"));
    }
  };

  const completedCount = activePlan?.tasks.filter((t) => t.completed).length || 0;
  const progress = activePlan ? Math.round((completedCount / activePlan.tasks.length) * 100) : 0;

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      <h1>Study Plan Generator</h1>
      <p className="page-subtitle">Get a day-by-day plan tailored to your goal and available time.</p>

      <form className="form-grid" onSubmit={handleGenerate}>
        <input
          type="text"
          placeholder="Subject (e.g. Data Structures)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Goal (e.g. Pass my final exam)"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          required
        />
        <label>
          Duration (days)
          <input
            type="number"
            min="1"
            max="30"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
          />
        </label>
        <label>
          Hours per day
          <input
            type="number"
            min="1"
            max="12"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
          />
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </form>

      {error && <div className="alert-error">{error}</div>}

      {activePlan && (
        <div className="plan-container">
          <div className="plan-header">
            <h2>{activePlan.subject}</h2>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}% complete</span>
          </div>
          <ul className="task-list">
            {activePlan.tasks.map((task) => (
              <li key={task.day} className={task.completed ? "completed" : ""}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTask(task.day)}
                />
                <div>
                  <strong>Day {task.day}: {task.title}</strong>
                  <p>{task.description}</p>
                  <span className="tag">{task.estimatedHours}h</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!activePlan && plans.length > 0 && (
        <div className="recent-section">
          <h2>Your Study Plans</h2>
          <ul className="list">
            {plans.map((p) => (
              <li key={p._id} onClick={() => setActivePlan(p)} style={{ cursor: "pointer" }}>
                <span>{p.subject}</span>
                <span className="tag">{p.durationDays} days</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StudyPlan;
