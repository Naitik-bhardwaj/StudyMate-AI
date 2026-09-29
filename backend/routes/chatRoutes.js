import express from "express";
import {
  sendMessage,
  getConversations,
  getConversation,
  deleteConversation,
} from "../controllers/chatController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getConversations);
router.post("/", sendMessage); // starts a new conversation
router.get("/:conversationId", getConversation);
router.post("/:conversationId", sendMessage); // continues a conversation
router.delete("/:conversationId", deleteConversation);

export default router;
