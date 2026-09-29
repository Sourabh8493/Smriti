import { useLanguage } from "../../../context/LanguageContext.jsx";
import SpeakerButton from "../../../components/common/SpeakerButton.jsx";
import React, { useState } from "react";
import "../game.css";

/* ---------------- Intro ---------------- */

export function IntroScreen({ onReady }) {
  const { t } = useLanguage();

  return (
    <div className="game-screen">
      <p className="game-kicker">{t("Personal Recall")}</p>
      
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "var(--sp-3)" }}>
        <h2 className="game-heading" style={{ marginBottom: 0 }}>{t("Let's see how well you remember your own details.")}</h2>
        <SpeakerButton text={t("Let's see how well you remember your own details.")} />
      </div>

      <p className="game-lead">
        {t("Five quick questions about the people, places, and details in your life. There's no rush - take your time with each one.")}
      </p>
      <button type="button" className="game-cta" onClick={onReady}>
        {t("Start")}
      </button>
    </div>
  );
}

/* ---------------- Not enough profile data yet ---------------- */

export function NotEnoughDataScreen({ onExit }) {
  return (
    <div className="game-screen">
      <p className="game-kicker">Personal Recall</p>
      <h2 className="game-heading">Not quite enough details yet.</h2>
      <p className="game-lead">
        This game is built entirely from the patient's own profile. Add a few more
        details on the Profile page — a person's photo and relation, a phone number, an
        address — and this game will come to life.
      </p>
      <button type="button" className="game-cta" onClick={onExit}>
        Back to games
      </button>
    </div>
  );
}

/* ---------------- One question ---------------- */

export function QuestionScreen({ question, questionNumber, totalQuestions, onAnswer }) {
  const { t } = useLanguage();
  const [chosen, setChosen] = useState(null);

  const handlePick = (opt) => {
    if (chosen) return;
    setChosen(opt.id);
    setTimeout(() => onAnswer(opt.correct, opt), 550);
  };

  return (
    <div className="game-screen">
      <p className="game-kicker">
        {t("Question")} {questionNumber} {t("of")} {totalQuestions}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "var(--sp-3)" }}>
        <h2 className="game-heading" style={{ marginBottom: 0 }}>{t(question.prompt)}</h2>
        <SpeakerButton text={t(question.prompt)} />
      </div>

      {question.media && (
        <div className="recall-photo-stage">
          <img src={question.media} alt="" />
        </div>
      )}

      <div className={`option-row ${question.media ? "option-row--four" : "option-row--stack"}`}>
        {question.options.map((opt) => (
          <button
            type="button"
            key={opt.id}
            className={`option-tile option-tile--text ${chosen === opt.id ? "is-chosen" : ""}`}
            onClick={() => handlePick(opt)}
            disabled={Boolean(chosen)}
          >
            {t(opt.label, opt.label)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Results ---------------- */

export function ResultsScreen({ summary, onPlayAgain, onExit }) {
  const { t } = useLanguage();
  const { correctCount, totalCount, accuracy, totalTimeMs, avgReactionMs, fastestMs, slowestMs, reviewItems = [] } =
    summary;

  return (
    <div className="game-screen game-screen--results">
      <p className="game-kicker">{t("Session complete")}</p>
      <h2 className="game-heading">{t("Nicely done — that's the whole round.")}</h2>

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
      </div>

      {/* Solutions & Mistake Feedback (Requirement 5) */}
      {reviewItems.length > 0 && (
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
            {reviewItems.map((item, idx) => (
              <div
                key={idx}
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
                    {t("Question")} {idx + 1}: {t(item.prompt, item.prompt)}
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

                {item.media && (
                  <div style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                    <img src={item.media} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}

                <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#443b2f" }}>
                  <p style={{ margin: "2px 0" }}>
                    <strong>{t("Your answer:")}</strong> {item.userChoice}
                  </p>
                  <p style={{ margin: "2px 0", color: item.isCorrect ? "#1e683b" : "#b45309" }}>
                    <strong>{t("Correct solution:")}</strong> {item.correctChoice}
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

function ResultStat({ label, value }) {
  return (
    <div className="result-stat">
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
