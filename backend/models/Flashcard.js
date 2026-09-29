import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    front: { type: String, required: true },
    back: { type: String, required: true },
    // SM-2 spaced repetition state
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 }, // days until next review
    repetitions: { type: Number, default: 0 },
    nextReviewDate: { type: Date, default: () => new Date() }, // due immediately when created
  },
  { _id: false }
);

const flashcardDeckSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },
    cards: [cardSchema],
  },
  { timestamps: true }
);

export default mongoose.model("FlashcardDeck", flashcardDeckSchema);
