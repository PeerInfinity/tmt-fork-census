# The pipeline, stage by stage

What each stage of [the census](README.md) actually does, and the rules it applies. The commands and their
outputs are in the README's stage table; this file is the detail behind them. The ranked table's columns are
documented separately in [COLUMNS.md](COLUMNS.md).

**Manifest** (not a stage). `node scripts/manifest.mjs <owner/repo | calibration:Name> --id <id> [--out <file>]`
emits one JSON object (schema 1, stdout by default) describing a single game for a loader: its `modInfo`
name / version / author, the upstream repo, branch and **full** commit sha, the engine version with its stock
baseline and deviation, the local script list in `index.html` order (render-only files included and marked),
`modInfo.modFiles` with the loader's own path prefix, every external URL classified `vendor` (Vue, number and
notation libraries) or `drop` (fonts, analytics), the save key and the rule that produces it (`modInfo.id`, or
2.5+'s `getModID`), the headless facts (prestubs, render stubs, the idle state hash after 200 ticks,

deterministic) and the per-file license verdict. Every value is read back out of `data/*.jsonl`,
`results/table.json` and the clone — nothing is recomputed and nothing is invented; a field the rows do not
carry is written `null`. The manifest is therefore a **pin of what the census observed** at the recorded
commit, not a live description: a loader parses the game's own `index.html` and can compare what it finds
against this file. Manifests are not committed here (the loader repo is their home), and this script reads
`data/` — it never writes it.

`load.external` and `load.modFilesPrefix` describe **what a loader has to decide**, so they are read the way a
loader reads the page rather than the way a string search sees it: HTML comments are stripped first, `type=module`
scripts are skipped, and only `<link rel=…stylesheet…>` counts. A loader never re-creates an `icon`, `preconnect`
or `manifest` link, so a verdict for one is drift nothing can satisfy; absolute ASSET urls anywhere in the tree
are a different thing, and the loader has `load.known.externalHosts` for them. `modFilesPrefix` is whatever
`loader.js` DECLARES, even when `modInfo.modFiles` is empty, because the declaration is what a loader reads.

### 1. List
Both roots (`Acamaeda/The-Modding-Tree`, `Jacorb90/Prestige-Tree`), `GET /repos/{r}/forks?per_page=100`
paginated, recursing one level into every fork with `forks_count > 0`. **The Modding Tree is itself a fork of
Prestige Tree**, so PT's `forks_count` (1,892 when measured) is the *network* count and its direct fork list is
short; TMT's forks are listed at depth 1 under TMT and again at depth 2 under PT (de-duplicated by name).
A fork is **untouched** when `pushed_at <= created_at` (a fork inherits its parent's last push). Untouched
rows are kept, flagged, and skipped by stage 2.

### 2. Static
For every touched fork, raw files at `HEAD`: `index.html`, `js/game.js`, `js/mod.js`, and the content files —
`js/layers.js`, every `modInfo.modFiles` entry, and every local `<script>` in `index.html` whose path never
appears in any stock TMT commit (older forks add layer files as script tags, not `modFiles`). ≤ 4 concurrent,
3 retries with backoff; a 404 is recorded in the row's `http` map. A small lexer (`lib/scan.mjs`: skips strings,
templates and comments; brace matching; depth-0 keys — no AST) extracts per layer: `row`, `branches`, and the
numeric-id counts of milestones / upgrades / buyables / challenges / achievements / clickables. Legacy
Prestige Tree forks (no `tmtNum`) use `var layers = { id: {…} }` and are parsed from its top-level keys.
Branchiness follows `probes/branchiness.mjs`: layers with a numeric row; width per row; branch edges
(`branches: ["p"]` on `b` = edge p→b); fork nodes (out-degree ≥ 2); join nodes (in-degree ≥ 2); `linear` =
max width ≤ 1. **Trivial** (flagged, not dropped) = any of: ≤ 2 layers, `layers.js` identical to a stock demo
with no other content file, no branch edges.

