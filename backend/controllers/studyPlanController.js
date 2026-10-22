import StudyPlan from "../models/StudyPlan.js";
import { getChatCompletion, parseAIJson } from "../utils/groq.js";
import { recordActivity } from "../utils/gamification.js";

// @route POST /api/studyplan/generate
// Body: { subject, goal, durationDays, hoursPerDay }
export const generateStudyPlan = async (req, res, next) => {
  try {
    const { subject, goal } = req.body;
    const durationDays = Math.min(30, Math.max(1, Number(req.body.durationDays) || 7));
    const hoursPerDay = Math.min(12, Math.max(1, Number(req.body.hoursPerDay) || 2));

    if (!subject || !goal) {
      return res.status(400).json({ message: "Please provide a subject and a goal" });
    }

    const prompt = `Create a ${durationDays}-day study plan for the subject "${subject}".
The student's goal is: "${goal}".
They can study ${hoursPerDay} hour(s) per day.
Return ONLY valid JSON (no markdown) in exactly this shape:
{
  "tasks": [
    { "day": 1, "title": "string", "description": "string", "estimatedHours": number }
  ]
}
Make sure there is exactly one entry per day from 1 to ${durationDays}, tasks build progressively,
and estimatedHours roughly matches ${hoursPerDay} per day.`;

    const raw = await getChatCompletion(
      [
        { role: "system", content: "You are a study-plan generation engine. You only output valid JSON." },
        { role: "user", content: prompt },
      ],
      { response_format: { type: "json_object" }, temperature: 0.6, max_tokens: 2000 }
    );

    const parsed = parseAIJson(raw);
    if (!Array.isArray(parsed.tasks) || parsed.tasks.length !== durationDays) {
      return res.status(502).json({ message: "The AI returned an incomplete study plan. Please generate it again." });
    }
    const tasks = parsed.tasks.map((task, index) => ({
      day: index + 1,
      title: String(task.title || `Day ${index + 1}`),
      description: String(task.description || ""),
      estimatedHours: Math.max(0.25, Number(task.estimatedHours) || hoursPerDay),
    }));

    const plan = await StudyPlan.create({
      user: req.user._id,
      subject,
      goal,
      durationDays,
      hoursPerDay,
      tasks,
    });

    res.status(201).json(plan);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/studyplan
export const getStudyPlans = async (req, res, next) => {
  try {
    const plans = await StudyPlan.find({ user: req.user._id }).sort("-createdAt");
    res.json(plans);
  } catch (error) {
    next(error);
  }
};

// @route PATCH /api/studyplan/:id/task/:day
// Toggles a task's completed state
export const toggleTask = async (req, res, next) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) return res.status(404).json({ message: "Study plan not found" });

    const task = plan.tasks.find((t) => t.day === Number(req.params.day));
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.completed = !task.completed;
    await plan.save();

    // Only award points when a task is being marked complete (not un-checked)
    let gamification = null;
    if (task.completed) {
      const { stats, newlyUnlocked } = await recordActivity(req.user._id, 5);
      gamification = { totalPoints: stats.points, streak: stats.studyStreak, newlyUnlocked };
    }

    res.json({ plan, gamification });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/studyplan/:id
export const deleteStudyPlan = async (req, res, next) => {
  try {
    await StudyPlan.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Study plan deleted" });
  } catch (error) {
    next(error);
  }
};
