// The harness boot, engine-version tolerant. ONE FORK PER PROCESS (sloppy-mode globals leak):
//   node lib/boot.mjs <gameRoot> [ticks=200] [diff=0.05]
// Prints one JSON line prefixed "BOOTRESULT " on stdout. Scripts run via vm.runInThisContext.
// Untrusted-code hygiene: `process`, `require`, `fetch` and friends are removed from the global before
// any game file runs (the harness keeps private references); the parent also scrubs the child's env.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import crypto from 'node:crypto';

const proc = process;
const out = (o) => proc.stdout.write('BOOTRESULT ' + JSON.stringify(o) + '\n');
const [ROOT, TICKS = '200', DIFF = '0.05'] = proc.argv.slice(2);
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
    if (/^(https?:)?\/\//i.test(src)) { R.files_skipped.push({ file: src, why: 'cdn' }); continue; }
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

// ---- load -----------------------------------------------------------------------------------------
const t0 = Date.now();
let modFilesInjected = false;
const loadFile = (file) => {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) { R.file_errors.push({ file, error: 'missing' }); return; }
  try { run(fs.readFileSync(abs, 'utf8'), file); R.files_loaded.push(file); }
  catch (e) { R.file_errors.push({ file, error: String(e && e.message || e).slice(0, 200) }); }
};
for (const o of order) {
  if (o.inline != null) { try { run(o.inline, o.file); R.files_loaded.push(o.file); } catch (e) { R.file_errors.push({ file: o.file, error: String(e.message).slice(0, 200) }); } continue; }
  if (/(^|\/)loader\.js$/.test(o.file)) {
    // loader.js appends <script> tags for modInfo.modFiles; do it synchronously in its place.
    R.files_skipped.push({ file: o.file, why: 'loader (modFiles injected in place)' });
    let mf = []; try { mf = run('typeof modInfo !== "undefined" && modInfo.modFiles || []', 'modFiles'); } catch {}
    for (const f of mf) loadFile(path.posix.normalize('js/' + f));
    modFilesInjected = true; R.modFiles = mf; continue;
  }
  loadFile(o.file);
}
// If the index had no loader but the mod declares modFiles (a mismatched fork), note it.
try { if (!modFilesInjected && run('typeof modInfo !== "undefined" && Array.isArray(modInfo.modFiles)', 'x')) R.modFiles_without_loader = run('modInfo.modFiles', 'x'); } catch {}
// Render-only files are skipped, so their entry points are stubbed after the load.
for (const f of ['loadVue', 'resizeCanvas', 'drawTree', 'updateMouse', 'constructNodeStyle']) {
  try { if (run(`typeof ${f}`, 'x') !== 'function') { globalThis[f] = function () { hit(f); }; } else if (f === 'loadVue' || f === 'resizeCanvas') { run(`${f} = function(){}`, 'x'); } } catch {}
}
R.load_ms = Date.now() - t0;
const errText = (e) => { const st = String(e && e.stack || ''); const at = (st.match(/^\s+at .*$/m) || [''])[0].trim(); return `${e && e.name || 'Error'}: ${String(e && e.message || e).slice(0, 300)}${at ? ' @ ' + at.slice(0, 160) : ''}`; };
const fail = (stage, e) => { R.ok = false; R.failed_at = stage; R.error = errText(e); out(R); proc.exit(0); };
// A global defined only in a skipped render-only file (e.g. `colors` in canvas.js on some engines) surfaces as a
// ReferenceError inside load(): define it as a recording stub and retry, up to 12 times. Recorded per fork.
R.auto_stubbed = [];
for (let attempt = 0; ; attempt++) {
  try { run(onload && /load\s*\(/.test(onload) ? onload : 'load()', 'onload'); break; }
  catch (e) {
    const m = e && e.name === 'ReferenceError' && /^(\w+) is not defined/.exec(e.message);
    if (m && attempt < 12 && !R.auto_stubbed.includes(m[1])) { R.auto_stubbed.push(m[1]); globalThis[m[1]] = stub(m[1]); shims.localStorage.clear(); continue; }
    fail('load()', e);
  }
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
      for (const e of (b || [])) { const p = Array.isArray(e) ? e[0] : e; edges.push([p, l]); outdeg[p] = (outdeg[p]||0)+1; indeg[l] = (indeg[l]||0)+1; } }
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
try {
  run('if (typeof player.offTime !== "undefined") player.offTime = undefined; player.time = Date.now();', 'pre');
  const t1 = Date.now();
  const r = run(`(function(N, DIFF){
    let n = 0, policyErrors = 0;
    const has = (f) => typeof globalThis[f] === 'function' || (function(){ try { return typeof eval(f) === 'function' } catch(e) { return false } })();
    const hasFix = typeof fixNaNs === 'function';
    for (let i = 0; i < N; i++) {
      try { // generic policy: reset any unlocked row-0 layer that can reset; buy affordable unlocked upgrades
        for (const l in layers) { const L = layers[l]; if (!L || !player[l] || !tmp[l]) continue;
          if (L.row === 0 && player[l].unlocked !== false && tmp[l].canReset && typeof doReset === 'function') doReset(l);
          if (L.upgrades && tmp[l].upgrades) for (const id in L.upgrades) { if (isNaN(id)) continue;
            if (tmp[l].upgrades[id] && tmp[l].upgrades[id].unlocked && typeof canAffordUpgrade === 'function' && canAffordUpgrade(l, id) && !hasUpgrade(l, id)) buyUpgrade(l, id); } }
      } catch (e) { policyErrors++ }
      updateTemp(); gameLoop(DIFF); if (hasFix) fixNaNs(); n++;
    }
    return { n, policyErrors };
  })(${ticks}, ${diff})`, 'ticks');
  R.ticks = r.n; R.policy_errors = r.policyErrors; R.ticks_ms = Date.now() - t1;
  const json = run('JSON.stringify(player, (k, v) => (k === "time" || k === "offTime") ? undefined : v)', 'hash');
  R.state_hash = crypto.createHash('sha256').update(json).digest('hex').slice(0, 16);
  R.unlocked_after = run('Object.keys(layers).filter(l => player[l] && player[l].unlocked).length', 'x');
  R.points_after = run('String(player.points)', 'x');
  R.ok = true;
} catch (e) { R.ok = false; R.failed_at = 'ticks'; R.error = errText(e); }
R.intervals_captured = intervals.length;
out(R);
proc.exit(0);
