import ChatMessage from "../models/ChatMessage.js";
import { getChatCompletion } from "../utils/groq.js";

const SYSTEM_PROMPT = `You are a friendly, encouraging AI study assistant helping a student learn.
Explain concepts clearly, use simple language, give examples, and break down complex topics
step by step. Keep responses focused and well-formatted with headings or bullet points when helpful.`;

// @route POST /api/chat/:conversationId?
// Sends a message, gets an AI reply, and stores both in the conversation
export const sendMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const { conversationId } = req.params;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    let conversation;
    if (conversationId) {
      conversation = await ChatMessage.findOne({ _id: conversationId, user: req.user._id });
    }
    if (!conversation) {
      conversation = await ChatMessage.create({
        user: req.user._id,
        title: message.slice(0, 40),
        messages: [],
      });
    }

    // Build message history for context (last 10 turns to control token usage)
    const history = conversation.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiReply = await getChatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ]);

    conversation.messages.push({ role: "user", content: message });
    conversation.messages.push({ role: "assistant", content: aiReply });
    await conversation.save();

    res.json({ conversationId: conversation._id, reply: aiReply });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/chat
export const getConversations = async (req, res, next) => {
  try {
    const conversations = await ChatMessage.find({ user: req.user._id })
      .select("title createdAt updatedAt")
      .sort("-updatedAt");
    res.json(conversations);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/chat/:conversationId
export const getConversation = async (req, res, next) => {
  try {
    const conversation = await ChatMessage.findOne({
      _id: req.params.conversationId,
      user: req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/chat/:conversationId
export const deleteConversation = async (req, res, next) => {
  try {
    await ChatMessage.deleteOne({ _id: req.params.conversationId, user: req.user._id });
    res.json({ message: "Conversation deleted" });
  } catch (error) {
    next(error);
  }
};
