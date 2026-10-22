import express from "express";
import {
  generateFlashcards,
  getDecks,
  getDeck,
  reviewCard,
  deleteDeck,
} from "../controllers/flashcardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/generate", generateFlashcards);
router.get("/", getDecks);
router.get("/:id", getDeck);
router.post("/:id/review", reviewCard);
router.delete("/:id", deleteDeck);

export default router;
