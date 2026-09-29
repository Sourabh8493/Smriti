import React from "react";
import Logo from "../common/Logo.jsx";
import "./auth-layout.css";
import "./auth-forms.css";

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-shell__brand">
        <Logo tone="light" />
        <div className="auth-shell__brand-copy">
          <h1>A gentle companion for every remembered day.</h1>
          <p>
            Smriti pairs cognitive games rooted in north-eastern India's culture with
            AI that adapts to each patient — built with their doctor and family from
            day one.
          </p>
        </div>
        <div className="auth-shell__woven" aria-hidden="true" />
      </aside>
      <main className="auth-shell__panel">
        <div className="auth-shell__panel-inner">{children}</div>
      </main>
    </div>
  );
}
