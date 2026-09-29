const GameSession = require("../models/GameSession");
const Patient = require("../models/Patient");

async function createSession(req, res) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    return res.status(404).json({ message: "No patient profile has been created yet." });
  }

  const {
    gameId,
    level,
    correctCount,
    totalCount,
    accuracy,
    totalTimeMs,
    avgReactionMs,
    fastestMs,
    slowestMs,
    patternCorrect,
    patternTotal,
    silhouetteCorrect,
    silhouetteTotal,
    recallCorrect,
    breakdown,
    isAdaptive,
    startingLevel,
    endingLevel,
    dominantLevel,
    levelProgression,
    aiInsights,
  } = req.body;

  if (level == null || accuracy == null) {
    return res.status(400).json({ message: "level and accuracy are required." });
  }

  const session = await GameSession.create({
    patient: patient._id,
    gameId: gameId || "market-memory",
    level,
    correctCount,
    totalCount,
    accuracy,
    totalTimeMs,
    avgReactionMs,
    fastestMs,
    slowestMs,
    patternCorrect,
    patternTotal,
    silhouetteCorrect,
    silhouetteTotal,
    recallCorrect,
    breakdown,
    isAdaptive: Boolean(isAdaptive),
    startingLevel,
    endingLevel,
    dominantLevel: dominantLevel || level,
    levelProgression,
    aiInsights,
  });

  res.status(201).json(session);
}

async function listSessions(req, res) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) return res.json([]);

  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const sessions = await GameSession.find({ patient: patient._id })
    .sort({ playedAt: -1 })
    .limit(limit);

  res.json(sessions);
}

/**
 * AI Difficulty Recommendation Engine
 * Analyzes rolling telemetry across recent game sessions and calculates
 * the optimal cognitive difficulty tier for the patient.
 */
async function getRecommendedDifficulty(req, res) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    return res.status(404).json({ message: "No patient profile found." });
  }

  const stage = (patient?.medical?.stage || "").toLowerCase();
  let baseLevel = 1;
  if (stage.includes("mild") || stage.includes("cdr 0.5") || stage.includes("cdr 1")) {
    baseLevel = 2;
  }

  // Fetch last 10 sessions
  const recentSessions = await GameSession.find({ patient: patient._id })
    .sort({ playedAt: -1 })
    .limit(10);

  if (!recentSessions.length) {
    return res.json({
      recommendedLevel: baseLevel,
      levelName: baseLevel === 2 ? "Steady" : "Gentle",
      confidence: "Baseline Calibration",
      rationale: `Calibrated to initial profile stage (${patient?.medical?.stage || "Calibrated baseline"}). As sessions are completed, AI will refine difficulty dynamically.`,
      stats: {
        totalSessions: 0,
        avgAccuracy: null,
        avgReactionMs: null,
      },
    });
  }

  const accuracies = recentSessions.map((s) => s.accuracy ?? 0);
  const avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);

  const reactionTimes = recentSessions.map((s) => s.avgReactionMs ?? 0).filter((t) => t > 0);
  const avgReactionMs = reactionTimes.length
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 4000;

  const lastLevel = recentSessions[0].dominantLevel || recentSessions[0].level || baseLevel;

  let recommendedLevel = lastLevel;
  let rationale = "";

  if (avgAccuracy >= 82 && avgReactionMs < 6000) {
    // Performing with ease -> step up or maintain top tier
    recommendedLevel = Math.min(lastLevel + 1, 3);
    rationale = `Patient achieved ${avgAccuracy}% average accuracy with brisk ${(avgReactionMs / 1000).toFixed(1)}s response latency. Advancing to Level ${recommendedLevel} maintains the optimal Zone of Proximal Development without boredom.`;
  } else if (avgAccuracy < 60 || avgReactionMs > 8500) {
    // Cognitive struggle / fatigue detected -> step down for scaffolding
    recommendedLevel = Math.max(lastLevel - 1, 1);
    rationale = `Recent accuracy (${avgAccuracy}%) and ${(avgReactionMs / 1000).toFixed(1)}s latency indicate mental fatigue. Level ${recommendedLevel} provides supportive scaffolding and psychological comfort.`;
  } else {
    // Stable performance in zone
    recommendedLevel = lastLevel;
    rationale = `Cognitive engagement is stable at ${avgAccuracy}% accuracy. Continuing at Level ${recommendedLevel} sustains focus and builds working memory endurance.`;
  }

  const LEVEL_NAMES = {
    1: "Gentle",
    2: "Steady",
    3: "Challenging",
  };

  res.json({
    recommendedLevel,
    levelName: LEVEL_NAMES[recommendedLevel] || "Steady",
    confidence: "High (Cognitive Telemetry Analyzed)",
    rationale,
    stats: {
      totalSessions: recentSessions.length,
      avgAccuracy,
      avgReactionMs,
    },
  });
}

module.exports = { createSession, listSessions, getRecommendedDifficulty };
