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
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const app = express();
// Render and similar hosts sit behind a proxy and set X-Forwarded-For.
app.set("trust proxy", 1);

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: "2mb" }));

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(backendDir, "../frontend/dist");

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
  const database = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    database,
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

// Unmatched API calls stay JSON 404s. Page routes fall through to the React app.
app.use("/api", notFound);

app.use(express.static(frontendDist));
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (!err) return;
    // Backend-only Render deploys have no frontend build. A 404 on / fails the health check.
    if (req.path === "/") return res.json({ status: "ok", service: "studymate-api" });
    next();
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithRetry = async () => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      await connectDB();
      return;
    } catch (error) {
      console.error(`MongoDB connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < 5) await sleep(5000);
    }
  }
  console.error("MongoDB is still unreachable. On Render, MONGO_URI must be the Atlas connection string, not 127.0.0.1.");
};

const startServer = () => {
  // Render only detects 0.0.0.0. Bind first so a slow database does not fail the port scan.
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    connectWithRetry();
  });

  server.on("error", (error) => {
    console.error("Server failed to listen:", error.message);
    process.exit(1);
  });
};

startServer();
