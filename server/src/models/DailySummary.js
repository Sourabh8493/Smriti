const mongoose = require("mongoose");

const dailySummarySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    sessionCount: {
      type: Number,
      required: true,
    },
    lastSessionTime: {
      type: Date,
      required: true,
    },
    avgAccuracy: {
      type: Number,
      required: true,
    },
    bestAccuracy: {
      type: Number,
      default: 0,
    },
    avgReactionMs: {
      type: Number,
      default: 0,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      required: true,
    },
    strengths: [String],
    challenges: [String],
    caregiverTip: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["gemini", "clinical-engine"],
      default: "clinical-engine",
    },
  },
  { timestamps: true }
);

// One summary per patient per day
dailySummarySchema.index({ patient: 1, date: -1 }, { unique: true });

module.exports = mongoose.model("DailySummary", dailySummarySchema);
