import express from "express";
import {
  generateQuiz,
  submitQuiz,
  getQuizHistory,
  getQuiz,
} from "../controllers/quizController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/generate", generateQuiz);
router.get("/", getQuizHistory);
router.get("/:id", getQuiz);
router.post("/:id/submit", submitQuiz);

export default router;
