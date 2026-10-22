import { useState } from "react";
import ReactMarkdown from "react-markdown";
import api, { getApiErrorMessage } from "../api/axios.js";

const CodingAssistant = () => {
  const [question, setQuestion] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setReply("");
    try {
      const { data } = await api.post("/coding/ask", { question, code, language });
      setReply(data.reply);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Paste some code first to get a review");
      return;
    }
    setError("");
    setLoading(true);
    setReply("");
    try {
      const { data } = await api.post("/coding/review", { code, language });
      setReply(data.reply);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Coding Assistant</h1>
      <p className="page-subtitle">Get help debugging, explaining, or reviewing your code.</p>

      <form className="coding-form" onSubmit={handleAsk}>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
          <option value="other">Other</option>
        </select>

        <textarea
          placeholder="Paste your code here (optional)"
          rows={10}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="code-input"
        />

        <input
          type="text"
          placeholder="What do you need help with? (e.g. Why is this loop infinite?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        <div className="button-row">
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Thinking..." : "Ask"}
          </button>
          <button type="button" className="btn-secondary" onClick={handleReview} disabled={loading}>
            Review My Code
          </button>
        </div>
      </form>

      {error && <div className="alert-error">{error}</div>}

      {reply && (
        <div className="coding-reply">
          <ReactMarkdown>{reply}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default CodingAssistant;