**Moved engines** (`lib/engine.mjs`). When `js/game.js` has no `tmtNum` (404, or a fork that renamed/moved its
engine — `js/technical/game.js`, `shared/js/game.js`, `Javascript/Game.js`), the engine is located **by content, not
path**: every local `<script>` of `index.html` is fetched, and if none carries an engine marker, every `.js` file of the
repo tree (one `git/trees` API call, cached). Markers: the game file defines `tmtNum:` (`TMT_VERSION`); `function
gameLoop(`; `function updateTemp(`; the mod file defines `modInfo = {`. The located game file supplies `tmtNum`
(`engine_located`, `engine_moved`), a moved mod file supplies `modInfo`, and for a moved engine the content set drops
every located engine file and every script whose path-independent name (basename, lower-cased, non-alphanumerics
dropped: `BreakEternity.js` ≡ `break_eternity.js`) is a stock engine name. `modFiles` are resolved against the fork's
own loader prefix (`"Javascript/" + modInfo.modFiles[i]`), `js/` in stock. Re-run only these rows with
`REDO_ENGINE=no-game-js,tmt-no-tmtNum,unknown node scripts/2-static.mjs` (removes those rows, and rows a previous run
located, before re-censusing).

### 3. Boot
**Shortlist score** = branch edges × content (milestones + upgrades + buyables + challenges + achievements),
0 for trivial rows (`lib/score.mjs: shortlistScore`). Rows are grouped into **families** — the same layer-id
set on the same `tmtNum` (copies and light edits of one game); the best-scoring member represents it (ties — copies score the same — go to the most
stars, then the most-copied content hash, i.e. the unmodified game rather than someone's broken edit, then the
latest push), and every family with a shortlist score > 0 is booted (slice 1 booted the top 60; slice 2 ran `SHORTLIST=1000`, i.e. all 195, in 9.2 min for the 135 not yet booted), plus three calibration rows from local clones
(`~/CC/Prestige-Tree`, `~/CC/The-Modding-Tree`).

Per row: `git clone --depth 1` into `clones/`; **engine deviation** = `git diff --no-index --numstat` of every
engine file in the stock commit for the fork's `tmtNum` (`index.html`, `style.css`, `css/*.css`, `js/*.js` except
`layers/mod/tree.js`, `js/technical/*`, `js/utils/*`) against the fork's copy. A stock file missing at its path is first **relocated** — for a moved engine the located
game / `updateTemp` file, else the fork file with the same path-independent name and extension (the one `index.html`
loads first, then the shortest path), recorded as `relocated`; this applies to every row, so a half-moved engine is
measured too — and a file with no relocation counts as all lines removed. A fork whose `js/game.js` has no `tmtNum`
gets it from the engine located by content, as in stage 2; also a whitespace-insensitive total and a *logic* subtotal (`game.js`, `utils.js`, `utils/*`,
`technical/{temp,layerSupport,displays,loader}.js`). The stock map (`lib/tmt-stock.mjs`) takes, for each
`tmtNum`, the last first-parent commit still carrying it (2.2.1 → `360d8ac`); an unknown version resolves to the
nearest lower one and the row says so. Many commits share one `tmtNum` (2.6.6.2 spans 2021-09 to 2024-10), so
the reported deviation is against the **closest** of them (fewest changed lines; candidates de-duplicated by
engine blob ids), with the last-commit figure kept as `vs_last`. PTR measures the same against both
(`360d8ac`: +1137/−242, reproducing plan §10b except `index.html` +178/−52 where §10b says +179/−53).

