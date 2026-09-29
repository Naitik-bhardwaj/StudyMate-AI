import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    // Simple progress tracking used by the dashboard
    stats: {
      quizzesTaken: { type: Number, default: 0 },
      totalCorrect: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      studyStreak: { type: Number, default: 0 },
      // Gamification
      points: { type: Number, default: 0 },
      lastActiveDate: { type: Date, default: null }, // used to compute streaks
      badges: [{ type: String }], // e.g. "Quiz Novice", "7-Day Streak"
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
