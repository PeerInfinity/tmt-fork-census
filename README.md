# tmt-fork-census

A census of the **The Modding Tree / Prestige Tree** fork family on GitHub: which forks are games with a
*branching* prestige tree, enough content to randomize, and some sign of completeness — and, for the
shortlist, how far each one's engine deviates from stock TMT (the cost of porting it to a newer engine).

**AI disclosure.** The code, the documentation and the results page in this repository were AI-generated (Claude Code sessions directed by PeerInfinity, who set the questions and reviewed the output). Every number is produced by the scripts here, run against the GitHub API and the forks' own source files, and can be regenerated from `data/*.jsonl`.

Results: [`results/SUMMARY.md`](results/SUMMARY.md) (ranked table + funnel), [`results/table.json`](results/table.json)
(the same rows), [`docs/index.html`](docs/index.html) (a static sortable table, data inline, no CDN — Pages-ready).
Raw census rows: `data/*.jsonl`.

**What is committed.** The data are **GitHub metadata and counts, not code**: repository names, dates, stars and fork
parents from the GitHub API; per-fork counts (layers, rows, branch edges, milestones, upgrades, …), content hashes,
engine-diff line counts, boot outcomes and state hashes. The only text taken from the forks is identifying strings
(`modInfo` name/author, version strings, layer ids), the endgame expression (≤ 160 chars) and boot error messages
(≤ 300 chars). No fork source is committed: the fetched raw files (`data/raw/`), the clones (`clones/`) and the
stock-engine and CDN caches (`cache/`) are gitignored. Committed JSON names no local absolute path (`lib/util.mjs:
scrub` writes `.` for the repo root and `~` for the home directory).

Survey code, not product code. Node ≥ 18, no npm dependencies. Needs `gh` authenticated (stage 1 API calls;
its token also raises the raw-file rate limit) and, for stages 2–3, a local clone of
`Acamaeda/The-Modding-Tree` (default `~/CC/The-Modding-Tree`, override with `TMT_REPO`) — the stock-engine
history is read from it.

## Stages

Every stage appends to a JSONL file and skips rows already present, so any stage can be killed and re-run to
resume. To redo a row, delete its line. Network responses are cached (`cache/api/`, `data/raw/`; both
gitignored — the raw cache is third-party code).

| stage | command | output |
|---|---|---|
| 1. list | `node scripts/1-list.mjs` | `data/forks.jsonl` |
| 2. static | `node scripts/2-static.mjs` (`LIMIT=n`, `ONLY=o/r,o/r`) | `data/static.jsonl` |
| 3. boot | `node scripts/3-boot.mjs` (`SHORTLIST=60`, `BUDGET_MIN=180`) | `data/boot.jsonl`, `data/shortlist.json`, `clones/` (gitignored) |
| 4. live | `node scripts/4-live.mjs` (`--recheck`) | `data/live.jsonl`, `cache/live/` (gitignored) |
| 5. license | `node scripts/5-license.mjs` (`--recheck`) | `data/license.jsonl` |
| rank | `node scripts/rank.mjs` | `results/SUMMARY.md`, `results/table.json`, `docs/index.html` |

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
(`~/CC/Prestige-Tree`, `~/CC/The-Modding-Tree`, `~/CC/upgrade-land-tmt`).

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
rather than being written down here. Stock TMT's Pages site is the engine's demo tree, not a game, and
`upgrade-land-tmt` is local-only: neither gets a live URL.

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
PTR and stock TMT both carry the two MIT texts → `MIT`; `upgrade-land-tmt` carries TMT's MIT for the engine while
Upgrade Land's own data ships with no license of its own → `MIT (engine) / none (data)`.

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

## Columns

The ranked table's columns, in order — the same definitions drive the page's header tooltips and its Columns
legend (`COLDEFS` in `scripts/rank.mjs`; this block is regenerated by that script).

<!-- columns:start (generated by scripts/rank.mjs from COLDEFS — do not edit by hand) -->

