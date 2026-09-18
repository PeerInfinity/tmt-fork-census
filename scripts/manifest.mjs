// Loader manifest for ONE fork — everything a loader needs to replay the game, read back out of the census rows.
//   node scripts/manifest.mjs <owner/repo | calibration:Prestige-Tree> --id <id> [--out <file>]
//
// The manifest is a PIN of what the census OBSERVED at the recorded commit (script order, mod files, prestubs,
// the idle state hash), not a live description: a loader parses the fork's own index.html and can compare what it
// finds against this file. Nothing here is invented — every value comes from data/*.jsonl, results/table.json or
// the clone; anything the rows do not carry is written null.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { p, readJsonl, latestBy, safeName } from '../lib/util.mjs';
import { modInfoOf } from '../lib/scan.mjs';
import { CALIBRATION } from '../lib/calibration.mjs';
import { classifyLicenseText, licenseFilesIn } from '../lib/license-text.mjs';

const argv = process.argv.slice(2);
let TARGET = null, ID = null, OUT = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--id') ID = argv[++i];
  else if (argv[i] === '--out') OUT = argv[++i];
  else if (!argv[i].startsWith('--') && TARGET === null) TARGET = argv[i];
  else { console.error(`unexpected argument: ${argv[i]}`); process.exit(2); }
}
if (!TARGET || !ID) { console.error('usage: node scripts/manifest.mjs <owner/repo | calibration:Name> --id <id> [--out <file>]'); process.exit(2); }

