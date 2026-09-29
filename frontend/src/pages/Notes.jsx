import { useState, useEffect, useRef } from "react";
import api, { getApiErrorMessage } from "../api/axios.js";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [pastedText, setPastedText] = useState("");
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const loadNotes = () => {
    api.get("/notes").then((res) => setNotes(res.data)).catch((err) => setError(getApiErrorMessage(err, "Could not load your notes")));
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/notes/summarize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setActiveNote(data.note);
      loadNotes();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to summarize this file"));
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePastedSubmit = async (e) => {
    e.preventDefault();
    if (!pastedText.trim()) return;

    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/notes/summarize", { text: pastedText });
      setActiveNote(data.note);
      setPastedText("");
      loadNotes();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to summarize this text"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      if (activeNote?._id === id) setActiveNote(null);
      loadNotes();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete this note"));
    }
  };

  return (
    <div className="page">
      <h1>Notes Summarizer</h1>
      <p className="page-subtitle">Upload a PDF or paste your notes to get an instant AI summary.</p>

      <div className="notes-upload-row">
        <label className="upload-box">
          <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileUpload} hidden />
          📄 Upload a PDF
        </label>
      </div>

      <form className="paste-form" onSubmit={handlePastedSubmit}>
        <textarea
          placeholder="...or paste your notes here"
          rows={6}
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading || !pastedText.trim()}>
          {loading ? "Summarizing..." : "Summarize Text"}
        </button>
      </form>

      {loading && <p className="empty-state">Reading and summarizing...</p>}
      {error && <div className="alert-error">{error}</div>}

      {activeNote && (
        <div className="note-summary-card">
          <h2>{activeNote.title}</h2>
          <p>{activeNote.summary}</p>
          {activeNote.keyPoints?.length > 0 && (
            <>
              <h3>Key Points</h3>
              <ul>
                {activeNote.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="recent-section">
        <h2>Your Notes</h2>
        {notes.length === 0 && <p className="empty-state">No summarized notes yet.</p>}
        <ul className="list">
          {notes.map((n) => (
            <li key={n._id}>
              <span onClick={() => setActiveNote(n)} style={{ cursor: "pointer", fontWeight: 600 }}>
                {n.title}
              </span>
              <span className="tag">{n.sourceType}</span>
              <button className="btn-ghost-small" onClick={() => handleDelete(n._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Notes;
