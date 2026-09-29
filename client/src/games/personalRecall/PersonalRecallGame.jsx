import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IntroScreen,
  NotEnoughDataScreen,
  QuestionScreen,
  ResultsScreen,
} from "./components/screens.jsx";
import { buildSession, formatQuestionForLevel } from "./data/content.js";
import { createAdaptiveEngine, getBaselineLevel } from "../shared/cognitiveEngine.js";
import { AdaptiveTopbarBadge, AdaptiveFeedbackToast } from "../shared/AdaptiveUI.jsx";
import { getMyPatient } from "../../api/patients.js";
import { saveGameSession } from "../../api/games.js";
import "./game.css";

const PHASE = {
  LOADING: "loading",
  INSUFFICIENT: "insufficient",
  INTRO: "intro",
  QUESTIONS: "questions",
  RESULTS: "results",
};

export default function PersonalRecallGame({
  patient: initialPatient = null,
  isAdaptive = true,
  onExit,
}) {
  const [seed, setSeed] = useState(0);
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const [patientData, setPatientData] = useState(initialPatient);
  const [activeLevel, setActiveLevel] = useState(1);
  const [adaptiveToast, setAdaptiveToast] = useState(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState([]);

  const adaptiveEngineRef = useRef(null);
  const roundStartRef = useRef(null);
  const questionStartRef = useRef(null);
  const savedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase(PHASE.LOADING);
    setLoadError(null);
    setResults([]);
    setQuestionIndex(0);
    setAdaptiveToast(null);

    async function loadData() {
      try {
        let p = initialPatient;
        if (!p) {
          p = await getMyPatient();
        }
        if (cancelled) return;

        setPatientData(p);
        const startLvl = isAdaptive ? getBaselineLevel(p) : 1;
        const engine = isAdaptive ? createAdaptiveEngine(startLvl, p) : null;
        adaptiveEngineRef.current = engine;
        setActiveLevel(engine ? engine.getCurrentLevel() : startLvl);

        const built = buildSession(p);
        setSession(built);
        setPhase(built.questions.length > 0 ? PHASE.INTRO : PHASE.INSUFFICIENT);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Couldn't load the patient profile.");
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [initialPatient, isAdaptive, seed]);

  const totalQuestions = session?.questions.length ?? 0;

  const beginQuestions = () => {
    roundStartRef.current = performance.now();
    questionStartRef.current = performance.now();
    setPhase(PHASE.QUESTIONS);
  };

  const handleAnswer = (correct, selectedOption) => {
    const now = performance.now();
    const reactionMs = now - (questionStartRef.current ?? now);
    const rawQuestion = session.questions[questionIndex];
    const formattedQ = currentFormattedQuestion;

    setResults((prev) => [
      ...prev,
      {
        category: rawQuestion.category,
        correct,
        reactionMs,
        prompt: formattedQ?.prompt || rawQuestion.prompt,
        media: formattedQ?.media || rawQuestion.media,
        userChoice: selectedOption?.label || (correct ? formattedQ?.correctLabel : "Selected option"),
        correctChoice: formattedQ?.correctLabel || rawQuestion.correctLabel,
        isCorrect: correct,
      },
    ]);
    questionStartRef.current = performance.now();

    if (isAdaptive && adaptiveEngineRef.current) {
      const evaluation = adaptiveEngineRef.current.evaluateStep({
        isCorrect: correct,
        reactionMs,
        questionType: rawQuestion.category,
      });
      setActiveLevel(evaluation.nextLevel);
      setAdaptiveToast({ message: evaluation.message, adjustment: evaluation.adjustment });
    }

    if (questionIndex + 1 < totalQuestions) {
      setQuestionIndex((i) => i + 1);
    } else {
      setPhase(PHASE.RESULTS);
    }
  };

  const handlePlayAgain = () => {
    roundStartRef.current = null;
    questionStartRef.current = null;
    savedRef.current = false;
    setSeed((s) => s + 1);
  };

  const summary = useMemo(() => {
    if (phase !== PHASE.RESULTS || results.length === 0) return null;
    const baseSummary = summarize(results, roundStartRef.current);
    const adaptiveSummary =
      isAdaptive && adaptiveEngineRef.current
        ? adaptiveEngineRef.current.generateSummary()
        : {
            isAdaptive: false,
            startingLevel: 1,
            endingLevel: 1,
            dominantLevel: 1,
            levelProgression: [1],
          };
    return { ...baseSummary, ...adaptiveSummary };
  }, [phase, results, isAdaptive]);

  useEffect(() => {
    if (phase !== PHASE.RESULTS || !summary || savedRef.current) return;
    savedRef.current = true;
    saveGameSession({
      gameId: "personal-recall",
      level: summary.dominantLevel || activeLevel,
      ...summary,
      breakdown: results.map(({ category, correct }) => ({ category, correct })),
    }).catch((err) => {
      console.warn("Could not save game session:", err.message);
    });
  }, [phase, summary, activeLevel, results]);

  const progress =
    phase === PHASE.INTRO || phase === PHASE.LOADING || phase === PHASE.INSUFFICIENT
      ? 0
      : phase === PHASE.RESULTS
        ? 1
        : (questionIndex + 1) / totalQuestions;

  const currentFormattedQuestion = useMemo(() => {
    if (!session || !session.questions[questionIndex]) return null;
    const raw = session.questions[questionIndex];
    return formatQuestionForLevel(raw, activeLevel);
  }, [session, questionIndex, activeLevel]);

  return (
    <div className="game-root">
      <header className="game-topbar">
        <button type="button" className="game-exit" onClick={onExit}>
            Leave game
        </button>
        <div className="game-progress" aria-hidden="true">
          <div className="game-progress__fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <AdaptiveTopbarBadge level={activeLevel} isAdaptive={isAdaptive} />
      </header>

      <div className="game-stage">
        {phase === PHASE.LOADING && !loadError && (
          <div className="game-screen">
            <div className="game-loader" aria-hidden="true" />
            <p className="game-lead" style={{ marginTop: "var(--sp-5)" }}>
              Preparing your personal memories
            </p>
          </div>
        )}

        {loadError && (
          <div className="game-screen">
            <h2 className="game-heading">This round couldn't be prepared.</h2>
            <p className="game-lead">{loadError}</p>
            <button type="button" className="game-cta" onClick={onExit}>
              Back to games
            </button>
          </div>
        )}

        {!loadError && phase === PHASE.INSUFFICIENT && <NotEnoughDataScreen onExit={onExit} />}
        {!loadError && phase === PHASE.INTRO && <IntroScreen onReady={beginQuestions} />}

        {!loadError && phase === PHASE.QUESTIONS && currentFormattedQuestion && (
          <>
            <AdaptiveFeedbackToast
              message={adaptiveToast?.message}
              adjustment={adaptiveToast?.adjustment}
            />
            <QuestionScreen
              key={questionIndex}
              question={currentFormattedQuestion}
              questionNumber={questionIndex + 1}
              totalQuestions={totalQuestions}
              onAnswer={handleAnswer}
            />
          </>
        )}

        {!loadError && phase === PHASE.RESULTS && summary && (
          <ResultsScreen summary={summary} onPlayAgain={handlePlayAgain} onExit={onExit} />
        )}
      </div>
    </div>
  );
}

function summarize(results, roundStart) {
  const reactionTimes = results.map((r) => r.reactionMs);
  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;

  const reviewItems = results.map((r, idx) => {
    let explanation = "";
    if (r.isCorrect) {
      explanation = `Wonderful memory! You remembered "${r.correctChoice}" accurately without hesitation.`;
    } else {
      explanation = `The correct answer was "${r.correctChoice}". Reviewing personal relations and familiar places helps reinforce everyday recognition.`;
    }
    return {
      qNum: idx + 1,
      prompt: r.prompt,
      media: r.media,
      userChoice: r.userChoice,
      correctChoice: r.correctChoice,
      isCorrect: r.isCorrect,
      explanation,
    };
  });

  return {
    correctCount,
    totalCount,
    accuracy: Math.round((correctCount / totalCount) * 100),
    totalTimeMs: performance.now() - (roundStart ?? performance.now()),
    avgReactionMs: reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length,
    fastestMs: Math.min(...reactionTimes),
    slowestMs: Math.max(...reactionTimes),
    reviewItems,
  };
}