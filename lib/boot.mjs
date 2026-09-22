// The harness boot, engine-version tolerant. ONE FORK PER PROCESS (sloppy-mode globals leak):
//   node lib/boot.mjs <gameRoot> [ticks=200] [diff=0.05] [leg=idle|policy] [prestubs=a,b]
// env CDN_MAP = JSON {url: localFile} for CDN logic libraries the parent pre-fetched (e.g. break_eternity).
// Prints one JSON line prefixed "BOOTRESULT " on stdout. Scripts run via vm.runInThisContext.
// Untrusted-code hygiene: `process`, `require`, `fetch` and friends are removed from the global before
// any game file runs (the harness keeps private references); the parent also scrubs the child's env.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import crypto from 'node:crypto';

const proc = process;
const out = (o) => proc.stdout.write('BOOTRESULT ' + JSON.stringify(o) + '\n');
const [ROOT, TICKS = '200', DIFF = '0.05', LEG = 'idle', PRESTUBS = ''] = proc.argv.slice(2);
const CDN_MAP = JSON.parse(proc.env.CDN_MAP || '{}');
const ticks = Number(TICKS), diff = Number(DIFF);
const realConsole = console;
const R = { root: ROOT, files_loaded: [], files_skipped: [], file_errors: [], inline_scripts: 0, stubs_hit: {}, console_lines: 0 };

const RENDER_ONLY = /(^|\/)(components|systemComponents|canvas|particleSystem)\.js$|(^|\/)vue[^/]*\.js$/i;

