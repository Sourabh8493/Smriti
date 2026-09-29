import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import StatCard from "../components/dashboard/StatCard.jsx";
import { ScoreTrendChart, GameAccuracyChart } from "../components/dashboard/Charts.jsx";
import ReportCard from "../components/dashboard/ReportCard.jsx";
import { getMyPatient } from "../api/patients.js";
import { listGameSessions, getDailySummaries } from "../api/games.js";
import { overallStats, scoreTrend, categoryAccuracy, dailyReports } from "../utils/sessionStats.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Dashboard() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState(null); // null while loading
  const [dailySummaries, setDailySummaries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getMyPatient(),
      listGameSessions(200),
      getDailySummaries().catch(() => []),
    ])
      .then(([patientData, sessionData, summariesData]) => {
        if (cancelled) return;
        setPatient(patientData);
        setSessions(sessionData);
        setDailySummaries(summariesData || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load the dashboard.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = sessions === null && !error;
  const stats = sessions ? overallStats(sessions) : null;
  const trend = sessions ? scoreTrend(sessions) : [];
  const categories = sessions ? categoryAccuracy(sessions) : [];
  const reports = sessions ? dailyReports(sessions, dailySummaries, patient).slice(0, 2) : [];

  return (
    <AppShell
      title={t("Dashboard")}
      subtitle={patient ? `${t("Overview for")} ${patient.basic?.fullName}` : t("Overview")}
    >
      {loading && <div className="route-loading" aria-hidden="true" />}
      {!loading && error && <p className="field__error">{error}</p>}

      {!loading && !error && (
        <>
          {!stats ? (
            <EmptyState
              title={t("No games played yet")}
              body={t("Once the patient plays a round of a game, their scores and trends will appear here.")}
            />
          ) : (
            <>
              <div className="stats-grid">
                <StatCard
                  label={t("Sessions this week")}
                  value={stats.sessionsThisWeek}
                  tone="primary"
                  icon={<SessionsIcon />}
                />
                <StatCard
                  label={t("Average accuracy")}
                  value={stats.avgAccuracy}
                  suffix="%"
                  tone="gold"
                  icon={<AccuracyIcon />}
                />
                <StatCard
                  label={t("Avg. reaction time")}
                  value={(stats.avgReactionMs / 1000).toFixed(1)}
                  suffix="s"
                  tone="primary"
                  icon={<TimeIcon />}
                />
                <StatCard
                  label={t("Current streak")}
                  value={stats.currentStreak}
                  suffix={` ${t("days")}`}
                  tone="accent"
                  icon={<StreakIcon />}
                />
              </div>

              <div className="charts-grid">
                <ScoreTrendChart data={trend} />
                {categories.length > 0 ? (
                  <GameAccuracyChart data={categories} />
                ) : (
                  <div className="card chart-card">
                    <div className="chart-card__head">
                      <h3>{t("Accuracy by question type")}</h3>
                    </div>
                    <p className="profile-empty">{t("Not enough data yet to break this down.", "Not enough data yet to break this down.")}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="section-head">
            <div>
              <h2>{t("Recent reports")}</h2>
              <p>{t("Generated from the patient's stored game sessions")}</p>
            </div>
          </div>
          {reports.length > 0 ? (
            <div className="reports-list">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("No reports yet")}
              body={t("A report is generated automatically for each day the patient plays.")}
            />
          )}
        </>
      )}
    </AppShell>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="card empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

function SessionsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="15" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9.5h16M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function AccuracyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}
function TimeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function StreakIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3c1.2 2.6 4 4 4 7.5a4 4 0 11-8 0c0-1 .3-1.8.8-2.6.3.9 1 1.4 1.6 1.2-.5-2.4.6-4.3 1.6-6.1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
