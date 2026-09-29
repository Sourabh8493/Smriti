import React from "react";
import "./dashboard.css";

export default function StatCard({ label, value, suffix, tone = "primary", icon }) {
  return (
    <div className="stat-card card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}>{icon}</div>
      <div>
        <p className="stat-card__value">
          {value}
          {suffix && <span className="stat-card__suffix">{suffix}</span>}
        </p>
        <p className="stat-card__label">{label}</p>
      </div>
    </div>
  );
}