// ---- script order ---------------------------------------------------------------------------------
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const order = [];
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = m[1]; const src = (attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1];
  if (/type\s*=\s*["']module["']/i.test(attrs)) { R.files_skipped.push({ file: src || 'inline-module', why: 'module' }); continue; }
  if (src) {
    if (/^(https?:)?\/\//i.test(src)) {
      if (CDN_MAP[src]) order.push({ file: src, abs: CDN_MAP[src] }); else R.files_skipped.push({ file: src, why: 'cdn' });
      continue;
    }
    const rel = path.posix.normalize(src.replace(/^\.?\//, '').replace(/[?#].*$/, ''));
    if (RENDER_ONLY.test(rel)) { R.files_skipped.push({ file: rel, why: 'render-only' }); continue; }
    order.push({ file: rel });
  } else if (m[2].trim()) order.push({ inline: m[2], file: `inline#${++R.inline_scripts}` });
}
const onload = (html.match(/<body\b[^>]*\bonload\s*=\s*["']([^"']+)["']/i) || [])[1] || null;
R.onload = onload;

// ---- shims ----------------------------------------------------------------------------------------
const hit = (k) => { R.stubs_hit[k] = (R.stubs_hit[k] || 0) + 1; };
function stub(name) {
  const store = {};
  const fn = function () {};
  return new Proxy(fn, {
    get(t, k) {
      if (k in store) return store[k];
      if (typeof k === 'symbol') return k === Symbol.toPrimitive ? () => '' : undefined;
      if (k === 'then' || k === 'toJSON') return undefined;
      if (k === 'length') return 0;
      if (k === 'toString' || k === 'valueOf') return () => '';
      hit(`${name}.${String(k)}`);
      return (store[k] = stub(`${name}.${String(k)}`));
    },
    set(t, k, v) { store[k] = v; return true; },
    has() { return true; },
    apply() { hit(`${name}()`); return stub(`${name}()`); },
    construct() { hit(`new ${name}`); return stub(`new ${name}`); },
  });
}
const lsStore = {};
const intervals = [];
const shims = {
  window: globalThis, self: globalThis, top: globalThis, parent: globalThis,
  document: (() => { const d = stub('document'); d.title = ''; d.readyState = 'complete'; return d; })(),
  navigator: { userAgent: 'node', clipboard: stub('navigator.clipboard'), language: 'en' },
  location: { href: 'http://localhost/', search: '', hash: '', protocol: 'http:', reload() { hit('location.reload') } },
  localStorage: { getItem: (k) => (k in lsStore ? lsStore[k] : null), setItem: (k, v) => { lsStore[k] = String(v); }, removeItem: (k) => { delete lsStore[k]; }, clear() { for (const k in lsStore) delete lsStore[k]; } },
  setInterval: (fn, ms) => { intervals.push(ms); return intervals.length; }, clearInterval() {},
  setTimeout: () => { hit('setTimeout'); return 0; }, clearTimeout() {},
  requestAnimationFrame: () => { hit('requestAnimationFrame'); return 0; },
  addEventListener() { hit('addEventListener'); }, removeEventListener() {},
  confirm: () => { hit('confirm'); return true; }, prompt: () => { hit('prompt'); return ''; }, alert: () => { hit('alert'); },
  getComputedStyle: () => stub('getComputedStyle()'),
  Vue: (() => { const v = stub('Vue'); v.set = (o, k, val) => { o[k] = val; }; v.delete = (o, k) => { delete o[k]; }; return v; })(),
  app: stub('app'),
  Image: function () { return stub('Image'); }, Audio: function () { return stub('Audio'); },
  HTMLElement: function () {}, Element: function () {},
};
const CONSOLE_KEEP = console;
Object.assign(globalThis, shims);
globalThis.console = new Proxy(CONSOLE_KEEP, { get: (t, k) => (typeof t[k] === 'function' ? () => { R.console_lines++; } : t[k]) });
for (const k of ['process', 'require', 'module', 'exports', 'fetch', 'Buffer', 'global', 'WebAssembly']) { try { delete globalThis[k]; } catch {} }
const run = (code, filename) => vm.runInThisContext(code, { filename });
// Names the parent learned (from an earlier attempt's ReferenceError in load()) are pre-stubbed before any file.
R.prestubs = PRESTUBS ? PRESTUBS.split(',') : [];
for (const n of R.prestubs) globalThis[n] = stub(n);

// ---- load -----------------------------------------------------------------------------------------
const t0 = Date.now();
let modFilesInjected = false;
const loadFile = (file, absIn) => {
  const abs = absIn || path.join(ROOT, file);
  if (!fs.existsSync(abs)) { R.file_errors.push({ file, error: 'missing' }); return; }
  try { run(fs.readFileSync(abs, 'utf8'), file); R.files_loaded.push(file); }
  catch (e) { R.file_errors.push({ file, error: String(e && e.message || e).slice(0, 200) }); }
};
for (const o of order) {
  if (o.inline != null) { try { run(o.inline, o.file); R.files_loaded.push(o.file); } catch (e) { R.file_errors.push({ file: o.file, error: String(e.message).slice(0, 200) }); } continue; }
  if (/(^|\/)loader\.js$/i.test(o.file)) {
    // loader.js inserts async=false <script> tags for modInfo.modFiles; a browser runs those after the parser's
    // own scripts, so they are loaded after the last static script (forks rely on it: top-level `format` calls).
    R.files_skipped.push({ file: o.file, why: 'loader (modFiles loaded after the static scripts)' });
    modFilesInjected = true;
    try { const m = fs.readFileSync(path.join(ROOT, o.file), 'utf8').match(/["'`]([^"'`]*)["'`]\s*\+\s*modInfo\.modFiles\s*\[/); if (m) R.modFiles_prefix = m[1]; } catch {}
    continue;
  }
  loadFile(o.file, o.abs);
}
if (modFilesInjected) {
  let mf = []; try { mf = run('typeof modInfo !== "undefined" && modInfo.modFiles || []', 'modFiles'); } catch {}
  R.modFiles = mf;
  for (const f of mf) loadFile(path.posix.normalize((R.modFiles_prefix ?? 'js/') + f));
}
// If the index had no loader but the mod declares modFiles (a mismatched fork), note it.
try { if (!modFilesInjected && run('typeof modInfo !== "undefined" && Array.isArray(modInfo.modFiles)', 'x')) R.modFiles_without_loader = run('modInfo.modFiles', 'x'); } catch {}
// Render-only files are skipped, so every top-level function they declare (and is not defined elsewhere) is
// stubbed after the load — e.g. `updateParticles` (particleSystem.js) is called from 2.6+ gameLoop.
R.render_stubs = [];
const declared = new Set(['loadVue', 'resizeCanvas']);
for (const sk of R.files_skipped) {
  if (sk.why !== 'render-only') continue;
  const abs = path.join(ROOT, sk.file); if (!fs.existsSync(abs)) continue;
  for (const m of fs.readFileSync(abs, 'utf8').matchAll(/^\s{0,4}function\s+([\w$]+)\s*\(/gm)) declared.add(m[1]);
}
for (const f of declared) {
  try {
    const t = run(`typeof ${f}`, 'x');
    if (t !== 'function') { globalThis[f] = function () { hit(f); }; R.render_stubs.push(f); }
    else if (f === 'loadVue' || f === 'resizeCanvas') run(`${f} = function(){ globalThis.__hit && __hit(${JSON.stringify(f)}) }`, 'x');
  } catch {}
}
globalThis.__hit = hit;
R.load_ms = Date.now() - t0;
const errText = (e) => { const st = String(e && e.stack || ''); const at = (st.match(/^\s+at .*$/m) || [''])[0].trim(); return `${e && e.name || 'Error'}: ${String(e && e.message || e).slice(0, 300)}${at ? ' @ ' + at.slice(0, 160) : ''}`; };
const fail = (stage, e) => { R.ok = false; R.failed_at = stage; R.error = errText(e); out(R); proc.exit(0); };
// A global defined only in a skipped file surfaces as a ReferenceError inside load(). Retrying load() in the
// same process is not idempotent (setupTemp re-wraps cost functions), so report the name and let the parent
// re-spawn with it pre-stubbed (bounded there).
try { run(onload && /load\s*\(/.test(onload) ? onload : 'load()', 'onload'); }
catch (e) {
  const m = e && e.name === 'ReferenceError' && /^([\w$]+) is not defined/.exec(e.message);
  if (m && !R.prestubs.includes(m[1])) R.needs_stub = m[1];
  fail('load()', e);
}

// ---- census from the live layers object ----------------------------------------------------------
let census;
try {
  census = run(`(function(){
    const numKeys = (o) => o && typeof o === 'object' ? Object.keys(o).filter(k => !isNaN(k)).length : 0;
    const ids = Object.keys(layers);
    const game = ids.filter(l => layers[l] && typeof layers[l].row === 'number' || (layers[l] && layers[l].row !== 'side' && layers[l].row !== undefined && !isNaN(layers[l].row)));
    const rows = {}; for (const l of game) (rows[Number(layers[l].row)] ??= []).push(l);
    const edges = [], indeg = {}, outdeg = {}; let dyn = 0, branchErr = 0;
    for (const l of game) { let b = layers[l].branches; if (typeof b === 'function') { dyn++; try { b = b() } catch (e) { branchErr++; b = [] } }
      if (!Array.isArray(b)) { if (b != null) branchErr++; b = []; }
      for (const e of b) { const p = Array.isArray(e) ? e[0] : e; edges.push([p, l]); outdeg[p] = (outdeg[p]||0)+1; indeg[l] = (indeg[l]||0)+1; } }
    const rk = Object.keys(rows).map(Number).sort((a,b)=>a-b); const width = rk.map(k => rows[k].length);
    const tot = { milestones:0, upgrades:0, buyables:0, challenges:0, achievements:0, clickables:0 };
    for (const l of ids) for (const k in tot) tot[k] += numKeys(layers[l] && layers[l][k]);
    const maxWidth = width.length ? Math.max(...width) : 0;
    return { allLayers: ids.length, layers: game.length, rows: rk.length, widthPerRow: width, maxWidth, branchEdges: edges.length,
      forkNodes: game.filter(l => (outdeg[l]||0) >= 2).length, joinNodes: game.filter(l => (indeg[l]||0) >= 2).length,
      linear: maxWidth <= 1, branchesFunctions: dyn, branchesErrors: branchErr, sideLayers: ids.filter(l => layers[l] && layers[l].row === 'side').length,
      ...tot, rowRoster: rk.map(k => rows[k]) };
  })()`, 'census');
} catch (e) { fail('census', e); }
Object.assign(R, { census });

// ---- milestone done() player-field trace -------------------------------------------------------
try {
  const reads = new Set(); let errs = 0, n = 0;
  globalThis.__reads = reads;
  run(`(function(){
    const real = player; const reads = globalThis.__reads; const D = typeof Decimal !== 'undefined' ? Decimal : function(){};
    const wrap = (obj, p) => new Proxy(obj, { get(t, k) { if (typeof k === 'symbol') return t[k]; const v = t[k];
      if (v && typeof v === 'object' && !(v instanceof D) && !Array.isArray(v)) return wrap(v, p + '.' + String(k));
      reads.add(p + '.' + String(k)); return v; } });
    globalThis.__trace = { n: 0, errs: 0 };
    for (const l in layers) { const ms = layers[l] && layers[l].milestones; if (!ms) continue;
      for (const id in ms) { if (isNaN(id) || !ms[id] || typeof ms[id].done !== 'function') continue; __trace.n++;
        player = wrap(real, 'player');
        try { ms[id].done() } catch (e) { __trace.errs++ } finally { player = real } } }
  })()`, 'trace');
  const t = run('__trace', 'x'); n = t.n; errs = t.errs;
  const fields = [...reads].filter((r) => !/\.(unlocked|activeChallenge|milestones|achievements|mastered|current)$/.test(r));
  R.milestone_trace = { milestones_traced: n, done_errors: errs, distinct_fields: fields.length, fields: fields.slice(0, 60) };
} catch (e) { R.milestone_trace = { error: String(e.message).slice(0, 200) }; }

// ---- ticks ---------------------------------------------------------------------------------------
// Leg "idle": 200 ticks with no input (the determinism measure). Leg "policy": 200 ticks with a generic policy
// (reset any row-0 layer that can reset; buy affordable unlocked upgrades) — more code coverage; the parent
// records its failure but does not fail the boot on it.
const hashOf = (t) => crypto.createHash('sha256').update(t).digest('hex').slice(0, 16);
function leg(name, policy) {
  const L = {};
  try {
    // ⚠ NO PRE-STEP (Q6, 2026-09-22). This line used to set `player.offTime = undefined; player.time = Date.now()`
    // before stepping. The page never does that — the engine's load() leaves `offTime = { remain }` — and a game that
    // writes PERSISTED state only while offTime is unset (Lun4-R/The-Collab-Tree's `cheese.cycle`) then hashed
    // differently here than on the page. Dropping it was measured over every boot row: 178/178 deterministic recorded
    // hashes unchanged, Lun4-R's moves to the page's value, and the only other rows that moved were the 7 already
    // recorded nondeterministic. `time` / `offTime` stay out of the hash below either way.
    const t1 = Date.now();
    const r = run(`(function(N, DIFF, POLICY){
      let n = 0, policyErrors = 0; const hasFix = typeof fixNaNs === 'function';
      for (let i = 0; i < N; i++) {
        if (POLICY) try {
          for (const l in layers) { const Ly = layers[l]; if (!Ly || !player[l] || !tmp[l]) continue;
            if (Ly.row === 0 && tmp[l].canReset && typeof doReset === 'function') doReset(l);
            if (Ly.upgrades && tmp[l].upgrades) for (const id in Ly.upgrades) { if (isNaN(id)) continue;
              if (tmp[l].upgrades[id] && tmp[l].upgrades[id].unlocked && typeof canAffordUpgrade === 'function' && canAffordUpgrade(l, id) && !hasUpgrade(l, id)) buyUpgrade(l, id); } }
        } catch (e) { policyErrors++ }
        updateTemp(); gameLoop(DIFF); if (hasFix) fixNaNs(); n++;
      }
      return { n, policyErrors };
    })(${ticks}, ${diff}, ${policy})`, 'ticks-' + name);
    L.ticks = r.n; if (policy) L.policy_errors = r.policyErrors; L.ms = Date.now() - t1;
    const json = run('JSON.stringify(player, (k, v) => (k === "time" || k === "offTime") ? undefined : v)', 'hash');
    L.state_hash = hashOf(json);
    const st = JSON.parse(json); L.state_paths = {};
    for (const k in st) {
      if (st[k] && typeof st[k] === 'object' && !Array.isArray(st[k])) for (const k2 in st[k]) L.state_paths[`${k}.${k2}`] = hashOf(JSON.stringify(st[k][k2]) ?? 'u');
      else L.state_paths[k] = hashOf(JSON.stringify(st[k]) ?? 'u');
    }
    L.unlocked_after = run('Object.keys(layers).filter(l => player[l] && player[l].unlocked).length', 'x');
    L.points_after = run('String(player.points)', 'x');
    L.ok = true;
  } catch (e) { L.ok = false; L.error = errText(e); }
  return L;
}
// A second load() in one process is not idempotent (setupTemp re-wraps cost functions → stack overflow on
// some forks), so each leg runs in its own process: the parent calls this script once per leg.
R.leg = LEG;
const L = leg(LEG, LEG === 'policy');
Object.assign(R, { ticks: L.ticks, ticks_ms: L.ms, state_hash: L.state_hash, state_paths: L.state_paths, policy_errors: L.policy_errors, unlocked_after: L.unlocked_after, points_after: L.points_after });
R.ok = !!L.ok;
if (!R.ok) { R.failed_at = 'ticks'; R.error = L.error; }
R.intervals_captured = intervals.length;
out(R);
proc.exit(0);
