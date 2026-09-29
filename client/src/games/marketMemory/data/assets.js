/*
  Asset discovery.

  Images are found by globbing the assets folders at build time, so dropping a
  correctly-named file into src/assets/<kind>/ is all that's needed — there is
  no registry to keep in sync.

  Filename convention (documented in each folder's README):
      <level>_<name>.<ext>        e.g.  2_naga-shawl-band.jpg

  If a folder is empty the corresponding `has*` flag is false and the game
  falls back to the generated SVG art.
*/

const textileModules = import.meta.glob("../../../assets/textiles/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

const marketModules = import.meta.glob("../../../assets/market/*.{png,webp,jpg,jpeg}", {
  eager: true,
  query: "?url",
  import: "default",
});

const silhouetteModules = import.meta.glob("../../../assets/silhouettes/*.{png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

function parse(modules) {
  return Object.entries(modules)
    .map(([path, url]) => {
      const file = path.split("/").pop() || "";
      const base = file.replace(/\.[^.]+$/, "");
      const match = base.match(/^([123])[_-](.+)$/);
      if (!match) {
        // Not fatal — just ignore files that don't follow the convention.
        console.warn(
          `[assets] Ignoring "${file}" — expected a name like "2_naga-shawl.jpg".`
        );
        return null;
      }
      const [, levelStr, rawName] = match;
      const key = rawName.toLowerCase();
      const label = rawName.replace(/-/g, " ").replace(/^./, (ch) => ch.toUpperCase());
      return { key, label, level: Number(levelStr), url };
    })
    .filter(Boolean);
}

export const TEXTILE_ASSETS = parse(textileModules);
export const MARKET_ASSETS = parse(marketModules);
export const SILHOUETTE_ASSETS = parse(silhouetteModules);

export const hasTextileImages = TEXTILE_ASSETS.length > 0;
export const hasMarketImages = MARKET_ASSETS.length >= 6;
export const hasSilhouetteImages = SILHOUETTE_ASSETS.length >= 4;

/** Assets available at a level: an item tagged level 1 also appears at 2 and 3. */
export function assetsUpToLevel(assets, level) {
  return assets.filter((a) => a.level <= level);
}

/** Assets tagged for exactly this level — used where difficulty must not leak down. */
export function assetsAtLevel(assets, level) {
  const exact = assets.filter((a) => a.level === level);
  return exact.length >= 4 ? exact : assetsUpToLevel(assets, level);
}
