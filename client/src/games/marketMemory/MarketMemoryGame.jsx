import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MarketIntroScreen,
  PatternQuestionScreen,
  SilhouetteQuestionScreen,
  RecallQuestionScreen,
  ResultsScreen,
} from "./components/screens.jsx";
import {
  generateMarketList,
  generatePatternQuestion,
  generateSilhouetteQuestion,
  generateRecallQuestion,
  buildSession,
} from "./data/content.js";
import { createAdaptiveEngine, getBaselineLevel } from "../shared/cognitiveEngine.js";
import { AdaptiveTopbarBadge, AdaptiveFeedbackToast } from "../shared/AdaptiveUI.jsx";
import { saveGameSession } from "../../api/games.js";
import "./game.css";

const PHASE = {
  LOADING: "loading",
  INTRO: "intro",
  QUESTIONS: "questions",
  RECALL: "recall",
  RESULTS: "results",
};

export default function MarketMemoryGame({
  level = 1,
  isAdaptive = true,
  patient = null,
  onExit,
}) {
  const [seed, setSeed] = useState(0);
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [loadError, setLoadError] = useState(null);

  const initialLevel = level || (patient ? getBaselineLevel(patient) : 1);
  const [activeLevel, setActiveLevel] = useState(initialLevel);
  const [adaptiveToast, setAdaptiveToast] = useState(null);

  const [marketList, setMarketList] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [recallQuestion, setRecallQuestion] = useState(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState([]);

  const usedTextilesRef = useRef([]);
  const usedObjectsRef = useRef([]);
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
    usedTextilesRef.current = [];
    usedObjectsRef.current = [];

    const engine = isAdaptive ? createAdaptiveEngine(initialLevel, patient) : null;
    adaptiveEngineRef.current = engine;
    const startLvl = engine ? engine.getCurrentLevel() : initialLevel;
    setActiveLevel(startLvl);

    async function initRound() {
      try {
        const list = generateMarketList(startLvl);
        const firstQ = await generatePatternQuestion(startLvl, []);
        if (cancelled) return;

        if (firstQ?.textileKey) {
          usedTextilesRef.current.push(firstQ.textileKey);
        }

        setMarketList(list);
        setCurrentQuestion(firstQ);
        setPhase(PHASE.INTRO);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Could not prepare this round.");
      }
    }

    initRound();

    return () => {
      cancelled = true;
    };
  }, [level, isAdaptive, patient, seed, initialLevel]);

  const totalQuestions = 5;

  const beginQuestions = () => {
    roundStartRef.current = performance.now();
    questionStartRef.current = performance.now();
    setPhase(PHASE.QUESTIONS);
  };

  const recordAnswer = (type, correct, details = {}) => {
    const now = performance.now();
    const reactionMs = now - (questionStartRef.current ?? now);
    setResults((prev) => [...prev, { type, correct, reactionMs, details }]);
    questionStartRef.current = performance.now();
    return reactionMs;
  };

  const handleQuestionAnswer = async (correct, details = {}) => {
    if (!currentQuestion) return;
    const qType = currentQuestion.type;
    const reactionMs = recordAnswer(qType, correct, details);

    let nextLvl = activeLevel;
    if (isAdaptive && adaptiveEngineRef.current) {
      const evaluation = adaptiveEngineRef.current.evaluateStep({
        isCorrect: correct,
        reactionMs,
        questionType: qType,
      });
      nextLvl = evaluation.nextLevel;
      setActiveLevel(nextLvl);
      setAdaptiveToast({ message: evaluation.message, adjustment: evaluation.adjustment });
    }

    const nextIndex = questionIndex + 1;
    if (nextIndex < totalQuestions) {
      try {
        let nextQ = null;
        if (nextIndex < 3) {
          nextQ = await generatePatternQuestion(nextLvl, usedTextilesRef.current);
          if (nextQ?.textileKey) usedTextilesRef.current.push(nextQ.textileKey);
        } else {
          nextQ = generateSilhouetteQuestion(nextLvl, usedObjectsRef.current);
          if (nextQ?.answerKey) usedObjectsRef.current.push(nextQ.answerKey);
        }
        setCurrentQuestion(nextQ);
        setQuestionIndex(nextIndex);
      } catch (err) {
        console.error("Failed to generate dynamic question:", err);
      }
    } else {
      const recallQ = generateRecallQuestion(nextLvl, marketList);
      setRecallQuestion(recallQ);
      setPhase(PHASE.RECALL);
    }
  };

  const handleRecallAnswer = (correct, details = {}) => {
    recordAnswer("recall", correct, details);
    setPhase(PHASE.RESULTS);
  };

  const handlePlayAgain = () => {
    roundStartRef.current = null;
    questionStartRef.current = null;
    savedRef.current = false;
    setSeed((s) => s + 1);
  };

  const summary = useMemo(() => {
    if (phase !== PHASE.RESULTS || results.length === 0) return null;
    const baseSummary = summarize(results, roundStartRef.current, marketList);
    const adaptiveSummary =
      isAdaptive && adaptiveEngineRef.current
        ? adaptiveEngineRef.current.generateSummary()
        : {
            isAdaptive: false,
            startingLevel: level,
            endingLevel: level,
            dominantLevel: level,
            levelProgression: [level],
          };
    return { ...baseSummary, ...adaptiveSummary };
  }, [phase, results, isAdaptive, level, marketList]);

  useEffect(() => {
    if (phase !== PHASE.RESULTS || !summary || savedRef.current) return;
    savedRef.current = true;
    saveGameSession({
      gameId: "market-memory",
      level: summary.dominantLevel || activeLevel,
      ...summary,
    }).catch((err) => {
      console.warn("Could not save game session:", err.message);
    });
  }, [phase, summary, activeLevel]);

  const progress =
    phase === PHASE.INTRO || phase === PHASE.LOADING
      ? 0
      : phase === PHASE.RESULTS
        ? 1
        : (questionIndex + 1) / (totalQuestions + 1);

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
        {loadError && (
          <div className="game-screen">
            <h2 className="game-heading">This round couldn't be prepared.</h2>
            <p className="game-lead">{loadError}</p>
            <button type="button" className="game-cta" onClick={onExit}>
              Back to games
            </button>
          </div>
        )}

        {phase === PHASE.LOADING && !loadError && (
          <div className="game-screen">
            <div className="game-loader" aria-hidden="true" />
            <p className="game-lead" style={{ marginTop: "var(--sp-5)" }}>
              Getting the round ready
            </p>
          </div>
        )}

        {phase === PHASE.INTRO && marketList.length > 0 && (
          <MarketIntroScreen items={marketList} onReady={beginQuestions} />
        )}

        {phase === PHASE.QUESTIONS && currentQuestion && (
          <>
            <AdaptiveFeedbackToast
              message={adaptiveToast?.message}
              adjustment={adaptiveToast?.adjustment}
            />
            {currentQuestion.type === "pattern" ? (
              <PatternQuestionScreen
                key={`q-${questionIndex}`}
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={totalQuestions}
                onAnswer={handleQuestionAnswer}
              />
            ) : (
              <SilhouetteQuestionScreen
                key={`q-${questionIndex}`}
                question={currentQuestion}
                questionNumber={questionIndex + 1}
                totalQuestions={totalQuestions}
                onAnswer={handleQuestionAnswer}
              />
            )}
          </>
        )}

        {phase === PHASE.RECALL && recallQuestion && (
          <RecallQuestionScreen question={recallQuestion} onAnswer={handleRecallAnswer} />
        )}

        {phase === PHASE.RESULTS && summary && (
          <ResultsScreen summary={summary} onPlayAgain={handlePlayAgain} onExit={onExit} />
        )}
      </div>
    </div>
  );
}

