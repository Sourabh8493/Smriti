import React, { useState, useEffect } from "react";
import { Tag } from "../common/UI.jsx";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { generateSpeech, stopAudio } from "../../api/bhashini.js";
import "./dashboard.css";

export default function ReportCard({ report, onRegenerate }) {
  const { t, lang, translateDynamic } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localizedSummary, setLocalizedSummary] = useState(report.summary || "");
  const [localizedTip, setLocalizedTip] = useState(report.caregiverTip || "");

  useEffect(() => {
    let cancelled = false;
    if (lang === "en") {
      setLocalizedSummary(report.summary || "");
      setLocalizedTip(report.caregiverTip || "");
      return;
    }

    if (report.summary) {
      translateDynamic(report.summary).then((res) => {
        if (!cancelled && res) setLocalizedSummary(res);
      });
    }
    if (report.caregiverTip) {
      translateDynamic(report.caregiverTip).then((res) => {
        if (!cancelled && res) setLocalizedTip(res);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [report.summary, report.caregiverTip, lang, translateDynamic]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const handleToggleSpeak = async (e) => {
    e.stopPropagation();

    if (isSpeaking) {
      stopAudio();
      setIsSpeaking(false);
      return;
    }

    stopAudio();
    setIsSpeaking(true);

    const textToRead = `${localizedSummary}. ${localizedTip ? `${t("💡 Caregiver Guidance for Tomorrow:")} ${localizedTip}` : ""}`;
    try {
      await generateSpeech(textToRead, lang);
    } catch (err) {
      console.warn("TTS failed:", err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleRegenerate = async (e) => {
    e.stopPropagation();
    if (!onRegenerate || isRegenerating || !report.dateKey) return;
    try {
      setIsRegenerating(true);
      await onRegenerate(report.dateKey);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className={`report-card card ${report.flagged ? "report-card--flagged" : ""}`}>
      <button
        type="button"
        className="report-card__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div>
          <p className="report-card__date">{report.date}</p>
          <div className="report-card__meta">
            <Tag tone={report.flagged ? "accent" : "primary"}>
              {report.accuracy}% {t("accuracy")}
            </Tag>
            <Tag tone="gold">{report.sessions} {report.sessions === 1 ? t("session") : t("sessions")}</Tag>
            {report.flagged && <Tag tone="accent">{t("Attention suggested")}</Tag>}
            {report.isAiGenerated && (
              <span className="report-card__ai-badge">
                <SparkleIcon /> {t("AI Summary")}
              </span>
            )}
          </div>
        </div>
        <span className={`report-card__chevron ${open ? "is-open" : ""}`}>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div className="report-card__body">
          <div className="report-card__summary-container">
            <p className="report-card__summary-text">{localizedSummary || report.summary}</p>
          </div>

          {(report.strengths?.length > 0 || report.challenges?.length > 0) && (
            <div className="report-card__domains">
              {report.strengths?.map((s) => (
                <span key={s} className="domain-pill domain-pill--strength">
                  ✓ {t(s, s)}
                </span>
              ))}
              {report.challenges?.map((c) => (
                <span key={c} className="domain-pill domain-pill--challenge">
                  {t("Focus:")} {t(c, c)}
                </span>
              ))}
            </div>
          )}

          {report.caregiverTip && (
            <div className="report-card__tip">
              <span className="report-card__tip-title">{t("💡 Caregiver Guidance for Tomorrow:")}</span>
              <p className="report-card__tip-text">{localizedTip || report.caregiverTip}</p>
            </div>
          )}

          <div className="report-card__footer">
            <div className="report-card__actions">
              <button
                type="button"
                className={`report-audio-btn ${isSpeaking ? "is-active" : ""}`}
                onClick={handleToggleSpeak}
                title={isSpeaking ? t("Stop voice") : t("Listen to report")}
              >
                {isSpeaking ? <PauseIcon /> : <SpeakerIcon />}
                <span>{isSpeaking ? t("Stop voice") : t("Listen to report")}</span>
              </button>

              {onRegenerate && report.dateKey && (
                <button
                  type="button"
                  className="report-regen-btn"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  title={t("Re-analyze this day's performance")}
                >
                  <RefreshIcon spinning={isRegenerating} />
                  <span>{isRegenerating ? t("Analyzing...") : t("Re-analyze")}</span>
                </button>
              )}
            </div>

            <span className="report-card__source-tag">
              Engine: {report.source === "gemini" ? "Gemini 1.5 Flash" : "Clinical Cognitive NLG"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpeakerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M17 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19.5 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L14.39 8.26L21 9.27L16.14 13.97L17.5 20.54L12 17.27L6.5 20.54L7.86 13.97L3 9.27L9.61 8.26L12 2Z" />
    </svg>
  );
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: spinning ? "spin 1s linear infinite" : "none" }}
    >
      <style>
        {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
      </style>
      <path
        d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
