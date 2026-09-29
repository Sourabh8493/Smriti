import React from "react";

export function AdaptiveTopbarBadge({ level = 1, isAdaptive = true }) {
  return (
    <span className="game-level">
      Level {level} {isAdaptive ? "(Auto)" : ""}
    </span>
  );
}

export function AdaptiveFeedbackToast() {
  // Kept silent during gameplay to prevent distracting or confusing dementia patients
  return null;
}

export function AdaptiveSummaryCard({ summary }) {
  if (!summary?.isAdaptive) return null;
  const { dominantLevel, aiInsights } = summary;
  return (
    <div className="adaptive-summary-simple">
      <p>
        <strong>Cognitive level:</strong> Auto-adjusted (Level {dominantLevel || 1}).
      </p>
      {aiInsights && <p className="adaptive-summary-simple__desc">{aiInsights}</p>}
    </div>
  );
}