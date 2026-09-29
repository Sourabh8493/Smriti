/*
  Grid analysis for the textile pattern question.

  The problem this solves: if you black out a square of a repeating weave and
  offer four crops as answers, several crops may be visually identical to the
  correct one. The question then has more than one right answer and the score
  is meaningless.

  So before building a question we fingerprint every cell of the image, then:
    - refuse to use cells that are near-identical to the answer as distractors
    - choose how *similar* the distractors are based on the level

  The fingerprint is a downsampled RGB vector per cell (8x8 samples). It is
  crude, but it only needs to answer "do these two squares look the same to a
  person glancing at them", and for flat textile photography it does.

  Images are bundled by Vite, so they are same-origin and the canvas stays
  untainted.
*/

const SAMPLES = 8; // per cell, per axis

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}

/**
 * Returns one fingerprint per grid cell, in row-major order.
 */
export function fingerprintCells(img, cols, rows) {
  const w = cols * SAMPLES;
  const h = rows * SAMPLES;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  // Drawing the whole image down to cols*8 x rows*8 gives us an averaged
  // sample per cell region for free.
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const vec = [];
      for (let y = 0; y < SAMPLES; y++) {
        for (let x = 0; x < SAMPLES; x++) {
          const px = ((r * SAMPLES + y) * w + (c * SAMPLES + x)) * 4;
          vec.push(data[px], data[px + 1], data[px + 2]);
        }
      }
      cells.push({ index: r * cols + c, row: r, col: c, vec });
    }
  }

  return cells;
}

/** Mean per-channel difference, 0 (identical) to 255 (opposite). */
export function cellDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i] - b[i]);
  }
  return sum / a.length;
}

/*
  Below this, two crops are treated as the same square. A distractor this close
  to the answer would make the question unfair, so such cells are discarded
  rather than offered.
*/
const IDENTICAL_THRESHOLD = 10;

/*
  How close the distractors are allowed to be, by level. Higher level = pick
  from the *most similar* remaining cells, so the patient has to read the motif
  rather than spot the obvious odd one out.
*/
const LEVEL_SIMILARITY = {
  1: "far",
  2: "mid",
  3: "near",
};

/**
 * Picks a hole and three distractor cells from a fingerprinted grid.
 * Returns null when the image is too uniform to make a fair question.
 */
export function chooseHoleAndDistractors(cells, level) {
  const order = shuffled(cells);

  for (const answer of order) {
    const scored = cells
      .filter((c) => c.index !== answer.index)
      .map((c) => ({ cell: c, dist: cellDistance(answer.vec, c.vec) }))
      .filter((c) => c.dist > IDENTICAL_THRESHOLD)
      .sort((a, b) => a.dist - b.dist);

    if (scored.length < 3) continue; // too uniform around this cell, try another

    const mode = LEVEL_SIMILARITY[level] || "far";
    let pool;
    if (mode === "near") {
      pool = scored.slice(0, Math.max(3, Math.ceil(scored.length * 0.4)));
    } else if (mode === "mid") {
      const start = Math.floor(scored.length * 0.3);
      pool = scored.slice(start, Math.max(start + 3, Math.ceil(scored.length * 0.75)));
    } else {
      pool = scored.slice(-Math.max(3, Math.ceil(scored.length * 0.5)));
    }

    const distractors = shuffled(pool).slice(0, 3).map((s) => s.cell);
    if (distractors.length < 3) continue;

    return { answer, distractors };
  }

  return null;
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
