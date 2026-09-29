import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, // index into options
    explanation: { type: String },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    questions: [questionSchema],
    // Filled in once the user submits their attempt
    attempt: {
      answers: [Number],
      score: Number,
      completedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
