// Stage 2 — static census from raw files (no clone) for every touched fork → data/static.jsonl.
// Raw responses are cached under data/raw/<owner>__<repo>/ (gitignored: third-party code). Resumable.
import fs from 'node:fs';
import path from 'node:path';
import { p, readJsonl, appendJsonl, cachedGet, pool, sha, safeName, latestBy } from '../lib/util.mjs';
import { findLayers, censusLayer, branchiness, modInfoOf, scriptSrcs, normalize } from '../lib/scan.mjs';
import { tmtNumOf, stockFor, stockFile, stockTree, stockMap } from '../lib/tmt-stock.mjs';
import { locateEngine, engineMoved, normBase, loaderPrefix } from '../lib/engine.mjs';

const OUT = p('data/static.jsonl');
const LIMIT = Number(process.env.LIMIT || Infinity);
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null;
// REDO_ENGINE=no-game-js,tmt-no-tmtNum re-censuses every row of those engine classes, and every row a previous run
// already sent through the engine locator (`engine_located`, whose class may now be `tmt`): their lines are removed
// first (not appended over), so row counts stay one per fork.
const REDO_ENGINE = process.env.REDO_ENGINE ? new Set(process.env.REDO_ENGINE.split(',')) : null;
if (REDO_ENGINE && fs.existsSync(OUT)) {
  const keep = readJsonl(OUT).filter((r) => !REDO_ENGINE.has(r.engine) && !r.engine_located);
  console.log('REDO_ENGINE: removing', readJsonl(OUT).length - keep.length, 'rows');
  fs.writeFileSync(OUT, keep.map((r) => JSON.stringify(r) + '\n').join(''));
}
const forks = [...latestBy(readJsonl(p('data/forks.jsonl'))).values()];
const done = new Set(readJsonl(OUT).map((r) => r.full_name));
const todo = forks.filter((f) => !f.untouched && !done.has(f.full_name) && (!ONLY || ONLY.has(f.full_name))).slice(0, LIMIT);
console.log('touched forks:', forks.filter((f) => !f.untouched).length, 'already censused:', done.size, 'to do:', todo.length);

// Every file path that appears in ANY stock TMT commit's tree is engine, not game content.
const ENGINE = new Set();
for (const v of stockMap().values()) for (const f of stockTree(v.commit)) if (/\.(js|html|css)$/.test(f)) ENGINE.add(f);
for (const f of ['js/layers.js', 'js/tree.js', 'js/mod.js']) ENGINE.delete(f); // demo/mod files: content
// Path-independent engine identities, used only for rows whose engine was located away from js/game.js.
const ENGINE_BASES = new Set([...ENGINE].filter((f) => f.endsWith('.js')).map(normBase));
const JS_TREE_CAP = 80;
const PT_ENGINE_EXTRA = ['js/sc.js', 'js/help.js']; // PTR helpers — content for PTR, not engine
const demoCache = new Map();
const demo = (commit, file) => { const k = commit + file; if (!demoCache.has(k)) demoCache.set(k, normalize(stockFile(commit, file))); return demoCache.get(k); };

async function raw(full, file) {
  const url = `https://raw.githubusercontent.com/${full}/HEAD/${file.split('/').map(encodeURIComponent).join('/')}`;
  return cachedGet(url, p('data/raw', safeName(full), file));
}

