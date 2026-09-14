// Stage 1 — list every fork of both roots (+ one level of forks-of-forks) → data/forks.jsonl.
// Resumable: API pages are cached under cache/api/; rows already in forks.jsonl are not re-appended.
import { p, readJsonl, appendJsonl, cachedGet } from '../lib/util.mjs';

const ROOTS = ['Acamaeda/The-Modding-Tree', 'Jacorb90/Prestige-Tree'];
const OUT = p('data/forks.jsonl');
const have = new Set(readJsonl(OUT).map((r) => r.full_name));

async function forksOf(full) {
  const out = [];
  for (let page = 1; ; page++) {
    const url = `https://api.github.com/repos/${full}/forks?per_page=100&sort=oldest&page=${page}`;
    const r = await cachedGet(url, p('cache/api', full.replace('/', '__'), `forks-p${page}.json`));
    if (r.status !== 200) { console.error('forks page', full, page, r.status, r.error || ''); break; }
    const arr = JSON.parse(r.body);
    out.push(...arr);
    if (arr.length < 100) break;
  }
  return out;
}

function row(f, parent, root, depth) {
  return {
    full_name: f.full_name, parent, root, depth,
    created_at: f.created_at, pushed_at: f.pushed_at, size: f.size,
    stars: f.stargazers_count, forks_count: f.forks_count,
    default_branch: f.default_branch, archived: f.archived,
    homepage: f.homepage || null, has_pages: f.has_pages ?? null,
    // A fork inherits the parent's last push, so an untouched fork's pushed_at predates its creation.
    untouched: !(new Date(f.pushed_at) > new Date(f.created_at)),
  };
}

let added = 0, seen = 0;
for (const root of ROOTS) {
  const direct = await forksOf(root);
  console.log(root, 'direct forks listed:', direct.length);
  for (const f of direct) {
    seen++;
    if (!have.has(f.full_name)) { appendJsonl(OUT, row(f, root, root, 1)); have.add(f.full_name); added++; }
    if (f.forks_count > 0) {
      const sub = await forksOf(f.full_name);
      for (const g of sub) {
        seen++;
        if (!have.has(g.full_name)) { appendJsonl(OUT, row(g, f.full_name, root, 2)); have.add(g.full_name); added++; }
      }
    }
  }
}
const all = readJsonl(OUT);
console.log(JSON.stringify({ seen, added, rows: all.length, untouched: all.filter((r) => r.untouched).length, touched: all.filter((r) => !r.untouched).length }));
