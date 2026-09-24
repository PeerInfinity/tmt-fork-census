// Rank — results/table.json, results/SUMMARY.md, docs/index.html. Every number printed comes from a row.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { p, readJsonl, latestBy } from '../lib/util.mjs';
import { shortlistScore, familyKey, composite } from '../lib/score.mjs';
import { modInfoOf } from '../lib/scan.mjs';
import { CALIBRATION, localStatic } from '../lib/calibration.mjs';

const REPO_URL = 'https://github.com/PeerInfinity/tmt-fork-census';
const git = (...a) => { try { return execFileSync('git', ['-C', p('.'), ...a], { encoding: 'utf8' }).trim(); } catch { return null; } };
const DATA_COMMIT = git('rev-parse', '--short', 'HEAD');
const DATA_DIRTY = !!git('status', '--porcelain', '--', 'data');
const GEN_DATE = new Date().toISOString().slice(0, 10);
const COUNT_KEYS = ['milestones', 'upgrades', 'buyables', 'challenges', 'achievements'];

const forksRows = readJsonl(p('data/forks.jsonl'));
const forks = latestBy(forksRows);
const statRows = readJsonl(p('data/static.jsonl'));
const stat = [...latestBy(statRows).values()];
const bootAll = readJsonl(p('data/boot.jsonl'));
const shortlist = fs.existsSync(p('data/shortlist.json')) ? JSON.parse(fs.readFileSync(p('data/shortlist.json'), 'utf8')) : [];
// Stage 4 — the verified live game page per repo (scripts/4-live.mjs). Missing = no page was derivable.
const liveRows = readJsonl(p('data/live.jsonl'));
const live = latestBy(liveRows);
// Stage 5 — the repo's declared license as GitHub reports it (scripts/5-license.mjs); calibration rows read their clone's files.
const licRows = readJsonl(p('data/license.jsonl'));
const lic = latestBy(licRows);
const licOf = (name) => { const l = lic.get(name); return { license: l ? l.license : null, license_name: l ? l.license_name : null, license_source: l ? l.license_source : null, license_note: l ? l.license_note : null }; };
// Stage 6 — the game hosted by tmt-loader at a pinned loader commit (scripts/6-loader.mjs). Missing = not hosted.
const loaderRows = readJsonl(p('data/loader.jsonl'));
const loader = latestBy(loaderRows);
const loaderOf = (name) => { const l = loader.get(name); return { loader_url: l ? l.loader_url : null, loader_mobile_url: l ? l.loader_mobile_url || null : null, loader_id: l ? l.loader_id : null, loader_commit: l ? l.loader_commit : null, declined_short: l ? l.declined_short || null : null, declined_reason: l ? l.declined_reason || null : null }; };
// Stage 7 — how big the game is (scripts/7-size.mjs). Two different numbers; see that file.
const sizeRows = readJsonl(p('data/size.jsonl'));
const sizes = latestBy(sizeRows);
const sizeOf = (name) => { const z = sizes.get(name); return { checkout_bytes: z ? z.checkout_bytes : null, checkout_files: z ? z.checkout_files : null, repo_kb: z ? z.repo_kb : null }; };
/**
 * Why a ranked game is not in the loader. The loader's own reason wins: it made the attempt and saw the evidence,
 * and it publishes the list this joins (stage 6). Where it has none, the census says only what IT measured — a
 * boot that failed here, or a repo it never cloned. It does NOT re-derive the loader's size policy: a game
 * declined for size is declined in that list, with the measured number in its reason, so no threshold is
 * duplicated here to go stale.
 */
const notHosted = (r) => {
  if (r.loader_url) return '';
  if (r.declined_short || r.declined_reason) return r.declined_short || r.declined_reason;
  if (r.calibration) return 'calibration clone';
  if (r.boot_ok === false) return `no boot: ${r.boot_failed_at || 'unknown'}`;
  if (r.checkout_bytes == null) return 'not cloned';
  return '';
};
/** The full account behind the short cell, for the tooltip: the loader's own words where it has them. */
const notHostedWhy = (r) => {
  if (r.loader_url) return '';
  if (r.declined_reason) return r.declined_reason;
  if (r.calibration) return 'a local calibration clone, not a fork of its own';
  if (r.boot_ok === false) return `did not boot in this census, at ${r.boot_failed_at || 'an unknown stage'}`;
  if (r.checkout_bytes == null) return 'not cloned on the machine that ran the census, so never measured or attempted';
  return '';
};
const LOADER_COMMITS = [...new Set(loaderRows.map((r) => r.loader_commit))];
const LOADER_BASES = [...new Set(loaderRows.filter((r) => r.loader_url).map((r) => r.loader_url.slice(0, r.loader_url.lastIndexOf('?mod='))))];  // a DECLINED row has no url
if (LOADER_COMMITS.length > 1 || LOADER_BASES.length > 1) throw new Error('data/loader.jsonl mixes loader commits or bases: ' + [...LOADER_COMMITS, ...LOADER_BASES].join(', '));
const LOADER_COMMIT = LOADER_COMMITS[0] || null, LOADER_BASE = LOADER_BASES[0] || null;
const liveOf = (name) => { const l = live.get(name); return l ? { live_url: l.live_url, live_status: l.live_status, live_ok: !!l.live_ok, live_source: l.live_source, live_final: l.final_url && l.final_url !== l.live_url ? l.final_url : null } : { live_url: null, live_status: null, live_ok: false, live_source: null, live_final: null }; };
// boot.jsonl is append-only and may hold rows for earlier shortlists; count only the current shortlist + calibration.
const current = new Set([...shortlist.map((x) => x.full_name), ...bootAll.filter((r) => r.calibration).map((r) => r.full_name)]);
const boot = latestBy(bootAll.filter((r) => current.has(r.full_name)));
const bootRows = [...boot.values()];

function fromBoot(r, b) {
  if (!b) return r;
  const c = b.boot?.census;
  r.boot_ok = !!b.ok; r.boot_failed_at = b.ok ? null : (b.boot?.failed_at || 'setup'); r.boot_error = b.ok ? null : (b.boot?.error || b.error || null);
  r.deterministic = b.ok ? b.deterministic : null;
  r.nondeterministic_paths = b.nondeterministic_paths || null;
  r.policy_ok = b.policy ? b.policy.ok : null; r.policy_moved = b.policy ? b.policy.moved_from_idle : null;
  r.policy_error = b.policy && !b.policy.ok ? b.policy.error : null;
  r.trace_fields = b.boot?.milestone_trace?.distinct_fields ?? null;
  r.auto_stubbed = b.boot?.auto_stubbed || null;
  r.head = b.head || null;
  // A boot that saw zero layers where the static census saw some (e.g. layers registered per story act read from
  // the save; a fresh save has none) keeps the static numbers and says so.
  r.boot_census_empty = !!(c && c.layers === 0 && (r.layers || 0) > 0);
  if (c && !r.boot_census_empty) Object.assign(r, { source: 'boot', layers: c.layers, rows: c.rows, widthPerRow: c.widthPerRow, maxWidth: c.maxWidth, branchEdges: c.branchEdges, forkNodes: c.forkNodes, joinNodes: c.joinNodes, linear: c.linear,
    milestones: c.milestones, upgrades: c.upgrades, buyables: c.buyables, challenges: c.challenges, achievements: c.achievements, clickables: c.clickables,
    content: c.milestones + c.upgrades + c.buyables + c.challenges + c.achievements });
  const d = b.engine_deviation;
  if (d) Object.assign(r, { dev_added: d.added, dev_removed: d.removed, dev_logic_added: d.logic_added, dev_logic_removed: d.logic_removed, dev_ws_added: d.ws_added, dev_ws_removed: d.ws_removed, dev_stock: `${d.stock_version}@${d.stock_commit}${d.exact ? '' : ' (nearest lower)'}`, dev_per_file: d.per_file });
  return r;
}

