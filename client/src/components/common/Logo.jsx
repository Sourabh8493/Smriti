import React from "react";

// Simple mark: a concentric "ripple of memory" motif in the app's primary
// and gold tones — deliberately not a generic gradient blob or brain icon.
export default function Logo({ withWordmark = true, tone = "dark" }) {
  const color = tone === "light" ? "#ffffff" : "var(--color-primary)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="15" stroke={color} strokeWidth="1.4" opacity="0.35" />
        <circle cx="16" cy="16" r="10.5" stroke={color} strokeWidth="1.6" opacity="0.6" />
        <circle cx="16" cy="16" r="5.5" fill="var(--color-gold)" />
      </svg>
      {withWordmark && (
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "1.3rem",
            color: tone === "light" ? "#ffffff" : "var(--color-ink)",
          }}
        >
          Smriti
        </span>
      )}
    </div>
  );
}
