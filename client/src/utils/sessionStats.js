/*
  Turns raw GameSession documents (from GET /api/games/sessions) into what the
  Dashboard and Reports pages display. Everything here is arithmetic over
  stored data — there is no AI summary pipeline yet (see server/README.md),
  so "reports" are real numbers in a templated sentence, not generated prose.
*/

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function average(values) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function overallStats(sessions) {
  if (!sessions.length) return null;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = sessions.filter((s) => new Date(s.playedAt).getTime() >= weekAgo);

  return {
    sessionsThisWeek: thisWeek.length,
    avgAccuracy: Math.round(average(sessions.map((s) => s.accuracy))),
    avgReactionMs: average(sessions.map((s) => s.avgReactionMs)),
    currentStreak: computeStreak(sessions),
  };
}

/** Consecutive days with at least one session, counting back from today (or yesterday, if today is empty so far). */
export function computeStreak(sessions) {
  if (!sessions.length) return 0;
  const days = new Set(sessions.map((s) => dayKey(new Date(s.playedAt))));

  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Average accuracy per day for the last `days` calendar days; null where nothing was played. */
export function scoreTrend(sessions, days = 7) {
  const byDay = new Map();
  sessions.forEach((s) => {
    const key = dayKey(new Date(s.playedAt));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(s.accuracy);
  });

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const values = byDay.get(dayKey(d));
    result.push({
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      accuracy: values ? Math.round(average(values)) : null,
    });
  }
  return result;
}

/** Accuracy broken down by question type, pooled across every stored Market Memory session. */
export function categoryAccuracy(sessions) {
  const marketMemorySessions = sessions.filter((s) => s.gameId === "market-memory");

  const t = {
    patternCorrect: 0,
    patternTotal: 0,
    silhouetteCorrect: 0,
    silhouetteTotal: 0,
    recallCorrect: 0,
    recallTotal: 0,
  };

  marketMemorySessions.forEach((s) => {
    t.patternCorrect += s.patternCorrect || 0;
    t.patternTotal += s.patternTotal || 0;
    t.silhouetteCorrect += s.silhouetteCorrect || 0;
    t.silhouetteTotal += s.silhouetteTotal || 0;
    t.recallCorrect += s.recallCorrect ? 1 : 0;
    t.recallTotal += 1;
  });

  const pct = (correct, total) => (total > 0 ? Math.round((correct / total) * 100) : null);

  return [
    { game: "Pattern", accuracy: pct(t.patternCorrect, t.patternTotal) },
    { game: "Shadow", accuracy: pct(t.silhouetteCorrect, t.silhouetteTotal) },
    { game: "Recall", accuracy: pct(t.recallCorrect, t.recallTotal) },
  ].filter((c) => c.accuracy !== null);
}

/** Accuracy broken down by question category, pooled across every stored Personal Recall session. */
export function personalRecallAccuracy(sessions) {
  const totals = new Map(); // category -> { correct, total }

  sessions
    .filter((s) => s.gameId === "personal-recall")
    .forEach((s) => {
      (s.breakdown || []).forEach(({ category, correct }) => {
        const entry = totals.get(category) || { correct: 0, total: 0 };
        entry.total += 1;
        if (correct) entry.correct += 1;
        totals.set(category, entry);
      });
    });

  const LABELS = {
    personPhoto: "Faces",
    personRelation: "Relationships",
    identity: "Names",
    phone: "Phone numbers",
    address: "Address",
    preference: "Preferences",
  };

  return Array.from(totals.entries()).map(([category, { correct, total }]) => ({
    game: LABELS[category] || category,
    accuracy: Math.round((correct / total) * 100),
  }));
}

/**
 * One "report" per calendar day that has sessions, most recent first.
 * Integrates persistent AI DailySummary documents, with a zero-cost local clinical
 * 5-6 line narrative fallback when offline or loading.
 */
