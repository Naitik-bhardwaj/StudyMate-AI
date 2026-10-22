import express from "express";
import {
  generateStudyPlan,
  getStudyPlans,
  toggleTask,
  deleteStudyPlan,
} from "../controllers/studyPlanController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/generate", generateStudyPlan);
router.get("/", getStudyPlans);
router.patch("/:id/task/:day", toggleTask);
router.delete("/:id", deleteStudyPlan);

export default router;
