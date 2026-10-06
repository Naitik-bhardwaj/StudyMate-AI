import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import studyPlanRoutes from "./routes/studyPlanRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import path from "path"


const app = express();
// Render and similar hosts sit behind a proxy and set X-Forwarded-For.
app.set("trust proxy", 1);

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: "2mb" }));

const _dirname = path.resolve();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests. Please wait a minute and try again." },
});

app.use("/api/chat", aiLimiter);
app.use("/api/quiz/generate", aiLimiter);
app.use("/api/studyplan/generate", aiLimiter);
app.use("/api/coding", aiLimiter);
app.use("/api/flashcards/generate", aiLimiter);
app.use("/api/notes/summarize", aiLimiter);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "connected",
    aiConfigured: Boolean(process.env.GROQ_API_KEY),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/studyplan", studyPlanRoutes);
app.use("/api/coding", codingRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use(notFound);
app.use(errorHandler);

app.use(express.static(path.join(_dirname, "frontend/dist")));
app.get("*", (req, res)=>{
  res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"));
});

const PORT = Number(process.env.PORT) || 5000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
