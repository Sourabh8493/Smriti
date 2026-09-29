import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import { Tag, Button } from "../components/common/UI.jsx";
import MarketMemoryGame from "../games/marketMemory/MarketMemoryGame.jsx";
import PersonalRecallGame from "../games/personalRecall/PersonalRecallGame.jsx";
import MemoryLaneGame from "../games/memoryLane/MemoryLaneGame.jsx";
import {
  LEVELS,
  hasTextileImages,
  hasMarketImages,
  hasSilhouetteImages,
} from "../games/marketMemory/data/content.js";
import { getMyPatient } from "../api/patients.js";
import { getRecommendedDifficulty } from "../api/games.js";
import { getBaselineLevel } from "../games/shared/cognitiveEngine.js";
import { useLanguage } from "../context/LanguageContext.jsx";
import "./games.css";

export default function Games() {
  const [activeGame, setActiveGame] = useState(null);
  const [patient, setPatient] = useState(null);
  const [recommendedDiff, setRecommendedDiff] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    getMyPatient()
      .then((data) => setPatient(data))
      .catch((err) => console.warn("Could not load patient for games baseline:", err.message));

    getRecommendedDifficulty()
      .then((data) => setRecommendedDiff(data))
      .catch((err) => console.warn("Could not load difficulty recommendation:", err.message));
  }, []);

  const baselineLevel = patient ? getBaselineLevel(patient) : 1;

  if (activeGame?.id === "market-memory") {
    return (
      <MarketMemoryGame
        level={activeGame.level || baselineLevel}
        isAdaptive={activeGame.isAdaptive ?? true}
        patient={patient}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  if (activeGame?.id === "personal-recall") {
    return (
      <PersonalRecallGame
        isAdaptive={activeGame.isAdaptive ?? true}
        patient={patient}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  if (activeGame?.id === "memory-lane") {
    return (
      <MemoryLaneGame
        patient={patient}
        onExit={() => setActiveGame(null)}
      />
    );
  }

  return (
    <AppShell title={t("Games")} subtitle={t("Cognitive exercises for the patient")}>
      {recommendedDiff && (
        <div
          className="card ai-recommendation-banner"
          style={{
            background: "linear-gradient(135deg, #eef7f1 0%, #f9fcf9 100%)",
            border: "2px solid #3c7d56",
            borderRadius: "16px",
            marginBottom: "var(--sp-4)",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            boxShadow: "0 4px 16px rgba(45, 90, 63, 0.08)",
          }}
        >
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span style={{ fontSize: "1.4rem" }}>✨</span>
              <strong style={{ fontSize: "1.15rem", color: "#1e4d32" }}>
                {t("AI Recommended Difficulty")}: Level {recommendedDiff.recommendedLevel} ({t(recommendedDiff.levelName)})
              </strong>
              <Tag tone="primary">{t("AI Recommended")}</Tag>
            </div>
            <p style={{ margin: "4px 0 0 0", color: "#45594b", fontSize: "0.95rem", lineHeight: "1.5" }}>
              {recommendedDiff.rationale}
            </p>
          </div>
          <Button
            onClick={() =>
              setActiveGame({
                id: "market-memory",
                level: recommendedDiff.recommendedLevel,
                isAdaptive: false,
              })
            }
          >
            {t("Play Recommended Level")}
          </Button>
        </div>
      )}

      <div className="game-card card">
        <div className="game-card__body">
          <h2>{t("Market Memory")}</h2>
          <p className="game-card__desc">
            {t("A short round that mixes delayed recall with pattern and shape recognition.")}
          </p>
          <ul className="game-card__parts">
            <li><strong>{t("Shopping list")}</strong> - {t("three market items to hold in mind")}</li>
            <li><strong>{t("Three pattern questions")}</strong> - {t("complete a woven textile design")}</li>
            <li><strong>{t("Two shadow questions")}</strong> - {t("name an object from its silhouette")}</li>
            <li><strong>{t("Recall")}</strong> - {t("which three items were we buying?")}</li>
          </ul>
          <div className="game-card__tags">
            <Tag tone="primary">{t("Delayed recall")}</Tag>
            <Tag tone="gold">{t("Pattern recognition")}</Tag>
            <Tag tone="accent">{t("Visual recognition")}</Tag>
          </div>
          <AssetStatus />
        </div>
        <div className="game-card__levels">
          <p className="game-card__levels-title">{t("Choose a level")}</p>
          <button
            type="button"
            className="level-button level-button--auto"
            onClick={() =>
              setActiveGame({ id: "market-memory", isAdaptive: true, level: baselineLevel })
            }
          >
            <span className="level-button__number">★</span>
            <span className="level-button__text">
              <strong>{t("Auto (Adaptive)")}</strong>
              <span>{t("Automatically adjusts difficulty as the patient plays")}</span>
            </span>
          </button>
          {LEVELS.map((level) => {
            const isRec = recommendedDiff?.recommendedLevel === level.id;
            return (
              <button
                type="button"
                key={level.id}
                className={`level-button ${isRec ? "level-button--recommended" : ""}`}
                style={isRec ? { borderColor: "#2d5a3f", background: "#f2f8f4" } : {}}
                onClick={() =>
                  setActiveGame({ id: "market-memory", level: level.id, isAdaptive: true })
                }
              >
                <span className="level-button__number">{level.id}</span>
                <span className="level-button__text">
                  <strong>
                    {t(level.name)} {isRec && <span style={{ color: "#2d5a3f", fontSize: "0.85em" }}>({t("AI Pick", "AI Pick")})</span>}
                  </strong>
                  <span>{t(level.blurb)}</span>
                </span>
              </button>
            );
          })}
          <p className="game-card__hint">
            Auto mode starts at {patient?.medical?.stage ? patient.medical.stage : "calibrated baseline"} and adapts based on answers.
          </p>
        </div>
      </div>

      <div className="game-card card">
        <div className="game-card__body">
          <h2>{t("Personal Recall")}</h2>
          <p className="game-card__desc">
            {t("Five multiple-choice questions built entirely from the patient's own saved profile.")}
          </p>
          <ul className="game-card__parts">
            <li><strong>{t("Faces & names")}</strong> - {t("recognize family and friends from their photo")}</li>
            <li><strong>{t("Relationships")}</strong> - {t("who is who in the patient's life")}</li>
            <li><strong>{t("Contact details")}</strong> - {t("phone numbers, address, emergency contact")}</li>
            <li><strong>{t("Care team")}</strong> - {t("doctor and caretaker names")}</li>
          </ul>
          <div className="game-card__tags">
            <Tag tone="primary">{t("Personal Recall")}</Tag>
            <Tag tone="gold">{t("Randomized order")}</Tag>
            <Tag tone="accent">{t("Built from profile")}</Tag>
          </div>
        </div>
        <div className="game-card__levels">
          <p className="game-card__levels-title">{t("Ready to play")}</p>
          <p className="game-card__hint" style={{ marginBottom: "var(--sp-3)" }}>
            {t("Questions are built fresh from the profile and auto-adjust choices to match the patient's pace.")}
          </p>
          <Button onClick={() => setActiveGame({ id: "personal-recall", isAdaptive: true })} style={{ width: "100%" }}>
            {t("Play")}
          </Button>
        </div>
      </div>

      {/* Game 3: Memory Lane CST Therapy */}
      <div className="game-card card" style={{ borderColor: "#45825d" }}>
        <div className="game-card__body">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--sp-2)" }}>
            <h2>{t("Memory Lane (CST Therapy)")}</h2>
            <Tag tone="gold">{t("Voice-first interaction")}</Tag>
          </div>
          <p className="game-card__desc">
            {t("A guided cognitive stimulation session that revisits a happy memory with the patient's own music playing.")}
          </p>
          <ul className="game-card__parts">
            <li><strong>{t("Happiest memories", "Happiest memories")}</strong> - {t("revisit weddings, festivals, scenic trips, and family moments")}</li>
            <li><strong>{t("Voice AI Companion", "Voice AI Companion")}</strong> - {t("Smriti Mitra talks, asks friendly questions, and listens to patient's speech")}</li>
            <li><strong>{t("Errorless scaffolding", "Errorless scaffolding")}</strong> - {t("AI gently cues and completes memories if the patient struggles or forgets")}</li>
            <li><strong>{t("No test scores", "No test scores")}</strong> - {t("purely restorative therapeutic reminiscence without stress")}</li>
          </ul>
          <div className="game-card__tags">
            <Tag tone="primary">{t("Cognitive Stimulation Therapy")}</Tag>
            <Tag tone="accent">{t("Therapeutic conversation")}</Tag>
            <Tag tone="gold">{t("Errorless reminiscence")}</Tag>
          </div>
        </div>
        <div className="game-card__levels">
          <p className="game-card__levels-title">{t("Ready to reminisce", "Ready to reminisce")}</p>
          <p className="game-card__hint" style={{ marginBottom: "var(--sp-3)" }}>
            {t("Relive your happiest moments with a friendly, voice-enabled AI companion.")}
          </p>
          <Button
            onClick={() => setActiveGame({ id: "memory-lane" })}
            style={{ width: "100%", background: "#2d5a3f", borderColor: "#234a33" }}
          >
            {t("Start Memory Lane")}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function AssetStatus() {
  const sources = [
    { label: "Textile photos", ready: hasTextileImages, folder: "src/assets/textiles" },
    { label: "Market item photos", ready: hasMarketImages, folder: "src/assets/market" },
    { label: "Silhouette cut-outs", ready: hasSilhouetteImages, folder: "src/assets/silhouettes" },
  ];
  const allReady = sources.every((s) => s.ready);
  if (allReady) return null;
  return (
    <div className="asset-status">
      <p className="asset-status__title">Running on placeholder artwork</p>
      <ul>
        {sources.map((s) => (
          <li key={s.folder} className={s.ready ? "is-ready" : ""}>
            <span>{s.ready ? "✓" : "⚠"}</span>
            {s.label} – {s.ready ? "using your photos" : `add files to ${s.folder}`}
          </li>
        ))}
      </ul>
      <p className="asset-status__hint">
        Each folder has a README with the naming rule and what makes a usable image.
      </p>
    </div>
  );
}