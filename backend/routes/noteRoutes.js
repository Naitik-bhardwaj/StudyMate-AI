import express from "express";
import multer from "multer";
import { summarizeNote, getNotes, getNote, deleteNote } from "../controllers/noteController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Store uploads in memory (not on disk) — we only need the buffer briefly
// to extract text, we never persist the raw file.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are supported"));
  },
});

router.use(protect);

router.post("/summarize", upload.single("file"), summarizeNote);
router.get("/", getNotes);
router.get("/:id", getNote);
router.delete("/:id", deleteNote);

export default router;
