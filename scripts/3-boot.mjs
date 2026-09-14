// Stage 3 — boot the shortlist (+ 3 local calibration rows) → data/boot.jsonl. Resumable; time-boxed.
//   SHORTLIST=60 BUDGET_MIN=180 node scripts/3-boot.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { p, readJsonl, appendJsonl, latestBy, safeName } from '../lib/util.mjs';
import { shortlistScore, familyKey } from '../lib/score.mjs';
import { TMT, stockFor, tmtNumOf } from '../lib/tmt-stock.mjs';

const N = Number(process.env.SHORTLIST || 60);
const BUDGET_MS = Number(process.env.BUDGET_MIN || 180) * 60e3;
const TICKS = 200, DIFF = 0.05;
const OUT = p('data/boot.jsonl');
const T0 = Date.now();

const forks = latestBy(readJsonl(p('data/forks.jsonl')));
const stat = [...latestBy(readJsonl(p('data/static.jsonl'))).values()];

// Shortlist: best representative per family, top N families by the stage-2 score.
const fam = new Map();
for (const s of stat) {
  const sc = shortlistScore(s); if (sc <= 0) continue;
  const k = familyKey(s); const f = forks.get(s.full_name) || {};
  const cand = { s, sc, pushed: f.pushed_at || '' };
  const cur = fam.get(k);
  if (!cur) fam.set(k, { best: cand, members: [s.full_name] });
  else { cur.members.push(s.full_name); if (cand.sc > cur.best.sc || (cand.sc === cur.best.sc && cand.pushed > cur.best.pushed)) cur.best = cand; }
}
const shortlist = [...fam.values()].sort((a, b) => b.best.sc - a.best.sc).slice(0, N)
  .map((x, i) => ({ full_name: x.best.s.full_name, shortlist_rank: i + 1, stage2_score: x.best.sc, family_size: x.members.length, family: x.members }));
fs.writeFileSync(p('data/shortlist.json'), JSON.stringify(shortlist, null, 1));

const CAL = [
  { full_name: 'calibration:Prestige-Tree', local: '/home/robert/CC/Prestige-Tree', calibration: true, upstream: 'Jacorb90/Prestige-Tree' },
  { full_name: 'calibration:The-Modding-Tree', local: '/home/robert/CC/The-Modding-Tree', calibration: true, upstream: 'Acamaeda/The-Modding-Tree' },
  { full_name: 'calibration:upgrade-land-tmt', local: '/home/robert/CC/upgrade-land-tmt', calibration: true, upstream: null },
];
const done = new Set(readJsonl(OUT).map((r) => r.full_name));
const queue = [...CAL, ...shortlist].filter((x) => !done.has(x.full_name));
console.log('families:', fam.size, 'shortlist:', shortlist.length, 'to boot:', queue.length);

// ---- engine deviation ----------------------------------------------------------------------------
const LOGIC = /^js\/(game|utils)\.js$|^js\/utils\/|^js\/technical\/(temp|layerSupport|displays|loader)\.js$/;
const ENGINE = (f) => /^index\.html$|^style\.css$|^css\/[^/]+\.css$|^js\/[^/]+\.js$|^js\/(technical|utils)\/[^/]+\.js$/.test(f)
  && !/^js\/(layers|mod|tree)\.js$/.test(f);
function stockDir(commit) {
  const d = p('cache/stock', commit);
  if (!fs.existsSync(d)) { fs.mkdirSync(d, { recursive: true }); execFileSync('sh', ['-c', `git -C "${TMT}" archive ${commit} | tar -x -C "${d}"`]); }
  return d;
}
const lines = (f) => { const t = fs.readFileSync(f, 'utf8'); return t ? t.split('\n').length - (t.endsWith('\n') ? 1 : 0) : 0; };
function numstat(a, b, extra = []) {
  const r = spawnSync('git', ['diff', '--no-index', '--numstat', ...extra, a, b], { encoding: 'utf8' });
  const m = /^(\d+|-)\t(\d+|-)/.exec(r.stdout || '');
  return m ? [m[1] === '-' ? 0 : +m[1], m[2] === '-' ? 0 : +m[2]] : [0, 0];
}
function deviation(root, tmtNum) {
  const st = stockFor(tmtNum); if (!st) return null;
  const sd = stockDir(st.commit);
  const walk = (d, pre = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name), pre + e.name + '/') : [pre + e.name]);
  const stockFiles = walk(sd).filter(ENGINE);
  const per = {}; const tot = { added: 0, removed: 0, logic_added: 0, logic_removed: 0, ws_added: 0, ws_removed: 0, missing_files: [] };
  for (const f of stockFiles) {
    const a = path.join(sd, f), b = path.join(root, f);
    let d, w;
    if (!fs.existsSync(b)) { d = [0, lines(a)]; w = d; tot.missing_files.push(f); }
    else { d = numstat(a, b); w = numstat(a, b, ['--ignore-all-space', '--ignore-blank-lines']); }
    if (d[0] || d[1]) per[f] = d;
    tot.added += d[0]; tot.removed += d[1]; tot.ws_added += w[0]; tot.ws_removed += w[1];
    if (LOGIC.test(f)) { tot.logic_added += d[0]; tot.logic_removed += d[1]; }
  }
  const forkEngineOnly = walk(root).filter((f) => /^js\/(technical|utils)\//.test(f) && !stockFiles.includes(f));
  return { stock_version: st.version, stock_commit: st.commit, exact: st.exact, note: st.note || null, ...tot, per_file: per, extra_engine_dir_files: forkEngineOnly.slice(0, 30) };
}

