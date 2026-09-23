# tmt-fork-census

A census of the **The Modding Tree / Prestige Tree** fork family on GitHub: which forks are games with a
*branching* prestige tree, enough content to randomize, and some sign of completeness — and, for the
shortlist, how far each one's engine deviates from stock TMT (the cost of porting it to a newer engine).

**▶ Live results: <https://peerinfinity.github.io/tmt-fork-census/>**

**Just want to play?** The live results are a ranked, sortable table of these games. In each row, **▶ loader** opens
the game in [tmt-loader](https://peerinfinity.github.io/tmt-loader/) (it runs there even when the author's own page
is gone), **▶ mobile** opens it with a phone layout, and **▶ play** opens the author's own page where it still
works. **Key columns** hides the technical columns; **about**, at the top of the page, explains every column.
The rest of this README is about how the census is made.

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

## Documents

| document | what is in it |
|---|---|
| **[STAGES.md](STAGES.md)** | what each stage of the pipeline does and the rules it applies — the detail behind the table below, plus the manifest emitter, the ranking formula and family collapse |
| **[COLUMNS.md](COLUMNS.md)** | every column of the ranked table, generated from the same `COLDEFS` that drive the page's tooltips |
| [`results/SUMMARY.md`](results/SUMMARY.md) | the ranked table and the funnel, as markdown |
| [`results/table.json`](results/table.json) | the same rows, as JSON |
| [`docs/index.html`](docs/index.html) | the page published at the link above (data inline, no CDN) |

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
| 6. loader | `node scripts/6-loader.mjs` (`LOADER_COMMIT`, `LOADER_BASE`, `LOADER_REPO`) | `data/loader.jsonl` |
| 7. size | `node scripts/7-size.mjs` (`--recheck`) | `data/size.jsonl` |
| rank | `node scripts/rank.mjs` | `results/SUMMARY.md`, `results/table.json`, `docs/index.html` |

The detail of what each stage does — and the manifest emitter, the ranking formula and family collapse — is in
**[STAGES.md](STAGES.md)**. The ranked table's columns are documented in **[COLUMNS.md](COLUMNS.md)**.

## tmt-loader

Most of the games this census ranks have no working play page of their own — their authors' GitHub Pages were
never enabled or have gone. **[tmt-loader](https://github.com/PeerInfinity/tmt-loader)** ([live](https://peerinfinity.github.io/tmt-loader/)) is the companion project that hosts them:
one static page that loads each game **on its own TMT engine version**, with no CDN and no build step, a save
namespaced per game, and an opt-in mobile layout. Stage 6 reads its manifests at a pinned commit and gives every
row the census ranks two links — `loader` and `mobile` — beside the author's own `play` link.

The loader's manifests are emitted by this repo's `scripts/manifest.mjs` (see [STAGES.md](STAGES.md)), so the two
repositories meet at that one file format: the census observes a game, the loader runs it.

| | repository | live |
|---|---|---|
| census (this repo) | [PeerInfinity/tmt-fork-census](https://github.com/PeerInfinity/tmt-fork-census) | https://peerinfinity.github.io/tmt-fork-census/ |
| loader | [PeerInfinity/tmt-loader](https://github.com/PeerInfinity/tmt-loader) | https://peerinfinity.github.io/tmt-loader/ |

## License

MIT (`LICENSE`) for the survey code and the results. No fork source is committed; each game's own repository
carries its own license, and the `license` column records what GitHub reported for it at census time.