// One row per family (the stage-3 representative when booted, else the best stage-2 member).
const fams = new Map();
for (const s of stat) {
  if (s.trivial || s.error) continue;
  const k = familyKey(s); const cur = fams.get(k);
  const sc = shortlistScore(s);
  if (!cur) fams.set(k, { best: s, sc, members: [s.full_name] });
  else { cur.members.push(s.full_name); }
}
// Representative: the stage-3 shortlist's choice where there is one (same rule), else best score → stars → push.
const hashCount = new Map(); for (const s of stat) if (s.content_hash) hashCount.set(s.content_hash, (hashCount.get(s.content_hash) || 0) + 1);
const better = (a, b) => { const sa = shortlistScore(a), sb = shortlistScore(b); if (sa !== sb) return sa > sb;
  const fa = forks.get(a.full_name) || {}, fb = forks.get(b.full_name) || {}; if ((fa.stars || 0) !== (fb.stars || 0)) return (fa.stars || 0) > (fb.stars || 0);
  const ca = hashCount.get(a.content_hash) || 0, cb = hashCount.get(b.content_hash) || 0; if (ca !== cb) return ca > cb;
  return (fa.pushed_at || '') > (fb.pushed_at || ''); };
const statBy = new Map(stat.map((x) => [x.full_name, x]));
for (const f of fams.values()) { for (const m of f.members) if (better(statBy.get(m), f.best)) f.best = statBy.get(m); f.sc = shortlistScore(f.best); }
for (const x of shortlist) { const s = statBy.get(x.full_name); const f = s && fams.get(familyKey(s)); if (f) { f.best = s; f.sc = shortlistScore(s); } }

const rows = [];
for (const [key, f] of fams) {
  const s = f.best, fk = forks.get(s.full_name) || {};
  const b = s.branchiness;
  const r = { full_name: s.full_name, calibration: false, url: `https://github.com/${s.full_name}`, mod_name: s.mod_name, author: s.author, version_num: s.version_num, version_name: s.version_name,
    engine: s.engine, tmtNum: s.tmtNum, endgame: s.endgame, pushed_at: fk.pushed_at, created_at: fk.created_at, archived: fk.archived, stars: fk.stars, root: fk.root, parent: fk.parent,
    family_size: f.members.length, family_members: f.members, stage2_score: f.sc, shortlist_rank: shortlist.find((x) => x.full_name === s.full_name)?.shortlist_rank ?? null,
    source: 'static', layers: b.layers, rows: b.rows, widthPerRow: b.widthPerRow, maxWidth: b.maxWidth, branchEdges: b.branchEdges, forkNodes: b.forkNodes, joinNodes: b.joinNodes, linear: b.linear,
    milestones: s.milestones, upgrades: s.upgrades, buyables: s.buyables, challenges: s.challenges, achievements: s.achievements, clickables: s.clickables, content: s.content_total,
    math_random: s.math_random, layers_is_demo: s.layers_is_demo, boot_ok: null,
    layer_ids: s.layer_ids, static_counts: COUNT_KEYS.map((k) => s[k]), engine_moved: !!s.engine_moved, engine_located: s.engine_located || null, ...liveOf(s.full_name), ...loaderOf(s.full_name), ...licOf(s.full_name), ...sizeOf(s.full_name) };
  rows.push(fromBoot(r, boot.get(s.full_name)));
}
// Calibration rows (local paths).
const gitDate = (d) => { try { return execFileSync('git', ['-C', d, 'log', '-1', '--format=%cI'], { encoding: 'utf8' }).trim(); } catch { return null; } };
for (const cal of CALIBRATION) {
  const name = cal.full_name, local = cal.local;
  const b = boot.get(name); if (!b) continue;
  const mi = modInfoOf(fs.readFileSync(path.join(local, 'js/mod.js'), 'utf8'));
  const st = localStatic(local);
  rows.push(fromBoot({ full_name: name, short: cal.short, calibration: true, url: cal.upstream ? `https://github.com/${cal.upstream}` : null, upstream: cal.upstream, mod_name: mi.name, author: mi.author, version_num: mi.version_num, version_name: mi.version_name, engine: b.tmtNum ? 'tmt' : 'unknown', tmtNum: b.tmtNum,
    endgame: mi.modInfo_endgame || mi.endgame, pushed_at: gitDate(local), archived: null, stars: null, family_size: null, stage2_score: null, shortlist_rank: null, local_head: b.head,
    layer_ids: st.layer_ids, static_counts: COUNT_KEYS.map((k) => st[k]), copies: [], ...liveOf(name), ...loaderOf(name), ...licOf(name), ...sizeOf(name) }, b));
}
// Same game as the PTR calibration row: equal live row roster (flagged so copies are not read as new games).
const ptrRoster = JSON.stringify(boot.get('calibration:Prestige-Tree')?.boot?.census?.rowRoster || null);
for (const r of rows) r.same_tree_as_ptr = !r.calibration && ptrRoster !== 'null' && JSON.stringify(boot.get(r.full_name)?.boot?.census?.rowRoster || null) === ptrRoster;

// ---- family collapse (STAGES.md "Family collapse") ---------------------------------------------------
// (a) COPY of a calibration tree: the representative's static layer-id set equals the calibration row's AND its static
//     milestone/upgrade/buyable/challenge/achievement counts are equal, AND — where both booted with a census — the live
//     game-layer count and counts are equal too. The whole family moves into the calibration row's `copies`.
// (b) every other family keeps its representative, with `members` (count) and `family_members` (names).
// (c) BASE: a representative whose layer-id set strictly contains a calibration tree's (that tree has > 2 layer ids,
//     the trivial threshold) or has the same ids with different counts is that tree plus added/changed content —
//     not a copy; it stays ranked with `base`.
const cals = rows.filter((r) => r.calibration);
const idKey = (r) => (r.layer_ids || []).slice().sort().join(',');
const liveCounts = (r) => (r.source === 'boot' ? [r.layers, ...COUNT_KEYS.map((k) => r[k])].join() : null);
const statCountsOf = new Map(stat.map((x) => [x.full_name, COUNT_KEYS.map((k) => x[k]).join()]));
const collapsed = new Set();
for (const r of rows) {
  r.members = r.family_size ?? null;
  if (r.calibration) continue;
  for (const c of cals) {
    const sameIds = idKey(r) === idKey(c) && (c.layer_ids || []).length > 0;
    const sameStatic = sameIds && r.static_counts.join() === c.static_counts.join();
    const lr = liveCounts(r), lc = liveCounts(c);
    if (sameStatic && (lr == null || lc == null || lr === lc)) {
      collapsed.add(r);
      for (const m of r.family_members) {
        const fk = forks.get(m) || {}, sm = statBy.get(m);
        c.copies.push({ full_name: m, url: `https://github.com/${m}`, tmtNum: sm?.tmtNum || null, edited: statCountsOf.get(m) !== c.static_counts.join() || (sm?.layer_ids || []).slice().sort().join(',') !== idKey(c),
          representative: m === r.full_name, boot_ok: m === r.full_name ? r.boot_ok : null, pushed_at: fk.pushed_at || null, stars: fk.stars ?? null, ...liveOf(m), ...licOf(m) });
      }
      break;
    }
    const cids = new Set(c.layer_ids || []);
    if (cids.size > 2 && [...cids].every((id) => (r.layer_ids || []).includes(id)) && !r.base) r.base = c.short;
  }
}
for (const c of cals) { c.copies.sort((a, b) => (b.representative - a.representative) || (b.stars || 0) - (a.stars || 0) || a.full_name.localeCompare(b.full_name)); c.copy_count = c.copies.length; }
const ranked = rows.filter((r) => !collapsed.has(r));
for (const r of ranked) Object.assign(r, composite(r));
ranked.sort((a, b) => b.score - a.score);
ranked.forEach((r, i) => { r.rank = i + 1; });
rows.length = 0; rows.push(...ranked);
fs.mkdirSync(p('results'), { recursive: true });
fs.writeFileSync(p('results/table.json'), JSON.stringify({ generated_at: new Date().toISOString(), data_commit: DATA_COMMIT, data_dirty: DATA_DIRTY, repo: REPO_URL,
  collapsed_families: collapsed.size, rows }, null, 1));

