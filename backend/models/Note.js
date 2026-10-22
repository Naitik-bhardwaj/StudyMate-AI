import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    sourceType: { type: String, enum: ["pdf", "text"], default: "text" },
    originalFilename: { type: String },
    summary: { type: String, required: true },
    keyPoints: [{ type: String }],
    // We intentionally do NOT store the full extracted text long-term to keep
    // documents small — only the AI-generated summary and key points.
  },
  { timestamps: true }
);

export default mongoose.model("Note", noteSchema);