// ---- boot one fork: two independent child processes ----------------------------------------------
function bootOnce(root) {
  const r = spawnSync(process.execPath, [p('lib/boot.mjs'), root, String(TICKS), String(DIFF)], {
    cwd: root, encoding: 'utf8', timeout: 240e3, maxBuffer: 64 << 20, env: { PATH: '/usr/bin:/bin', HOME: '/tmp' },
  });
  const line = (r.stdout || '').split('\n').find((l) => l.startsWith('BOOTRESULT '));
  if (!line) return { ok: false, failed_at: r.error?.code === 'ETIMEDOUT' || r.signal ? 'timeout' : 'crash', error: String(r.error || r.signal || (r.stderr || '').slice(-400)) };
  return JSON.parse(line.slice(11));
}

let booted = 0;
for (const item of queue) {
  if (Date.now() - T0 > BUDGET_MS) { console.log('time box reached'); break; }
  const t = Date.now();
  const row = { full_name: item.full_name, calibration: !!item.calibration, shortlist_rank: item.shortlist_rank ?? null, stage2_score: item.stage2_score ?? null, family_size: item.family_size ?? null, family: item.family ?? null, started_at: new Date().toISOString() };
  let root = item.local;
  try {
    if (!root) {
      root = p('clones', safeName(item.full_name));
      if (!fs.existsSync(path.join(root, '.git'))) {
        const c = spawnSync('git', ['clone', '-q', '--depth', '1', `https://github.com/${item.full_name}.git`, root], { encoding: 'utf8', timeout: 600e3, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
        if (c.status !== 0) throw new Error('clone failed: ' + (c.stderr || c.error).toString().slice(0, 200));
      }
    }
    row.head = execFileSync('git', ['-C', root, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('no index.html at repo root');
    const game = fs.existsSync(path.join(root, 'js/game.js')) ? fs.readFileSync(path.join(root, 'js/game.js'), 'utf8') : null;
    row.tmtNum = tmtNumOf(game);
    row.engine_deviation = row.tmtNum ? deviation(root, row.tmtNum) : null;
    const a = bootOnce(root), b = bootOnce(root);
    row.boot = a;
    row.ok = !!a.ok;
    row.deterministic = !!(a.ok && b.ok && a.state_hash === b.state_hash && a.ticks === b.ticks);
    row.run2 = { ok: b.ok, ticks: b.ticks, state_hash: b.state_hash, failed_at: b.failed_at, error: b.error };
  } catch (e) { row.ok = false; row.error = String(e.message || e).slice(0, 300); }
  row.wall_ms = Date.now() - t;
  appendJsonl(OUT, row); booted++;
  const c = row.boot?.census;
  console.log(`[${booted}/${queue.length}] ${row.full_name} ok=${row.ok} det=${row.deterministic} ${c ? `L${c.layers} E${c.branchEdges} F${c.forkNodes} J${c.joinNodes}` : row.boot?.failed_at || row.error || ''} dev=${row.engine_deviation ? row.engine_deviation.added + '/' + row.engine_deviation.removed : '-'} ${row.wall_ms}ms`);
}
const all = readJsonl(OUT);
console.log(JSON.stringify({ rows: all.length, ok: all.filter((r) => r.ok).length, deterministic: all.filter((r) => r.deterministic).length, elapsed_min: +((Date.now() - T0) / 60e3).toFixed(1) }));
