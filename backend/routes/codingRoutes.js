import express from "express";
import { askCodingAssistant, reviewCode } from "../controllers/codingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/ask", askCodingAssistant);
router.post("/review", reviewCode);

export default router;
