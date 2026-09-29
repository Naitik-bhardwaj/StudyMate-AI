import { useState } from "react";
import api, { getApiErrorMessage } from "../api/axios.js";

const QuizGenerator = () => {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setQuiz(null);
    setResult(null);
    try {
      const { data } = await api.post("/quiz/generate", { topic, difficulty, numQuestions });
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(null));
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to generate quiz"));
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (qIndex, optIndex) => {
    if (result) return;
    const updated = [...answers];
    updated[qIndex] = optIndex;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    try {
      const { data } = await api.post(`/quiz/${quiz._id}/submit`, { answers });
      setResult(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to submit quiz"));
    }
  };

  return (
    <div className="page">
      <h1>Quiz Generator</h1>
      <p className="page-subtitle">Turn any topic into a custom multiple-choice quiz.</p>

      <form className="inline-form" onSubmit={handleGenerate}>
        <input
          type="text"
          placeholder="Topic (e.g. Photosynthesis, React Hooks, WW2)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <input
          type="number"
          min="3"
          max="15"
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Quiz"}
        </button>
      </form>

      {error && <div className="alert-error">{error}</div>}

      {quiz && (
        <div className="quiz-container">
          {result && (
            <div className="quiz-result">
              Score: {result.score} / {result.total}
            </div>
          )}
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="quiz-question-card">
              <h3>{qi + 1}. {q.question}</h3>
              <div className="options">
                {q.options.map((opt, oi) => {
                  let cls = "option";
                  if (result) {
                    if (oi === q.correctAnswer) cls += " correct";
                    else if (oi === answers[qi]) cls += " incorrect";
                  } else if (answers[qi] === oi) {
                    cls += " selected";
                  }
                  return (
                    <button
                      key={oi}
                      type="button"
                      className={cls}
                      onClick={() => selectAnswer(qi, oi)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {result && q.explanation && (
                <p className="explanation">💡 {q.explanation}</p>
              )}
            </div>
          ))}
          {!result && (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={answers.includes(null)}
            >
              Submit Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;
