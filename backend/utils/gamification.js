import User from "../models/User.js";

// Badge thresholds — checked after every point-awarding action
const BADGE_RULES = [
  { key: "Quiz Novice", check: (s) => s.quizzesTaken >= 5 },
  { key: "Quiz Master", check: (s) => s.quizzesTaken >= 25 },
  { key: "Sharp Shooter", check: (s) => s.totalQuestions >= 20 && s.totalCorrect / s.totalQuestions >= 0.8 },
  { key: "3-Day Streak", check: (s) => s.studyStreak >= 3 },
  { key: "7-Day Streak", check: (s) => s.studyStreak >= 7 },
  { key: "30-Day Streak", check: (s) => s.studyStreak >= 30 },
  { key: "Point Collector", check: (s) => s.points >= 100 },
  { key: "Point Champion", check: (s) => s.points >= 500 },
];

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const isYesterday = (lastDate, today) => {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(lastDate, yesterday);
};

/**
 * Call this any time a user does a "study activity" (quiz submit, flashcard
 * review, study-plan task completion, notes summarized). Awards points,
 * updates the daily streak, and unlocks any newly-earned badges.
 *
 * @param {String} userId
 * @param {Number} points - points to award for this action
 * @returns {Object} the updated stats + any newly unlocked badges
 */
export const recordActivity = async (userId, points = 0) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const today = new Date();
  const lastActive = user.stats.lastActiveDate;

  if (!lastActive) {
    user.stats.studyStreak = 1;
  } else if (isSameDay(lastActive, today)) {
    // already active today — streak unchanged
  } else if (isYesterday(lastActive, today)) {
    user.stats.studyStreak += 1;
  } else {
    user.stats.studyStreak = 1; // streak broken, restart
  }

  user.stats.lastActiveDate = today;
  user.stats.points += points;

  const newlyUnlocked = [];
  for (const rule of BADGE_RULES) {
    if (rule.check(user.stats) && !user.stats.badges.includes(rule.key)) {
      user.stats.badges.push(rule.key);
      newlyUnlocked.push(rule.key);
    }
  }

  await user.save();

  return { stats: user.stats, newlyUnlocked };
};