// ---- SUMMARY.md ----------------------------------------------------------------------------------
const cnt = (arr, f) => arr.filter(f).length;
const bootForks = bootRows.filter((r) => !r.calibration);
const stages = {
  listed: forksRows.length, untouched: cnt(forksRows, (r) => r.untouched), touched: cnt(forksRows, (r) => !r.untouched),
  static_censused: statRows.length, static_errors: cnt(statRows, (r) => r.error), game_js_404: cnt(statRows, (r) => r.http?.['js/game.js'] === 404),
  engine_located: cnt(statRows, (r) => r.engine_located), engine_moved_recovered: cnt(statRows, (r) => r.engine_moved && r.tmtNum),
  engine_moved_recovered_nontrivial: cnt(statRows, (r) => r.engine_moved && r.tmtNum && r.trivial === false),
  nontrivial: cnt(statRows, (r) => r.trivial === false), layers_is_demo: cnt(statRows, (r) => r.layers_is_demo === true), families: fams.size, families_scored: [...fams.values()].filter((f) => f.sc > 0).length, shortlisted: shortlist.length,
  boot_rows: bootRows.length, booted_forks: bootForks.length, boot_forks_ok: cnt(bootForks, (r) => r.ok), boot_forks_failed: cnt(bootForks, (r) => !r.ok),
  boot_ok: cnt(bootRows, (r) => r.ok), boot_failed: cnt(bootRows, (r) => !r.ok),
  deterministic: cnt(bootRows, (r) => r.deterministic), policy_ok: cnt(bootRows, (r) => r.policy?.ok),
  boot_moved_engine_deviation: cnt(bootForks, (r) => r.engine_moved && r.engine_deviation),
  boot_census_rows: cnt(bootForks, (r) => r.boot?.census),
  static_boot_agree: cnt(bootForks, (b) => { const s = statBy.get(b.full_name), c = b.boot?.census; if (!s || !c) return false;
    return [s.branchiness.layers, s.branchiness.branchEdges, s.content_total].join() === [c.layers, c.branchEdges, c.milestones + c.upgrades + c.buyables + c.challenges + c.achievements].join(); }),
  licenses: (() => { const d = {}; for (const r of rows) d[r.license || 'none'] = (d[r.license || 'none'] || 0) + 1; return d; })(),
  live_checked: live.size, live_ok: cnt(liveRows, (r) => r.live_ok), live_dead: cnt(liveRows, (r) => !r.live_ok),
  ranked_loader: cnt(rows, (r) => r.loader_url), ranked_loader_no_live: cnt(rows, (r) => r.loader_url && !r.live_ok),
  ranked_loader_mobile: cnt(rows, (r) => r.loader_mobile_url),
  ranked_declined: cnt(rows, (r) => r.declined_reason), ranked_not_hosted_explained: cnt(rows, (r) => !r.loader_url && notHosted(r)),
  loader_hosted: loader.size, loader_not_ranked: [...loader.keys()].filter((n) => !rows.some((r) => r.full_name === n)),
  ranked_live_ok: cnt(rows, (r) => r.live_ok), ranked_live_dead: cnt(rows, (r) => !r.live_ok && r.live_url), ranked_live_none: cnt(rows, (r) => !r.live_url),
  collapsed_families: collapsed.size, ranked_rows: rows.length,
  copies: Object.fromEntries(cals.map((c) => [c.short, { families: [...collapsed].filter((r) => c.copies.some((x) => x.representative && x.full_name === r.full_name)).length, forks: c.copies.length }])),
  based_on: Object.fromEntries(cals.map((c) => [c.short, cnt(rows, (r) => r.base === c.short)])),
};
const engines = {}; for (const r of statRows) engines[r.engine] = (engines[r.engine] || 0) + 1;
const trivialWhy = {}; for (const r of statRows) if (r.trivial) for (const w of r.trivial_reasons) trivialWhy[w] = (trivialWhy[w] || 0) + 1;
const esc = (x) => String(x ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const dev = (r) => r.dev_added == null ? '—' : `+${r.dev_added}/−${r.dev_removed} (logic +${r.dev_logic_added}/−${r.dev_logic_removed})${r.engine_moved ? ' moved' : ''}`;
const bootCell = (r) => r.boot_ok == null ? 'not booted' : r.boot_ok ? `ok${r.deterministic ? '' : ' ⚠nondet'}${r.policy_ok === false ? ' policy✗' : ''}${r.boot_census_empty ? ' 0-layers→static' : ''}` : `✗ ${r.boot_failed_at}`;
const membersCell = (r) => r.calibration ? (r.copy_count ? `${r.copy_count} copies (below)` : '') : r.members > 1 ? `${r.members}: ${r.family_members.map(esc).join(', ')}` : (r.members ?? '');
const playCell = (r) => r.live_ok ? `[▶ play](${r.live_url})` : r.live_url ? `✗ ${esc(String(r.live_status))}` : '';
const loaderCell = (r) => r.loader_url ? `[▶ loader](${r.loader_url})` : '';
const mobileCell = (r) => r.loader_mobile_url ? `[▶ mobile](${r.loader_mobile_url})` : '';
// one decimal under 100 MB, none above; a game under 0.1 MB still reads as a number, never as 0
const mb = (b) => b == null ? '' : b >= 1e8 ? `${Math.round(b / 1e6)}` : b >= 1e5 ? `${(b / 1e6).toFixed(1)}` : `${(b / 1e6).toFixed(2)}`;
const sizeCell = (r) => mb(r.checkout_bytes);
const repoSizeCell = (r) => r.repo_kb == null ? '' : mb(r.repo_kb * 1024);
const line = (r) => `| ${r.rank} | ${r.calibration ? '🔧 ' : ''}${r.url ? `[${esc(r.full_name)}](${r.url})` : esc(r.full_name)} | ${playCell(r)} | ${loaderCell(r)} | ${mobileCell(r)} | ${esc(r.license || 'none')} | ${esc(r.mod_name)} ${esc(r.version_num)}${r.base ? ` (base: ${r.base})` : ''}${r.same_tree_as_ptr && !r.base ? ' (= PTR tree)' : ''} | ${esc(r.tmtNum || r.engine)} | ${r.score} | ${r.layers}/${r.rows} | ${(r.widthPerRow || []).join(',')} | ${r.branchEdges} | ${r.forkNodes}/${r.joinNodes} | ${r.milestones}/${r.upgrades}/${r.buyables}/${r.challenges}/${r.achievements} | ${r.content} | ${r.endgame && !/e280000000/.test(r.endgame) ? 'yes' : 'no'} | ${(r.pushed_at || '').slice(0, 10)} | ${membersCell(r)} | ${bootCell(r)} | ${dev(r)} | ${sizeCell(r)} | ${repoSizeCell(r)} | ${esc(notHosted(r))} |`;
const HDR = '| # | repo | play | loader | mobile | license | game / version | engine | score | layers/rows | width per row | edges | fork/join | ms/upg/buy/ch/ach | content | endgame | last push | members | boot | engine deviation vs stock | size MB | repo MB | why not hosted |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
const booted = rows.filter((r) => r.boot_ok != null);
const LOADER_REPO_URL = 'https://github.com/PeerInfinity/tmt-loader';
const provenance = `Generated ${GEN_DATE} by \`scripts/rank.mjs\` from \`data/*.jsonl\` at commit \`${DATA_COMMIT}\`${DATA_DIRTY ? ' (with uncommitted data changes)' : ''} of [${REPO_URL.replace('https://github.com/', '')}](${REPO_URL}).${LOADER_COMMIT ? ` The \`loader\` and \`mobile\` columns read [tmt-loader](${LOADER_REPO_URL})'s manifests at commit \`${LOADER_COMMIT.slice(0, 7)}\` (stage 6) and link ${LOADER_BASE} — the second with \`&mobile=1\`, the loader's mobile layout.` : ''}`;
// (U15) the about section's "Reading the table": the columns a PLAYER reads, in plain words, before the technical
// definitions. Every key must exist in COLDEFS (its label is taken from there); the full definitions stay in COLDEFS.
const PLAIN = [
  ['mod_name', "The game's title, as its author wrote it."],
  ['full_name', "The author's GitHub repository. Games with the same title are told apart by this."],
  ['score', 'The overall ranking, 0\u2013100: how branching the tree is (up to 40), how much there is to do (up to 30) and how finished it looks (up to 30); halved if it failed to run here.'],
  ['layers', 'How many layers \u2014 the nodes of the tree \u2014 the game has.'],
  ['rows', 'How many rows deep the tree goes.'],
  ['content', 'Milestones, upgrades, buyables, challenges and achievements, added up.'],
  ['pushed_at', 'When the author last updated the repository.'],
  ['members', 'How many other forks are copies of this same game; expand the cell to list them.'],
  ['boot_ok', 'Whether the game ran when it was tested here.'],
  ['license', 'The licence GitHub detected. "none" or NOASSERTION does not mean the code is free to reuse.'],
];
const METHOD = `A census of the GitHub forks of The Modding Tree and Prestige Tree (both fork lists, plus one level of forks-of-forks). Forks never pushed to are dropped; every other fork's files are read at HEAD and a small lexer counts its layers, tree rows, branch edges and content (milestones, upgrades, buyables, challenges, achievements). Forks with the same layer-id set on the same engine version form one family, represented by one fork; every family with a branching tree and some content is cloned and booted headless (200 idle ticks twice for determinism, plus a simple buy/reset policy), and its engine files are diffed against the closest stock TMT commit of its version (the port cost). Families that are exact copies of a calibration tree are folded into that tree's row. Rows are ranked by a 0–100 composite: branchiness 40, content 30, completeness 30, halved when the boot fails. The data are GitHub metadata and counts, not game code.`;
const copyLink = (x) => `[${esc(x.full_name)}](${x.url})${x.live_ok ? ` ([▶ play](${x.live_url}))` : ''}${x.tmtNum ? ` (${esc(x.tmtNum)})` : ''}${x.edited ? ' ~edited member' : ''}${x.representative ? ' ★' : ''}`;
const md = `# TMT fork census — results