function summarize(results, roundStart, marketList = []) {
  const reactionTimes = results.map((r) => r.reactionMs);
  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;

  const patterns = results.filter((r) => r.type === "pattern");
  const silhouettes = results.filter((r) => r.type === "silhouette");
  const recall = results.find((r) => r.type === "recall");

  const reviewItems = results.map((r, idx) => {
    const qNum = idx + 1;
    const { type, correct, details } = r;
    let title = "";
    let questionContext = "";
    let userChoice = "";
    let correctChoice = "";
    let explanation = "";

    if (type === "pattern") {
      title = `Pattern Question ${qNum}`;
      questionContext = details?.question?.label || "Woven textile design";
      userChoice = details?.selectedOption?.id ? `Tile #${details.selectedOption.id}` : "Chosen tile";
      correctChoice = "Matching weave piece";
      explanation = correct
        ? "Excellent focus! You correctly identified the symmetry and weave pattern that fits the missing square."
        : "The correct piece aligns with the woven thread directions and color pattern across the missing grid square.";
    } else if (type === "silhouette") {
      title = `Shadow Question ${qNum}`;
      const correctOpt = details?.question?.options?.find((o) => o.correct);
      questionContext = "Dark silhouette recognition";
      userChoice = details?.selectedOption?.label || "Chosen picture";
      correctChoice = correctOpt?.label || "Correct object";
      explanation = correct
        ? `Superb visual recognition! You accurately identified the shape of ${correctChoice}.`
        : `This shadow was cast by ${correctChoice}. Notice the characteristic outer contours and curves.`;
    } else {
      title = "Market List Recall";
      questionContext = "Shopping list from the beginning";
      userChoice = details?.selectedOption?.items?.map((i) => i.label).join(", ") || "Selected items";
      correctChoice = marketList.map((m) => m.label).join(", ");
      explanation = correct
        ? "Terrific delayed memory! You held all 3 market items in your mind across all the puzzle tasks."
        : `The shopping list was: ${correctChoice}. Excellent effort holding it in memory across the distractor tasks!`;
    }

    return {
      qNum,
      type,
      title,
      questionContext,
      userChoice,
      correctChoice,
      isCorrect: correct,
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
    patternCorrect: patterns.filter((r) => r.correct).length,
    patternTotal: patterns.length,
    silhouetteCorrect: silhouettes.filter((r) => r.correct).length,
    silhouetteTotal: silhouettes.length,
    recallCorrect: Boolean(recall?.correct),
    reviewItems,
  };
}