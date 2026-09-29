import FlashcardDeck from "../models/Flashcard.js";
import { getChatCompletion, parseAIJson } from "../utils/groq.js";
import { applySM2 } from "../utils/spacedRepetition.js";
import { recordActivity } from "../utils/gamification.js";

// @route POST /api/flashcards/generate
// Body: { topic, numCards }
export const generateFlashcards = async (req, res, next) => {
  try {
    const { topic } = req.body;
    const numCards = Math.min(30, Math.max(5, Number(req.body.numCards) || 10));

    if (!topic) {
      return res.status(400).json({ message: "Please provide a topic" });
    }

    const prompt = `Create ${numCards} flashcards for studying "${topic}".
Return ONLY valid JSON (no markdown) in exactly this shape:
{
  "cards": [
    { "front": "question or term", "back": "answer or definition" }
  ]
}
Keep each side concise — front is a short prompt, back is a clear, complete answer.`;

    const maxTokens = Math.min(6000, Math.max(1500, numCards * 120));

    const raw = await getChatCompletion(
      [
        {
          role: "system",
          content: "You are a flashcard-generation engine. Reply with a single valid JSON object only. Never return an empty response.",
        },
        { role: "user", content: prompt },
      ],
      { response_format: { type: "json_object" }, temperature: 0.4, max_tokens: maxTokens }
    );

    const parsed = parseAIJson(raw);
    if (!Array.isArray(parsed.cards) || parsed.cards.length !== numCards ||
      parsed.cards.some((card) => !card.front || !card.back)) {
      return res.status(502).json({ message: "The AI returned an invalid flashcard deck. Please generate it again." });
    }

    const deck = await FlashcardDeck.create({
      user: req.user._id,
      topic,
      cards: parsed.cards, // defaults (easeFactor, interval, nextReviewDate=now) apply automatically
    });

    res.status(201).json(deck);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/flashcards
export const getDecks = async (req, res, next) => {
  try {
    const decks = await FlashcardDeck.find({ user: req.user._id }).sort("-createdAt");

    // Attach a "dueCount" for each deck so the UI can show what needs review today
    const now = new Date();
    const withDueCounts = decks.map((deck) => ({
      ...deck.toObject(),
      dueCount: deck.cards.filter((c) => c.nextReviewDate <= now).length,
    }));

    res.json(withDueCounts);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/flashcards/:id
export const getDeck = async (req, res, next) => {
  try {
    const deck = await FlashcardDeck.findOne({ _id: req.params.id, user: req.user._id });
    if (!deck) return res.status(404).json({ message: "Deck not found" });
    res.json(deck);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/flashcards/:id/review
// Body: { cardIndex, quality } — quality is 0-5 (SM-2 rating)
export const reviewCard = async (req, res, next) => {
  try {
    const { cardIndex, quality } = req.body;

    if (quality === undefined || cardIndex === undefined) {
      return res.status(400).json({ message: "cardIndex and quality are required" });
    }

    const deck = await FlashcardDeck.findOne({ _id: req.params.id, user: req.user._id });
    if (!deck) return res.status(404).json({ message: "Deck not found" });

    const card = deck.cards[cardIndex];
    if (!card) return res.status(404).json({ message: "Card not found" });

    const updated = applySM2(card, quality);
    card.easeFactor = updated.easeFactor;
    card.interval = updated.interval;
    card.repetitions = updated.repetitions;
    card.nextReviewDate = updated.nextReviewDate;

    await deck.save();

    // Small point reward per card reviewed, keeps the streak alive
    const { stats, newlyUnlocked } = await recordActivity(req.user._id, 1);

    res.json({ card, totalPoints: stats.points, streak: stats.studyStreak, newlyUnlocked });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/flashcards/:id
export const deleteDeck = async (req, res, next) => {
  try {
    await FlashcardDeck.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Deck deleted" });
  } catch (error) {
    next(error);
  }
};
