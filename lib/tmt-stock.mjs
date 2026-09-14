// tmtNum → stock commit map, built from ~/CC/The-Modding-Tree history (read-only).
// For each version the stock commit is the LAST first-parent commit whose js/game.js still carries that
// tmtNum (so 2.2.1 → 360d8ac, the parent of the commit that bumped it), matching plan §10b.
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

export const TMT = process.env.TMT_REPO || path.join(process.env.CC_DIR || path.join(os.homedir(), 'CC'), 'The-Modding-Tree');
const git = (...a) => execFileSync('git', ['-C', TMT, ...a], { encoding: 'utf8', maxBuffer: 1 << 28 });

export const tmtNumOf = (src) => (src && src.match(/tmtNum\s*:\s*["'`]([^"'`]+)["'`]/) || [])[1] || null;

let cache;
export function stockMap() {
  if (cache) return cache;
  const commits = git('rev-list', '--first-parent', '--reverse', 'HEAD', '--', 'js/game.js').trim().split('\n');
  const map = new Map(); // version → {commit, date, first}
  for (const c of commits) {
    let src; try { src = git('show', `${c}:js/game.js`); } catch { continue; }
    const v = tmtNumOf(src); if (!v) continue;
    const date = git('show', '-s', '--format=%cs', c).trim();
    const prev = map.get(v);
    map.set(v, { version: v, commit: c.slice(0, 7), date, first: prev ? prev.first : c.slice(0, 7) });
  }
  // The last commit carrying version v is the parent of the first commit of the next version, which may be
  // a non-game.js commit; resolve it on the full first-parent history.
  const full = git('rev-list', '--first-parent', '--reverse', 'HEAD').trim().split('\n').map((c) => c.slice(0, 7));
  const vers = [...map.values()];
  for (let i = 0; i < vers.length; i++) {
    const next = vers[i + 1];
    if (!next) { vers[i].commit = full[full.length - 1]; continue; }
    const idx = full.findIndex((c) => next.first.startsWith(c) || c.startsWith(next.first));
    if (idx > 0) vers[i].commit = full[idx - 1];
  }
  cache = new Map(vers.map((v) => [v.version, v]));
  return cache;
}

const cmpVer = (a, b) => {
  // 'π' (TMT's 2.π releases sit between 2.3.5 and 2.4) compares as 3.99.
  const num = (x) => (x === 'π' ? 3.99 : parseFloat(x) || 0);
  const pa = a.split(/[.\-]/).map(num), pb = b.split(/[.\-]/).map(num);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
};

/** {version, commit, exact, note} — unknown versions resolve to the nearest lower known one. */
export function stockFor(tmtNum) {
  const m = stockMap();
  if (!tmtNum) return null;
  if (m.has(tmtNum)) return { ...m.get(tmtNum), exact: true };
  const lower = [...m.keys()].filter((v) => cmpVer(v, tmtNum) <= 0).sort(cmpVer);
  const v = lower.length ? lower[lower.length - 1] : [...m.keys()].sort(cmpVer)[0];
  return { ...m.get(v), exact: false, note: `tmtNum ${tmtNum} not in stock history; using nearest lower ${v}` };
}

export function stockFile(commit, file) {
  try { return git('show', `${commit}:${file}`); } catch { return null; }
}
export function stockTree(commit) {
  return git('ls-tree', '-r', '--name-only', commit).trim().split('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const v of stockMap().values()) console.log(v.version.padEnd(10), v.commit, v.date, 'first', v.first);
}
