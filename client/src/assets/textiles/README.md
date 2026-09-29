# Textile pattern images

Drop real photographs of north-eastern textiles in this folder. The game finds
them automatically — no code changes, no registration file to edit.

## Naming

```
<level>_<name>.jpg
```

- `<level>` is `1`, `2` or `3` — which difficulty level the textile belongs to.
- `<name>` uses dashes; it becomes the on-screen label
  (`assam-silk` shows as "Assam silk").

Examples:

```
1_assam-mekhela-border.jpg
1_mizo-puan-stripes.jpg
2_naga-shawl-band.jpg
2_bodo-dokhona.jpg
3_manipuri-phanek.jpg
3_tripuri-risa.jpg
```

Accepted extensions: `.jpg` `.jpeg` `.png` `.webp`

## What makes a good image here

The game cuts the photo into a grid, blacks out one square, and asks the
patient which of four crops belongs in the hole. That only works if the photo
suits the task:

- **Square crop.** Crop to 1:1 before saving. Non-square images get stretched.
- **Flat and straight-on.** No perspective, no folds, no draping shadows. A
  flat-lay or a scan is ideal.
- **Simple, repeating motif.** Two or three colours, a clear repeat. Busy
  brocade makes every crop look alike and the question becomes unanswerable.
- **The repeat should not be perfectly uniform.** If every square is identical
  the puzzle has four correct answers. Borders, colour bands, or a motif that
  shifts across the cloth all give the grid something to distinguish.
  The game checks for this and will skip cells that are visually identical to
  the answer, but it can only work with what the image gives it.
- **At least 900×900px**, so the small crops stay sharp.
- **Even lighting**, no flash hotspot.

Level 1 images should be the boldest and simplest; level 3 can be finer and
lower-contrast.

## Licensing — read before you submit

For an SIH submission, every image needs to be one you are allowed to use:

- Photos your team takes yourselves are the best option, and the most
  defensible in a judging room. A phone photo of a real gamosa on a plain
  table is genuinely fine.
- Wikimedia Commons has openly licensed textile photography, but check each
  file's licence individually and keep the attribution.
- Government handloom/handicraft board material is sometimes reusable, but
  varies — verify before relying on it.
- Do not use image-search results or stock photos without a licence.

Keep a `CREDITS.md` next to these files listing the source and licence of each
image. Judges do ask, and being able to answer well is worth points.

## Before any images are added

The game falls back to generated SVG motifs so it still runs. Those are
placeholders — they are geometric approximations, not real weaves, and should
not be what you demo.
