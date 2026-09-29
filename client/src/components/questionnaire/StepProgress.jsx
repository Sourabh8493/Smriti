import React from "react";
import "./questionnaire.css";

export default function StepProgress({ steps, currentIndex }) {
  return (
    <ol className="step-progress" aria-label="Questionnaire progress">
      {steps.map((step, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "upcoming";
        return (
          <li key={step} className={`step-progress__item step-progress__item--${state}`}>
            <span className="step-progress__index">{i < currentIndex ? "\u2713" : i + 1}</span>
            <span className="step-progress__label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