Then four child processes (`lib/boot.mjs`, one fork per process — sloppy-mode globals leak): two **idle** legs
(200 ticks × `gameLoop(0.05)`, no input) — **deterministic** = same state hash and tick count, and on a miss the
differing `player.<k>` / `player.<layer>.<k>` paths are recorded — and two **policy** legs (each tick: reset any
row-0 layer that can reset, buy any affordable unlocked upgrade), recorded but not failing the boot. The boot:
script order from `index.html` (inline scripts included); `loader.js` (matched case-insensitively) is skipped and `modInfo.modFiles` are loaded, with the loader's own path prefix,
**after the last static script** (a browser runs `async=false` inserted scripts after the parser's own, and forks
depend on it — top-level `format(...)` calls in mod files); render-only files skipped (`components.js`,
`systemComponents.js`, `canvas.js`, `particleSystem.js`, `vue*.js`) and every top-level function they declare
stubbed if nothing else defines it; CDN scripts skipped except number/notation libraries (`break_eternity`,
`OmegaNum`, `bad_notations`, …), which the parent fetches once into `cache/cdn/`; DOM/`Vue`/`app` are recording
stubs. A `ReferenceError` inside `load()` makes the child report the name and the parent re-spawns it with that
name pre-stubbed (≤ 12 times; recorded as `prestubs`) — retrying `load()` in one process is not idempotent
(`setupTemp` re-wraps cost functions → stack overflow). Census from the live `layers` object (a boot that sees 0 layers where the static census saw some keeps the
static numbers, flagged `boot_census_empty` — e.g. layers registered per story act read from the save); milestone `done()` `player`-field
Proxy trace (distinct fields). Hygiene: `process`, `require`, `fetch`, `Buffer` are deleted from the global
before any game file runs and children get a scrubbed environment — this runs other people's code.
Time box: `BUDGET_MIN` (default 180) wall minutes; the row count that ran is in the log and SUMMARY. Re-boot rows with
`REBOOT_LOCATED=1` (every row whose engine stage 2 located by content) or `REBOOT=o/r,o/r`; their old lines are removed
first.

### 4. Live
Where the game can actually be played. No repo metadata is fetched: stage 1 already reads `homepage` and
`has_pages` off the `/forks` listing, and the live URL is derived from them by one rule —
`homepage` when it is an `http(s)` URL (`live_source: homepage`), else `https://<owner>.github.io/<repo>/` when
`has_pages` (`live_source: pages`), else no row. Each derived URL is then **verified** with one GET (redirects
followed, 10 s timeout, 4 at a time): `live_status` is the HTTP code or `"error"`, and `live_ok` is true for
2xx/3xx. A dead URL keeps its row, so the table can show it greyed with its status instead of silently dropping it.
Per-URL results are cached under `cache/live/` (no body stored, and no GitHub token is sent to third-party hosts);
repos already in `data/live.jsonl` are skipped. `--recheck` ignores both.

Calibration rows are local clones, so only PTR has a public page; its URL comes from the upstream repo's own
GitHub metadata (`https://jacorb90.github.io/Prestige-Tree/`, which redirects to `https://jacorb90.me/Prestige-Tree/`)
rather than being written down here. Stock TMT's Pages site is the engine's demo tree, not a game, so it gets no
live URL.

`rank.mjs` joins the rows on `full_name` and carries `live_url`, `live_status`, `live_ok` and `live_source` into
`results/table.json`, a `play` column in `results/SUMMARY.md` and the `play` column of the page (also on each
calibration copy).

