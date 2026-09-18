// Stage 6 — the games tmt-loader hosts → data/loader.jsonl.
//
// The loader repo (PeerInfinity/tmt-loader) keeps one manifest per game it hosts. This stage reads them at a PINNED
// loader commit — `git show <commit>:manifests/…`, never the working tree — so the column is reproducible, and joins
// each manifest's `upstream.repo` onto the census case-insensitively: a fork row on its `full_name`, a calibration row
// on its upstream repo (PTR is `calibration:Prestige-Tree` here and `Jacorb90/Prestige-Tree` in the loader), the way
// stage 4 derives PTR's live page. The file is rewritten whole (not appended): it is a pure function of the pinned
// commit and data/forks.jsonl, so two runs are byte-identical. Whether a joined repo is a RANKED row is rank's call.
//
//   LOADER_REPO    the local loader checkout (default ~/CC/tmt-loader) — read-only, only git objects are read
//   LOADER_COMMIT  the loader commit to read (default below; a full sha)
//   LOADER_BASE    the loader's public URL; a row's link is LOADER_BASE + '?mod=' + id (no automation parameter)
//
// A second link, `loader_mobile_url` (= the same URL + '&mobile=1', the loader's mobile layout — docs/mobile.md
// there), is emitted ONLY when the PINNED commit actually carries that mode. The pin can be older than the
// feature, and `?mobile=1` on a loader that does not know it is silently ignored: the link would open the desktop
// layout while the column claimed otherwise. So the support is READ at the pin, the same way everything else here
// is, rather than assumed from the parameter's existence.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { p, readJsonl, latestBy } from '../lib/util.mjs';
import { CALIBRATION, CC_DIR } from '../lib/calibration.mjs';

export const LOADER_COMMIT = process.env.LOADER_COMMIT || 'e675d7214ae369a17e6bc0762e901f5831f2f2cd';
export const LOADER_BASE = process.env.LOADER_BASE || 'https://peerinfinity.github.io/tmt-loader/';
const LOADER_REPO = process.env.LOADER_REPO || path.join(CC_DIR, 'tmt-loader');
const OUT = p('data/loader.jsonl');

const show = (f) => execFileSync('git', ['-C', LOADER_REPO, 'show', `${LOADER_COMMIT}:${f}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const commit = execFileSync('git', ['-C', LOADER_REPO, 'rev-parse', '--verify', `${LOADER_COMMIT}^{commit}`], { encoding: 'utf8' }).trim();

// Census names, lower-cased → the census full_name that row carries.
const census = new Map();
for (const name of latestBy(readJsonl(p('data/forks.jsonl'))).keys()) census.set(name.toLowerCase(), name);
for (const cal of CALIBRATION) if (cal.upstream) census.set(cal.upstream.toLowerCase(), cal.full_name);

// Read at the pin: the stylesheet must exist AND page.js must actually branch on the parameter.
const mobileSupported = (() => {
  // `git show` of a path the pin does not have exits non-zero AND prints to stderr; quiet it, this is a probe
  const quiet = (f) => { try { return execFileSync('git', ['-C', LOADER_REPO, 'show', `${LOADER_COMMIT}:${f}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 }); } catch { return null; } };
  return quiet('loader/mobile.css') !== null && /params\.get\(['"]mobile['"]\)/.test(quiet('loader/page.js') || '');
})();

const index = JSON.parse(show('manifests/index.json'));
const rows = [], unjoined = [];
for (const { id } of index) {
  const m = JSON.parse(show(`manifests/${id}.json`));
  if (m.id !== id) throw new Error(`manifests/${id}.json carries id ${m.id}`);
  const repo = m.upstream?.repo;
  const full_name = repo ? census.get(repo.toLowerCase()) : null;
  if (!full_name) { unjoined.push({ id, repo: repo || null }); continue; }
  const loader_url = LOADER_BASE + '?mod=' + encodeURIComponent(id);
  rows.push({ full_name, loader_id: id, loader_url, loader_mobile_url: mobileSupported ? loader_url + '&mobile=1' : null, loader_commit: commit,
    upstream_commit: m.upstream.commit || null, license_verdict: m.license?.verdict ?? null });
}
const dup = rows.map((r) => r.full_name).filter((n, i, a) => a.indexOf(n) !== i);
if (dup.length) throw new Error('two manifests join one census row: ' + [...new Set(dup)].join(', '));
rows.sort((a, b) => (a.full_name < b.full_name ? -1 : a.full_name > b.full_name ? 1 : 0));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
console.log(JSON.stringify({ loader_commit: commit, loader_base: LOADER_BASE, mobile_supported: mobileSupported, manifests: index.length, joined: rows.length, unjoined }));
