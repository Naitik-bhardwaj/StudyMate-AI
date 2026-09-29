import { useState, useEffect } from "react";
import api, { getApiErrorMessage } from "../api/axios.js";

const QUALITY_OPTIONS = [
  { label: "Again", quality: 0, className: "quality-again" },
  { label: "Hard", quality: 3, className: "quality-hard" },
  { label: "Good", quality: 4, className: "quality-good" },
  { label: "Easy", quality: 5, className: "quality-easy" },
];

const Flashcards = () => {
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [reviewQueue, setReviewQueue] = useState([]); // indices of due cards
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const loadDecks = () => {
    api.get("/flashcards").then((res) => setDecks(res.data)).catch((err) => setError(getApiErrorMessage(err, "Could not load your flashcards")));
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/flashcards/generate", { topic, numCards });
      setTopic("");
      loadDecks();
      startReview(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to generate flashcards"));
    } finally {
      setLoading(false);
    }
  };

  const startReview = (deck) => {
    const now = new Date();
    const due = deck.cards
      .map((c, i) => ({ ...c, index: i }))
      .filter((c) => new Date(c.nextReviewDate) <= now);
    setActiveDeck(deck);
    setReviewQueue(due.length > 0 ? due.map((c) => c.index) : deck.cards.map((_, i) => i));
    setCurrentIndex(0);
    setShowBack(false);
  };

  const handleOpenDeck = async (deckId) => {
    try {
      const { data } = await api.get(`/flashcards/${deckId}`);
      startReview(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not open this deck"));
    }
  };

  const handleRate = async (quality) => {
    const cardIndex = reviewQueue[currentIndex];
    try {
      const { data } = await api.post(`/flashcards/${activeDeck._id}/review`, {
        cardIndex,
        quality,
      });
      if (data.newlyUnlocked?.length) {
        setToast(`🏅 Badge unlocked: ${data.newlyUnlocked.join(", ")}`);
        setTimeout(() => setToast(""), 4000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save this review"));
      return;
    }

    if (currentIndex + 1 < reviewQueue.length) {
      setCurrentIndex(currentIndex + 1);
      setShowBack(false);
    } else {
      setActiveDeck(null);
      loadDecks();
    }
  };

  const handleDelete = async (deckId) => {
    try {
      await api.delete(`/flashcards/${deckId}`);
      loadDecks();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete this deck"));
    }
  };

  if (activeDeck && reviewQueue.length > 0) {
    const card = activeDeck.cards[reviewQueue[currentIndex]];
    return (
      <div className="page">
        {toast && <div className="toast">{toast}</div>}
        <h1>{activeDeck.topic}</h1>
        <p className="page-subtitle">
          Card {currentIndex + 1} of {reviewQueue.length}
        </p>

        <div className="flashcard" onClick={() => setShowBack(!showBack)}>
          <div className="flashcard-content">{showBack ? card.back : card.front}</div>
          <span className="flashcard-hint">{showBack ? "" : "Click to reveal answer"}</span>
        </div>

        {showBack && (
          <div className="quality-row">
            {QUALITY_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                className={`quality-btn ${opt.className}`}
                onClick={() => handleRate(opt.quality)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <button className="btn-secondary" style={{ marginTop: "1.5rem" }} onClick={() => setActiveDeck(null)}>
          Exit Review
        </button>
      </div>
    );
  }

  return (
    <div className="page">
      {toast && <div className="toast">{toast}</div>}
      <h1>Flashcards</h1>
      <p className="page-subtitle">Generate AI flashcards and review them with spaced repetition.</p>

      <form className="inline-form" onSubmit={handleGenerate}>
        <input
          type="text"
          placeholder="Topic (e.g. Cell Biology, JavaScript Closures)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        <input
          type="number"
          min="5"
          max="30"
          value={numCards}
          onChange={(e) => setNumCards(Number(e.target.value))}
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Deck"}
        </button>
      </form>

      {error && <div className="alert-error">{error}</div>}

      <div className="recent-section">
        <h2>Your Decks</h2>
        {decks.length === 0 && <p className="empty-state">No decks yet — generate your first one above.</p>}
        <ul className="list">
          {decks.map((deck) => (
            <li key={deck._id}>
              <span onClick={() => handleOpenDeck(deck._id)} style={{ cursor: "pointer", fontWeight: 600 }}>
                {deck.topic}
              </span>
              <span className="tag">{deck.cards.length} cards</span>
              {deck.dueCount > 0 && <span className="tag due-tag">{deck.dueCount} due</span>}
              <button className="btn-ghost-small" onClick={() => handleDelete(deck._id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Flashcards;
