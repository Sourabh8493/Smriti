import { useLanguage } from "../../../context/LanguageContext.jsx";
import SpeakerButton from "../../../components/common/SpeakerButton.jsx";
import React, { useState } from "react";
import MotifCell from "./MotifCell.jsx";
import ObjectShape from "./ObjectShape.jsx";
import "../game.css";

/*
  Patient-facing screens. Everything here is deliberately oversized and
  low-density compared with the caretaker dashboard: large type, few elements
  per screen, generous tap targets, and one instruction at a time.

  Each screen renders either real photographs or the generated SVG fallback,
  depending on what is present in src/assets/.
*/

/* ---------------- shared bits ---------------- */

/** One market item / object: photo if supplied, drawn shape otherwise. */
function ItemMedia({ item, size = 96 }) {
  if (item.url) {
    return (
      <span
        className="item-media"
        style={{ width: size, height: size, backgroundImage: `url(${item.url})` }}
        role="img"
        aria-label={item.label}
      />
    );
  }
  return <ObjectShape shape={item.shape} size={size} />;
}

/**
 * Background-position maths for showing a single grid cell of a larger image.
 * With background-size at cols*100%, position 0%..100% walks the cells.
 */
function cropStyle(url, index, cols, rows) {
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${(col / (cols - 1)) * 100}% ${(row / (rows - 1)) * 100}%`,
  };
}

/* ---------------- 1. The shopping list ---------------- */

export function MarketIntroScreen({ items, onReady }) {
  const { t } = useLanguage();

  return (
    <div className="game-screen">
      <p className="game-kicker">{t("Before we begin")}</p>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "var(--sp-3)" }}>
        <h2 className="game-heading" style={{ marginBottom: 0 }}>{t("We are going to the market.")}</h2>
        <SpeakerButton text={t("We are going to the market.")} />
      </div>

      <p className="game-lead">
        {t("Please remember these three things we need to buy. Take all the time you need.")}
      </p>
      <div className="market-list">
        {items.map((item) => (
          <div className="market-item" key={item.key}>
            <ItemMedia item={item} size={110} />
            <span className="market-item__label">{t(item.label, item.label)}</span>
          </div>
        ))}
      </div>
      <p className="game-note">
        {t("We will play a few other games first, and then I will ask you what we came to buy.")}
      </p>
      <button type="button" className="game-cta" onClick={onReady}>
        {t("I have remembered them")}
      </button>
    </div>
  );
}

/* ---------------- 2. Pattern recognition ---------------- */

export function PatternQuestionScreen({ question, questionNumber, totalQuestions, onAnswer }) {
  const { t } = useLanguage();
  const [chosen, setChosen] = useState(null);
  const isImage = question.mode === "image";
  const { cols, rows = question.cols } = question;

  const handlePick = (opt) => {
    if (chosen) return;
    setChosen(opt.id);
    // Brief pause so the patient sees their choice land before moving on.
    setTimeout(() => onAnswer(opt.correct, { question, selectedOption: opt }), 550);
  };

  return (
    <div className="game-screen">
      <p className="game-kicker">
        Question {questionNumber} of {totalQuestions}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "var(--sp-3)" }}>
        <h2 className="game-heading" style={{ marginBottom: 0 }}>{t("Which piece completes the cloth?")}</h2>
        <SpeakerButton text={t("Which piece completes the cloth?")} />
      </div>
      <p className="game-lead">
        One square of this weave is missing. Choose the piece that belongs there.
      </p>

      {isImage ? (
        <div
          className="weave-stage"
          style={{ backgroundImage: `url(${question.url})` }}
          role="img"
          aria-label={`${question.label} with one square missing`}
        >
          <div
            className="weave-stage__grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {Array.from({ length: cols * rows }).map((_, i) => (
              <div
                key={i}
                className={`weave-cell ${i === question.holeIndex ? "weave-cell--hole" : ""}`}
              >
                {i === question.holeIndex && <span aria-hidden="true">?</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pattern-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {question.grid.map((cell, i) =>
            i === question.holeIndex ? (
              <div className="pattern-cell pattern-cell--hole" key={i}>
                <span aria-hidden="true">?</span>
              </div>
            ) : (
              <div className="pattern-cell" key={i}>
                <MotifCell cell={cell} size={62} />
              </div>
            )
          )}
        </div>
      )}

      {isImage && question.label && <p className="weave-caption">{question.label}</p>}

      <div className="option-row option-row--four">
        {question.options.map((opt) => (
          <button
            type="button"
            key={opt.id}
            className={`option-tile ${chosen === opt.id ? "is-chosen" : ""}`}
            onClick={() => handlePick(opt)}
            disabled={Boolean(chosen)}
          >
            {isImage ? (
              <span
                className="crop-swatch"
                style={cropStyle(question.url, opt.cellIndex, cols, rows)}
              />
            ) : (
              <MotifCell cell={opt.cell} size={76} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 3. Silhouette recognition ---------------- */

export function SilhouetteQuestionScreen({ question, questionNumber, totalQuestions, onAnswer }) {
  const { t } = useLanguage();
  const [chosen, setChosen] = useState(null);
  const isImage = question.mode === "image";

  const handlePick = (opt) => {
    if (chosen) return;
    setChosen(opt.id);
    setTimeout(() => onAnswer(opt.correct, { question, selectedOption: opt }), 550);
  };

  return (
    <div className="game-screen">
      <p className="game-kicker">
        {t("Question")} {questionNumber} {t("of")} {totalQuestions}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "var(--sp-3)" }}>
        <h2 className="game-heading" style={{ marginBottom: 0 }}>{t("What is this a shadow of?")}</h2>
        <SpeakerButton text={t("What is this a shadow of?")} />
      </div>
      <p className="game-lead">{t("Look at the dark shape, then choose the matching picture.")}</p>

      <div className="silhouette-stage">
        {isImage ? (
          // The silhouette is the same cut-out PNG rendered pure black, so it
          // always matches its colour version exactly.
          <img src={question.answerUrl} alt="" className="silhouette-image" />
        ) : (
          <ObjectShape shape={question.answerKey} size={190} mode="silhouette" />
        )}
      </div>

      <div className="option-row option-row--four">
        {question.options.map((opt) => (
          <button
            type="button"
            key={opt.id}
            className={`option-tile option-tile--tall ${chosen === opt.id ? "is-chosen" : ""}`}
            onClick={() => handlePick(opt)}
            disabled={Boolean(chosen)}
          >
            <ItemMedia item={opt} size={92} />
            <span className="option-tile__label">{t(opt.label, opt.label)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 4. Recall the shopping list ---------------- */

export function RecallQuestionScreen({ question, onAnswer }) {
  const { t } = useLanguage();
  const [chosen, setChosen] = useState(null);

  const handlePick = (opt) => {
    if (chosen) return;
    setChosen(opt.id);
    setTimeout(() => onAnswer(opt.correct, { question, selectedOption: opt }), 600);
  };

  return (
    <div className="game-screen">
      <p className="game-kicker">{t("Last question")}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "var(--sp-3)" }}>
        <h2 className="game-heading" style={{ marginBottom: 0 }}>{t("What were we going to buy?")}</h2>
        <SpeakerButton text={t("What were we going to buy?")} />
      </div>
      <p className="game-lead">
        {t("Choose the row that shows the three things from our market list.")}
      </p>

      <div className="recall-options">
        {question.options.map((opt) => (
          <button
            type="button"
            key={opt.id}
            className={`recall-option ${chosen === opt.id ? "is-chosen" : ""}`}
            onClick={() => handlePick(opt)}
            disabled={Boolean(chosen)}
          >
            {opt.items.map((item) => (
              <span className="recall-option__item" key={item.key}>
                <ItemMedia item={item} size={74} />
                <span className="recall-option__label">{t(item.label, item.label)}</span>
              </span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 5. Results ---------------- */

export function ResultsScreen({ summary, onPlayAgain, onExit }) {
  const { t } = useLanguage();
  const {
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
  } = summary;

  return (
    <div className="game-screen game-screen--results">
      <p className="game-kicker">{t("Session complete")}</p>
      <h2 className="game-heading">{t("Well done — that's the whole round.")}</h2>

      <div className="result-hero">
        <div className="result-hero__score">
          <span className="result-hero__value">{accuracy}%</span>
          <span className="result-hero__label">{t("accuracy")}</span>
        </div>
        <p className="result-hero__detail">
          {correctCount} {t("of")} {totalCount} {t("answers correct", "answers correct")}
        </p>
      </div>

      <div className="result-grid">
        <ResultStat label={t("Total time")} value={formatDuration(totalTimeMs)} />
        <ResultStat label={t("Average answer time")} value={`${(avgReactionMs / 1000).toFixed(1)}s`} />
        <ResultStat label={t("Fastest answer")} value={`${(fastestMs / 1000).toFixed(1)}s`} />
        <ResultStat label={t("Slowest answer")} value={`${(slowestMs / 1000).toFixed(1)}s`} />
        <ResultStat label={t("Pattern questions")} value={`${patternCorrect}/${patternTotal}`} />
        <ResultStat label={t("Shadow questions")} value={`${silhouetteCorrect}/${silhouetteTotal}`} />
        <ResultStat
          label={t("Market list recall")}
          value={recallCorrect ? t("Remembered") : t("Not this time")}
          tone={recallCorrect ? "good" : "soft"}
        />
      </div>

      {/* Solutions & Mistake Feedback (Requirement 5) */}
      {summary.reviewItems?.length > 0 && (
        <div
          className="solutions-review-section"
          style={{
            width: "100%",
            maxWidth: "680px",
            margin: "28px auto 20px",
            textAlign: "left",
          }}
        >
          <h3 style={{ fontSize: "1.3rem", color: "#2d5a3f", marginBottom: "6px" }}>
            {t("Question Review & Solutions")}
          </h3>
          <p style={{ color: "#6a6152", fontSize: "0.95rem", marginBottom: "18px" }}>
            {t("Review your answers and see where to improve:")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {summary.reviewItems.map((item) => (
              <div
                key={item.qNum}
                style={{
                  background: "#ffffff",
                  border: `2px solid ${item.isCorrect ? "#cde6d5" : "#fed7aa"}`,
                  borderRadius: "14px",
                  padding: "16px 20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <strong style={{ fontSize: "1.05rem", color: "#261e14" }}>
                    {t(item.title, item.title)}: {t(item.questionContext, item.questionContext)}
                  </strong>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "999px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      background: item.isCorrect ? "#e8f5ec" : "#fff7ed",
                      color: item.isCorrect ? "#1e683b" : "#c2410c",
                      border: `1px solid ${item.isCorrect ? "#a7d7b5" : "#fdba74"}`,
                    }}
                  >
                    {item.isCorrect ? `✓ ${t("Correct!")}` : `✗ ${t("Needs Practice")}`}
                  </span>
                </div>

                <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#443b2f" }}>
                  <p style={{ margin: "2px 0" }}>
                    <strong>{t("Your answer:")}</strong> {t(item.userChoice, item.userChoice)}
                  </p>
                  <p style={{ margin: "2px 0", color: item.isCorrect ? "#1e683b" : "#b45309" }}>
                    <strong>{t("Correct solution:")}</strong> {t(item.correctChoice, item.correctChoice)}
                  </p>
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      background: "#fbf8f2",
                      borderRadius: "8px",
                      borderLeft: `4px solid ${item.isCorrect ? "#2d5a3f" : "#d97706"}`,
                      fontSize: "0.9rem",
                      color: "#5c5040",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <span>
                      <strong>{t("Explanation:")}</strong> {t(item.explanation, item.explanation)}
                    </span>
                    <SpeakerButton text={t(item.explanation, item.explanation)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="result-actions">
        <button type="button" className="game-cta" onClick={onPlayAgain}>
          {t("Play again")}
        </button>
        <button type="button" className="game-cta game-cta--quiet" onClick={onExit}>
          {t("Back to games")}
        </button>
      </div>
    </div>
  );
}

function ResultStat({ label, value, tone }) {
  return (
    <div className={`result-stat ${tone ? `result-stat--${tone}` : ""}`}>
      <span className="result-stat__value">{value}</span>
      <span className="result-stat__label">{label}</span>
    </div>
  );
}

function formatDuration(ms) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
