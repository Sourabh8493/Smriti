const GameSession = require("../models/GameSession");
const Patient = require("../models/Patient");
const DailySummary = require("../models/DailySummary");
const { generateDailySummaryForPatient } = require("../utils/clinicalSummarizer");

function getDayKey(dateObj) {
  return new Date(dateObj).toISOString().slice(0, 10);
}

/**
 * Returns cached daily AI summaries for the patient, generating only for
 * newly played dates or when new sessions have been recorded on that day.
 * Zero repetitive API calls or redundant computation!
 */
async function getDailySummaries(req, res) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) return res.json([]);

  // Fetch all sessions sorted chronologically for baseline calculation
  const allSessions = await GameSession.find({ patient: patient._id }).sort({ playedAt: 1 });
  if (!allSessions.length) return res.json([]);

  // Group sessions by day: dateKey -> array of sessions
  const sessionsByDay = new Map();
  allSessions.forEach((s) => {
    const key = getDayKey(s.playedAt);
    if (!sessionsByDay.has(key)) sessionsByDay.set(key, []);
    sessionsByDay.get(key).push(s);
  });

  // Fetch all existing cached summaries from MongoDB in one batch
  const existingSummaries = await DailySummary.find({ patient: patient._id });
  const summaryMap = new Map();
  existingSummaries.forEach((sum) => {
    summaryMap.set(sum.date, sum);
  });

  const dayKeys = Array.from(sessionsByDay.keys()).sort(); // chronological
  const finalSummaries = [];

  for (let i = 0; i < dayKeys.length; i++) {
    const dayKey = dayKeys[i];
    const daySessions = sessionsByDay.get(dayKey);
    const existing = summaryMap.get(dayKey);

    const latestSession = daySessions[daySessions.length - 1];
    const latestSessionTime = new Date(latestSession.playedAt);

    const needsGeneration =
      !existing ||
      existing.sessionCount !== daySessions.length ||
      new Date(existing.lastSessionTime).getTime() < latestSessionTime.getTime();

    if (needsGeneration) {
      // Gather previous sessions (up to 7 days before this date) for baseline
      const previousSessions = allSessions.filter((s) => {
        const sTime = new Date(s.playedAt).getTime();
        const curDayStart = new Date(`${dayKey}T00:00:00Z`).getTime();
        const sevenDaysPrior = curDayStart - 7 * 24 * 60 * 60 * 1000;
        return sTime < curDayStart && sTime >= sevenDaysPrior;
      });

      const generated = await generateDailySummaryForPatient(daySessions, patient, previousSessions);

      const saved = await DailySummary.findOneAndUpdate(
        { patient: patient._id, date: dayKey },
        {
          patient: patient._id,
          date: dayKey,
          sessionCount: daySessions.length,
          lastSessionTime: latestSessionTime,
          avgAccuracy: generated.avgAccuracy,
          bestAccuracy: generated.bestAccuracy,
          avgReactionMs: generated.avgReactionMs,
          flagged: generated.flagged,
          summary: generated.summary,
          strengths: generated.strengths,
          challenges: generated.challenges,
          caregiverTip: generated.caregiverTip,
          source: generated.source,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      finalSummaries.push(saved);
    } else {
      // Use cached MongoDB document directly
      finalSummaries.push(existing);
    }
  }

  // Return sorted descending (most recent date first)
  finalSummaries.sort((a, b) => b.date.localeCompare(a.date));
  res.json(finalSummaries);
}

/**
 * Explicitly forces a re-analysis/regeneration of a specific day's summary.
 */
async function regenerateDailySummary(req, res) {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    return res.status(404).json({ message: "No patient profile found." });
  }

  const { date } = req.body;
  if (!date) {
    return res.status(400).json({ message: "Date is required (YYYY-MM-DD)." });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const daySessions = await GameSession.find({
    patient: patient._id,
    playedAt: { $gte: dayStart, $lte: dayEnd },
  }).sort({ playedAt: 1 });

  if (!daySessions.length) {
    return res.status(404).json({ message: "No game sessions recorded for this date." });
  }

  const previousSessions = await GameSession.find({
    patient: patient._id,
    playedAt: {
      $gte: new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000),
      $lt: dayStart,
    },
  });

  const generated = await generateDailySummaryForPatient(daySessions, patient, previousSessions);
  const latestSession = daySessions[daySessions.length - 1];

  const saved = await DailySummary.findOneAndUpdate(
    { patient: patient._id, date },
    {
      patient: patient._id,
      date,
      sessionCount: daySessions.length,
      lastSessionTime: latestSession.playedAt,
      avgAccuracy: generated.avgAccuracy,
      bestAccuracy: generated.bestAccuracy,
      avgReactionMs: generated.avgReactionMs,
      flagged: generated.flagged,
      summary: generated.summary,
      strengths: generated.strengths,
      challenges: generated.challenges,
      caregiverTip: generated.caregiverTip,
      source: generated.source,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json(saved);
}

module.exports = {
  getDailySummaries,
  regenerateDailySummary,
};
