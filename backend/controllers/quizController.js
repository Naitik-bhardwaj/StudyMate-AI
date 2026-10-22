import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import { getChatCompletion, parseAIJson } from "../utils/groq.js";
import { recordActivity } from "../utils/gamification.js";

// @route POST /api/quiz/generate
// Body: { topic, difficulty, numQuestions }
export const generateQuiz = async (req, res, next) => {
  try {
    const { topic, difficulty = "medium" } = req.body;
    const numQuestions = Math.min(15, Math.max(3, Number(req.body.numQuestions) || 5));

    if (!topic) {
      return res.status(400).json({ message: "Please provide a topic" });
    }

    const prompt = `Generate exactly ${numQuestions} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty.
Return ONLY a valid JSON object (no markdown, no code fences) with this shape:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ]
}
Rules:
- "questions" must contain exactly ${numQuestions} items
- each "options" array must have exactly 4 short strings
- "correctAnswer" is the zero-based index (0-3) of the correct option
- keep explanations to one short sentence
- do not wrap the JSON in markdown`;

    // ~220 tokens per question (stem + 4 options + explanation); keep headroom for JSON.
    const maxTokens = Math.min(8000, Math.max(1800, numQuestions * 280));

    const raw = await getChatCompletion(
      [
        {
          role: "system",
          content: "You are a quiz-generation engine. Reply with a single valid JSON object only. Never return an empty response.",
        },
        { role: "user", content: prompt },
      ],
      { response_format: { type: "json_object" }, temperature: 0.4, max_tokens: maxTokens }
    );

    const parsed = parseAIJson(raw);
    if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(502).json({ message: "The AI returned an incomplete quiz. Please generate it again." });
    }
    // Accept a slightly shorter list if the model truncated; pad is not useful — require at least 3.
    if (parsed.questions.length < Math.min(3, numQuestions)) {
      return res.status(502).json({ message: "The AI returned an incomplete quiz. Please generate it again." });
    }
    parsed.questions = parsed.questions.slice(0, numQuestions).map((q) => ({
      ...q,
      correctAnswer: Number(q.correctAnswer),
      options: Array.isArray(q.options) ? q.options.map((opt) => String(opt)) : q.options,
    }));
    if (parsed.questions.some((q) => !q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
      !Number.isInteger(q.correctAnswer) || q.correctAnswer < 0 || q.correctAnswer > 3)) {
      return res.status(502).json({ message: "The AI returned an invalid quiz format. Please generate it again." });
    }

    const quiz = await Quiz.create({
      user: req.user._id,
      topic,
      difficulty,
      questions: parsed.questions,
    });

    res.status(201).json(quiz);
  } catch (error) {
    next(error);
  }
};

// @route POST /api/quiz/:id/submit
// Body: { answers: [number, number, ...] }
export const submitQuiz = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) score += 1;
    });

    quiz.attempt = { answers, score, completedAt: new Date() };
    await quiz.save();

    // Update user stats for the dashboard
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        "stats.quizzesTaken": 1,
        "stats.totalCorrect": score,
        "stats.totalQuestions": quiz.questions.length,
      },
    });

    // Gamification: 10 points per quiz + 2 bonus points per correct answer
    const pointsEarned = 10 + score * 2;
    const { stats, newlyUnlocked } = await recordActivity(req.user._id, pointsEarned);

    res.json({
      score,
      total: quiz.questions.length,
      quiz,
      pointsEarned,
      totalPoints: stats.points,
      streak: stats.studyStreak,
      newlyUnlocked,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/quiz
export const getQuizHistory = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ user: req.user._id }).sort("-createdAt");
    res.json(quizzes);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/quiz/:id
export const getQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, user: req.user._id });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (error) {
    next(error);
  }
};
