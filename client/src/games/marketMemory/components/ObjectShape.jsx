import React from "react";

/*
  Stylized SVG objects used for (a) the market-list items and (b) the
  silhouette-recognition questions. Drawn as geometry rather than photos so
  the game runs with no image assets and no network.

  NOTE FOR LATER: these are deliberately simple stand-ins. For the real
  prototype, swap in photographs of actual objects — a patient recognising a
  real xorai matters far more than recognising my approximation of one.
  Every shape below renders identically in silhouette mode (all parts dark),
  so the swap only needs a matching photo + its cut-out mask.
*/

const P = {
  leafGreen: "#3f7d5c",
  darkGreen: "#2f5d50",
  brass: "#c68a2e",
  brassDark: "#9c6a1f",
  red: "#b23a2e",
  clay: "#a9633c",
  clayDark: "#7d4526",
  cream: "#efe2c6",
  wood: "#8a6234",
  silver: "#b9bfc4",
  yellow: "#e0b13c",
  white: "#f4f1e8",
  ink: "#2a3129",
};

/* Each shape is drawn in a 100x100 viewBox. `c` is the colour resolver:
   in silhouette mode every call returns the same dark ink. */

const SHAPES = {
  /* ---------- market items ---------- */
  rice: (c) => (
    <>
      <path d="M26 46 L74 46 L78 86 L22 86 Z" fill={c(P.cream)} />
      <path d="M26 46 L74 46 L72 56 L28 56 Z" fill={c(P.wood)} />
      <path d="M34 40 Q50 30 66 40 L74 46 L26 46 Z" fill={c(P.wood)} />
      <ellipse cx="42" cy="68" rx="3" ry="6" fill={c(P.wood)} opacity="0.6" />
      <ellipse cx="54" cy="74" rx="3" ry="6" fill={c(P.wood)} opacity="0.6" />
    </>
  ),
  fish: (c, mono) => (
    <>
      <ellipse cx="46" cy="52" rx="30" ry="18" fill={c(P.silver)} />
      <polygon points="74,52 94,38 94,66" fill={c(P.silver)} />
      <path d="M40 34 Q48 26 56 36 Z" fill={c(P.silver)} />
      {!mono && <circle cx="30" cy="47" r="3.2" fill={P.ink} />}
    </>
  ),
  banana: (c) => (
    <>
      <path
        d="M22 34 Q26 72 62 82 Q84 86 84 74 Q60 74 44 56 Q32 44 32 32 Z"
        fill={c(P.yellow)}
      />
      <path d="M30 30 L34 36 L26 38 Z" fill={c(P.wood)} />
    </>
  ),
  egg: (c) => (
    <>
      <ellipse cx="38" cy="58" rx="19" ry="24" fill={c(P.cream)} />
      <ellipse cx="66" cy="62" rx="16" ry="20" fill={c(P.cream)} opacity="0.85" />
    </>
  ),
  tea: (c) => (
    <>
      <path d="M50 14 C24 32 22 66 50 88 C78 66 76 32 50 14 Z" fill={c(P.leafGreen)} />
      <path
        d="M50 22 L50 84"
        stroke={c(P.darkGreen)}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M50 40 L36 50 M50 40 L64 50 M50 58 L38 66 M50 58 L62 66"
        stroke={c(P.darkGreen)}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  pumpkin: (c) => (
    <>
      <ellipse cx="50" cy="58" rx="34" ry="28" fill={c(P.clay)} />
      <ellipse cx="50" cy="58" rx="12" ry="28" fill={c(P.clayDark)} opacity="0.45" />
      <ellipse cx="28" cy="58" rx="9" ry="26" fill={c(P.clayDark)} opacity="0.3" />
      <ellipse cx="72" cy="58" rx="9" ry="26" fill={c(P.clayDark)} opacity="0.3" />
      <rect x="46" y="20" width="8" height="14" rx="3" fill={c(P.leafGreen)} />
    </>
  ),
  oil: (c) => (
    <>
      <rect x="38" y="20" width="24" height="12" rx="3" fill={c(P.brassDark)} />
      <path d="M40 32 L60 32 L70 50 L70 84 L30 84 L30 50 Z" fill={c(P.yellow)} />
      <rect x="36" y="56" width="28" height="16" rx="2" fill={c(P.cream)} opacity="0.85" />
    </>
  ),
  chilli: (c) => (
    <>
      <path
        d="M36 26 Q40 34 40 42 Q40 74 58 84 Q74 88 74 74 Q58 68 54 44 Q52 30 46 24 Z"
        fill={c(P.red)}
      />
      <path d="M34 20 Q44 18 48 26 L40 30 Z" fill={c(P.leafGreen)} />
    </>
  ),
  ginger: (c) => (
    <>
      <ellipse cx="44" cy="56" rx="22" ry="15" fill={c(P.wood)} />
      <ellipse cx="66" cy="44" rx="12" ry="9" fill={c(P.wood)} />
      <ellipse cx="66" cy="70" rx="11" ry="8" fill={c(P.wood)} />
      <ellipse cx="26" cy="42" rx="9" ry="7" fill={c(P.wood)} />
    </>
  ),
  jaggery: (c) => (
    <>
      <polygon points="30,38 70,38 78,52 22,52" fill={c(P.clayDark)} />
      <rect x="22" y="52" width="56" height="30" fill={c(P.clay)} />
      <polygon points="22,52 78,52 78,82 22,82" fill={c(P.clay)} />
      <line x1="22" y1="66" x2="78" y2="66" stroke={c(P.clayDark)} strokeWidth="2" />
    </>
  ),
  bambooShoot: (c) => (
    <>
      <path d="M50 12 Q68 42 66 84 L34 84 Q32 42 50 12 Z" fill={c(P.cream)} />
      <path d="M50 12 Q60 40 58 84 L42 84 Q40 40 50 12 Z" fill={c(P.leafGreen)} opacity="0.5" />
      <path d="M36 52 Q50 58 64 52" stroke={c(P.wood)} strokeWidth="2.5" fill="none" />
      <path d="M36 68 Q50 74 64 68" stroke={c(P.wood)} strokeWidth="2.5" fill="none" />
    </>
  ),
  betelNut: (c) => (
    <>
      <ellipse cx="38" cy="58" rx="17" ry="20" fill={c(P.clay)} />
      <ellipse cx="64" cy="64" rx="14" ry="16" fill={c(P.clayDark)} />
      <ellipse cx="56" cy="38" rx="12" ry="14" fill={c(P.clay)} opacity="0.85" />
    </>
  ),

  /* ---------- silhouette objects ---------- */
  boat: (c) => (
    <>
      <path d="M10 64 L90 64 L76 84 L24 84 Z" fill={c(P.wood)} />
      <rect x="48" y="22" width="4" height="42" fill={c(P.clayDark)} />
      <polygon points="52,26 52,60 80,60" fill={c(P.cream)} />
    </>
  ),
  umbrella: (c) => (
    <>
      <path d="M12 56 A38 38 0 0 1 88 56 Z" fill={c(P.red)} />
      <path d="M12 56 Q24 48 36 56 Q48 48 50 56" fill={c(P.red)} opacity="0" />
      <rect x="47.5" y="56" width="5" height="26" fill={c(P.wood)} />
      <path
        d="M52.5 82 q0 8 -9 8 q-6 0 -6 -6"
        fill="none"
        stroke={c(P.wood)}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </>
  ),
  pot: (c) => (
    <>
      <path d="M26 44 Q50 30 74 44 L78 66 Q50 84 22 66 Z" fill={c(P.clay)} />
      <rect x="40" y="28" width="20" height="16" fill={c(P.clay)} />
      <ellipse cx="50" cy="27" rx="15" ry="5.5" fill={c(P.clayDark)} />
      <path d="M26 58 Q50 68 74 58" stroke={c(P.clayDark)} strokeWidth="2.5" fill="none" />
    </>
  ),
  bird: (c, mono) => (
    <>
      <polygon points="26,52 4,66 28,64" fill={c(P.wood)} />
      <ellipse cx="48" cy="54" rx="24" ry="17" fill={c(P.wood)} />
      <circle cx="70" cy="40" r="11" fill={c(P.wood)} />
      <polygon points="79,38 94,43 79,47" fill={c(P.brass)} />
      <path d="M38 46 Q50 36 62 50 Q50 58 38 46 Z" fill={c(P.clayDark)} />
      {!mono && <circle cx="72" cy="37" r="2.4" fill={P.ink} />}
    </>
  ),
  dhol: (c) => (
    <>
      <path d="M28 30 L72 30 Q82 50 72 70 L28 70 Q18 50 28 30 Z" fill={c(P.wood)} />
      <rect x="20" y="26" width="10" height="48" rx="4" fill={c(P.cream)} />
      <rect x="70" y="26" width="10" height="48" rx="4" fill={c(P.cream)} />
      <path
        d="M30 34 L70 42 M30 42 L70 50 M30 50 L70 58 M30 58 L70 66"
        stroke={c(P.clayDark)}
        strokeWidth="2"
        fill="none"
      />
    </>
  ),
  japi: (c) => (
    <>
      <polygon points="50,16 88,68 12,68" fill={c(P.cream)} />
      <ellipse cx="50" cy="68" rx="38" ry="8" fill={c(P.wood)} />
      <path d="M32 50 L68 50 M40 38 L60 38" stroke={c(P.red)} strokeWidth="3" fill="none" />
      <circle cx="50" cy="18" r="4.5" fill={c(P.red)} />
    </>
  ),
  bamboo: (c) => (
    <>
      <rect x="42" y="12" width="16" height="76" rx="4" fill={c(P.leafGreen)} />
      <line x1="42" y1="34" x2="58" y2="34" stroke={c(P.darkGreen)} strokeWidth="3" />
      <line x1="42" y1="54" x2="58" y2="54" stroke={c(P.darkGreen)} strokeWidth="3" />
      <line x1="42" y1="74" x2="58" y2="74" stroke={c(P.darkGreen)} strokeWidth="3" />
      <path d="M58 28 Q82 20 90 32 Q70 40 58 34 Z" fill={c(P.leafGreen)} />
      <path d="M42 48 Q18 40 10 52 Q30 60 42 54 Z" fill={c(P.leafGreen)} />
    </>
  ),
  teacup: (c) => (
    <>
      <path d="M26 36 L70 36 L64 68 L32 68 Z" fill={c(P.white)} />
      <path
        d="M70 42 q14 6 0 18"
        fill="none"
        stroke={c(P.white)}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="76" rx="32" ry="7" fill={c(P.silver)} />
      <rect x="26" y="36" width="44" height="5" fill={c(P.red)} />
    </>
  ),
  xorai: (c) => (
    <>
      <path d="M30 40 Q50 14 70 40 Z" fill={c(P.brass)} />
      <circle cx="50" cy="14" r="4.5" fill={c(P.brassDark)} />
      <path d="M24 42 L76 42 Q70 66 50 66 Q30 66 24 42 Z" fill={c(P.brass)} />
      <rect x="45" y="66" width="10" height="12" fill={c(P.brassDark)} />
      <ellipse cx="50" cy="84" rx="26" ry="7" fill={c(P.brass)} />
      <path d="M28 50 Q50 58 72 50" stroke={c(P.brassDark)} strokeWidth="2.5" fill="none" />
    </>
  ),
  hornbill: (c, mono) => (
    <>
      <polygon points="22,54 2,70 24,66" fill={c(P.ink)} />
      <ellipse cx="44" cy="56" rx="26" ry="17" fill={c(P.ink)} />
      <circle cx="68" cy="38" r="12" fill={c(P.ink)} />
      <path d="M76 32 Q98 28 94 46 Q82 50 76 44 Z" fill={c(P.yellow)} />
      <path d="M68 24 Q84 17 92 28 Q78 28 70 31 Z" fill={c(P.brassDark)} />
      {!mono && <circle cx="70" cy="36" r="2.4" fill="#fff" />}
    </>
  ),
  rhino: (c) => (
    <>
      <ellipse cx="46" cy="52" rx="31" ry="19" fill={c(P.silver)} />
      <path d="M74 42 Q92 46 90 60 L72 64 Z" fill={c(P.silver)} />
      <polygon points="88,44 97,30 92,47" fill={c(P.cream)} />
      <rect x="26" y="66" width="10" height="18" rx="3" fill={c(P.silver)} />
      <rect x="44" y="66" width="10" height="18" rx="3" fill={c(P.silver)} />
      <rect x="62" y="66" width="10" height="18" rx="3" fill={c(P.silver)} />
      <ellipse cx="78" cy="38" rx="4" ry="6" fill={c(P.silver)} />
    </>
  ),
  gamosa: (c) => (
    <>
      <rect x="28" y="14" width="44" height="72" rx="2" fill={c(P.white)} />
      <rect x="28" y="14" width="44" height="10" fill={c(P.red)} />
      <rect x="28" y="76" width="44" height="10" fill={c(P.red)} />
      <polygon points="50,34 58,42 50,50 42,42" fill={c(P.red)} />
      <polygon points="50,52 58,60 50,68 42,60" fill={c(P.red)} opacity="0.7" />
    </>
  ),
};

export const SHAPE_KEYS = Object.keys(SHAPES);

/**
 * Renders an object either in full colour or as a flat dark silhouette.
 */
export default function ObjectShape({ shape, size = 96, mode = "color" }) {
  const draw = SHAPES[shape];
  if (!draw) return null;

  const mono = mode === "silhouette";
  const resolve = (natural) => (mono ? "#1d2620" : natural);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {draw(resolve, mono)}
    </svg>
  );
}
