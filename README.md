# tmt-fork-census

A census of the **The Modding Tree / Prestige Tree** fork family on GitHub: which forks are games with a
*branching* prestige tree, enough content to randomize, and some sign of completeness — and, for the
shortlist, how far each one's engine deviates from stock TMT (the cost of porting it to a newer engine).

Results: [`results/SUMMARY.md`](results/SUMMARY.md) (ranked table + funnel), [`results/table.json`](results/table.json)
(the same rows), [`docs/index.html`](docs/index.html) (a static sortable table, data inline, no CDN — Pages-ready).
Raw census rows: `data/*.jsonl`.

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

### 3. Boot
**Shortlist score** = branch edges × content (milestones + upgrades + buyables + challenges + achievements),
0 for trivial rows (`lib/score.mjs: shortlistScore`). Rows are grouped into **families** — the same layer-id
set on the same `tmtNum` (copies and light edits of one game); the best-scoring member represents it (ties — copies score the same — go to the most
stars, then the most-copied content hash, i.e. the unmodified game rather than someone's broken edit, then the
latest push), and the top 60 families are booted, plus three calibration rows from local clones
(`~/CC/Prestige-Tree`, `~/CC/The-Modding-Tree`, `~/CC/upgrade-land-tmt`).

Per row: `git clone --depth 1` into `clones/`; **engine deviation** = `git diff --no-index --numstat` of every
engine file in the stock commit for the fork's `tmtNum` (`index.html`, `style.css`, `css/*.css`, `js/*.js` except
`layers/mod/tree.js`, `js/technical/*`, `js/utils/*`) against the fork's copy (a missing file counts as all lines
removed); also a whitespace-insensitive total and a *logic* subtotal (`game.js`, `utils.js`, `utils/*`,
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
script order from `index.html` (inline scripts included); `loader.js` is skipped and `modInfo.modFiles` are loaded
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
Time box: `BUDGET_MIN` (default 180) wall minutes; the row count that ran is in the log and SUMMARY.

## Rank
`lib/score.mjs: composite`, 0–100:

- **branchiness 40** × min(1, (fork nodes + join nodes) / 30), × 0.25 when linear (PTR has 30 nodes);
- **content 30** × min(1, log10(1 + content) / log10(401)) (PTR's content is 398);
- **completeness 30** = 10 endgame differs from the stock demo's `e280000000` + 10 × recency (last push ≤ 1 year
  before the census date → 1, linear to 0 at 5 years) + 5 version string not `0.0` + 5 boots headless (2.5 when
  not booted, 0 when the boot failed);
- a **failed boot halves** the total (a game that crashes at load in its own engine is not a candidate until fixed).

`archived` is shown, not scored (finished and abandoned games both get archived). Engine deviation is a
separate column, not folded into the score. Boot-exact numbers replace static ones where a boot row exists.