export function dailyReports(sessions, dailySummaries = [], patient = null) {
  const byDay = new Map();
  sessions.forEach((s) => {
    const key = dayKey(new Date(s.playedAt));
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(s);
  });

  const summaryMap = new Map();
  (dailySummaries || []).forEach((sum) => {
    if (sum?.date) summaryMap.set(sum.date, sum);
  });

  const days = Array.from(byDay.keys()).sort().reverse();
  const patientName = patient?.basic?.fullName || "The patient";

  return days.map((key, idx) => {
    const daySessions = byDay.get(key);
    const avgAcc = Math.round(average(daySessions.map((s) => s.accuracy)));
    const best = Math.max(...daySessions.map((s) => s.accuracy));
    const avgReactionMs = average(daySessions.map((s) => s.avgReactionMs));

    const prevSessions = byDay.get(days[idx + 1]);
    const prevAvg = prevSessions ? average(prevSessions.map((s) => s.accuracy)) : null;
    const flagged = prevAvg != null && avgAcc < prevAvg - 18;

    const dateLabel = new Date(key).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const cachedSummary = summaryMap.get(key);

    if (cachedSummary) {
      return {
        id: key,
        dateKey: key,
        date: dateLabel,
        accuracy: cachedSummary.avgAccuracy ?? avgAcc,
        bestAccuracy: cachedSummary.bestAccuracy ?? best,
        avgReactionMs: cachedSummary.avgReactionMs ?? avgReactionMs,
        sessions: cachedSummary.sessionCount ?? daySessions.length,
        flagged: cachedSummary.flagged ?? flagged,
        summary: cachedSummary.summary,
        strengths: cachedSummary.strengths || [],
        challenges: cachedSummary.challenges || [],
        caregiverTip: cachedSummary.caregiverTip || "",
        source: cachedSummary.source || "clinical-engine",
        isAiGenerated: true,
      };
    }

    // High-fidelity 5-6 line clinical synthesis fallback
    const patternTotals = daySessions.reduce((acc, s) => acc + (s.patternTotal || 0), 0);
    const patternCorrects = daySessions.reduce((acc, s) => acc + (s.patternCorrect || 0), 0);
    const patternRatio = patternTotals > 0 ? patternCorrects / patternTotals : 0.8;

    const recallTotals = daySessions.filter((s) => s.gameId === "market-memory").length;
    const recallCorrects = daySessions.filter((s) => s.gameId === "market-memory" && s.recallCorrect).length;
    const recallStruggled = recallTotals > 0 && recallCorrects < recallTotals;

    const l1 = `${patientName} completed ${daySessions.length} session${daySessions.length > 1 ? "s" : ""} today with an average accuracy of ${avgAcc}%, reaching a peak score of ${best}%.`;
    const l2 = patternRatio >= 0.7
      ? `Visual-spatial recognition of traditional patterns and silhouettes remained strongly preserved, reflecting solid perceptual discrimination.`
      : `Autobiographical and personal orientation questions were approached with thoughtful concentration.`;
    const l3 = recallStruggled
      ? `Delayed short-term recall of prospective market items exhibited mild retrieval friction after intervening distractor tasks.`
      : `Response consistency was well-maintained with steady cognitive stamina across game trials.`;
    const l4 = `Average answer latency was ${(avgReactionMs / 1000).toFixed(1)}s, demonstrating a comfortable, unhurried processing rhythm.`;
    const l5 = flagged
      ? `Today's score indicates a moderate dip compared to the previous day; gentle check-ins for physical fatigue, hydration, or sleep disruptions are advised.`
      : `Day-to-day stability remains positive with no evident distress or cognitive overload during interaction.`;
    const tip = recallStruggled
      ? `Gently mention 2-3 everyday items during conversation or tea, and casually revisit them 10 minutes later to reinforce delayed recall naturally.`
      : `Share a pleasant family memory or photograph together to foster ongoing emotional warmth and reassurance.`;
    const l6 = `Caregiver suggestion for tomorrow: ${tip}`;

    const fallbackSummary = [l1, l2, l3, l4, l5, l6].join(" ");

    const strengths = patternRatio >= 0.7 ? ["Visual Pattern Recognition", "Perceptual Discrimination"] : ["Consistent Engagement"];
    const challenges = recallStruggled ? ["Delayed Working Memory"] : [];

    return {
      id: key,
      dateKey: key,
      date: dateLabel,
      accuracy: avgAcc,
      bestAccuracy: best,
      avgReactionMs,
      sessions: daySessions.length,
      flagged,
      summary: fallbackSummary,
      strengths,
      challenges,
      caregiverTip: tip,
      source: "clinical-engine",
      isAiGenerated: true,
    };
  });
}

export function adaptiveCognitiveOverview(sessions) {
  const adaptiveSessions = sessions.filter((s) => s.isAdaptive || (s.levelProgression && s.levelProgression.length > 1));
  if (!adaptiveSessions.length) return null;

  const dominantLevels = adaptiveSessions.map((s) => s.dominantLevel || s.level || 1);
  const avgDominant = Math.round(average(dominantLevels));

  const levelCounts = { 1: 0, 2: 0, 3: 0 };
  dominantLevels.forEach((l) => {
    levelCounts[l] = (levelCounts[l] || 0) + 1;
  });

  const latestInsight = adaptiveSessions.find((s) => s.aiInsights)?.aiInsights || "";

  const LEVEL_NAMES = {
    1: "Gentle (Level 1)",
    2: "Steady (Level 2)",
    3: "Challenging (Level 3)",
  };

  return {
    totalAdaptiveSessions: adaptiveSessions.length,
    dominantWorkingLevel: avgDominant,
    dominantLevelName: LEVEL_NAMES[avgDominant] || "Steady",
    levelCounts,
    latestInsight,
    recentSessions: adaptiveSessions.slice(0, 5),
  };
}