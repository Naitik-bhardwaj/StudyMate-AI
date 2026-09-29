import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true }, // day 1, 2, 3...
    title: { type: String, required: true },
    description: { type: String },
    estimatedHours: { type: Number, default: 1 },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const studyPlanSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    goal: { type: String, required: true },
    durationDays: { type: Number, required: true },
    hoursPerDay: { type: Number, required: true },
    tasks: [taskSchema],
  },
  { timestamps: true }
);

export default mongoose.model("StudyPlan", studyPlanSchema);
