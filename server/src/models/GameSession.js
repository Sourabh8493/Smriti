const mongoose = require("mongoose");

const gameSessionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    gameId: { type: String, required: true, default: "market-memory" },
    level: { type: Number, required: true, min: 1, max: 3 },
    correctCount: Number,
    totalCount: Number,
    accuracy: Number,
    totalTimeMs: Number,
    avgReactionMs: Number,
    fastestMs: Number,
    slowestMs: Number,
    patternCorrect: Number,
    patternTotal: Number,
    silhouetteCorrect: Number,
    silhouetteTotal: Number,
    recallCorrect: Boolean,
    breakdown: [
      {
        category: String,
        correct: Boolean,
        _id: false,
      },
    ],
    // AI Adaptive difficulty tracking fields
    isAdaptive: { type: Boolean, default: false },
    startingLevel: Number,
    endingLevel: Number,
    dominantLevel: Number,
    levelProgression: [Number],
    aiInsights: String,
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gameSessionSchema.index({ patient: 1, playedAt: -1 });
module.exports = mongoose.model("GameSession", gameSessionSchema);