import React from "react";
import "./ui.css";

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  icon,
  ...rest
}) {
  return (
    <button type={type} className={`btn btn--${variant} btn--${size}`} {...rest}>
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
}

export function Field({ label, htmlFor, hint, error, required, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="field__required"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

export function Input({ id, error, ...rest }) {
  return <input id={id} className={`input ${error ? "input--error" : ""}`} {...rest} />;
}

export function Textarea({ id, error, rows = 4, ...rest }) {
  return (
    <textarea id={id} rows={rows} className={`input ${error ? "input--error" : ""}`} {...rest} />
  );
}

export function Select({ id, error, children, ...rest }) {
  return (
    <select id={id} className={`input input--select ${error ? "input--error" : ""}`} {...rest}>
      {children}
    </select>
  );
}

export function FileInput({ id, label, hint, onFiles, multiple = false, accept = "image/*" }) {
  return (
    <label htmlFor={id} className="file-drop">
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="visually-hidden"
        onChange={(e) => onFiles?.(Array.from(e.target.files || []))}
      />
      <span className="file-drop__icon" aria-hidden="true">
        <UploadIcon />
      </span>
      <span className="file-drop__text">
        <strong>{label || "Upload"}</strong>
        {hint && <span className="file-drop__hint">{hint}</span>}
      </span>
    </label>
  );
}

export function Tag({ children, tone = "primary" }) {
  return <span className={`tag tag--${tone}`}>{children}</span>;
}

export function IconButton({ label, children, ...rest }) {
  return (
    <button type="button" className="icon-btn" aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/* --- inline icon set (no external icon library dependency) --- */

export function UploadIcon(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SpeakerIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 9v6h4l5 4V5L8 9H4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M17 8.5a5 5 0 010 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M19.5 6a8.5 8.5 0 010 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function GlobeIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.7 12h16.6M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}
