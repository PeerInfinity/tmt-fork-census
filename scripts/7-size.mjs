// Stage 7 — how big each game actually is → data/size.jsonl.
//
// TWO different numbers, because they answer different questions and are wildly different:
//
//   `repo_kb`      what GitHub reports for the repository (data/forks.jsonl `size`, KB). That is the repo AS STORED
//                  on GitHub — packed, and INCLUDING ALL HISTORY. It is what cloning the fork costs.
//   `checkout_*`   the bytes and file count of the working tree at the commit the census booted, `.git` excluded.
//                  That is the GAME: what a copy of it costs to host, and what `git subtree add` puts in a loader.
//
// Measured over the ranked rows, they diverge by a median of 3x and a maximum of 34x, in BOTH directions: a repo
// with a heavy history reads far larger than its game (Askinga/The-MJ-Tree, 23.5 MB reported vs 0.7 MB of files),
// and a repo full of incompressible PNGs reads smaller (hanlaosan1/The-Wall-Tree, 36.5 MB reported vs 70.8 MB of
// files). Neither is a usable proxy for the other, so the table carries both.
//
// The checkout is measured from `clones/<owner>__<repo>`, which stage 3 made and which is gitignored — so this
// stage, like stage 3, only produces rows for repos cloned on this machine, and is resumable: an existing row for
// the same `head` is kept, so re-running after a new boot batch measures only what is new. `--recheck` re-measures
// every row.
//
//   node scripts/7-size.mjs [--recheck]
import fs from 'node:fs';
import path from 'node:path';
import { p, readJsonl, latestBy, appendJsonl, safeName } from '../lib/util.mjs';
import { CALIBRATION } from '../lib/calibration.mjs';

const recheck = process.argv.includes('--recheck');
const OUT = p('data/size.jsonl');
const forks = latestBy(readJsonl(p('data/forks.jsonl')));
const boots = latestBy(readJsonl(p('data/boot.jsonl')));
const prev = fs.existsSync(OUT) ? latestBy(readJsonl(OUT)) : new Map();

/** Bytes and file count under `dir`, excluding `.git` and never following a symlink. */
function measure(dir) {
  let bytes = 0, files = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const fp = path.join(d, e.name);
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) walk(fp);
      else if (e.isFile()) { bytes += fs.statSync(fp).size; files++; }
    }
  };
  walk(dir);
  return { bytes, files };
}

const cloneOf = (full) => {
  const cal = CALIBRATION.find((c) => c.full_name === full);
  return cal ? cal.local : p('clones', safeName(full));
};

let measured = 0, kept = 0, noClone = 0;
for (const [full, b] of boots) {
  const old = prev.get(full);
  if (!recheck && old && old.head === b.head) { kept++; continue; }
  const dir = cloneOf(full);
  if (!fs.existsSync(dir)) { noClone++; continue; }
  const { bytes, files } = measure(dir);
  const fk = forks.get(full);
  appendJsonl(OUT, { full_name: full, head: b.head ?? null, checkout_bytes: bytes, checkout_files: files,
    repo_kb: fk ? fk.size ?? null : null, measured_at: new Date().toISOString() });
  measured++;
}
console.log(JSON.stringify({ measured, kept, no_clone: noClone, rows: measured + kept }));
