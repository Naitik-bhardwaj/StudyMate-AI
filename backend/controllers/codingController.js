import { getChatCompletion } from "../utils/groq.js";

const CODING_SYSTEM_PROMPT = `You are an expert programming tutor and coding assistant.
When explaining code: be precise, use correct terminology, and format code in fenced code blocks
with the right language tag. When debugging: identify the bug, explain WHY it happens, then show
the fix. When asked to write code: keep it clean, add brief comments, and mention time complexity
where relevant. Keep explanations beginner-friendly unless the user signals otherwise.`;

// @route POST /api/coding/ask
// Body: { question, code, language }
export const askCodingAssistant = async (req, res, next) => {
  try {
    const { question, code, language } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Please provide a question" });
    }

    const userContent = code
      ? `Language: ${language || "unspecified"}\n\nCode:\n\`\`\`${language || ""}\n${code}\n\`\`\`\n\nQuestion: ${question}`
      : question;

    const reply = await getChatCompletion([
      { role: "system", content: CODING_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ]);

    res.json({ reply });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/coding/review
// Body: { code, language }
// Dedicated endpoint for structured code review / bug finding
export const reviewCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Please provide code to review" });
    }

    const prompt = `Review the following ${language || ""} code. List:
1. Bugs or errors (if any)
2. Improvements (readability, performance, best practices)
3. A corrected version if changes are needed

Code:
\`\`\`${language || ""}
${code}
\`\`\``;

    const reply = await getChatCompletion([
      { role: "system", content: CODING_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ]);

    res.json({ reply });
  } catch (error) {
    next(error);
  }
};
