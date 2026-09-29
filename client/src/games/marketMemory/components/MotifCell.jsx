import React from "react";

/*
  Textile motif set for the pattern-recognition questions.

  These are stylized geometric motifs inspired by north-eastern weaving
  traditions (Assam silk mekhela borders, Naga shawl bands, Mizo puan
  stripes). They are drawn as SVG rather than loaded as photos so the game
  works offline with zero assets.

  NOTE FOR LATER: for the real SIH demo these should be replaced with
  photographed/scanned motifs from actual textiles, ideally with the weave
  community credited. Generated geometry is a stand-in, not the final art.
*/

const V = 40; // motif viewBox is 40x40

function Diamond({ color }) {
  return (
    <>
      <polygon points="20,4 36,20 20,36 4,20" fill={color} />
      <polygon points="20,12 28,20 20,28 12,20" fill="#fff" opacity="0.75" />
    </>
  );
}

function Chevron({ color }) {
  return (
    <>
      <polygon points="4,26 20,10 36,26 36,34 20,18 4,34" fill={color} />
      <polygon points="4,14 20,-2 36,14 36,6 20,-10 4,6" fill={color} opacity="0" />
    </>
  );
}

function Stripe({ color }) {
  return (
    <>
      <rect x="4" y="6" width="32" height="6" fill={color} />
      <rect x="4" y="17" width="32" height="6" fill={color} opacity="0.55" />
      <rect x="4" y="28" width="32" height="6" fill={color} />
    </>
  );
}

function Cross({ color }) {
  return (
    <>
      <rect x="16" y="4" width="8" height="32" fill={color} />
      <rect x="4" y="16" width="32" height="8" fill={color} />
    </>
  );
}

function Zigzag({ color }) {
  return (
    <path
      d="M2 28 L11 14 L20 28 L29 14 L38 28"
      fill="none"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Triangles({ color }) {
  return (
    <>
      <polygon points="8,32 20,10 32,32" fill={color} />
      <polygon points="14,32 20,20 26,32" fill="#fff" opacity="0.7" />
    </>
  );
}

function Dots({ color }) {
  return (
    <>
      <circle cx="13" cy="13" r="5" fill={color} />
      <circle cx="27" cy="13" r="5" fill={color} opacity="0.55" />
      <circle cx="13" cy="27" r="5" fill={color} opacity="0.55" />
      <circle cx="27" cy="27" r="5" fill={color} />
    </>
  );
}

function Steps({ color }) {
  return (
    <>
      <rect x="4" y="24" width="12" height="12" fill={color} />
      <rect x="14" y="14" width="12" height="12" fill={color} />
      <rect x="24" y="4" width="12" height="12" fill={color} />
    </>
  );
}

export const MOTIFS = {
  diamond: Diamond,
  chevron: Chevron,
  stripe: Stripe,
  cross: Cross,
  zigzag: Zigzag,
  triangles: Triangles,
  dots: Dots,
  steps: Steps,
};

export const MOTIF_KEYS = Object.keys(MOTIFS);

// Weaving-inspired thread colours: madder red, indigo, turmeric gold,
// pine green, undyed cream, charcoal.
export const MOTIF_COLORS = {
  red: "#b23a2e",
  indigo: "#2f4b7c",
  gold: "#c68a2e",
  green: "#2f5d50",
  cream: "#a48b63",
  black: "#3a3a36",
};

export const MOTIF_COLOR_KEYS = Object.keys(MOTIF_COLORS);

/**
 * One woven cell: a motif, in a thread colour, at a rotation.
 */
export default function MotifCell({ cell, size = 64, muted = false }) {
  if (!cell) return null;
  const Motif = MOTIFS[cell.motif];
  const color = MOTIF_COLORS[cell.color];
  if (!Motif) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${V} ${V}`}
      aria-hidden="true"
      style={{ display: "block", opacity: muted ? 0.4 : 1 }}
    >
      <rect width={V} height={V} fill="#f6f1e6" />
      <g transform={`rotate(${cell.rotation || 0} ${V / 2} ${V / 2})`}>
        <Motif color={color} />
      </g>
    </svg>
  );
}
