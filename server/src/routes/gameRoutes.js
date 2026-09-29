const express = require("express");
const { protect } = require("../middleware/auth");
const {
  createSession,
  listSessions,
  getRecommendedDifficulty,
} = require("../controllers/gameController");
const {
  getDailySummaries,
  regenerateDailySummary,
} = require("../controllers/dailySummaryController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/sessions", protect, asyncHandler(createSession));
router.get("/sessions", protect, asyncHandler(listSessions));
router.get("/recommended-difficulty", protect, asyncHandler(getRecommendedDifficulty));
router.get("/daily-summaries", protect, asyncHandler(getDailySummaries));
router.post("/daily-summaries/regenerate", protect, asyncHandler(regenerateDailySummary));

module.exports = router;
