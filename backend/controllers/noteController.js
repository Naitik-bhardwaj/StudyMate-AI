import pdfParse from "pdf-parse";
import Note from "../models/Note.js";
import { getChatCompletion, parseAIJson } from "../utils/groq.js";
import { recordActivity } from "../utils/gamification.js";

const MAX_CHARS_FOR_AI = 15000; // keep prompt size (and cost) under control

// @route POST /api/notes/summarize
// Accepts EITHER a multipart file upload (field name "file", PDF) OR a JSON
// body { text, title } for plain pasted notes.
export const summarizeNote = async (req, res, next) => {
  try {
    let extractedText = "";
    let sourceType = "text";
    let originalFilename;
    let title = req.body.title;

    if (req.file) {
      // PDF uploaded via multer (memory storage)
      const parsed = await pdfParse(req.file.buffer);
      extractedText = parsed.text;
      sourceType = "pdf";
      originalFilename = req.file.originalname;
      title = title || req.file.originalname.replace(/\.pdf$/i, "");
    } else if (req.body.text) {
      extractedText = req.body.text;
      title = title || extractedText.slice(0, 40);
    } else {
      return res.status(400).json({ message: "Please upload a PDF or paste some text" });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ message: "No readable text was found in the file" });
    }

    const trimmedText = extractedText.slice(0, MAX_CHARS_FOR_AI);

    const prompt = `Summarize the following study notes. Return ONLY valid JSON (no markdown) in exactly this shape:
{
  "summary": "a clear 3-6 sentence summary",
  "keyPoints": ["short key point 1", "short key point 2", "..."]
}
Notes:
"""
${trimmedText}
"""`;

    const raw = await getChatCompletion(
      [
        { role: "system", content: "You are a study-notes summarization engine. You only output valid JSON." },
        { role: "user", content: prompt },
      ],
      { response_format: { type: "json_object" }, temperature: 0.5, max_tokens: 800 }
    );

    const parsed = parseAIJson(raw);
    if (!parsed.summary || !Array.isArray(parsed.keyPoints)) {
      return res.status(502).json({ message: "The AI returned an invalid note summary. Please try again." });
    }

    const note = await Note.create({
      user: req.user._id,
      title,
      sourceType,
      originalFilename,
      summary: parsed.summary,
      keyPoints: parsed.keyPoints || [],
    });

    const { stats, newlyUnlocked } = await recordActivity(req.user._id, 5);

    res.status(201).json({ note, totalPoints: stats.points, streak: stats.studyStreak, newlyUnlocked });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/notes
export const getNotes = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort("-createdAt");
    res.json(notes);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/notes/:id
export const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/notes/:id
export const deleteNote = async (req, res, next) => {
  try {
    await Note.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Note deleted" });
  } catch (error) {
    next(error);
  }
};
