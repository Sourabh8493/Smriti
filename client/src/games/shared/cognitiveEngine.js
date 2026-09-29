/**
 * AI-Driven Cognitive Adaptive Engine for Dementia Interventions
 * Grounded in the North Eastern India Cultural & Clinical Context (Smriti)
 * Clinical Goals:
 * 1. Maintain the patient in their "Zone of Proximal Development" (scaffolding).
 * 2. Avoid catastrophic reactions (agitation/frustration from excessive difficulty).
 * 3. Avoid boredom/inattention from under-stimulation.
 * 4. Ground questions in familiar regional stimuli (textiles, flora, fauna, heritage, family).
 */
export const DIFFICULTY_LEVELS = {
  1: {
    id: 1,
    name: "Gentle",
    badgeTone: "soft",
    description: "Everyday familiar items, coarse 3x3 textile weave, 2-choice clear personal recall.",
  },
  2: {
    id: 2,
    name: "Steady",
    badgeTone: "gold",
    description: "Regional cultural items, mid-contrast weaves, 3-choice personal recall.",
  },
  3: {
    id: 3,
    name: "Challenging",
    badgeTone: "primary",
    description: "Culturally specific symbols, fine 4x4 weave, closely matched options.",
  },
};

export function getBaselineLevel(patient) {
  const stage = (patient?.medical?.stage || "").toLowerCase();
  if (stage.includes("severe") || stage.includes("cdr 3")) {
    return 1;
  }
  if (stage.includes("moderate") || stage.includes("cdr 2")) {
    return 1;
  }
  if (stage.includes("mild") || stage.includes("cdr 0.5") || stage.includes("cdr 1")) {
    return 2;
  }
  return 1;
}

export function createAdaptiveEngine(startingLevel = 1, patient = null) {
  const effectiveStart = startingLevel || (patient ? getBaselineLevel(patient) : 1);
  const validStart = Math.min(Math.max(effectiveStart, 1), 3);
  let currentLevel = validStart;
  let consecutiveCorrect = 0;
  let consecutiveIncorrect = 0;
  const history = [];
  const levelProgression = [validStart];

  return {
    getCurrentLevel() {
      return currentLevel;
    },
    getStartingLevel() {
      return validStart;
    },
    getLevelProgression() {
      return [...levelProgression];
    },
    getHistory() {
      return [...history];
    },
    evaluateStep({ isCorrect, reactionMs = 3000, questionType = "general" }) {
      const prevLevel = currentLevel;
      let nextLevel = currentLevel;
      let adjustment = "maintain";
      let message = "";
      let clinicalNote = "";

      const reactionSec = (reactionMs / 1000).toFixed(1);

      if (isCorrect) {
        consecutiveCorrect += 1;
        consecutiveIncorrect = 0;
        const isQuickResponse = reactionMs < 6500;

        if (isQuickResponse && currentLevel < 3) {
          nextLevel = currentLevel + 1;
          adjustment = "increase";
          message = `Brisk answer (${reactionSec}s)! Stepping up to Level ${nextLevel}.`;
          clinicalNote = `Confident answer (${reactionSec}s). Advancing difficulty to Level ${nextLevel}.`;
        } else if (!isQuickResponse) {
          // Accurate but took longer — maintain or steady
          adjustment = "maintain";
          message = `Well done! Taking your time (${reactionSec}s) — maintaining Level ${currentLevel}.`;
          clinicalNote = `Accurate response with measured latency (${reactionSec}s). Sustaining Level ${currentLevel}.`;
        } else {
          adjustment = "maintain";
          message = `Superb! You are performing at peak precision at Level ${currentLevel}.`;
          clinicalNote = `Mastery sustained at Level 3 (${reactionSec}s).`;
        }
      } else {
        consecutiveIncorrect += 1;
        consecutiveCorrect = 0;

        if (currentLevel > 1) {
          nextLevel = currentLevel - 1;
          adjustment = "decrease";
          message = `That's okay! Easing challenge down to Level ${nextLevel} for gentle support.`;
          clinicalNote = `Struggle detected (${reactionSec}s). Stepped down to Level ${nextLevel} for supportive scaffolding.`;
        } else {
          adjustment = "maintain";
          message = "Take all the time you need. We are here together.";
          clinicalNote = "Supportive cue provided at Level 1 foundation tier.";
        }
      }

      currentLevel = nextLevel;
      levelProgression.push(nextLevel);

      const stepRecord = {
        stepIndex: history.length,
        fromLevel: prevLevel,
        toLevel: nextLevel,
        isCorrect,
        reactionMs,
        questionType,
        adjustment,
        message,
        clinicalNote,
        timestamp: Date.now(),
      };
      history.push(stepRecord);

      return {
        nextLevel,
        adjustment,
        message,
        clinicalNote,
        levelInfo: DIFFICULTY_LEVELS[nextLevel],
      };
    },
    generateSummary() {
      const totalSteps = history.length;
      if (totalSteps === 0) {
        return {
          startingLevel: validStart,
          endingLevel: currentLevel,
          levelProgression: [validStart],
          aiInsights: "No steps recorded.",
          dominantLevel: validStart,
        };
      }

      const levelCounts = { 1: 0, 2: 0, 3: 0 };
      levelProgression.forEach((lvl) => {
        levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
      });
      const dominantLevel = Number(
        Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0][0]
      );

      const increases = history.filter((h) => h.adjustment === "increase").length;
      const decreases = history.filter((h) => h.adjustment === "decrease").length;

      let insightSummary = "";
      if (increases > decreases) {
        insightSummary = `Patient showed positive cognitive trajectory, advancing from Level ${validStart} to Level ${currentLevel}. Optimal engagement observed at Level ${dominantLevel}.`;
      } else if (decreases > increases) {
        insightSummary = `AI provided gentle cognitive scaffolding, easing challenge from Level ${validStart} down to Level ${currentLevel} to prevent fatigue. Recommended starting level for next session: Level ${dominantLevel}.`;
      } else {
        insightSummary = `Patient maintained steady cognitive stability throughout the session at Level ${dominantLevel}. Consistent attention sustained.`;
      }

      return {
        isAdaptive: true,
        startingLevel: validStart,
        endingLevel: currentLevel,
        dominantLevel,
        levelProgression: [...levelProgression],
        adjustmentsCount: { increases, decreases, maintained: totalSteps - increases - decreases },
        aiInsights: insightSummary,
      };
    },
  };
}