${METHOD}

${provenance} Every number below is read from those rows.
🔧 = calibration row (local clone, not a fork). Score = branchiness 40 + content 30 + completeness 30 (formula: STAGES.md "Rank", \`lib/score.mjs\`).

## Funnel

| stage | count |
|---|---|
| forks listed (both roots + one level of forks-of-forks) | ${stages.listed} |
| … untouched (\`pushed_at <= created_at\`) | ${stages.untouched} |
| … touched | ${stages.touched} |
| static-censused (stage 2) | ${stages.static_censused} (fetch errors ${stages.static_errors}; no \`js/game.js\` ${stages.game_js_404}) |
| … engine located by content (no \`tmtNum\` in \`js/game.js\`) | ${stages.engine_located}; moved engine with a recovered \`tmtNum\` ${stages.engine_moved_recovered} (non-trivial ${stages.engine_moved_recovered_nontrivial}) |
| non-trivial | ${stages.nontrivial} |
| static-censused rows whose \`js/layers.js\` is byte-identical (after CRLF/trim normalization) to a stock demo | ${stages.layers_is_demo} |
| distinct non-trivial families (layer-id set + engine version) | ${stages.families} (with a shortlist score > 0: ${stages.families_scored}) |
| shortlisted for boot | ${stages.shortlisted} |
| boot rows (shortlist + calibration) | ${stages.boot_rows} — forks ${stages.booted_forks} (ok ${stages.boot_forks_ok}, failed ${stages.boot_forks_failed}) + calibration ${stages.boot_rows - stages.booted_forks}; idle-deterministic ${stages.deterministic}; policy leg ok ${stages.policy_ok} |
| booted moved-engine forks with an engine deviation | ${stages.boot_moved_engine_deviation} |
| static census agrees with the live boot census (layers, branch edges, content all equal) | ${stages.static_boot_agree} of ${stages.boot_census_rows} booted forks with a census |
| families collapsed into a calibration row as copies | ${stages.collapsed_families} (${cals.map((c) => `${c.short}: ${stages.copies[c.short].families} families / ${stages.copies[c.short].forks} forks`).join(' · ')}) |
| ranked rows (families + calibration) | ${stages.ranked_rows}; marked \`base\`: ${cals.map((c) => `${c.short} ${stages.based_on[c.short]}`).join(' · ')} |
| declared licenses (stage 5, GitHub's detection) | ranked rows: ${Object.entries(stages.licenses).map(([k, v]) => `${k} ${v}`).join(' · ')} |
| ranked rows hosted by the loader (stage 6, tmt-loader \`${(LOADER_COMMIT || '').slice(0, 7)}\`) | ${stages.ranked_loader} (of which ${stages.ranked_loader_no_live} had no live page)${stages.loader_not_ranked.length ? `; hosted but not a ranked row: ${stages.loader_not_ranked.map(esc).join(', ')}` : ''} |
| live pages derived and verified (stage 4) | ${stages.live_checked} URLs — reachable ${stages.live_ok}, dead ${stages.live_dead}; of the ranked rows: ${stages.ranked_live_ok} playable, ${stages.ranked_live_dead} dead URL, ${stages.ranked_live_none} none |

Engines (stage 2): ${Object.entries(engines).map(([k, v]) => `${k} ${v}`).join(' · ')}.
Trivial reasons as recorded by stage 2 (a row may have several; \"demo unchanged\" was run as: demo \`layers.js\` and no other content file): ${Object.entries(trivialWhy).map(([k, v]) => `${k} ${v}`).join(' · ')}.

## Ranked families

${HDR}
${booted.map(line).join('\n')}
${rows.some((r) => r.boot_ok == null) ? `
## Families not booted (static numbers only)

${HDR}
${rows.filter((r) => r.boot_ok == null).map(line).join('\n')}
` : ''}
## Calibration rows and their copies

A copy has the calibration tree's layer-id set and content counts (STAGES.md, "Family collapse"); its whole family is listed here and left out of the ranking. ★ = the family's representative (booted); \`~edited member\` = a family member whose own static counts or layer ids differ from the calibration tree's.

${cals.map((c) => `### ${esc(c.short)} (${esc(c.mod_name)} ${esc(c.version_num)}) — ${c.copies.length} ${c.copies.length === 1 ? 'copy' : 'copies'}

${c.copies.length ? c.copies.map((x) => `- ${copyLink(x)}`).join('\n') : '(none)'}
`).join('\n')}
## Boot failures

| repo | failed at | error |
|---|---|---|
${booted.filter((r) => !r.boot_ok).map((r) => `| ${esc(r.full_name)} | ${esc(r.boot_failed_at)} | ${esc((r.boot_error || '').slice(0, 160))} |`).join('\n')}

## Non-deterministic boots (idle leg) and the state paths that differ

| repo | paths |
|---|---|
${booted.filter((r) => r.boot_ok && !r.deterministic).map((r) => `| ${esc(r.full_name)} | ${esc((r.nondeterministic_paths || []).join(', '))} |`).join('\n')}
`;
fs.writeFileSync(p('results/SUMMARY.md'), md);

// ---- docs/index.html (static, no CDN, data inline, relative links only) --------------------------
// ---- column definitions ---------------------------------------------------------------------------
// The ONE source for the column list: the page's header tooltips and legend, the Columns panel's labels
// and the columns table in COLUMNS.md are all generated from it. {key, label, desc, note} — desc says what
// the number is and where it comes from; note is the unit or format.
const COLDEFS = [
  { key: 'rank', label: 'Rank', desc: 'Position in this table, highest composite score first.', note: '1–N over the ranked rows; calibration clones are ranked alongside the forks' },
  { key: 'full_name', label: 'Repository', desc: 'The GitHub repo this row stands for — a family\'s representative fork, or a local calibration clone.', note: 'owner/name, linking to github.com; a calibration row links to its upstream repo' },
  { key: 'play', label: 'Play', desc: 'The row\'s live game page, derived from the repo\'s homepage or its GitHub Pages URL and verified with one GET (stage 4).', note: '▶ play = answered 2xx/3xx; a greyed ▶ dead names the status in its tooltip; empty = no URL could be derived' },
  { key: 'loader', label: 'Loader', desc: 'The same game loaded through tmt-loader on its own engine (no CDN, namespaced save; automation only with ?automation=1) — for every ranked row the loader hosts at the pinned commit (stage 6).', note: '▶ loader = a URL; empty = not hosted' },
  { key: 'loader_mobile', label: 'Mobile', desc: 'The same loader URL with ?mobile=1 — the loader\'s mobile layout: one column, the tree until you open a layer and then the layer full width, a bottom nav bar and 44px tap targets. The engines themselves ship no @media query at all. Present only when the pinned loader commit carries the mode (stage 6).', note: '▶ mobile = a URL; empty = not hosted, or the pinned loader predates the mode' },
  { key: 'mod_name', label: 'Game name', desc: 'The game\'s own title, read from modInfo.name in js/mod.js.', note: 'text, exactly as the fork wrote it' },
  { key: 'version_num', label: 'Version', desc: 'The game\'s own version string, from modInfo.versionNumber.', note: 'text; the stock demo\'s "0.0" earns no completeness point' },
  { key: 'base', label: 'Base game', desc: 'The calibration tree this game is built on: its layer-id set contains that tree\'s, so it is that game plus added or changed content (STAGES.md, Family collapse (c)).', note: 'PTR or TMT; empty when it is not built on one' },
  { key: 'tmtNum', label: 'Engine version', desc: 'The Modding Tree engine the fork runs, from tmtNum in js/game.js — or, when the engine was moved off the stock paths, from the engine located by content.', note: 'e.g. 2.6.6.2; empty when nothing declares it' },
  { key: 'score', label: 'Score', desc: 'The composite ranking, branchiness 40 + content 30 + completeness 30, halved when the boot failed (lib/score.mjs: composite).', note: '0–100, two decimals' },
  { key: 's_branch', label: 'Branchiness', desc: 'The branchiness part of the score: 40 × min(1, (fork nodes + join nodes) / 30), × 0.25 when the tree is linear.', note: '0–40; the /30 is PTR\'s 30 nodes' },
  { key: 's_content', label: 'Content score', desc: 'The content part of the score: 30 × min(1, log10(1 + content) / log10(401)).', note: '0–30; the 401 is PTR\'s content of 398' },
  { key: 's_complete', label: 'Completeness', desc: 'The completeness part: 10 for an endgame differing from the stock demo\'s, 10 × recency of the last push (≤ 1 year → 1, falling to 0 at 5), 5 for a version that is not 0.0, 5 for booting headless (2.5 not booted, 0 failed).', note: '0–30' },
  { key: 'layers', label: 'Layers', desc: 'How many game layers the tree has — from the live layers object where the fork booted, else stage 2\'s static lexer.', note: 'count' },
  { key: 'rows', label: 'Tree rows', desc: 'How many distinct rows the tree layout declares — how deep the tree is.', note: 'count' },
  { key: 'widthPerRow', label: 'Width per row', desc: 'How many layers sit in each tree row, top row first — the tree\'s shape in one line.', note: 'comma-separated counts, one per row' },
  { key: 'branchEdges', label: 'Branch edges', desc: 'Edges in the branch DAG: every layer-to-layer prerequisite link the tree declares.', note: 'count' },
  { key: 'forkNodes', label: 'Fork nodes', desc: 'Layers with ≥ 2 children in the branch DAG — where the tree splits.', note: 'count; fork + join nodes drive the branchiness score' },
  { key: 'joinNodes', label: 'Join nodes', desc: 'Layers with ≥ 2 parents in the branch DAG — where branches merge.', note: 'count; fork + join nodes drive the branchiness score' },
  { key: 'milestones', label: 'Milestones', desc: 'Milestones counted across the game\'s layers (boot-exact where the fork booted, else the static census).', note: 'count' },
  { key: 'upgrades', label: 'Upgrades', desc: 'Upgrades counted across the game\'s layers.', note: 'count' },
  { key: 'buyables', label: 'Buyables', desc: 'Buyables counted across the game\'s layers.', note: 'count' },
  { key: 'challenges', label: 'Challenges', desc: 'Challenges counted across the game\'s layers.', note: 'count' },
  { key: 'achievements', label: 'Achievements', desc: 'Achievements counted across the game\'s layers.', note: 'count' },
  { key: 'content', label: 'Content total', desc: 'Total content = milestones + upgrades + buyables + challenges + achievements.', note: 'count; this is what the content score reads' },
  { key: 'pushed_at', label: 'Last push', desc: 'When the repository was last pushed to, from the GitHub API.', note: 'YYYY-MM-DD; drives the recency half of completeness' },
  { key: 'archived', label: 'Archived', desc: 'Whether GitHub marks the repository archived — shown, never scored, since a finished game and an abandoned one both get archived.', note: 'true / false' },
  { key: 'stars', label: 'Stars', desc: 'The repository\'s stargazer count from the GitHub API.', note: 'integer; used only to break ties when picking a family\'s representative' },
  { key: 'members', label: 'Members / copies', desc: 'For a fork row, how many repos share this game (the same layer-id set on the same engine version); for a calibration row, how many forks are exact copies of it and have left the ranking (STAGES.md, Family collapse).', note: 'count; the cell expands to the list' },
  { key: 'boot_ok', label: 'Boots', desc: 'Whether the game loaded and ran 200 headless ticks in its own engine (stage 3).', note: 'true / false; empty when the family was not booted, and a false halves the score' },
  { key: 'deterministic', label: 'Deterministic', desc: 'Whether the two idle boot legs ended on the same state hash after the same number of ticks.', note: 'true / false; a false row lists the differing player paths in SUMMARY.md' },
  { key: 'policy_ok', label: 'Policy leg', desc: 'Whether the second boot leg survived a generic play policy (each tick: reset any row-0 layer that can reset, buy every affordable unlocked upgrade).', note: 'true / false; recorded, never scored' },
  { key: 'trace_fields', label: 'Milestone fields', desc: 'How many distinct player fields the milestone done() conditions read, traced through a Proxy — a rough measure of what the game\'s goals depend on.', note: 'count' },
  { key: 'dev_added', label: 'Engine lines added', desc: 'Engine lines added against the closest stock TMT commit of the fork\'s version — the port cost.', note: 'git diff --numstat line count over the stock engine files' },
  { key: 'dev_removed', label: 'Engine lines removed', desc: 'Engine lines removed against that same stock commit; a stock file with no counterpart in the fork counts as wholly removed.', note: 'git diff --numstat line count' },
  { key: 'dev_logic_added', label: 'Logic lines added', desc: 'The share of the added lines that lands in the logic files (game.js, utils.js, utils/*, technical/temp, layerSupport, displays, loader).', note: 'line count, a subset of engine lines added' },
  { key: 'dev_logic_removed', label: 'Logic lines removed', desc: 'The share of the removed lines that lands in those same logic files.', note: 'line count, a subset of engine lines removed' },
  { key: 'dev_stock', label: 'Stock baseline', desc: 'Which stock TMT commit the engine deviation was measured against (many commits share one tmtNum, so it is the closest of them).', note: 'version@commit; "(nearest lower)" when the fork\'s version is not in the stock map' },
  { key: 'engine_moved', label: 'Engine moved', desc: 'Whether the fork moved its engine files off the stock paths, so they had to be located by content before diffing.', note: 'true / false' },
  { key: 'same_tree_as_ptr', label: 'Same tree as PTR', desc: 'Whether the booted game\'s live row roster is exactly Prestige Tree Rewritten\'s — flagged so a near-copy is not read as a new game.', note: 'true / false' },
  { key: 'license', label: 'License', desc: "The license GitHub detected on the repository at census time — its license.spdx_id, quoted as reported and not a legal determination; \"none\" means GitHub detected no LICENSE file, which does not free the code, since a fork of an MIT project without the file is still bound by the upstream terms.", note: 'SPDX id, e.g. MIT; NOASSERTION = a license file licensee could not match (the TMT lineage\'s MIT text carries a non-standard copyright line, so nearly every row reads this); calibration rows are read from their clone\'s own files' },
  { key: 'checkout_bytes', label: 'Game size', desc: 'How big the game itself is: the bytes of the working tree at the commit the census booted, .git excluded (stage 7). This is what a copy of it costs to host — what `git subtree add` puts in a loader — and it is the number to judge "is this small enough" by.', note: 'MB; empty when the repo was not cloned on the machine that ran the stage' },
  { key: 'repo_kb', label: 'Repository size', desc: 'What GitHub reports for the repository: packed, and INCLUDING ALL HISTORY (stage 1\'s size field). It is what cloning the fork costs, and it is NOT a proxy for the game size beside it — over these rows the two diverge by a median of 3x and a maximum of 34x, in both directions (a heavy history reads far larger than its game; a pile of incompressible PNGs reads smaller).', note: 'MB, converted from the API\'s KB' },
  { key: 'not_hosted', label: 'Why not hosted', desc: 'For a ranked game the loader does not host: why. The loader publishes its own list of what it looked at and declined (manifests/declined.json, read at the pinned commit by stage 6) and that reason wins, because it made the attempt and saw the evidence. Where it has none, the census says only what it measured itself — a boot that failed here, or a repo it never cloned. Empty for a hosted game.', note: 'text; empty when the game IS hosted, and also when nothing here has anything to say about it' },
];
const cols = COLDEFS.map((d) => d.key);
const slim = rows.map((r) => ({ ...Object.fromEntries(cols.map((c) => [c, c === 'widthPerRow' ? (r[c] || []).join(',') : c === 'pushed_at' ? (r[c] || '').slice(0, 10) : c === 'play' ? (r.live_ok ? 'live' : r.live_url ? 'dead' : null) : c === 'loader' ? (r.loader_url ? 'hosted' : null) : c === 'loader_mobile' ? (r.loader_mobile_url ? 'hosted' : null) : c === 'not_hosted' ? (notHosted(r) || null) : r[c] ?? null])),
  checkout_files: r.checkout_files ?? null,
  url: r.url, calibration: r.calibration, live_url: r.live_url || null, live_ok: !!r.live_ok, live_status: r.live_status ?? null, loader_url: r.loader_url || null, loader_mobile_url: r.loader_mobile_url || null, not_hosted_why: notHostedWhy(r) || null,
  lic_n: r.license_name || null, lic_s: r.license_source || null, lic_note: r.license_note || null,
  family_members: r.calibration ? null : r.family_members, copies: r.calibration ? r.copies.map((x) => ({ n: x.full_name, u: x.url, v: x.tmtNum, e: x.edited, r: x.representative, l: x.live_ok ? x.live_url : null })) : null }));
const hesc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// COLUMNS.md's table comes from the same definitions — the block between the markers is rewritten here. (It lived
// in README.md until the README was split; the markers are unchanged, only the file they are looked for in.)
const COLS_DOC = 'COLUMNS.md';
const COLS_START = '<!-- columns:start (generated by scripts/rank.mjs from COLDEFS — do not edit by hand) -->';
const COLS_END = '<!-- columns:end -->';
const colsMd = [COLS_START, '', '| column | what it is | format |', '|---|---|---|',
  ...COLDEFS.map((d) => `| \`${d.key}\` (${esc(d.label)}) | ${esc(d.desc)} | ${esc(d.note)} |`), '', COLS_END].join('\n');
{
  const f = p(COLS_DOC); const txt = fs.readFileSync(f, 'utf8');
  const a = txt.indexOf(COLS_START), b = txt.indexOf(COLS_END);
  if (a < 0 || b < 0) console.error(`${COLS_DOC}: no columns block (markers missing) — column table NOT updated`);
  else { const next = txt.slice(0, a) + colsMd + txt.slice(b + COLS_END.length); if (next !== txt) fs.writeFileSync(f, next); }
}
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TMT Fork Census</title>
<style>
:root{color-scheme:dark;--bg:#151513;--bg2:#20201c;--zeb:#1b1b18;--fg:#e8e6df;--mut:#9c9a91;--line:#35342f;--hi:#3d3620;--acc:#8fd7b0;--btn:#26261f}
:root[data-theme="light"]{color-scheme:light;--bg:#fbfaf7;--bg2:#f1efe8;--zeb:#f6f5f1;--fg:#1d1d1b;--mut:#67665f;--line:#e0ded6;--hi:#fff3c4;--acc:#1a5e3f;--btn:#eeece4}
*{box-sizing:border-box}
body{margin:0;padding-block:16px;padding-inline:16px;background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif;height:100vh;height:100dvh;display:flex;flex-direction:column}
h1{font-size:17px;margin:0;display:inline;font-weight:700}
p{color:var(--mut);margin:0 0 12px;max-width:80ch}
.about{border:1px solid var(--line);border-radius:6px;background:var(--bg2);max-width:100%}
.about>summary{cursor:pointer;padding:6px 10px;user-select:none;list-style:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.about>summary::-webkit-details-marker{display:none}
.about>summary::before{content:"\\25b8 ";color:var(--mut)}
.about[open]>summary::before{content:"\\25be "}
.ab{padding:10px 10px 0;border-top:1px solid var(--line)}
.ab h2{font-size:14px;margin:14px 0 6px}
.lg{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:3px 14px;margin:0 0 12px;max-width:110ch}
.lg dt{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;white-space:nowrap}
.lg dd{margin:0;color:var(--mut)}
.lg b{color:var(--fg);font-weight:600}
.ab p:last-child{margin-bottom:10px}
.lg.pl dt{font-family:inherit;font-size:inherit;font-weight:600}
.ab details.full>summary{cursor:pointer;margin:4px 0 8px;font-weight:600}
.bar{position:relative;display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 0;max-width:100%}
button,input{font:inherit;color:var(--fg);border:1px solid var(--line);border-radius:4px;padding:6px 8px}
button{background:var(--btn);cursor:pointer}
button:hover{border-color:var(--mut)}
input{background:var(--bg);width:min(320px,100%)}
.cols{border:1px solid var(--line);border-radius:4px;background:var(--btn)}
.cols>summary{cursor:pointer;padding:6px 8px;user-select:none;list-style:none;white-space:nowrap}
.cols>summary::-webkit-details-marker{display:none}
.cols>summary::before{content:"\\25b8 ";color:var(--mut)}
.cols[open]>summary::before{content:"\\25be "}
.cg{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:6;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:2px 12px;padding:8px;background:var(--bg2);border:1px solid var(--line);border-radius:6px;max-height:50vh;overflow:auto;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.cg label{display:flex;gap:6px;align-items:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.cg input{width:auto;padding:0}
.n{color:var(--mut);font-size:12px}
.wrap{overflow:auto;max-width:100%;flex:1 1 auto;min-height:340px;margin-top:8px;border:1px solid var(--line);border-radius:6px}
table{border-collapse:separate;border-spacing:0;font-variant-numeric:tabular-nums;white-space:nowrap}
th,td{padding:4px 8px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top;overflow:hidden;text-overflow:ellipsis}
th{position:sticky;top:0;z-index:2;background:var(--bg2);cursor:pointer;user-select:none;font-weight:600;touch-action:none}
th.rz{cursor:col-resize}
th .rs{position:absolute;top:0;right:0;width:5px;height:100%;pointer-events:none;background:var(--line)}
th.rz .rs{background:var(--acc)}
td.t,th.t{text-align:left}
td[data-c="full_name"]{max-width:24ch}
td[data-c="mod_name"]{max-width:22ch}
td[data-c="widthPerRow"]{max-width:22ch}
td[data-c="base"],td[data-c="version_num"],td[data-c="dev_stock"],td[data-c="trace_fields"]{max-width:16ch}
td[data-c="members"]{max-width:30ch}
td[data-c="play"],th[data-c="play"],td[data-c="loader"],th[data-c="loader"]{white-space:nowrap}
td[data-c="license"]{max-width:18ch}
tbody tr:nth-child(even) td{background:var(--zeb)}
tbody tr.cal td{background:var(--hi)}
a{color:var(--acc)}
.dead{color:var(--mut);opacity:.7}
details.m{white-space:normal;max-width:100%;text-align:left}
details.m>summary{cursor:pointer;white-space:nowrap}
</style>
<script>try{document.documentElement.setAttribute('data-theme',localStorage.getItem('tmtcensus.theme')==='"light"'?'light':'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}</script>
</head><body>
<details class="about" id="about"><summary><h1>TMT Fork Census</h1> <span class="n">about this table \u00b7 how to play a game, what each column means, how it was made</span></summary><div class="ab">
<h2>What this is</h2>
<p>Games built on The Modding Tree and Prestige Tree, found by going through their GitHub forks. The table keeps the forks that look like games &mdash; one row per game, however many forks copy it &mdash; best first. The ranking favours a tree that branches rather than one straight line of layers, plenty to do, and signs of a finished game &mdash; an ending, a version number, a recent update, and that it still runs.</p>
<h2>Playing a game</h2>
<p><b>\u25b6 loader</b> opens the game in <a href="https://peerinfinity.github.io/tmt-loader/">tmt-loader</a>, which runs it on its own engine even when the author's page is gone; <b>\u25b6 mobile</b> opens the same with a one-column phone layout; <b>\u25b6 play</b> opens the author's own page, and a grey <b>\u25b6 dead</b> means that page no longer answers. A row with no loader link is a game the loader does not host; the <em>Why not hosted</em> column, far right, says why when it is known.</p>
<h2>Reading the table</h2>
<dl class="lg pl">${PLAIN.map(([k, t]) => `<dt>${hesc((COLDEFS.find((d) => d.key === k) || {}).label || k)}</dt><dd>${hesc(t)}</dd>`).join('')}</dl>
<p>The columns further right are technical: how the score is built, the shape of the tree, the engine and how far it differs from stock TMT, the boot checks and the sizes. Hover a header for its definition, or open <em>Every column, in full</em> below. Click a header to sort; drag its right edge to resize (double-click the edge to reset); the table scrolls sideways inside its frame. <b>Key columns</b> hides the technical ones. Shaded rows are the two calibration games, Prestige Tree Rewritten and The Modding Tree itself, which the scores are measured against.</p>
<h2>How it was made</h2>
<p>${hesc(METHOD)}</p>
<p>Generated ${GEN_DATE} from <code>data/*.jsonl</code> at commit <code>${hesc(DATA_COMMIT)}</code>${DATA_DIRTY ? ' (with uncommitted data changes)' : ''}. Source, method and raw rows: <a href="${REPO_URL}">${REPO_URL.replace('https://', '')}</a> (<a href="${REPO_URL}/blob/HEAD/results/SUMMARY.md">SUMMARY.md</a>). The <em>loader</em> links come from <a href="${LOADER_REPO_URL}">tmt-loader</a>${LOADER_COMMIT ? ` (manifests read at commit <code>${hesc(LOADER_COMMIT.slice(0, 7))}</code>, served from <a href="${hesc(LOADER_BASE)}">${hesc(LOADER_BASE.replace('https://', ''))}</a>)` : ''}. The full method is <a href="${REPO_URL}/blob/HEAD/STAGES.md">STAGES.md</a>, and every column is defined in <a href="${REPO_URL}/blob/HEAD/COLUMNS.md">COLUMNS.md</a>.</p>
<p><strong>AI disclosure.</strong> The census scripts, the documentation and this page were AI-generated (Claude Code sessions directed by PeerInfinity, who set the questions and reviewed the output); every number here is produced by those scripts from the GitHub API and the forks' own source files, and can be regenerated from the repo.</p>
<details class="full"><summary>Every column, in full</summary>
<dl class="lg pl">${COLDEFS.map((d) => `<dt>${hesc(d.label)}</dt><dd>${hesc(d.desc)} <span class="n">${hesc(d.note)}</span></dd>`).join('')}</dl>
</details>
</div></details>
<script>try{if(localStorage.getItem('tmtcensus.about')==='true')document.getElementById('about').open=true}catch(e){}</script>
<div class="bar">
<input id="q" placeholder="filter by repo or game name" aria-label="filter">
<details class="cols"><summary>Columns</summary><div class="cg" id="cg"></div></details>
<button id="theme" type="button">Light</button>
<button id="all" type="button">All columns</button>
<button id="key" type="button">Key columns</button>
<button id="rw" type="button">Reset widths</button>
<span class="n" id="count"></span>
</div>
<div class="wrap" id="wrap"><table id="tbl"><thead><tr id="h"></tr></thead><tbody id="b"></tbody></table></div>
<style id="cw"></style>
<script type="application/json" id="data">${JSON.stringify(slim).replace(/</g, '\\u003c')}</script>
<script>
const rows=JSON.parse(document.getElementById('data').textContent);const cols=${JSON.stringify(cols)};
const CD=${JSON.stringify(Object.fromEntries(COLDEFS.map((d) => [d.key, [d.label, d.desc, d.note]])))};
const lab=c=>CD[c]?CD[c][0]:c;
const tip=c=>{const d=CD[c];return d?d[0]+' \u2014 '+d[1]+' \u00b7 '+d[2]:c};
const text=new Set(['full_name','play','loader','loader_mobile','not_hosted','license','mod_name','version_num','base','tmtNum','widthPerRow','pushed_at','dev_stock','members']);
const KEYCOLS=['rank','full_name','play','loader','mod_name','version_num','base','score','layers','rows','content','pushed_at','stars','members','boot_ok','license'];
const LS={get(k,d){try{const v=localStorage.getItem('tmtcensus.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('tmtcensus.'+k,JSON.stringify(v))}catch(e){}}};
let hidden=new Set((LS.get('hidden',[])||[]).filter(c=>cols.includes(c)));
let widths=LS.get('widths',{})||{};
let key='rank',dir=1,dragging=false;
const h=document.getElementById('h'),b=document.getElementById('b'),q=document.getElementById('q'),cg=document.getElementById('cg'),cw=document.getElementById('cw'),cnt=document.getElementById('count');
const vis=()=>cols.filter(c=>!hidden.has(c));
function applyWidths(){let s='';for(const c of cols){const w=widths[c];if(w)s+='th[data-c="'+c+'"],td[data-c="'+c+'"]{width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px}'}cw.textContent=s}
const EDGE=8,near=(th,x)=>th.getBoundingClientRect().right-x<=EDGE;let dragged=false;
function head(){h.replaceChildren(...vis().map(c=>{const th=document.createElement('th');th.dataset.c=c;th.className=(text.has(c)?'t':'');th.title=tip(c)+'\\n\\nClick to sort, drag the right edge to resize, double-click that edge to reset.';
th.appendChild(document.createTextNode(lab(c)+(key===c?(dir>0?' \\u25b2':' \\u25bc'):'')));
const rs=document.createElement('span');rs.className='rs';th.appendChild(rs);
th.addEventListener('pointermove',e=>{if(!dragging)th.classList.toggle('rz',near(th,e.clientX))});
th.addEventListener('pointerleave',()=>{if(!dragging)th.classList.remove('rz')});
th.addEventListener('dblclick',e=>{if(!near(th,e.clientX))return;e.preventDefault();delete widths[c];LS.set('widths',widths);applyWidths()});
th.addEventListener('pointerdown',e=>{if(!near(th,e.clientX))return;e.preventDefault();dragging=true;dragged=false;
const sx=e.clientX,sw=th.getBoundingClientRect().width;
const mv=ev=>{dragged=true;widths[c]=Math.max(40,Math.round(sw+ev.clientX-sx));applyWidths()};
const up=()=>{window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);dragging=false;th.classList.remove('rz');if(dragged)LS.set('widths',widths)};
window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)});
th.addEventListener('click',e=>{if(dragged){dragged=false;return}if(near(th,e.clientX))return;dir=key===c?-dir:(text.has(c)||c==='rank'?1:-1);key=c;head();draw()});
return th}))}
function link(u,t){const a=document.createElement('a');a.href=u;a.textContent=t;return a}
// same rule as the markdown table: one decimal under 100 MB, none above, and a small game never reads as 0
function fmtMB(b){return b>=1e8?String(Math.round(b/1e6)):b>=1e5?(b/1e6).toFixed(1):(b/1e6).toFixed(2)}
function list(label,items){const d=document.createElement('details');d.className='m';const s=document.createElement('summary');s.textContent=label;d.appendChild(s);items.forEach((it,i)=>{if(i)d.appendChild(document.createTextNode(', '));d.appendChild(it)});return d}
function draw(){const f=q.value.toLowerCase();const shown=vis();
const rs=rows.filter(r=>!f||(r.full_name+' '+(r.mod_name||'')+' '+(r.copies||[]).map(x=>x.n).join(' ')+' '+(r.family_members||[]).join(' ')).toLowerCase().includes(f));
rs.sort((x,y)=>{const a=x[key],c=y[key];if(a==null)return 1;if(c==null)return -1;return (a>c?1:a<c?-1:0)*dir});
cnt.textContent=rs.length+' of '+rows.length+' rows, '+shown.length+' of '+cols.length+' columns';
b.replaceChildren(...rs.map(r=>{const tr=document.createElement('tr');if(r.calibration)tr.className='cal';for(const c of shown){const td=document.createElement('td');td.dataset.c=c;if(text.has(c))td.className='t';
if(c==='full_name'&&r.url){td.appendChild(link(r.url,r.full_name));td.title=r.full_name}
else if(c==='play'){if(r.live_ok){const a=link(r.live_url,'\u25b6 play');a.target='_blank';a.rel='noopener';a.title='play '+(r.mod_name||r.full_name)+' at '+r.live_url;td.appendChild(a)}
else if(r.live_url){const s=document.createElement('span');s.className='dead';s.textContent='\u25b6 dead';s.title=r.live_url+' \u2192 HTTP '+r.live_status;td.appendChild(s)}}
else if(c==='loader'){if(r.loader_url){const a=link(r.loader_url,'\u25b6 loader');a.target='_blank';a.rel='noopener';a.title='load '+(r.mod_name||r.full_name)+' through tmt-loader at '+r.loader_url;td.appendChild(a)}}
else if(c==='checkout_bytes'){if(r.checkout_bytes!=null){td.textContent=fmtMB(r.checkout_bytes);td.title=r.checkout_bytes.toLocaleString()+' bytes in '+(r.checkout_files??'?')+' files, at the commit the census booted (.git excluded)';td.className='n'}}
else if(c==='repo_kb'){if(r.repo_kb!=null){td.textContent=fmtMB(r.repo_kb*1024);td.title='GitHub\\'s reported repository size: '+r.repo_kb.toLocaleString()+' KB, packed and including all history — not the game size beside it';td.className='n'}}
else if(c==='not_hosted'){if(r.not_hosted){td.textContent=r.not_hosted;if(r.not_hosted_why)td.title=r.not_hosted_why}}
else if(c==='loader_mobile'){if(r.loader_mobile_url){const a=link(r.loader_mobile_url,'\u25b6 mobile');a.target='_blank';a.rel='noopener';a.title='load '+(r.mod_name||r.full_name)+' through tmt-loader in its MOBILE layout at '+r.loader_mobile_url;td.appendChild(a)}}
else if(c==='members'&&r.copies)td.appendChild(r.copies.length?list(r.copies.length+' copies',r.copies.map(x=>{const a=link(x.u,x.n+(x.v?' ('+x.v+')':'')+(x.e?' ~edited':''));if(!x.l)return a;const f=document.createDocumentFragment();f.appendChild(a);const pl=link(x.l,' \u25b6');pl.target='_blank';pl.rel='noopener';pl.title='play '+x.n;f.appendChild(pl);return f})):document.createTextNode('0 copies'));
else if(c==='members'&&r.family_members&&r.family_members.length>1)td.appendChild(list(r.family_members.length+' members',r.family_members.map(n=>link('https://github.com/'+n,n))));
else if(c==='license'){td.textContent=r.license||'none';td.title=(r.license?(r.lic_n?r.lic_n+' \u2014 ':'')+'from '+r.lic_s:'no LICENSE file detected \u2014 which does not free the code: a fork of an MIT project without the file is still bound by the upstream terms')+(r.lic_note?' \u2014 '+r.lic_note:'')}
else{const v=r[c]==null?'':String(r[c]);td.textContent=v;if(v&&text.has(c))td.title=v}
tr.appendChild(td)}return tr}))}
function boxes(){cg.replaceChildren(...cols.map(c=>{const l=document.createElement('label'),cb=document.createElement('input');cb.type='checkbox';cb.checked=!hidden.has(c);
cb.onchange=()=>{if(cb.checked)hidden.delete(c);else hidden.add(c);LS.set('hidden',[...hidden]);head();draw()};
l.title=tip(c);l.appendChild(cb);l.appendChild(document.createTextNode(lab(c)));return l}))}
function setHidden(s){hidden=s;LS.set('hidden',[...hidden]);boxes();head();draw()}
document.getElementById('all').onclick=()=>setHidden(new Set());
document.getElementById('key').onclick=()=>setHidden(new Set(cols.filter(c=>!KEYCOLS.includes(c))));
document.getElementById('rw').onclick=()=>{widths={};LS.set('widths',widths);applyWidths()};
const tb=document.getElementById('theme');
const paint=()=>{tb.textContent=document.documentElement.getAttribute('data-theme')==='dark'?'Light':'Dark'};
tb.onclick=()=>{const t=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';document.documentElement.setAttribute('data-theme',t);LS.set('theme',t);paint()};
const ab=document.getElementById('about');ab.addEventListener('toggle',()=>LS.set('about',ab.open));
paint();q.oninput=draw;applyWidths();boxes();head();draw();
</script></body></html>`;
fs.mkdirSync(p('docs'), { recursive: true });
fs.writeFileSync(p('docs/index.html'), html);
console.log(JSON.stringify(stages));