// Stage 3 fetched these with the parent's CDN_LOGIC rule; Vue is UI, but a loader still has to vendor it.
const CDN_LOGIC = /break_eternity|omeganum|expantanum|decimal|bad[_-]?notations|logarithmica|notation/i;
const VENDOR = (url) => CDN_LOGIC.test(url) || /vue/i.test(url);
const git = (root, ...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim();

// ---- locate the row and the clone -----------------------------------------------------------------
const boot = latestBy(readJsonl(p('data/boot.jsonl'))).get(TARGET);
if (!boot) { console.error(`no data/boot.jsonl row for ${TARGET}`); process.exit(1); }
const stat = latestBy(readJsonl(p('data/static.jsonl'))).get(TARGET) || {};
const fork = latestBy(readJsonl(p('data/forks.jsonl'))).get(TARGET) || {};
const lic = latestBy(readJsonl(p('data/license.jsonl'))).get(TARGET) || {};
const cal = CALIBRATION.find((c) => c.full_name === TARGET);
const root = cal ? cal.local : p('clones', safeName(TARGET));
if (!fs.existsSync(path.join(root, 'index.html'))) { console.error(`no clone at ${root} (stage 3 clones it)`); process.exit(1); }

const tableFile = p('results/table.json');
const table = fs.existsSync(tableFile) ? (JSON.parse(fs.readFileSync(tableFile, 'utf8')).rows || []).find((r) => r.full_name === TARGET) : null;

// Repo identity: a fork names itself in data/forks.jsonl; a calibration clone names its upstream in its remote.
let repo = TARGET, url = `https://github.com/${TARGET}.git`, branch = fork.default_branch ?? null;
if (cal) {
  const origin = git(root, 'remote', 'get-url', 'origin');
  repo = (origin.match(/github\.com[:/](.+?)(?:\.git)?$/) || [])[1] || origin;
  url = origin.endsWith('.git') ? origin : origin + '.git';
  branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD');
  if (branch === 'HEAD') branch = null;
}
let commit = null;
try { commit = git(root, 'rev-parse', 'HEAD'); }
catch { try { commit = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/commits/HEAD`, '--jq', '.sha'], { encoding: 'utf8' })); } catch { commit = null; } }

// ---- index.html: script order and external resources ----------------------------------------------
// Same regex lib/boot.mjs boots with, so the order pinned here is the order the census loaded.
const htmlRaw = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
// COMMENTS FIRST. A loader parses the page the way a browser would, so a tag inside <!-- --> is not a load — and
// `load.external` is a list of decisions a loader has to make, not of strings that occur in the file. Measured:
// medsal15/The-Gaming-Tree has its Google-Fonts <link> commented out and a local font css beside it, and this
// emitter pinned a `drop` verdict for a URL the page never requests.
const html = htmlRaw.replace(/<!--[\s\S]*?-->/g, '');
const rel = (src) => path.posix.normalize(src.replace(/^\.?\//, '').replace(/[?#].*$/, ''));
const scripts = [], external = {};
let inline = 0;
for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  const attrs = m[1], src = (attrs.match(/\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1];
  if (/type\s*=\s*["']module["']/i.test(attrs)) continue; // a loader skips these; so does lib/boot.mjs
  if (src) {
    if (/^(https?:)?\/\//i.test(src)) external[src] = VENDOR(src) ? 'vendor' : 'drop';
    else scripts.push(rel(src));
  } else if (m[2].trim()) scripts.push(`inline#${++inline}`);
}
// ONLY STYLESHEETS. A loader re-creates `<link rel=stylesheet>`; every other <link> — `icon`, `preconnect`,
// `manifest` — it does not re-create at all, so there is no verdict for it to honour and an entry here is drift
// it can never satisfy. Absolute ASSET urls anywhere in the tree are a different thing and have their own place:
// the loader's `load.known.externalHosts`. Measured: Askinga/The-MJ-Tree pins a favicon on ngfiles.com,
// denisolenison/The-Leveling-Tree two bare `preconnect` hosts.
for (const m of html.matchAll(/<link\b([^>]*)>/gi)) {
  const attrs = m[1];
  if (!/\brel\s*=\s*["'][^"']*\bstylesheet\b/i.test(attrs)) continue;
  const href = (attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i) || [])[1];
  if (href && /^(https?:)?\/\//i.test(href)) external[href] = VENDOR(href) ? 'vendor' : 'drop';
}

const b = boot.boot || {};
const renderOnly = (b.files_skipped || []).filter((s) => s.why === 'render-only').map((s) => s.file);
const modFiles = b.modFiles ?? (b.modFiles_without_loader || null);
// The loader's own prefix where loader.js declared one, else the prefix the boot actually resolved the files with.
const prefixFromLoad = () => {
  const f0 = (modFiles || [])[0]; if (!f0) return null;
  const hit = (b.files_loaded || []).find((f) => f === f0 || f.endsWith('/' + f0));
  return hit ? hit.slice(0, hit.length - f0.length) || null : null;
};
// The prefix is a property of what loader.js DECLARES, not of whether the mod happens to list any files. A game
// with an empty `modInfo.modFiles` still has the declaration, and a loader reads it off the source — so gating
// this on `modFiles.length` pinned `null` against a live `js/`, drift nothing could resolve. Measured on
// c0v1d-9119361/The-Plague-Tree and shenmi124/The-Game-Tree.
// The declaration is read with the SAME rule as the loader's `loaderPrefixOf` (tmt-loader loader/interpret.mjs):
// the string literal in `"<prefix>" + modInfo.modFiles[`. Keep the two in step.
const loaderPrefixFromSource = () => {
  const entry = (b.files_loaded || []).find((f) => /(^|\/)loader\.js$/i.test(f))
    || (scripts.find((f) => /(^|\/)loader\.js$/i.test(f)));
  if (!entry) return null;
  const f = path.join(root, entry);
  if (!fs.existsSync(f)) return null;
  const m = fs.readFileSync(f, 'utf8').match(/["'`]([^"'`]*)["'`]\s*\+\s*modInfo\.modFiles\s*\[/);
  return m ? m[1] || null : null;
};
const modFilesPrefix = (modFiles && modFiles.length ? (b.modFiles_prefix ?? prefixFromLoad()) : null) ?? loaderPrefixFromSource();

// ---- modInfo (lib/scan.mjs, not a second regex) ---------------------------------------------------
const modPath = boot.engine_located?.mod
  || (b.files_loaded || []).find((f) => /(^|\/)mod\.js$/i.test(f))
  || 'js/mod.js';
const mi = modInfoOf(fs.existsSync(path.join(root, modPath)) ? fs.readFileSync(path.join(root, modPath), 'utf8') : null);
// 2.5+ engines key the save on getModID() = modInfo.id ?? `${name}-${author}` (spaces hyphenated); older ones on
// modInfo.id alone. Which rule applies is read off the clone, not assumed from the engine version.
const hasGetModID = (b.files_loaded || []).some((f) => {
  try { return /\bgetModID\s*(=|\()/.test(fs.readFileSync(path.join(root, f), 'utf8')); } catch { return false; }
});
const hyph = (s) => String(s).replace(/\s+/g, '-');
const keyRule = mi.id ? 'modInfo.id' : hasGetModID ? 'getModID (modInfo.id ?? name-author)' : null;
const saveKey = mi.id ?? (hasGetModID && mi.name && mi.author ? `${hyph(mi.name)}-${hyph(mi.author)}` : null);

// ---- license: the FILES' text, not GitHub's detector ----------------------------------------------
const files = {};
for (const f of licenseFilesIn(root)) files[f] = classifyLicenseText(fs.readFileSync(path.join(root, f), 'utf8')).verdict;
const verdicts = Object.values(files);
const licenseVerdict = !verdicts.length ? null
  : verdicts.every((v) => v === 'MIT') ? 'MIT'
  : Object.entries(files).map(([f, v]) => `${f}=${v}`).join('; ');

const c = b.census || {};
const dev = boot.engine_deviation || {};
const manifest = {
  schema: 1,
  id: ID,
  name: mi.name ?? stat.mod_name ?? null,
  version: mi.version_num ?? stat.version_num ?? null,
  author: mi.author ?? stat.author ?? null,
  upstream: { repo, url, branch, commit, pushed_at: fork.pushed_at ?? table?.pushed_at ?? null },
  engine: {
    tmtNum: boot.tmtNum ?? null,
    stock_commit: dev.stock_commit ?? null,
    moved: !!boot.engine_moved,
    deviation: { added: dev.added ?? null, removed: dev.removed ?? null },
  },
  entry: 'index.html',
  load: {
    onload: b.onload ?? null,
    scripts,
    renderOnly,
    modFilesPrefix,
    modFiles: modFiles ?? [],
    external,
    vendor: {},
  },
  save: { keyRule, key: saveKey },
  headless: {
    prestubs: b.prestubs ?? [],
    renderStubs: b.render_stubs ?? [],
    idleHash: { ticks: b.ticks ?? null, diff: 0.05, hash: b.state_hash ?? null },
    deterministic: boot.deterministic ?? null,
  },
  license: { githubSpdx: lic.license ?? null, files, verdict: licenseVerdict },
  census: {
    full_name: TARGET,
    head: boot.head ?? null,
    score: table?.score ?? null,
    layers: c.layers ?? null,
    rows: c.rows ?? null,
    milestones: c.milestones ?? null,
    upgrades: c.upgrades ?? null,
    buyables: c.buyables ?? null,
    challenges: c.challenges ?? null,
    achievements: c.achievements ?? null,
    trace_fields: b.milestone_trace?.distinct_fields ?? null,
  },
  generated: {
    by: 'tmt-fork-census scripts/manifest.mjs',
    commit: git(p('.'), 'rev-parse', '--short', 'HEAD'),
    at: new Date().toISOString(),
  },
};

const json = JSON.stringify(manifest, null, 2) + '\n';
if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, json); console.error(`wrote ${OUT}`); }
else process.stdout.write(json);
