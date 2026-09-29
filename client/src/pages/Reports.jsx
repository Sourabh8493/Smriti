import React, { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell.jsx";
import ReportCard from "../components/dashboard/ReportCard.jsx";
import { getMyPatient } from "../api/patients.js";
import { listGameSessions, getDailySummaries, regenerateDailySummary } from "../api/games.js";
import { dailyReports } from "../utils/sessionStats.js";
import { useLanguage } from "../context/LanguageContext.jsx";

export default function Reports() {
  const { t } = useLanguage();
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState(null); // null while loading
  const [dailySummaries, setDailySummaries] = useState([]);
  const [error, setError] = useState("");

  const loadData = () => {
    return Promise.all([
      getMyPatient(),
      listGameSessions(500),
      getDailySummaries().catch(() => []),
    ])
      .then(([patientData, sessionData, summariesData]) => {
        setPatient(patientData);
        setSessions(sessionData);
        setDailySummaries(summariesData || []);
      })
      .catch((err) => {
        setError(err.message || "Couldn't load reports.");
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerate = async (dateKey) => {
    try {
      const updated = await regenerateDailySummary(dateKey);
      setDailySummaries((prev) => {
        const next = prev.filter((s) => s.date !== dateKey);
        return [updated, ...next];
      });
    } catch (err) {
      console.error("Could not regenerate summary:", err);
    }
  };

  const loading = sessions === null && !error;
  const reports = sessions ? dailyReports(sessions, dailySummaries, patient) : [];

  return (
    <AppShell
      title={t("Daily reports")}
      subtitle={patient ? `${t("All reports for")} ${patient.basic?.fullName}` : t("All reports")}
    >
      {loading && <div className="route-loading" aria-hidden="true" />}
      {!loading && error && <p className="field__error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="section-head">
            <div>
              <h2>{t("All reports")}</h2>
              <p>{t("Generated automatically from each day's game sessions")}</p>
            </div>
          </div>

          {reports.length > 0 ? (
            <div className="reports-list">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} onRegenerate={handleRegenerate} />
              ))}
            </div>
          ) : (
            <div className="card empty-state">
              <h3>{t("No reports yet")}</h3>
              <p>{t("A report is generated automatically for each day the patient plays.")}</p>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