function resolveLocal(src) {
  if (/^(https?:)?\/\//i.test(src)) return null;
  return path.posix.normalize(src.replace(/^\.\//, '').replace(/[?#].*$/, '').replace(/^\//, ''));
}

async function repoTree(f) {
  const url = `https://api.github.com/repos/${f.full_name}/git/trees/${encodeURIComponent(f.default_branch || 'HEAD')}?recursive=1`;
  const r = await cachedGet(url, p('cache/api/trees', safeName(f.full_name) + '.json'), { accept: 'application/vnd.github+json' });
  if (r.status !== 200) return null;
  try { return JSON.parse(r.body).tree.filter((e) => e.type === 'blob').map((e) => ({ path: e.path, size: e.size })); } catch { return null; }
}

async function census(f) {
  const row = { full_name: f.full_name, fetched_at: new Date().toISOString(), http: {} };
  const get = async (file) => { const r = await raw(f.full_name, file); row.http[file] = r.status; return r.body; };
  const [html, game, mod] = await Promise.all([get('index.html'), get('js/game.js'), get('js/mod.js')]);
  row.tmtNum = tmtNumOf(game);
  const scripts = scriptSrcs(html).map(resolveLocal).filter(Boolean);
  // No tmtNum in js/game.js: locate the engine by content — every local <script> of index.html first, then (nothing
  // found) every .js file in the repo tree (one API call). The located game file supplies tmtNum; a moved mod file
  // supplies modInfo.
  let located = null; const fetched = {};
  if (!row.tmtNum && html) {
    const order = scripts.filter((s) => s.endsWith('.js') && !/vue/i.test(s)).slice(0, JS_TREE_CAP);
    await Promise.all(order.map(async (s) => { fetched[s] = await get(s); }));
    located = locateEngine(fetched, order);
    if (!located.game && !located.gameLoop) {
      const tree = await repoTree(f);
      row.tree_js_files = tree ? tree.filter((e) => e.path.endsWith('.js')).length : null;
      const more = (tree || []).filter((e) => e.path.endsWith('.js') && !(e.path in fetched) && !/node_modules|vue/i.test(e.path) && e.size < 1.5e6).slice(0, JS_TREE_CAP).map((e) => e.path);
      await Promise.all(more.map(async (s) => { fetched[s] = await get(s); }));
      located = locateEngine(fetched, [...order, ...more]);
    }
    row.engine_located = located;
    row.engine_moved = engineMoved(located);
    if (located.tmtNum) row.tmtNum = located.tmtNum;
  }
  const modSrc = mod ?? (located?.mod ? fetched[located.mod] : null);
  const mi = modInfoOf(modSrc);
  Object.assign(row, { mod_name: mi.name, mod_id: mi.id, author: mi.author, version_num: mi.version_num, version_name: mi.version_name, endgame: mi.modInfo_endgame || mi.endgame, modFiles: mi.modFiles });

  row.scripts = scripts;
  const content = new Set();
  const locatedEngine = new Set(located ? [located.game, located.gameLoop, located.updateTemp].filter(Boolean) : []);
  const isEngine = (s) => ENGINE.has(s) || (row.engine_moved && (locatedEngine.has(s) || ENGINE_BASES.has(normBase(s))));
  for (const s of scripts) if (s.endsWith('.js') && !isEngine(s) && !/vue/i.test(s)) content.add(s);
  // modFiles are relative to the loader's own prefix ("js/" in stock; a moved engine may use "Javascript/").
  const loaderFile = row.engine_moved ? scripts.find((s) => normBase(s) === 'loader' && fetched[s]) : null;
  row.modFiles_prefix = (loaderFile && loaderPrefix(fetched[loaderFile])) || 'js/';
  for (const m of mi.modFiles || []) content.add(path.posix.normalize(row.modFiles_prefix + m));
  content.add('js/layers.js');
  content.delete('js/mod.js'); if (located?.mod) content.delete(located.mod);
  const files = [...content].slice(0, 60);
  row.content_files_truncated = content.size > 60;
  const srcs = {};
  await Promise.all(files.map(async (file) => { const b = await get(file); if (b != null) srcs[file] = b; }));
  row.content_files = Object.keys(srcs);
  row.missing_files = files.filter((x) => !(x in srcs) && row.http[x] !== 200);

  const all = Object.values(srcs).join('\n;\n');
  const { layers, legacy } = findLayers(all);
  row.engine = row.tmtNum ? 'tmt' : legacy ? 'prestige-tree-legacy' : ((game || located?.gameLoop) ? (layers.length ? 'tmt-no-tmtNum' : 'unknown') : 'no-game-js');
  const lrows = layers.map(censusLayer);
  row.layer_ids = lrows.map((l) => l.id);
  row.addLayer_count = legacy ? 0 : layers.length;
  row.legacy_layer_keys = legacy ? layers.length : 0;
  row.rows_values = lrows.map((l) => l.row);
  row.branches = Object.fromEntries(lrows.filter((l) => l.branches.length).map((l) => [l.id, l.branches]));
  row.branches_dynamic = lrows.filter((l) => l.branches_dynamic).map((l) => l.id);
  for (const k of ['milestones', 'upgrades', 'buyables', 'challenges', 'achievements', 'clickables']) row[k] = lrows.reduce((a, l) => a + l[k], 0);
  row.branchiness = branchiness(lrows);
  row.math_random = (all + '\n' + (modSrc || '')).match(/Math\.random\s*\(/g)?.length || 0;
  row.content_lines = all.split('\n').length;
  row.content_hash = Object.keys(srcs).length ? sha(Object.keys(srcs).sort().map((k) => normalize(srcs[k])).join('\n\0\n')) : null;

  const stock = stockFor(row.tmtNum);
  row.stock = stock ? { version: stock.version, commit: stock.commit, exact: stock.exact } : null;
  if (stock) {
    const d = demo(stock.commit, 'js/layers.js');
    row.layers_is_demo = srcs['js/layers.js'] != null && normalize(srcs['js/layers.js']) === d;
    row.mod_is_demo = modSrc != null && normalize(modSrc) === demo(stock.commit, 'js/mod.js');
    // Demo in ANY stock version (a fork that bumped its engine but kept the demo).
    if (!row.layers_is_demo && srcs['js/layers.js'] != null) {
      const n = normalize(srcs['js/layers.js']);
      row.layers_is_demo = [...stockMap().values()].some((v) => demo(v.commit, 'js/layers.js') === n);
    }
  } else { row.layers_is_demo = null; row.mod_is_demo = null; }

  const b = row.branchiness;
  const reasons = [];
  if (b.layers <= 2) reasons.push('<=2 layers');
  if (row.layers_is_demo && row.content_files.every((x) => x === 'js/layers.js' || x === 'js/tree.js')) reasons.push('demo unchanged');
  if (b.branchEdges === 0) reasons.push('no branches');
  row.trivial_reasons = reasons;
  row.trivial = reasons.length > 0;
  row.content_total = row.milestones + row.upgrades + row.buyables + row.challenges + row.achievements;
  return row;
}

let n = 0;
await pool(todo, 4, async (f) => {
  let row;
  try { row = await census(f); } catch (e) { row = { full_name: f.full_name, error: String(e && e.stack || e).slice(0, 400) }; }
  appendJsonl(OUT, row);
  if (++n % 50 === 0) console.log(n, '/', todo.length);
});
const rows = readJsonl(OUT);
console.log(JSON.stringify({ rows: rows.length, errors: rows.filter((r) => r.error).length, nontrivial: rows.filter((r) => r.trivial === false).length }));
