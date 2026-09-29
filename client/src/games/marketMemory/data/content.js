/*
  Content pools + question generators for the Market Memory game.

  Two sources of content:
    - real photographs dropped into src/assets/{textiles,market,silhouettes}
    - generated SVG art, used only as a fallback so the app runs before any
      photos are added

  buildSession() is async because the image-backed pattern questions have to
  load and fingerprint the photo before a fair question can be built.
*/

import { MOTIF_KEYS, MOTIF_COLOR_KEYS } from "../components/MotifCell.jsx";
import {
  TEXTILE_ASSETS,
  MARKET_ASSETS,
  SILHOUETTE_ASSETS,
  hasTextileImages,
  hasMarketImages,
  hasSilhouetteImages,
  assetsUpToLevel,
  assetsAtLevel,
} from "./assets.js";
import { loadImage, fingerprintCells, chooseHoleAndDistractors } from "../utils/imageGrid.js";

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sb = new Set(b.map((x) => x.key ?? x));
  return a.every((x) => sb.has(x.key ?? x));
}

/* ------------------------------------------------------------------ */
/* 1. Market list                                                      */
/* ------------------------------------------------------------------ */

/* Fallback pools, used only when there are no market photos. */
export const FALLBACK_MARKET_ITEMS = {
  rice: { label: "Rice", shape: "rice" },
  fish: { label: "Fish", shape: "fish" },
  banana: { label: "Banana", shape: "banana" },
  egg: { label: "Eggs", shape: "egg" },
  tea: { label: "Tea leaves", shape: "tea" },
  pumpkin: { label: "Pumpkin", shape: "pumpkin" },
  oil: { label: "Mustard oil", shape: "oil" },
  chilli: { label: "Chilli", shape: "chilli" },
  ginger: { label: "Ginger", shape: "ginger" },
  jaggery: { label: "Jaggery", shape: "jaggery" },
  bambooShoot: { label: "Bamboo shoot", shape: "bambooShoot" },
  betelNut: { label: "Betel nut", shape: "betelNut" },
};

const FALLBACK_MARKET_POOLS = {
  1: ["rice", "fish", "banana", "egg", "tea", "pumpkin"],
  2: ["rice", "fish", "banana", "egg", "tea", "pumpkin", "oil", "chilli", "ginger", "jaggery"],
  3: Object.keys(FALLBACK_MARKET_ITEMS),
};

/*
  Level knob #1 — how hard the market list is to hold and to tell apart.
    L1: small pool of very distinct items; wrong options share at most 1 item.
    L2: wider pool; wrong options share up to 2.
    L3: full pool; every wrong option shares exactly 2 and differs by one, so
        gist matching fails and real recall is required.
*/
const MARKET_OVERLAP = { 1: 1, 2: 2, 3: 2 };

function marketPool(level) {
  if (hasMarketImages) {
    const levelAssets = assetsUpToLevel(MARKET_ASSETS, level);
    // Must have at least 4 items to generate 3 unique wrong answers
    if (levelAssets.length >= 4) {
      return levelAssets.map((a) => ({
        key: a.key,
        label: a.label,
        url: a.url,
      }));
    }
  }
  return (FALLBACK_MARKET_POOLS[level] || FALLBACK_MARKET_POOLS[1]).map((key) => ({
    key,
    label: FALLBACK_MARKET_ITEMS[key].label,
    shape: FALLBACK_MARKET_ITEMS[key].shape,
  }));
}

export function generateMarketList(level) {
  return pick(marketPool(level), 3);
}

export function generateRecallQuestion(level, correctItems) {
  const pool = marketPool(level);
  const maxOverlap = MARKET_OVERLAP[level] ?? 1;
  const correctKeys = correctItems.map((i) => i.key);
  const others = pool.filter((i) => !correctKeys.includes(i.key));

  const distractors = [];
  let guard = 0;

  while (distractors.length < 3 && guard < 400) {
    guard++;
    const overlap = level === 3 ? maxOverlap : Math.floor(Math.random() * (maxOverlap + 1));
    const kept = pick(correctItems, overlap);
    const fresh = pick(others, 3 - overlap);
    if (fresh.length < 3 - overlap) continue;

    const candidate = [...kept, ...fresh];
    if (sameSet(candidate, correctItems)) continue;
    if (distractors.some((d) => sameSet(d, candidate))) continue;
    distractors.push(candidate);
  }

  let fallbackGuard1 = 0;
  while (distractors.length < 3 && fallbackGuard1 < 100) {
    fallbackGuard1++;
    const candidate = pick(pool, 3);
    if (!sameSet(candidate, correctItems) && !distractors.some((d) => sameSet(d, candidate))) {
      distractors.push(candidate);
    }
  }

  const options = shuffle([
    { id: "correct", items: correctItems, correct: true },
    ...distractors.map((items, i) => ({ id: `d${i}`, items, correct: false })),
  ]);

  return { type: "recall", options };
}

/* ------------------------------------------------------------------ */
/* 2. Pattern recognition — image-backed                               */
/* ------------------------------------------------------------------ */