| column | what it is | format |
|---|---|---|
| `rank` (Rank) | Position in this table, highest composite score first. | 1–N over the ranked rows; calibration clones are ranked alongside the forks |
| `full_name` (Repository) | The GitHub repo this row stands for — a family's representative fork, or a local calibration clone. | owner/name, linking to github.com; a calibration row links to its upstream repo |
| `play` (Play) | The row's live game page, derived from the repo's homepage or its GitHub Pages URL and verified with one GET (stage 4). | ▶ play = answered 2xx/3xx; a greyed ▶ dead names the status in its tooltip; empty = no URL could be derived |
| `mod_name` (Game name) | The game's own title, read from modInfo.name in js/mod.js. | text, exactly as the fork wrote it |
| `version_num` (Version) | The game's own version string, from modInfo.versionNumber. | text; the stock demo's "0.0" earns no completeness point |
| `base` (Base game) | The calibration tree this game is built on: its layer-id set contains that tree's, so it is that game plus added or changed content (README, Family collapse (c)). | PTR, TMT or upgrade-land-tmt; empty when it is not built on one |
| `tmtNum` (Engine version) | The Modding Tree engine the fork runs, from tmtNum in js/game.js — or, when the engine was moved off the stock paths, from the engine located by content. | e.g. 2.6.6.2; empty when nothing declares it |
| `score` (Score) | The composite ranking, branchiness 40 + content 30 + completeness 30, halved when the boot failed (lib/score.mjs: composite). | 0–100, two decimals |
| `s_branch` (Branchiness) | The branchiness part of the score: 40 × min(1, (fork nodes + join nodes) / 30), × 0.25 when the tree is linear. | 0–40; the /30 is PTR's 30 nodes |
| `s_content` (Content score) | The content part of the score: 30 × min(1, log10(1 + content) / log10(401)). | 0–30; the 401 is PTR's content of 398 |
| `s_complete` (Completeness) | The completeness part: 10 for an endgame differing from the stock demo's, 10 × recency of the last push (≤ 1 year → 1, falling to 0 at 5), 5 for a version that is not 0.0, 5 for booting headless (2.5 not booted, 0 failed). | 0–30 |
| `layers` (Layers) | How many game layers the tree has — from the live layers object where the fork booted, else stage 2's static lexer. | count |
| `rows` (Tree rows) | How many distinct rows the tree layout declares — how deep the tree is. | count |
| `widthPerRow` (Width per row) | How many layers sit in each tree row, top row first — the tree's shape in one line. | comma-separated counts, one per row |
| `branchEdges` (Branch edges) | Edges in the branch DAG: every layer-to-layer prerequisite link the tree declares. | count |
| `forkNodes` (Fork nodes) | Layers with ≥ 2 children in the branch DAG — where the tree splits. | count; fork + join nodes drive the branchiness score |
| `joinNodes` (Join nodes) | Layers with ≥ 2 parents in the branch DAG — where branches merge. | count; fork + join nodes drive the branchiness score |
| `milestones` (Milestones) | Milestones counted across the game's layers (boot-exact where the fork booted, else the static census). | count |
| `upgrades` (Upgrades) | Upgrades counted across the game's layers. | count |
| `buyables` (Buyables) | Buyables counted across the game's layers. | count |
| `challenges` (Challenges) | Challenges counted across the game's layers. | count |
| `achievements` (Achievements) | Achievements counted across the game's layers. | count |
| `content` (Content total) | Total content = milestones + upgrades + buyables + challenges + achievements. | count; this is what the content score reads |
| `pushed_at` (Last push) | When the repository was last pushed to, from the GitHub API. | YYYY-MM-DD; drives the recency half of completeness |
| `archived` (Archived) | Whether GitHub marks the repository archived — shown, never scored, since a finished game and an abandoned one both get archived. | true / false |
| `stars` (Stars) | The repository's stargazer count from the GitHub API. | integer; used only to break ties when picking a family's representative |
| `members` (Members / copies) | For a fork row, how many repos share this game (the same layer-id set on the same engine version); for a calibration row, how many forks are exact copies of it and have left the ranking (README, Family collapse). | count; the cell expands to the list |
| `boot_ok` (Boots) | Whether the game loaded and ran 200 headless ticks in its own engine (stage 3). | true / false; empty when the family was not booted, and a false halves the score |
| `deterministic` (Deterministic) | Whether the two idle boot legs ended on the same state hash after the same number of ticks. | true / false; a false row lists the differing player paths in SUMMARY.md |
| `policy_ok` (Policy leg) | Whether the second boot leg survived a generic play policy (each tick: reset any row-0 layer that can reset, buy every affordable unlocked upgrade). | true / false; recorded, never scored |
| `trace_fields` (Milestone fields) | How many distinct player fields the milestone done() conditions read, traced through a Proxy — a rough measure of what the game's goals depend on. | count |
| `dev_added` (Engine lines added) | Engine lines added against the closest stock TMT commit of the fork's version — the port cost. | git diff --numstat line count over the stock engine files |
| `dev_removed` (Engine lines removed) | Engine lines removed against that same stock commit; a stock file with no counterpart in the fork counts as wholly removed. | git diff --numstat line count |
| `dev_logic_added` (Logic lines added) | The share of the added lines that lands in the logic files (game.js, utils.js, utils/*, technical/temp, layerSupport, displays, loader). | line count, a subset of engine lines added |
| `dev_logic_removed` (Logic lines removed) | The share of the removed lines that lands in those same logic files. | line count, a subset of engine lines removed |
| `dev_stock` (Stock baseline) | Which stock TMT commit the engine deviation was measured against (many commits share one tmtNum, so it is the closest of them). | version@commit; "(nearest lower)" when the fork's version is not in the stock map |
| `engine_moved` (Engine moved) | Whether the fork moved its engine files off the stock paths, so they had to be located by content before diffing. | true / false |
| `same_tree_as_ptr` (Same tree as PTR) | Whether the booted game's live row roster is exactly Prestige Tree Rewritten's — flagged so a near-copy is not read as a new game. | true / false |
| `license` (License) | The license GitHub detected on the repository at census time — its license.spdx_id, quoted as reported and not a legal determination; "none" means GitHub detected no LICENSE file, which does not free the code, since a fork of an MIT project without the file is still bound by the upstream terms. | SPDX id, e.g. MIT; NOASSERTION = a license file licensee could not match (the TMT lineage's MIT text carries a non-standard copyright line, so nearly every row reads this); calibration rows are read from their clone's own files |

<!-- columns:end -->

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
