// Stage 5 — declared license per repo → data/license.jsonl.
//
// GitHub reports a repo's license on the repository object itself, and stage 1 already cached the full objects
// (cache/api/**/forks-p*.json), so every fork's license is read out of that cache: no new request. A fork missing
// from the cache falls back to GET /repos/{o}/{r}, cached the same way. `license.spdx_id` is taken verbatim —
// MIT, NOASSERTION for a file licensee could not match, null when no LICENSE file was detected at all.
//
// The TMT lineage's LICENSE is a standard MIT text with a non-standard copyright line ("Modding Tree Copyright
// (c) 2020 Acamaeda") beside a second file, Prestige-tree-license, so licensee classifies it "Other"
// (NOASSERTION) rather than MIT — which is why almost every row reads NOASSERTION. That is GitHub's detector
// talking, not a legal finding.
//
// Calibration rows are local clones with no GitHub repo of their own, so their licenses are read off the files
// in the clone (both MIT texts). upgrade-land-tmt carries TMT's MIT for the engine while Upgrade Land's own data
// is unlicensed, which the row says outright.
import fs from 'node:fs';
import path from 'node:path';
import { p, readJsonl, appendJsonl, latestBy, cachedGet, safeName } from '../lib/util.mjs';
import { CALIBRATION } from '../lib/calibration.mjs';

const RECHECK = process.argv.includes('--recheck');
const OUT = p('data/license.jsonl');
const have = RECHECK ? new Set() : new Set(readJsonl(OUT).map((r) => r.full_name));

/** Every repository object stage 1 cached, by full_name. */
function cachedRepoObjects() {
  const m = new Map();
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (/forks-p\d+\.json$/.test(e.name)) { for (const r of JSON.parse(fs.readFileSync(f, 'utf8'))) if (r && r.full_name) m.set(r.full_name, r); }
  } };
  if (fs.existsSync(p('cache/api'))) walk(p('cache/api'));
  return m;
}

const MIT = (txt) => /MIT License/i.test(txt) && /Permission is hereby granted, free of charge/i.test(txt);
/** Calibration clones: read the license files themselves. */
function localLicense(dir) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^(LICEN[CS]E|.*licen[cs]e)/i.test(f) && fs.statSync(path.join(dir, f)).isFile()) : [];
  const mit = files.filter((f) => MIT(fs.readFileSync(path.join(dir, f), 'utf8')));
  return { files, spdx: mit.length ? 'MIT' : files.length ? 'NOASSERTION' : null };
}
// Upgrade Land's own data (the tree it ships) carries no license of its own; only the TMT engine under it is MIT.
const CAL_NOTE = { 'calibration:upgrade-land-tmt': { suffix: ' (engine) / none (data)', note: "TMT's MIT covers the engine; Upgrade Land's own data ships with no license" } };

const repoObjs = cachedRepoObjects();
const forks = latestBy(readJsonl(p('data/forks.jsonl')));
let fromCache = 0, fetched = 0, rows = 0;
for (const [full_name] of forks) {
  if (have.has(full_name)) continue;
  let obj = repoObjs.get(full_name), src = 'GitHub repository metadata (stage-1 listing cache)';
  if (!obj) {
    const r = await cachedGet(`https://api.github.com/repos/${full_name}`, p('cache/api', safeName(full_name), 'repo.json'));
    if (r.status !== 200) { console.error('repo', full_name, r.status); continue; }
    obj = JSON.parse(r.body); src = 'GitHub repository metadata (repos endpoint)'; fetched++;
  } else fromCache++;
  appendJsonl(OUT, { full_name, license: obj.license ? obj.license.spdx_id : null, license_name: obj.license ? obj.license.name : null, license_source: src, license_note: null, checked_at: new Date().toISOString() });
  rows++;
}
for (const cal of CALIBRATION) {
  if (have.has(cal.full_name)) continue;
  const l = localLicense(cal.local); const n = CAL_NOTE[cal.full_name];
  appendJsonl(OUT, { full_name: cal.full_name, license: l.spdx ? l.spdx + (n ? n.suffix : '') : null, license_name: l.spdx === 'MIT' ? 'MIT License' : null,
    license_source: `the local clone's own files (${l.files.join(', ') || 'none found'})`, license_note: n ? n.note : null, checked_at: new Date().toISOString() });
  rows++;
}
const all = [...latestBy(readJsonl(OUT)).values()];
const dist = {}; for (const r of all) dist[String(r.license)] = (dist[String(r.license)] || 0) + 1;
console.log(JSON.stringify({ written: rows, from_stage1_cache: fromCache, fetched, rows_total: all.length, distribution: dist }));
