// Locate a fork's engine files by CONTENT, not by path (forks move `js/game.js` to `js/technical/game.js`,
// `shared/js/game.js`, `Javascript/Game.js`, …). Shared by stage 2 (raw files) and stage 3 (clone).
import path from 'node:path';
import { tmtNumOf } from './tmt-stock.mjs';

export const MARKERS = {
  game: /\btmtNum\s*:\s*["'`]/, // TMT_VERSION = { tmtNum: "2.7", … } — the file that names the engine version
  gameLoop: /\bfunction\s+gameLoop\s*\(/,
  updateTemp: /\bfunction\s+updateTemp\s*\(/,
  mod: /\bmodInfo\s*=\s*\{/,
};

/** Path-independent file identity: basename, lower-cased, extension and non-alphanumerics dropped (BreakEternity.js ≡ break_eternity.js). */
export const normBase = (f) => path.posix.basename(f).toLowerCase().replace(/\.(js|css|html)$/, '').replace(/[^a-z0-9]/g, '');

/**
 * files: {path: source}. Returns {game, gameLoop, updateTemp, mod, tmtNum} — the first path (in `order`, else key order)
 * whose source carries each marker; `js/game.js` / `js/mod.js` win ties so an unmoved fork locates to its stock paths.
 */
export function locateEngine(files, order = null) {
  const keys = (order || Object.keys(files)).filter((k) => files[k] != null);
  const prefer = (k, want) => (k === want ? 0 : 1);
  const find = (re, want) => keys.filter((k) => re.test(files[k])).sort((a, b) => prefer(a, want) - prefer(b, want))[0] || null;
  const game = find(MARKERS.game, 'js/game.js');
  return {
    game, gameLoop: find(MARKERS.gameLoop, 'js/game.js'), updateTemp: find(MARKERS.updateTemp, 'js/technical/temp.js'), mod: find(MARKERS.mod, 'js/mod.js'),
    tmtNum: game ? tmtNumOf(files[game]) : null,
  };
}

/** True when the located engine sits somewhere other than the stock `js/game.js`. */
export const engineMoved = (loc) => !!(loc && (loc.game || loc.gameLoop) && (loc.game || loc.gameLoop) !== 'js/game.js');

/** The directory prefix a loader.js puts in front of modInfo.modFiles (`"js/" + modInfo.modFiles[i]` in stock). */
export const loaderPrefix = (src) => (src && src.match(/["'`]([^"'`]*)["'`]\s*\+\s*modInfo\.modFiles\s*\[/) || [])[1] ?? null;
