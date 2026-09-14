// Stage 4 — live game pages → data/live.jsonl.
//
// The fork rows already carry `homepage` and `has_pages` (stage 1 reads them off the /forks listing), so no
// repo metadata is fetched for forks. The live URL is derived, never guessed at read time:
//   homepage, when it is an http(s) URL → source "homepage"
//   else https://<owner>.github.io/<repo>/ when has_pages → source "pages"
//   else no row at all.
// Every derived URL is then verified with one GET (redirects followed, 10 s timeout, 4 at a time) and the HTTP
// code — or "error" — is recorded. 2xx/3xx counts as live; a dead URL keeps its row so the table can grey it.
// Resumable and cached: the per-URL result is cached under cache/live/ (gitignored, no body kept, no GitHub token
// sent to third-party hosts) and a repo already in data/live.jsonl is skipped. --recheck ignores both.
import fs from 'node:fs';
import { p, readJsonl, appendJsonl, latestBy, pool, safeName } from '../lib/util.mjs';
import { CALIBRATION } from '../lib/calibration.mjs';
import { cachedGet } from '../lib/util.mjs';

const RECHECK = process.argv.includes('--recheck');
const OUT = p('data/live.jsonl');
const have = RECHECK ? new Set() : new Set(readJsonl(OUT).map((r) => r.full_name));

/** The one derivation rule, shared by forks and calibration upstreams. */
export function deriveLive(full_name, meta) {
  const hp = typeof meta?.homepage === 'string' ? meta.homepage.trim() : '';
  if (/^https?:\/\//i.test(hp)) return { live_url: hp, live_source: 'homepage' };
  if (meta?.has_pages) { const [owner, repo] = full_name.split('/'); return { live_url: `https://${owner.toLowerCase()}.github.io/${repo}/`, live_source: 'pages' }; }
  return null;
}

async function check(url) {
  const cache = p('cache/live', safeName(url.replace(/^https?:\/\//, '').replace(/[^\w.-]+/g, '_')) + '.json');
  if (!RECHECK && fs.existsSync(cache)) return { ...JSON.parse(fs.readFileSync(cache, 'utf8')), from_cache: true };
  let out;
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'tmt-fork-census' } });
    out = { live_status: res.status, final_url: res.url || url };
  } catch (e) { out = { live_status: 'error', final_url: null, live_error: String(e.name === 'TimeoutError' ? 'timeout' : e.message || e).slice(0, 120) }; }
  out.checked_at = new Date().toISOString();
  fs.mkdirSync(p('cache/live'), { recursive: true });
  fs.writeFileSync(cache, JSON.stringify(out));
  return { ...out, from_cache: false };
}

const forks = latestBy(readJsonl(p('data/forks.jsonl')));
const todo = [];
for (const [full_name, f] of forks) {
  const d = deriveLive(full_name, f);
  if (d && !have.has(full_name)) todo.push({ full_name, ...d });
}
// Calibration rows are local clones. Only PTR has a public live page; its URL comes from the upstream repo's own
// GitHub metadata (fetched once, cached) rather than being assumed here. Stock TMT's Pages site is the engine's
// demo tree, not a game, and upgrade-land-tmt is local-only — both stay without a live URL, by the same call the
// census makes elsewhere about what counts as a game.
const CAL_LIVE = { 'calibration:Prestige-Tree': 'Jacorb90/Prestige-Tree' };
for (const cal of CALIBRATION) {
  const up = CAL_LIVE[cal.full_name];
  if (!up || have.has(cal.full_name)) continue;
  const r = await cachedGet(`https://api.github.com/repos/${up}`, p('cache/api', safeName(up), 'repo.json'));
  if (r.status !== 200) { console.error('calibration upstream', up, r.status); continue; }
  const d = deriveLive(up, JSON.parse(r.body));
  if (d) todo.push({ full_name: cal.full_name, upstream: up, ...d });
}

console.log('to check:', todo.length, RECHECK ? '(rechecking)' : `(${have.size} already recorded)`);
let n = 0, live = 0, dead = 0;
await pool(todo, 4, async (t) => {
  const res = await check(t.live_url);
  const ok = typeof res.live_status === 'number' && res.live_status >= 200 && res.live_status < 400;
  ok ? live++ : dead++;
  appendJsonl(OUT, { full_name: t.full_name, upstream: t.upstream || null, live_url: t.live_url, live_source: t.live_source, live_status: res.live_status, live_ok: ok, final_url: res.final_url || null, live_error: res.live_error || null, checked_at: res.checked_at });
  if (++n % 25 === 0) console.log(`  ${n}/${todo.length} (live ${live}, dead ${dead})`);
});
const all = [...latestBy(readJsonl(OUT)).values()];
console.log(JSON.stringify({ checked: todo.length, live, dead, rows_total: all.length, live_total: all.filter((r) => r.live_ok).length, dead_total: all.filter((r) => !r.live_ok).length }));