/*
  Level knob #2 — grid fineness and how alike the four crops are.
    L1: 3x3 grid, distractor crops taken from the most visually different
        parts of the cloth.
    L2: 3x3 grid, mid-similarity distractors.
    L3: 4x4 grid (smaller, finer squares) and distractors drawn from the crops
        most similar to the answer without being identical to it.
*/
const PATTERN_GRID = { 1: 3, 2: 3, 3: 4 };

async function generateImagePatternQuestion(level, excludeKeys = []) {
  const candidates = assetsAtLevel(TEXTILE_ASSETS, level).filter(
    (t) => !excludeKeys.includes(t.key)
  );
  const pool = candidates.length ? candidates : assetsAtLevel(TEXTILE_ASSETS, level);
  if (!pool.length) return null;

  const size = PATTERN_GRID[level] || 3;

  // Try a few textiles before giving up — some photos are too uniform to make
  // a fair question at this grid size.
  for (const textile of shuffle(pool)) {
    try {
      const img = await loadImage(textile.url);
      const cells = fingerprintCells(img, size, size);
      const chosen = chooseHoleAndDistractors(cells, level);
      if (!chosen) continue;

      const options = shuffle([
        { id: "correct", cellIndex: chosen.answer.index, correct: true },
        ...chosen.distractors.map((c, i) => ({
          id: `d${i}`,
          cellIndex: c.index,
          correct: false,
        })),
      ]);

      return {
        type: "pattern",
        mode: "image",
        textileKey: textile.key,
        label: textile.label,
        url: textile.url,
        cols: size,
        rows: size,
        holeIndex: chosen.answer.index,
        options,
      };
    } catch {
      // Unreadable file — skip it and try the next textile.
      continue;
    }
  }

  return null;
}

/* ---- SVG fallback pattern (used only when no textile photos exist) ---- */

const FALLBACK_PATTERN_LEVELS = {
  1: { cols: 3, rows: 3, motifs: 2, colors: 1, rotate: false },
  2: { cols: 3, rows: 3, motifs: 3, colors: 2, rotate: false },
  3: { cols: 4, rows: 4, motifs: 3, colors: 3, rotate: true },
};

function fallbackCellAt(r, c, cfg, motifs, colors) {
  const motifIdx =
    cfg.motifs === 2 ? (r + c) % 2 : (r + (cfg.rotate ? 2 * c : c)) % cfg.motifs;
  const colorIdx = cfg.colors === 1 ? 0 : cfg.colors === 2 ? r % 2 : (r + c) % 3;
  const rotation = cfg.rotate ? (c % 2 === 0 ? 0 : 90) : 0;
  return { motif: motifs[motifIdx], color: colors[colorIdx], rotation };
}