### 5. License
What each repo declares. No request is made: stage 1 cached the full repository objects
(`cache/api/**/forks-p*.json`) and GitHub reports the license on the repository object, so all 1,914 forks are
read out of that cache; a repo missing from it would fall back to `GET /repos/{o}/{r}`, cached the same way
(measured: 0 such repos). `license.spdx_id` is quoted verbatim — `MIT`, `NOASSERTION` for a license file
[licensee](https://github.com/licensee/licensee) could not match, and `null` (shown as `none`) when no license
file was detected at all.

**Nearly every row reads `NOASSERTION`, and that is a detector result, not a legal one.** The TMT lineage's
`LICENSE` is a standard MIT text with a non-standard copyright line (`Modding Tree Copyright (c) 2020 Acamaeda`)
next to a second file, `Prestige-tree-license`; licensee therefore classifies the repo as "Other". Measured over
the 1,914 forks: NOASSERTION 1,907, MIT 6, none 1. `none` does not mean the code is unencumbered — a fork of an
MIT project that dropped the file is still bound by the upstream terms.

Calibration rows have no GitHub repo of their own, so their licenses are read from the files in the local clone:
PTR and stock TMT both carry the two MIT texts → `MIT`. A calibration row whose own files do not tell the whole
story can carry a note (`CAL_NOTE` in `scripts/5-license.mjs`); none does at present.

**Read as text, the two chosen games are plain MIT.** `lib/license-text.mjs: classifyLicenseText` answers the
question licensee does not: it strips the copyright line, normalises whitespace, and compares what is left against
the canonical MIT text (this repository's own `LICENSE`). Measured on all four license files of the two games —
`Jacorb90/Prestige-Tree` (the PTR calibration clone) and `Justcubing97/JC97sSomethingTree`, which GitHub reports
as `MIT` and `NOASSERTION` respectively — every one is the MIT permission and warranty text **verbatim**, and the
only difference is the copyright line: `LICENSE` reads `Modding Tree Copyright (c) 2020 Acamaeda` and
`Prestige-tree-license` reads `Prestige Tree Copyright (c) 2020 Jacorb` in both repos (the two `LICENSE` files are
byte-identical to each other, as are the two `Prestige-tree-license` files). So the `NOASSERTION` on the Something
Tree row is the detector refusing to name a file whose copyright line it cannot parse, not a repository under
unknown terms. `scripts/manifest.mjs` runs this per-file check over every license-like file at the clone root
(`LICENSE*`, `*license*`, `COPYING*`) and reports both GitHub's `spdx_id` and its own verdict; a text that keeps
the MIT paragraphs but changes them reads `MIT-modified`, and anything else `other`. This is a text comparison,
not legal advice.

### 6. Loader
Where the game can be played when its own page cannot: [tmt-loader](https://github.com/PeerInfinity/tmt-loader)
hosts census games as pristine copies, each loaded on its own engine with no CDN and a namespaced save (automation
tools appear only with `?automation=1`). No request is made: the stage reads the loader's `manifests/index.json` and
every `manifests/<id>.json` out of a local loader checkout (`LOADER_REPO`, default `~/CC/tmt-loader`) with
`git show <LOADER_COMMIT>:…` — never the working tree — so the column is pinned to one loader commit and reproducible.
Each manifest's `upstream.repo` is joined onto the census case-insensitively: a fork on its `full_name`, a calibration
row on its upstream repo (the loader's `ptr` is `Jacorb90/Prestige-Tree`, i.e. `calibration:Prestige-Tree`), as
stage 4 does for PTR's live page. A joined row records `loader_id`, `loader_url` (`LOADER_BASE` + `?mod=<id>`, the
base defaulting to `https://peerinfinity.github.io/tmt-loader/`), `loader_mobile_url`, `loader_commit`, the upstream
commit the loader copied and the loader's per-file license verdict. `loader_mobile_url` is that same URL plus
`&mobile=1` — the loader's mobile layout — and is emitted **only when the pinned commit carries that mode**, read at
the pin (`loader/mobile.css` present and `loader/page.js` branching on the parameter). The pin can be older than the
feature, and a loader that does not know `?mobile=1` ignores it silently, so the link would quietly open the desktop
layout while the column claimed otherwise. The file is rewritten whole on every run, so two runs are
byte-identical; a manifest that joins no census repo is printed, not written.

The loader also records what it **looked at and declined**, and why (`manifests/declined.json`), read at the same
pinned commit. That judgement belongs on its side — it made the attempt and saw the evidence — so the census joins
it rather than forming an opinion of its own. A repo cannot be both hosted and declined: the loader gates that, and
the duplicate check here would catch it too. A pin older than the file simply yields no declined rows.

`rank.mjs` joins the rows on `full_name` and carries `loader_url`, `loader_mobile_url`, `loader_id` and
`loader_commit` into `results/table.json`, a `loader` and a `mobile` column in `results/SUMMARY.md` and on the page —
for every ranked row the loader hosts, including rows that also have a live page — plus `declined_reason`, which
feeds the `why not hosted` column. Where the loader has no reason for an unhosted row, that column says only what
the census measured itself (a boot that failed here, a repo never cloned); it does **not** re-derive the loader's
size policy, because a game declined for size is declined in that list with the measured number in its reason. The
stage also names the loader commit and base in SUMMARY's provenance line
and the page's about block. A hosted repo that is not a ranked row (a family member or a calibration copy) is named in
the funnel.

### 7. Size
Two different numbers, because they answer different questions and diverge badly:

- **`checkout_bytes` / `checkout_files`** — the working tree at the commit the census booted, `.git` excluded,
  measured from `clones/<owner>__<repo>`. This is *the game*: what a copy costs to host, and what a
  `git subtree add` puts in a loader. It is the number to judge "is this small enough" by.
- **`repo_kb`** — what GitHub reports for the repository (stage 1's `size` field): packed, and **including all
  history**. That is what cloning the fork costs.

Over the ranked rows the two diverge by a **median of 3×, a maximum of 34×, and in both directions**. A repo with
a heavy history reads far larger than its game — `Askinga/The-MJ-Tree`, 23.5 MB reported against 0.7 MB of files.
A repo full of incompressible PNGs reads smaller — `hanlaosan1/The-Wall-Tree`, 36.5 MB reported against 70.8 MB of
files. Neither is a usable proxy for the other, so the table carries both and the column descriptions say so.

The checkout is measured from the clones stage 3 made, which are gitignored, so this stage — like stage 3 —
produces rows only for repos cloned on the machine that runs it. It is resumable: a row whose `head` still matches
is kept, so a re-run after a new boot batch measures only what is new. `--recheck` re-measures everything.

## Rank
`lib/score.mjs: composite`, 0–100:

- **branchiness 40** × min(1, (fork nodes + join nodes) / 30), × 0.25 when linear (PTR has 30 nodes);
- **content 30** × min(1, log10(1 + content) / log10(401)) (PTR's content is 398);
- **completeness 30** = 10 endgame differs from the stock demo's `e280000000` + 10 × recency (last push ≤ 1 year
  before the census date → 1, linear to 0 at 5 years) + 5 version string not `0.0` + 5 boots headless (2.5 when
  not booted, 0 when the boot failed);
- a **failed boot halves** the total (a game that crashes at load in its own engine is not a candidate until fixed).

### Family collapse
Applied by `rank.mjs` after every family has a representative, against each calibration row (`lib/calibration.mjs`;
its layer ids and counts come from stage 2's static census run on the local clone, its live numbers from its boot).

- **(a) Copy.** A family whose representative has the calibration tree's **layer-id set** and the same **static
  content counts** (milestones / upgrades / buyables / challenges / achievements) — and, where both booted with a
  census, the same live game-layer count and content counts (PTR: 28 layers / 85 / 172 / 52 / 9 / 80) — is a copy.
  The **whole family** moves into the calibration row's `copies` (name, link, `tmtNum`, `representative`, and
  `edited` when that member's own static ids or counts differ) and leaves the ranked table. The engine version is
  not part of the test: PTR's mod files dropped onto a 2.6.6.2 engine is still a copy of PTR (its `tmtNum` is listed).
- **(b) Family.** Every other family keeps one representative (the stage-3 rule) and carries `members` (count) and
  `family_members` (names).
- **(c) Base.** A representative whose layer-id set **contains** a calibration tree's (strictly more ids, or the same
  ids with different counts) is that tree **plus added or changed content** (NG+, Extended Tree) — not a copy. It stays
  ranked, marked `base: PTR`. A calibration tree with ≤ 2 layer ids (the trivial threshold: stock TMT's demo) is never
  a base. A fork that renamed any of the tree's layers matches neither (a) nor (c).

`archived` is shown, not scored (finished and abandoned games both get archived). Engine deviation is a
separate column, not folded into the score. Boot-exact numbers replace static ones where a boot row exists.
