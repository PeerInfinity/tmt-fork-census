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
    layer_ids: s.layer_ids, static_counts: COUNT_KEYS.map((k) => s[k]), engine_moved: !!s.engine_moved, engine_located: s.engine_located || null, ...liveOf(s.full_name) };
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
    layer_ids: st.layer_ids, static_counts: COUNT_KEYS.map((k) => st[k]), copies: [], ...liveOf(name) }, b));
}
// Same game as the PTR calibration row: equal live row roster (flagged so copies are not read as new games).
const ptrRoster = JSON.stringify(boot.get('calibration:Prestige-Tree')?.boot?.census?.rowRoster || null);
for (const r of rows) r.same_tree_as_ptr = !r.calibration && ptrRoster !== 'null' && JSON.stringify(boot.get(r.full_name)?.boot?.census?.rowRoster || null) === ptrRoster;

// ---- family collapse (README "Family collapse") ---------------------------------------------------
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
          representative: m === r.full_name, boot_ok: m === r.full_name ? r.boot_ok : null, pushed_at: fk.pushed_at || null, stars: fk.stars ?? null, ...liveOf(m) });
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
  live_checked: live.size, live_ok: cnt(liveRows, (r) => r.live_ok), live_dead: cnt(liveRows, (r) => !r.live_ok),
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
const line = (r) => `| ${r.rank} | ${r.calibration ? '🔧 ' : ''}${r.url ? `[${esc(r.full_name)}](${r.url})` : esc(r.full_name)} | ${playCell(r)} | ${esc(r.mod_name)} ${esc(r.version_num)}${r.base ? ` (base: ${r.base})` : ''}${r.same_tree_as_ptr && !r.base ? ' (= PTR tree)' : ''} | ${esc(r.tmtNum || r.engine)} | ${r.score} | ${r.layers}/${r.rows} | ${(r.widthPerRow || []).join(',')} | ${r.branchEdges} | ${r.forkNodes}/${r.joinNodes} | ${r.milestones}/${r.upgrades}/${r.buyables}/${r.challenges}/${r.achievements} | ${r.content} | ${r.endgame && !/e280000000/.test(r.endgame) ? 'yes' : 'no'} | ${(r.pushed_at || '').slice(0, 10)} | ${membersCell(r)} | ${bootCell(r)} | ${dev(r)} |`;
const HDR = '| # | repo | play | game / version | engine | score | layers/rows | width per row | edges | fork/join | ms/upg/buy/ch/ach | content | endgame | last push | members | boot | engine deviation vs stock |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
const booted = rows.filter((r) => r.boot_ok != null);
const provenance = `Generated ${GEN_DATE} by \`scripts/rank.mjs\` from \`data/*.jsonl\` at commit \`${DATA_COMMIT}\`${DATA_DIRTY ? ' (with uncommitted data changes)' : ''} of [${REPO_URL.replace('https://github.com/', '')}](${REPO_URL}).`;
const METHOD = `A census of the GitHub forks of The Modding Tree and Prestige Tree (both fork lists, plus one level of forks-of-forks). Forks never pushed to are dropped; every other fork's files are read at HEAD and a small lexer counts its layers, tree rows, branch edges and content (milestones, upgrades, buyables, challenges, achievements). Forks with the same layer-id set on the same engine version form one family, represented by one fork; every family with a branching tree and some content is cloned and booted headless (200 idle ticks twice for determinism, plus a simple buy/reset policy), and its engine files are diffed against the closest stock TMT commit of its version (the port cost). Families that are exact copies of a calibration tree are folded into that tree's row. Rows are ranked by a 0–100 composite: branchiness 40, content 30, completeness 30, halved when the boot fails. The data are GitHub metadata and counts, not game code.`;
const copyLink = (x) => `[${esc(x.full_name)}](${x.url})${x.live_ok ? ` ([▶ play](${x.live_url}))` : ''}${x.tmtNum ? ` (${esc(x.tmtNum)})` : ''}${x.edited ? ' ~edited member' : ''}${x.representative ? ' ★' : ''}`;
const md = `# TMT fork census — results

${METHOD}

${provenance} Every number below is read from those rows.
🔧 = calibration row (local clone, not a fork). Score = branchiness 40 + content 30 + completeness 30 (formula: README, \`lib/score.mjs\`).

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

A copy has the calibration tree's layer-id set and content counts (README, "Family collapse"); its whole family is listed here and left out of the ranking. ★ = the family's representative (booted); \`~edited member\` = a family member whose own static counts or layer ids differ from the calibration tree's.

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
const cols = ['rank', 'full_name', 'play', 'mod_name', 'version_num', 'base', 'tmtNum', 'score', 's_branch', 's_content', 's_complete', 'layers', 'rows', 'widthPerRow', 'branchEdges', 'forkNodes', 'joinNodes', 'milestones', 'upgrades', 'buyables', 'challenges', 'achievements', 'content', 'pushed_at', 'archived', 'stars', 'members', 'boot_ok', 'deterministic', 'policy_ok', 'trace_fields', 'dev_added', 'dev_removed', 'dev_logic_added', 'dev_logic_removed', 'dev_stock', 'engine_moved', 'same_tree_as_ptr'];
const slim = rows.map((r) => ({ ...Object.fromEntries(cols.map((c) => [c, c === 'widthPerRow' ? (r[c] || []).join(',') : c === 'pushed_at' ? (r[c] || '').slice(0, 10) : c === 'play' ? (r.live_ok ? 'live' : r.live_url ? 'dead' : null) : r[c] ?? null])),
  url: r.url, calibration: r.calibration, live_url: r.live_url || null, live_ok: !!r.live_ok, live_status: r.live_status ?? null,
  family_members: r.calibration ? null : r.family_members, copies: r.calibration ? r.copies.map((x) => ({ n: x.full_name, u: x.url, v: x.tmtNum, e: x.edited, r: x.representative, l: x.live_ok ? x.live_url : null })) : null }));
const hesc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
.ab p:last-child{margin-bottom:10px}
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
td[data-c="play"],th[data-c="play"]{white-space:nowrap}
tbody tr:nth-child(even) td{background:var(--zeb)}
tbody tr.cal td{background:var(--hi)}
a{color:var(--acc)}
.dead{color:var(--mut);opacity:.7}
details.m{white-space:normal;max-width:100%;text-align:left}
details.m>summary{cursor:pointer;white-space:nowrap}
</style>
<script>try{document.documentElement.setAttribute('data-theme',localStorage.getItem('tmtcensus.theme')==='"light"'?'light':'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}</script>
</head><body>
<details class="about" id="about"><summary><h1>TMT Fork Census</h1> <span class="n">about \u00b7 methodology, provenance, how to read the table</span></summary><div class="ab">
<p>${hesc(METHOD)}</p>
<p>Generated ${GEN_DATE} from <code>data/*.jsonl</code> at commit <code>${hesc(DATA_COMMIT)}</code>${DATA_DIRTY ? ' (with uncommitted data changes)' : ''}. Source, method and raw rows: <a href="${REPO_URL}">${REPO_URL.replace('https://', '')}</a> (<a href="${REPO_URL}/blob/HEAD/results/SUMMARY.md">SUMMARY.md</a>). The <em>play</em> column links the repo's verified live page (stage 4); a greyed marker means the page exists in the repo's metadata but did not answer. Shaded rows are calibration clones; their copies are listed in the <em>members</em> column. Click a header to sort; drag a header's right edge to resize it (double-click that edge to reset); the table scrolls sideways inside its own frame.</p>
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
const text=new Set(['full_name','play','mod_name','version_num','base','tmtNum','widthPerRow','pushed_at','dev_stock','members']);
const KEYCOLS=['rank','full_name','play','mod_name','version_num','base','score','layers','rows','content','pushed_at','stars','members','boot_ok'];
const LS={get(k,d){try{const v=localStorage.getItem('tmtcensus.'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('tmtcensus.'+k,JSON.stringify(v))}catch(e){}}};
let hidden=new Set((LS.get('hidden',[])||[]).filter(c=>cols.includes(c)));
let widths=LS.get('widths',{})||{};
let key='rank',dir=1,dragging=false;
const h=document.getElementById('h'),b=document.getElementById('b'),q=document.getElementById('q'),cg=document.getElementById('cg'),cw=document.getElementById('cw'),cnt=document.getElementById('count');
const vis=()=>cols.filter(c=>!hidden.has(c));
function applyWidths(){let s='';for(const c of cols){const w=widths[c];if(w)s+='th[data-c="'+c+'"],td[data-c="'+c+'"]{width:'+w+'px;min-width:'+w+'px;max-width:'+w+'px}'}cw.textContent=s}
const EDGE=8,near=(th,x)=>th.getBoundingClientRect().right-x<=EDGE;let dragged=false;
function head(){h.replaceChildren(...vis().map(c=>{const th=document.createElement('th');th.dataset.c=c;th.className=(text.has(c)?'t':'');th.title=c+' \\u2014 click to sort, drag the right edge to resize, double-click it to reset';
th.appendChild(document.createTextNode(c+(key===c?(dir>0?' \\u25b2':' \\u25bc'):'')));
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
function list(label,items){const d=document.createElement('details');d.className='m';const s=document.createElement('summary');s.textContent=label;d.appendChild(s);items.forEach((it,i)=>{if(i)d.appendChild(document.createTextNode(', '));d.appendChild(it)});return d}
function draw(){const f=q.value.toLowerCase();const shown=vis();
const rs=rows.filter(r=>!f||(r.full_name+' '+(r.mod_name||'')+' '+(r.copies||[]).map(x=>x.n).join(' ')+' '+(r.family_members||[]).join(' ')).toLowerCase().includes(f));
rs.sort((x,y)=>{const a=x[key],c=y[key];if(a==null)return 1;if(c==null)return -1;return (a>c?1:a<c?-1:0)*dir});
cnt.textContent=rs.length+' of '+rows.length+' rows, '+shown.length+' of '+cols.length+' columns';
b.replaceChildren(...rs.map(r=>{const tr=document.createElement('tr');if(r.calibration)tr.className='cal';for(const c of shown){const td=document.createElement('td');td.dataset.c=c;if(text.has(c))td.className='t';
if(c==='full_name'&&r.url){td.appendChild(link(r.url,r.full_name));td.title=r.full_name}
else if(c==='play'){if(r.live_ok){const a=link(r.live_url,'\u25b6 play');a.target='_blank';a.rel='noopener';a.title='play '+(r.mod_name||r.full_name)+' at '+r.live_url;td.appendChild(a)}
else if(r.live_url){const s=document.createElement('span');s.className='dead';s.textContent='\u25b6 dead';s.title=r.live_url+' \u2192 HTTP '+r.live_status;td.appendChild(s)}}
else if(c==='members'&&r.copies)td.appendChild(r.copies.length?list(r.copies.length+' copies',r.copies.map(x=>{const a=link(x.u,x.n+(x.v?' ('+x.v+')':'')+(x.e?' ~edited':''));if(!x.l)return a;const f=document.createDocumentFragment();f.appendChild(a);const pl=link(x.l,' \u25b6');pl.target='_blank';pl.rel='noopener';pl.title='play '+x.n;f.appendChild(pl);return f})):document.createTextNode('0 copies'));
else if(c==='members'&&r.family_members&&r.family_members.length>1)td.appendChild(list(r.family_members.length+' members',r.family_members.map(n=>link('https://github.com/'+n,n))));
else{const v=r[c]==null?'':String(r[c]);td.textContent=v;if(v&&text.has(c))td.title=v}
tr.appendChild(td)}return tr}))}
function boxes(){cg.replaceChildren(...cols.map(c=>{const l=document.createElement('label'),cb=document.createElement('input');cb.type='checkbox';cb.checked=!hidden.has(c);
cb.onchange=()=>{if(cb.checked)hidden.delete(c);else hidden.add(c);LS.set('hidden',[...hidden]);head();draw()};
l.appendChild(cb);l.appendChild(document.createTextNode(c));return l}))}
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