function generateFallbackPatternQuestion(level) {
  const cfg = FALLBACK_PATTERN_LEVELS[level] || FALLBACK_PATTERN_LEVELS[1];
  const motifs = pick(MOTIF_KEYS, cfg.motifs);
  const colors = pick(MOTIF_COLOR_KEYS, cfg.colors);

  const grid = [];
  for (let r = 0; r < cfg.rows; r++) {
    for (let c = 0; c < cfg.cols; c++) {
      grid.push(fallbackCellAt(r, c, cfg, motifs, colors));
    }
  }

  const holeIndex = 1 + Math.floor(Math.random() * (grid.length - 1));
  const answer = grid[holeIndex];

  const distractors = [];
  const seen = new Set([JSON.stringify(answer)]);
  let guard = 0;

  while (distractors.length < 3 && guard < 400) {
    guard++;
    let candidate;
    if (level === 1) {
      const otherMotifs = MOTIF_KEYS.filter((m) => !motifs.includes(m));
      candidate = {
        motif: otherMotifs.length ? pick(otherMotifs, 1)[0] : pick(MOTIF_KEYS, 1)[0],
        color: answer.color,
        rotation: 0,
      };
    } else if (level === 2) {
      candidate =
        Math.random() < 0.5
          ? { ...answer, motif: pick(MOTIF_KEYS.filter((m) => m !== answer.motif), 1)[0] }
          : { ...answer, color: pick(MOTIF_COLOR_KEYS.filter((c) => c !== answer.color), 1)[0] };
    } else {
      const roll = Math.random();
      if (roll < 0.45) {
        candidate = { ...answer, rotation: (answer.rotation + 90) % 360 };
      } else if (roll < 0.8) {
        candidate = {
          ...answer,
          color: pick(MOTIF_COLOR_KEYS.filter((c) => c !== answer.color), 1)[0],
        };
      } else {
        candidate = {
          ...answer,
          motif: pick(motifs.filter((m) => m !== answer.motif), 1)[0] || answer.motif,
          rotation: (answer.rotation + 90) % 360,
        };
      }
    }
    const key = JSON.stringify(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    distractors.push(candidate);
  }

  let fallbackGuard2 = 0;
  while (distractors.length < 3 && fallbackGuard2 < 100) {
    fallbackGuard2++;
    const candidate = {
      motif: pick(MOTIF_KEYS, 1)[0],
      color: pick(MOTIF_COLOR_KEYS, 1)[0],
      rotation: 0,
    };
    if (!seen.has(JSON.stringify(candidate))) {
      seen.add(JSON.stringify(candidate));
      distractors.push(candidate);
    }
  }

  const options = shuffle([
    { id: "correct", cell: answer, correct: true },
    ...distractors.map((cell, i) => ({ id: `d${i}`, cell, correct: false })),
  ]);

  return {
    type: "pattern",
    mode: "svg",
    grid,
    holeIndex,
    cols: cfg.cols,
    rows: cfg.rows,
    options,
  };
}

export async function generatePatternQuestion(level, excludeKeys = []) {
  if (hasTextileImages) {
    const q = await generateImagePatternQuestion(level, excludeKeys);
    if (q) return q;
  }
  return generateFallbackPatternQuestion(level);
}

/* ------------------------------------------------------------------ */
/* 3. Silhouette recognition                                           */
/* ------------------------------------------------------------------ */

export const FALLBACK_SILHOUETTES = {
  fish: "Fish",
  tea: "Tea leaf",
  pot: "Clay pot",
  umbrella: "Umbrella",
  boat: "Country boat",
  bird: "Bird",
  bamboo: "Bamboo",
  dhol: "Dhol drum",
  japi: "Japi hat",
  teacup: "Cup of tea",
  xorai: "Xorai",
  hornbill: "Hornbill",
  rhino: "One-horned rhino",
  gamosa: "Gamosa",
};

/*
  Level knob #3 — how familiar the silhouetted object is.
    L1: everyday things anyone names instantly.
    L2: regionally common objects.
    L3: culturally specific objects, whose outlines also confuse more easily.
*/
const FALLBACK_SILHOUETTE_POOLS = {
  1: ["fish", "umbrella", "boat", "bird", "pot", "tea"],
  2: ["bamboo", "dhol", "japi", "teacup", "pot", "boat", "bird"],
  3: ["xorai", "hornbill", "rhino", "gamosa", "japi", "dhol", "bamboo"],
};

export function generateSilhouetteQuestion(level, exclude = []) {
  if (hasSilhouetteImages) {
    const all = assetsAtLevel(SILHOUETTE_ASSETS, level);
    const pool = all.filter((a) => !exclude.includes(a.key));
    const usable = pool.length >= 4 ? pool : all;

    const answer = pick(usable, 1)[0];
    const distractors = pick(
      usable.filter((a) => a.key !== answer.key),
      3
    );

    const options = shuffle([
      { id: answer.key, url: answer.url, label: answer.label, correct: true },
      ...distractors.map((a) => ({ id: a.key, url: a.url, label: a.label, correct: false })),
    ]);

    return {
      type: "silhouette",
      mode: "image",
      answerKey: answer.key,
      answerUrl: answer.url,
      options,
    };
  }

  const all = FALLBACK_SILHOUETTE_POOLS[level] || FALLBACK_SILHOUETTE_POOLS[1];
  const pool = all.filter((k) => !exclude.includes(k));
  const usable = pool.length >= 4 ? pool : all;

  const answer = pick(usable, 1)[0];
  const distractors = pick(
    usable.filter((k) => k !== answer),
    3
  );

  const options = shuffle([
    { id: answer, shape: answer, label: FALLBACK_SILHOUETTES[answer], correct: true },
    ...distractors.map((k) => ({
      id: k,
      shape: k,
      label: FALLBACK_SILHOUETTES[k],
      correct: false,
    })),
  ]);

  return { type: "silhouette", mode: "svg", answerKey: answer, options };
}

/* ------------------------------------------------------------------ */
/* 4. Whole session                                                    */
/* ------------------------------------------------------------------ */

export async function buildSession(level) {
  const marketList = generateMarketList(level);

  const questions = [];

  const usedTextiles = [];
  for (let i = 0; i < 3; i++) {
    const q = await generatePatternQuestion(level, usedTextiles);
    if (q.textileKey) usedTextiles.push(q.textileKey);
    questions.push(q);
  }

  const usedObjects = [];
  for (let i = 0; i < 2; i++) {
    const q = generateSilhouetteQuestion(level, usedObjects);
    usedObjects.push(q.answerKey);
    questions.push(q);
  }

  return {
    level,
    marketList,
    questions,
    recall: generateRecallQuestion(level, marketList),
  };
}

export const LEVELS = [
  {
    id: 1,
    name: "Gentle",
    blurb: "Familiar market items, a coarse 3x3 weave grid, everyday objects.",
  },
  {
    id: 2,
    name: "Steady",
    blurb: "A wider shopping list, closer-matching crops, regional objects.",
  },
  {
    id: 3,
    name: "Challenging",
    blurb: "Near-identical options, a fine 4x4 weave grid, cultural objects.",
  },
];

export { hasTextileImages, hasMarketImages, hasSilhouetteImages };
