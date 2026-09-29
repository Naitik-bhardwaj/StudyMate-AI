import User from "../models/User.js";

// @route GET /api/leaderboard
// Returns the top 20 users by points, plus the current user's rank if
// they're outside the top 20.
export const getLeaderboard = async (req, res, next) => {
  try {
    const topUsers = await User.find({})
      .select("name stats.points stats.studyStreak stats.badges")
      .sort({ "stats.points": -1 })
      .limit(20);

    const leaderboard = topUsers.map((u, i) => ({
      rank: i + 1,
      userId: u._id,
      name: u.name,
      points: u.stats.points,
      streak: u.stats.studyStreak,
      badges: u.stats.badges,
      isCurrentUser: u._id.equals(req.user._id),
    }));

    let currentUserEntry = leaderboard.find((entry) => entry.isCurrentUser);

    if (!currentUserEntry) {
      // Current user isn't in the top 20 — compute their real rank separately
      const higherRankedCount = await User.countDocuments({
        "stats.points": { $gt: req.user.stats.points },
      });
      currentUserEntry = {
        rank: higherRankedCount + 1,
        userId: req.user._id,
        name: req.user.name,
        points: req.user.stats.points,
        streak: req.user.stats.studyStreak,
        badges: req.user.stats.badges,
        isCurrentUser: true,
        outsideTop20: true,
      };
    }

    res.json({ leaderboard, currentUserEntry });
  } catch (error) {
    next(error);
  }
};
