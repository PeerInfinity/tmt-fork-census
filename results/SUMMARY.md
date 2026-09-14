# TMT fork census — results

A census of the GitHub forks of The Modding Tree and Prestige Tree (both fork lists, plus one level of forks-of-forks). Forks never pushed to are dropped; every other fork's files are read at HEAD and a small lexer counts its layers, tree rows, branch edges and content (milestones, upgrades, buyables, challenges, achievements). Forks with the same layer-id set on the same engine version form one family, represented by one fork; every family with a branching tree and some content is cloned and booted headless (200 idle ticks twice for determinism, plus a simple buy/reset policy), and its engine files are diffed against the closest stock TMT commit of its version (the port cost). Families that are exact copies of a calibration tree are folded into that tree's row. Rows are ranked by a 0–100 composite: branchiness 40, content 30, completeness 30, halved when the boot fails. The data are GitHub metadata and counts, not game code.

Generated 2026-09-14 by `scripts/rank.mjs` from `data/*.jsonl` at commit `10a9ef1` of [PeerInfinity/tmt-fork-census](https://github.com/PeerInfinity/tmt-fork-census). Every number below is read from those rows.
🔧 = calibration row (local clone, not a fork). Score = branchiness 40 + content 30 + completeness 30 (formula: README, `lib/score.mjs`).

## Funnel

| stage | count |
|---|---|
| forks listed (both roots + one level of forks-of-forks) | 1914 |
| … untouched (`pushed_at <= created_at`) | 817 |
| … touched | 1097 |
| static-censused (stage 2) | 1097 (fetch errors 0; no `js/game.js` 16) |
| … engine located by content (no `tmtNum` in `js/game.js`) | 11; moved engine with a recovered `tmtNum` 7 (non-trivial 4) |
| non-trivial | 235 |
| static-censused rows whose `js/layers.js` is byte-identical (after CRLF/trim normalization) to a stock demo | 294 |
| distinct non-trivial families (layer-id set + engine version) | 197 (with a shortlist score > 0: 196) |
| shortlisted for boot | 196 |
| boot rows (shortlist + calibration) | 199 — forks 196 (ok 182, failed 14) + calibration 3; idle-deterministic 177; policy leg ok 184 |
| booted moved-engine forks with an engine deviation | 2 |
| static census agrees with the live boot census (layers, branch edges, content all equal) | 143 of 183 booted forks with a census |
| families collapsed into a calibration row as copies | 2 (PTR: 2 families / 16 forks · TMT: 0 families / 0 forks · upgrade-land-tmt: 0 families / 0 forks) |
| ranked rows (families + calibration) | 198; marked `base`: PTR 2 · TMT 0 · upgrade-land-tmt 0 |

Engines (stage 2): tmt 1082 · prestige-tree-legacy 2 · no-game-js 9 · tmt-no-tmtNum 3 · unknown 1.
Trivial reasons as recorded by stage 2 (a row may have several; "demo unchanged" was run as: demo `layers.js` and no other content file): <=2 layers 799 · no branches 804 · demo unchanged 2.

## Ranked families

| # | repo | game / version | engine | score | layers/rows | width per row | edges | fork/join | ms/upg/buy/ch/ach | content | endgame | last push | members | boot | engine deviation vs stock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [crazkingda1st/PrestigeTreeNGPlus-edited-](https://github.com/crazkingda1st/PrestigeTreeNGPlus-edited-) | Prestige Tree NG+ 1.6 (base: PTR) | 2.2.1 | 100 | 34/9 | 1,2,5,4,5,6,5,5,1 | 63 | 20/21 | 113/253/57/9/121 | 553 | yes | 2026-06-11 | 3: legendaryflower/PrestigeTreeNGPlus, semurhabana/Prestige-Tree-All-Mods-And-Edits, crazkingda1st/PrestigeTreeNGPlus-edited- | ok | +1164/−243 (logic +520/−114) |
| 2 | [thecuttlefish123213/The-Cosmic-Tree](https://github.com/thecuttlefish123213/The-Cosmic-Tree) | The Cosmic Tree 0.1.1 | 2.7 | 98.67 | 23/7 | 2,4,5,4,4,1,3 | 38 | 15/14 | 43/175/134/17/63 | 432 | yes | 2026-09-10 | 1 | ok | +1884/−1180 (logic +685/−569) |
| 3 | [CrazyHighNumbers69/The-Modding-Tree](https://github.com/CrazyHighNumbers69/The-Modding-Tree) | The Pro Tree 0.9c | 2.6.0.1 | 95.06 | 40/12 | 1,2,3,4,5,6,7,8,1,1,1,1 | 64 | 24/23 | 95/1207/34/72/187 | 1595 | yes | 2023-09-23 | 1 | ok | +1899/−3692 (logic +266/−189) |
| 4 | [skylafalls/Extended-Tree](https://github.com/skylafalls/Extended-Tree) | The Extended Tree 1.4.1 (base: PTR) | 2.2.1 | 94.22 | 35/9 | 1,2,5,6,5,6,5,3,2 | 64 | 23/22 | 103/233/58/12/80 | 486 | yes | 2023-05-23 | 1 | ok | +1172/−275 (logic +497/−115) |
| 5 | 🔧 [calibration:Prestige-Tree](https://github.com/Jacorb90/Prestige-Tree) | Prestige Tree Rewritten 1.3 | 2.2.1 | 89.97 | 28/7 | 1,2,5,4,5,6,5 | 45 | 15/15 | 85/172/52/9/80 | 398 | yes | 2021-05-25 | 16 copies (below) | ok | +1137/−242 (logic +495/−113) |
| 6 | [Omega-pgg/The-Modding-Tree](https://github.com/Omega-pgg/The-Modding-Tree) | The Omega Tree 2.3.0: Update 13 | 2.6.6.2 | 86.18 | 25/10 | 1,4,1,4,4,4,1,2,1,3 | 38 | 12/10 | 112/569/19/17/170 | 887 | yes | 2024-06-09 | 1 | ok | +490/−55 (logic +485/−54) |
| 7 | [Askinga/The-MJ-Tree](https://github.com/Askinga/The-MJ-Tree) | The MJ Tree 2.4.0 | 2.6.6.2 | 77.67 | 15/6 | 3,1,1,7,2,1 | 23 | 8/7 | 15/147/2/15/72 | 251 | yes | 2026-09-13 | 1 | ok | +11/−6 (logic +7/−3) |
| 8 | [Dressygithub/The-Dressy-Tree](https://github.com/Dressygithub/The-Dressy-Tree) | The Dressy Tree 1 | 2.7 | 77.25 | 16/5 | 8,4,2,1,1 | 18 | 5/9 | 17/238/12/9/25 | 301 | yes | 2026-07-14 | 1 | ok | +31/−5 (logic +12/−3) |
| 9 | [thecoolcookie366/The-Modding-Tree](https://github.com/thecoolcookie366/The-Modding-Tree) | The Cookie Tree 1.03 | 2.7 | 77.21 | 32/8 | 5,5,7,6,3,3,2,1 | 43 | 7/9 | 24/113/0/2/36 | 175 | yes | 2026-08-28 | 1 | ok ⚠nondet | +15/−14 (logic +15/−13) |
| 10 | [haram0614/The-Modding-Tree](https://github.com/haram0614/The-Modding-Tree) | The Quantum Tree 1.1 | 2.6.6.2 | 77.07 | 25/5 | 6,7,6,4,2 | 26 | 8/8 | 0/184/0/0/23 | 207 | yes | 2025-04-24 | 1 | ok | +0/−0 (logic +0/−0) |
| 11 | [CoolBoris/The-Galactic-Tree](https://github.com/CoolBoris/The-Galactic-Tree) | The Galactic Tree 3.0.2 | 2.7 | 76.67 | 39/12 | 2,6,4,5,4,4,2,1,3,3,3,2 | 38 | 9/11 | 214/421/33/17/177 | 862 | no | 2026-04-28 | 3: CoolBoris/The-Galactic-Tree, doyle31/The-Galactic-Tree, vharlieb0y6999-gif/The-Galactic-Tree | ok | +7613/−5220 (logic +2100/−1575) moved |
| 12 | [Justcubing97/JC97sSomethingTree](https://github.com/Justcubing97/JC97sSomethingTree) | Justcubing97's Something Tree 0.5.9 | 2.7 | 76.36 | 14/7 | 1,1,3,4,1,2,2 | 22 | 9/4 | 68/175/23/11/52 | 329 | yes | 2026-08-02 | 1 | ok | +51/−11 (logic +49/−9) |
| 13 | [SIGMA-HOPEDY/The-PP-Tree](https://github.com/SIGMA-HOPEDY/The-PP-Tree) | The PP Tree 0.1 | 2.7 | 76.01 | 12/6 | 1,2,3,1,2,3 | 21 | 6/7 | 45/172/14/12/64 | 307 | yes | 2026-08-31 | 1 | ok | +208/−127 (logic +149/−83) |
| 14 | [c0v1d-9119361/The-Plague-Tree](https://github.com/c0v1d-9119361/The-Plague-Tree) | Plague Tree (Vorona Cirus Treesease) 0.6.25 | 2.6.6.2 | 75.49 | 16/5 | 2,4,4,5,1 | 24 | 8/6 | 372/1131/319/40/169 | 2031 | yes | 2024-06-07 | 8: James103/The-Plague-Tree, c0v1d-9119361/The-Plague-Tree, Atticuss26/The-Plague-Tree-alternate-link, BruhBruhcast/vorona-offline-progress, RainyYC/The-Plague-Tree, yakasov/The-Plague-Tree, ilikecheze/summationIs-Cool, decio2022/The-Plague-Tree | ok ⚠nondet | +1057/−270 (logic +920/−238) |
| 15 | [SSansssssssssssss/Excavation-Tree](https://github.com/SSansssssssssssss/Excavation-Tree) | Excavation Tree 1.3 | 2.6.6.2 | 75.08 | 21/5 | 10,2,3,4,2 | 25 | 6/6 | 22/172/61/10/86 | 351 | yes | 2025-08-05 | 1 | ok | +500/−15 (logic +392/−4) |
| 16 | [p-u/The-Point-Tree](https://github.com/p-u/The-Point-Tree) | The Point Tree 3.6S | 2.7 | 74.67 | 11/8 | 1,1,1,1,1,3,2,1 | 22 | 5/6 | 255/712/24/6/226 | 1223 | yes | 2026-08-11 | 2: p-u/The-Point-Tree, LinLei0102/The-Point-Tree | ok | +281/−28 (logic +243/−13) |
| 17 | [certainjellyfish9204/The-Modding-Tree](https://github.com/certainjellyfish9204/The-Modding-Tree) | The Classic+ Tree 0.9 | 2.7 | 74.67 | 14/9 | 1,3,2,2,1,2,1,1,1 | 20 | 5/6 | 105/223/72/40/164 | 604 | yes | 2026-09-11 | 1 | ok | +1579/−3211 (logic +1369/−453) |
| 18 | [FlareZ0000/The-Modding-Tree](https://github.com/FlareZ0000/The-Modding-Tree) | The Alphabetree 1.2.6 | 2.6.6.2 | 73.35 | 46/27 | 1,2,2,3,1,2,2,1,2,3,2,1,1,2,3,1,3,1,1,3,2,1,2,1,1,1,1 | 77 | 23/20 | 11/20/0/0/0 | 31 | no | 2024-02-07 | 1 | ok | +0/−0 (logic +0/−0) |
| 19 | [ducdat0507/prestreestuck](https://github.com/ducdat0507/prestreestuck) | The Prestreestuck 0.1.1.2.6 | 2.5.2.1 | 70.9 | 19/11 | 2,1,2,2,2,1,1,2,3,2,1 | 21 | 6/3 | 77/166/162/8/0 | 413 | yes | 2025-04-05 | 1 | ok ⚠nondet 0-layers→static | +1313/−350 (logic +713/−239) |
| 20 | [denisolenison/The-Leveling-Tree](https://github.com/denisolenison/The-Leveling-Tree) | The Leveling Tree 0.2.0.1 | 2.6.6.2 | 68.5 | 8/4 | 2,3,2,1 | 15 | 6/6 | 60/100/6/9/0 | 175 | yes | 2024-05-07 | 2: ingeniousclown/The-Leveling-Tree, denisolenison/The-Leveling-Tree | ok | +673/−611 (logic +589/−584) |
| 21 | [MegaLaad/Infinity-Tree2](https://github.com/MegaLaad/Infinity-Tree2) | The Infinity Tree 1.0.4 | 2.6.6.2 | 67.81 | 14/6 | 1,2,3,4,1,3 | 19 | 7/4 | 41/67/26/3/29 | 166 | yes | 2024-09-17 | 1 | ok | +5/−4 (logic +4/−3) |
| 22 | [pg132/The-Modding-Tree](https://github.com/pg132/The-Modding-Tree) | The Incrementreeverse 1.0 The Abelian Tributary | 2.1.3.1 | 67.17 | 16/5 | 2,5,4,3,2 | 18 | 5/3 | 31/245/30/16/0 | 322 | yes | 2024-09-26 | 6: pg132/The-Modding-Tree, sps09/The-Modding-Tree, Unihedro/The-Modding-Tree, lidf-codelidf-delorlidf532/The-Modding-Tree, doggy-dood/The-Modding-Tree, FactorXXXX/Prestige-Chain-NtoZ | ok | +147/−49 (logic +108/−37) |
| 23 | [epicstatbattles/Low-Taper-Fade](https://github.com/epicstatbattles/Low-Taper-Fade) | The Low Taper Fade Tree 5.6.1 | 2.7 | 65.35 | 13/6 | 1,2,3,2,3,2 | 16 | 4/3 | 27/127/18/8/0 | 180 | yes | 2026-08-06 | 1 | ok | +5/−3 (logic +5/−3) |
| 24 | [KremboMC/Ultimate-Prestige-Tree](https://github.com/KremboMC/Ultimate-Prestige-Tree) | Ultimate Prestige Tree 0.2.3 | 2.7 | 65.2 | 11/4 | 1,3,3,4 | 13 | 3/6 | 23/64/15/0/0 | 102 | yes | 2026-09-05 | 1 | ok | +0/−0 (logic +0/−0) |
| 25 | [Thaness0/The-reset-tree](https://github.com/Thaness0/The-reset-tree) | The Reset Tree 0.3 | 2.6.6.2 | 64.77 | 12/6 | 1,2,3,3,2,1 | 31 | 10/8 | 19/69/6/4/36 | 134 | no | 2024-03-09 | 1 | ok | +13/−4 (logic +13/−4) |
| 26 | [liamhmn/The-Modding-Tree](https://github.com/liamhmn/The-Modding-Tree) | The Number Tree 0.3.2 | 2.6.6.2 | 64.32 | 14/6 | 1,3,3,5,1,1 | 18 | 3/4 | 153/160/24/64/49 | 450 | yes | 2023-09-12 | 1 | ok | +566/−564 (logic +560/−560) |
| 27 | [ThePrestigeTreeGuy/The-Modding-Tree](https://github.com/ThePrestigeTreeGuy/The-Modding-Tree) | The Doors Tree 0.7 | 2.6.6.2 | 63.49 | 8/4 | 3,3,1,1 | 10 | 1/5 | 32/112/12/2/4 | 162 | yes | 2026-09-08 | 1 | ok | +10/−10 (logic +0/−0) |
| 28 | [danickverse/The-Modding-Tree](https://github.com/danickverse/The-Modding-Tree) | Universal Expansion 0.2.5 | 2.6.6.2 | 63.16 | 6/2 | 3,3 | 8 | 2/2 | 37/127/38/2/55 | 259 | yes | 2026-07-10 | 1 | ok | +172/−34 (logic +68/−16) |
| 29 | [ArmeKnockedOut/the-element-tree](https://github.com/ArmeKnockedOut/the-element-tree) | The Element Tree ersion: alpha 0.4 | 2.6.5.1 | 63.13 | 9/5 | 2,2,3,1,1 | 7 | 2/2 | 45/135/8/13/56 | 257 | yes | 2026-06-24 | 1 | ok | +74/−2 (logic +31/−2) |
| 30 | [unsoftcapped4/Prestige-Tree-Rewritten](https://github.com/unsoftcapped4/Prestige-Tree-Rewritten) | Prestige Tree Rewritten 1.0 | 2.2.1 | 63.04 | 16/6 | 1,2,5,4,3,1 | 22 | 6/6 | 45/119/17/8/32 | 221 | yes | 2020-12-26 | 1 | ok | +515/−126 (logic +277/−67) |
| 31 | [peacefulwar/Arc-Tree](https://github.com/peacefulwar/Arc-Tree) | Arc Tree 0.0.4 | 2.7 | 62.28 | 13/6 | 1,2,2,4,3,1 | 12 | 3/0 | 65/170/17/13/65 | 330 | yes | 2025-05-25 | 1 | ok | +17/−1 (logic +1/−1) |
| 32 | [BanaCubed/Create-Incremental-Legacy-TMT](https://github.com/BanaCubed/Create-Incremental-Legacy-TMT) | Create Incremental 0.4 | 2.7 | 61.25 | 14/4 | 1,1,3,9 | 13 | 2/2 | 44/88/15/7/55 | 209 | yes | 2025-05-12 | 1 | ok | +2316/−1780 (logic +1604/−1241) |
| 33 | [e205-idle-beta/normaltree.github.io](https://github.com/e205-idle-beta/normaltree.github.io) | The Normal Tree 0.1.4 | 2.6.6.2 | 60.48 | 18/12 | 1,1,2,1,2,1,3,1,2,1,2,1 | 19 | 3/5 | 34/78/0/3/0 | 115 | yes | 2024-02-09 | 1 | ok | +3/−3 (logic +0/−0) |
| 34 | [The-Alternate-Tree/The-Incremental-Tree](https://github.com/The-Alternate-Tree/The-Incremental-Tree) | The Incremental Tree 5.0.0 | 2.7 | 60.37 | 8/5 | 1,2,2,2,1 | 10 | 2/3 | 3/100/0/10/0 | 113 | yes | 2026-03-06 | 1 | ok | +2/−2 (logic +0/−0) |
| 35 | [The179UCETile/wextwall-tree](https://github.com/The179UCETile/wextwall-tree) | The TextWall Tree 0.2 | 2.7 | 59.91 | 7/6 | 1,1,2,1,1,1 | 9 | 2/3 | 14/67/3/4/15 | 103 | yes | 2026-09-04 | 1 | ok | +175/−55 (logic +75/−17) |
| 36 | [The-Alternate-Tree/The-Loop-Tree](https://github.com/The-Alternate-Tree/The-Loop-Tree) | The Loop Tree 1.42 | 2.7 | 59.58 | 8/4 | 1,2,3,2 | 6 | 3/1 | 19/61/9/4/33 | 126 | yes | 2026-04-04 | 1 | ok | +186/−193 (logic +2/−2) |
| 37 | [mirc3a22000/the-lime-upgrade-tree](https://github.com/mirc3a22000/the-lime-upgrade-tree) | The Lime Upgrade Tree 0.9 | 2.6.6.2 | 59.26 | 7/4 | 2,1,2,2 | 6 | 2/0 | 0/166/5/0/31 | 202 | yes | 2026-04-30 | 1 | ok | +44/−35 (logic +27/−27) |
| 38 | [hanlaosan1/The-Wall-Tree](https://github.com/hanlaosan1/The-Wall-Tree) | 墙树 1.0 | 2.7 | 59.05 | 5/3 | 1,3,1 | 9 | 3/3 | 9/66/1/5/0 | 81 | yes | 2025-04-19 | 1 | ok | +2/−2 (logic +0/−0) |
| 39 | [MsliAghtlyD/A-Tree-For-Sure](https://github.com/MsliAghtlyD/A-Tree-For-Sure) | A Tree For Sure 0.04999d | 2.6.6.2 | 59.01 | 7/3 | 1,3,3 | 6 | 2/1 | 13/82/9/11/32 | 147 | yes | 2026-07-21 | 1 | ok | +26/−3 (logic +25/−2) |
| 40 | [nolhan42/The-Greek-Tree](https://github.com/nolhan42/The-Greek-Tree) | The Greek Tree 0.1 | 2.7 | 58.71 | 4/3 | 1,2,1 | 4 | 1/1 | 23/116/16/0/26 | 181 | yes | 2026-07-05 | 1 | ok | +191/−35 (logic +186/−26) |
| 41 | [Sersseras/The-Modding-Tree](https://github.com/Sersseras/The-Modding-Tree) | The Algebra Tree 0.0 | 2.7 | 58.57 | 16/7 | 1,2,4,4,2,1,2 | 24 | 7/8 | 24/57/29/0/0 | 110 | no | 2026-03-25 | 1 | ok | +6/−6 (logic +0/−0) |
| 42 | [MSpekkio/The-Mana-Tree](https://github.com/MSpekkio/The-Mana-Tree) | The Mana Tree 0.4 | 2.7 | 58.48 | 9/3 | 3,3,3 | 9 | 2/2 | 11/63/11/0/18 | 103 | yes | 2025-08-29 | 1 | ok | +10/−0 (logic +10/−0) |
| 43 | [liamkelly4123-jpg/The-Incremental-Tree](https://github.com/liamkelly4123-jpg/The-Incremental-Tree) | The Incremental Tree 4.0.0 | 2.7 | 58.48 | 7/4 | 1,2,2,2 | 8 | 2/2 | 1/90/0/10/0 | 101 | yes | 2026-03-04 | 1 | ok | +2/−2 (logic +0/−0) |
| 44 | [SorbetTheShark/SConvolution-Mainframe](https://github.com/SorbetTheShark/SConvolution-Mainframe) | Sorbet's Convolution: Mainframe 1.2.0 | 2.7 | 58.21 | 6/5 | 1,2,1,1,1 | 4 | 0/1 | 54/114/8/1/37 | 214 | yes | 2026-04-26 | 1 | ok | +823/−999 (logic +666/−569) moved |
| 45 | [Onesmartshark/Earth-Tree](https://github.com/Onesmartshark/Earth-Tree) | The Earth Tree 1.11 | 2.6.6.2 | 58.09 | 11/5 | 1,2,3,3,2 | 10 | 3/0 | 18/78/2/4/20 | 122 | yes | 2026-07-30 | 1 | ok | +0/−0 (logic +0/−0) |
| 46 | [medsal15/The-Gaming-Tree](https://github.com/medsal15/The-Gaming-Tree) | The Gaming Tree R0.B.6 | 2.6.6.2 | 57.62 | 17/4 | 8,6,2,1 | 13 | 1/0 | 11/153/61/16/116 | 357 | yes | 2024-06-11 | 1 | ok ⚠nondet | +982/−511 (logic +723/−348) |
| 47 | [cyxw/Arctree](https://github.com/cyxw/Arctree) | ArcTree 0.0.7.0 | 2.6.6.2 | 56.83 | 32/6 | 1,4,6,6,7,8 | 15 | 3/0 | 73/220/18/27/90 | 428 | yes | 2022-10-31 | 1 | ok | +208/−34 (logic +49/−10) |
| 48 | [IEmory/TreeQuest](https://github.com/IEmory/TreeQuest) | TreeQuest 0.2.1-SR | 2.6.6.2 | 56.77 | 24/3 | 2,16,6 | 30 | 8/1 | 4/2/80/0/0 | 86 | yes | 2022-09-02 | 1 | ok | +57/−19 (logic +13/−3) |
| 49 | [Inferno-Inc/The-Primordial-Tree](https://github.com/Inferno-Inc/The-Primordial-Tree) | The Primordial Tree 2.3 | 2.6.6.2 | 56.49 | 13/5 | 1,3,4,3,2 | 12 | 1/2 | 144/138/13/5/72 | 372 | yes | 2022-11-04 | 2: William3Johnson/The-Primordial-Tree, Inferno-Inc/The-Primordial-Tree | ok | +2284/−3453 (logic +1223/−1353) |
| 50 | [freddifred/The-Modding-Tree](https://github.com/freddifred/The-Modding-Tree) | Bobbit's Tech Tree 0.2 | 2.6.6.2 | 56.37 | 75/28 | 2,4,5,5,6,7,6,6,4,2,1,1,1,1,1,1,1,1,1,2,3,3,3,2,2,2,1,1 | 77 | 15/6 | 9/13/0/0/0 | 22 | no | 2022-10-09 | 1 | ok | +5636/−5635 (logic +1592/−1591) |
| 51 | [Slicedberg/Ore-Tree](https://github.com/Slicedberg/Ore-Tree) | The Ore Tree INDEV | 2.7 | 54.96 | 5/3 | 1,2,2 | 4 | 2/0 | 9/49/7/2/18 | 85 | yes | 2026-04-28 | 1 | ok | +0/−1 (logic +0/−1) |
| 52 | [xiajibazuo/Layer-Tree](https://github.com/xiajibazuo/Layer-Tree) | 层级树 0.2 | 2.7 | 54.66 | 7/6 | 1,2,1,1,1,1 | 7 | 1/2 | 22/16/9/14/0 | 61 | yes | 2026-08-10 | 1 | ok | +114/−114 (logic +83/−83) |
| 53 | [great0108/The-Modding-Tree](https://github.com/great0108/The-Modding-Tree) | The mechanic Tree 0.3 | 2.7 | 54.58 | 3/2 | 1,2 | 2 | 1/0 | 5/84/14/0/0 | 103 | yes | 2026-06-24 | 1 | ok | +33/−4 (logic +33/−3) |
| 54 | [ArkSayCode/The-Question-Tree](https://github.com/ArkSayCode/The-Question-Tree) | The Question Tree 0.0.4 | 2.6.6.2 | 54.33 | 6/4 | 1,2,2,1 | 9 | 2/4 | 9/15/9/4/8 | 45 | yes | 2024-07-26 | 1 | ok | +10/−3 (logic +10/−3) |
| 55 | [quwpsss/The-Modding-Tree](https://github.com/quwpsss/The-Modding-Tree) | The Danus Tree 0.9.2 | 2.6.6.2 | 53.87 | 9/5 | 1,2,2,2,2 | 1 | 0/0 | 20/120/8/0/0 | 148 | yes | 2025-03-26 | 1 | ok | +19/−23 (logic +4/−0) |
| 56 | [beterbriffin/Moding-Tree-game-or-something](https://github.com/beterbriffin/Moding-Tree-game-or-something) | The Tree of some random ideas and is probably bad 1.0 | 2.6.6.2 | 53.64 | 5/3 | 1,1,3 | 4 | 1/1 | 35/14/1/5/10 | 65 | yes | 2026-08-29 | 2: beterbriffin/Moding-Tree-game-or-something, glitchyfishys/Moding-Tree-game-or-something | ok | +0/−0 (logic +0/−0) |
| 57 | [brendonjaygarcia2011-dot/Universal-Shifting-Tree](https://github.com/brendonjaygarcia2011-dot/Universal-Shifting-Tree) | The Universal Shifting Tree 0.20.1.2 | 2.7 | 53.58 | 6/4 | 1,2,2,1 | 6 | 2/1 | 15/34/0/0/0 | 49 | yes | 2026-05-04 | 1 | ok | +0/−0 (logic +0/−0) |
| 58 | [XxXOLEGXxX/Shenanigans-Tree](https://github.com/XxXOLEGXxX/Shenanigans-Tree) | The Shenanigans Tree: Rewritten 1.0.1 | 2.6.0.1 | 53.58 | 6/3 | 2,3,1 | 7 | 1/1 | 13/117/9/5/36 | 180 | yes | 2023-08-29 | 1 | ok | +13/−13 (logic +0/−0) |
| 59 | [murapix/Universal-Reconstruction](https://github.com/murapix/Universal-Reconstruction) | Universal Reconstruction 0.8.2 | 2.6.5.1 | 53.32 | 11/4 | 5,1,3,2 | 6 | 2/1 | 18/78/56/2/0 | 154 | yes | 2023-05-02 | 1 | ok | +609/−121 (logic +236/−48) |
| 60 | [qwerty2281444/The-Fly-Eating-Tree](https://github.com/qwerty2281444/The-Fly-Eating-Tree) | Devourer of Flies 0.4 | 2.7 | 52.94 | 9/4 | 1,2,3,3 | 11 | 4/2 | 24/110/3/8/0 | 145 | no | 2026-09-06 | 1 | ok | +4/−0 (logic +4/−0) |
| 61 | [cosmology101-active/The-H2O-Tree](https://github.com/cosmology101-active/The-H2O-Tree) | The H2O Tree 1.0 | 2.6.6.2 | 52.88 | 7/3 | 2,3,2 | 8 | 2/3 | 6/27/2/0/7 | 42 | yes | 2024-08-27 | 1 | ok | +20/−5 (logic +7/−4) |
| 62 | [XtremeRusher/The-Modding-Tree](https://github.com/XtremeRusher/The-Modding-Tree) | Collection of Everything 0.3 | 2.6.6.2 | 52.64 | 10/4 | 3,5,1,1 | 11 | 2/2 | 9/26/4/4/13 | 56 | yes | 2024-07-13 | 1 | ok | +4/−4 (logic +1/−1) |
| 63 | [QnoraeT/The-Modding-Tree](https://github.com/QnoraeT/The-Modding-Tree) | The TearonQ (i have no creative names) 0.0 | 2.7 | 52.62 | 3/2 | 1,2 | 2 | 1/0 | 23/98/55/14/0 | 190 | yes | 2026-09-14 | 1 | ok | +4382/−2284 (logic +590/−189) |
| 64 | [mikosss2/TFoTremake](https://github.com/mikosss2/TFoTremake) | The Function of Time Tree 1.5.n+1 | 2.6.6.2 | 52.34 | 15/3 | 6,6,3 | 9 | 2/1 | 5/61/36/7/72 | 181 | yes | 2022-08-14 | 1 | ok | +14/−3 (logic +1/−0) |
| 65 | [MartianCreations/The-Congratulations-Tree](https://github.com/MartianCreations/The-Congratulations-Tree) | The Congratulations Tree 0.13 (DEMO) | 2.7 | 51.66 | 6/3 | 2,3,1 | 5 | 1/0 | 0/52/0/0/5 | 57 | yes | 2026-02-17 | 1 | ok | +391/−289 (logic +179/−122) |
| 66 | [The-Alternate-Tree/The-Prestige-Galaxy](https://github.com/The-Alternate-Tree/The-Prestige-Galaxy) | The Prestige Galaxy 1.03 | 2.7 | 51.48 | 3/2 | 1,2 | 2 | 1/0 | 1/34/0/1/19 | 55 | yes | 2026-04-23 | 1 | ok | +2/−2 (logic +2/−2) |
| 67 | [Cubedey/The-Tree-Prestige](https://github.com/Cubedey/The-Tree-Prestige) | The Tree Prestige 1.11111 | 2.1.1 | 51.37 | 6/3 | 1,2,3 | 6 | 3/1 | 9/28/19/0/0 | 56 | yes | 2024-01-08 | 1 | ok | +194/−165 (logic +23/−68) |
| 68 | [Increveloper/The-Hyperoperator-Tree](https://github.com/Increveloper/The-Hyperoperator-Tree) | The Hyperoperator Tree 2.0 | 2.5.11.1 | 51.33 | 4/4 | 1,1,1,1 | 3 | 0/0 | 19/45/6/0/0 | 70 | yes | 2026-07-25 | 1 | ok | +2016/−3512 (logic +297/−78) |
| 69 | [FallingMountain/The-Modding-Tree](https://github.com/FallingMountain/The-Modding-Tree) | Falling Mountain's AlterPrestige 0.4.0c Beta | 2.6.4.3 | 51.32 | 10/5 | 1,2,4,2,1 | 4 | 0/0 | 37/107/27/5/69 | 245 | yes | 2023-03-18 | 1 | ok ⚠nondet | +2/−2 (logic +1/−1) |
| 70 | [HothUH33/The-ExisReality-Tree](https://github.com/HothUH33/The-ExisReality-Tree) | The Tree of Existence and Reality 0.4 | 2.6.6.2 | 51.08 | 10/5 | 3,3,2,1,1 | 9 | 3/1 | 5/30/14/4/18 | 71 | yes | 2023-06-09 | 1 | ok | +211/−1 (logic +211/−1) |
| 71 | [usi1947/The-Fruit-Tree](https://github.com/usi1947/The-Fruit-Tree) | The Fruit Tree 1.3 | 2.6.6.2 | 50.99 | 5/3 | 2,2,1 | 5 | 2/2 | 8/82/0/0/0 | 90 | yes | 2022-12-07 | 1 | ok | +0/−0 (logic +0/−0) |
| 72 | [liam43210/The-Prestige-Tree-2](https://github.com/liam43210/The-Prestige-Tree-2) | The Prestige Tree 2 1.0.0 | 2.7 | 50.6 | 4/3 | 1,2,1 | 4 | 1/1 | 3/21/0/0/11 | 35 | yes | 2026-04-12 | 2: liam43210/The-Prestige-Tree-2, The-Alternate-Tree/The-Prestige-Tree-2 | ok | +2/−2 (logic +2/−2) |
| 73 | [Jeehan2561/The-Numbruh-Tree](https://github.com/Jeehan2561/The-Numbruh-Tree) | The Numbruh Tree .1.2.1 | 2.6.6.2 | 50.54 | 3/3 | 1,1,1 | 2 | 0/0 | 13/44/17/0/50 | 124 | yes | 2024-04-01 | 2: Jeehan2561/The-Numbruh-Tree, Jaxix096/The-Numbruh-Tree | ok | +0/−0 (logic +0/−0) |
| 74 | [gapples2/The-Modding-Tree](https://github.com/gapples2/The-Modding-Tree) | The Basic Tree 1.6.2.1 | 2.2.1 | 49.99 | 6/3 | 2,2,2 | 8 | 3/4 | 14/11/0/0/36 | 61 | yes | 2021-08-19 | 1 | ok | +1/−3 (logic +1/−3) |
| 75 | [Efsoone/The-Modding-Tree](https://github.com/Efsoone/The-Modding-Tree) | The Reborn Incremental Tree 0.2a Part1 | 2.7 | 49.92 | 4/3 | 1,1,2 | 3 | 1/0 | 15/25/0/0/0 | 40 | yes | 2026-06-27 | 1 | ok | +0/−0 (logic +0/−0) |
| 76 | [difficultcomplexity/The-Modding-Tree](https://github.com/difficultcomplexity/The-Modding-Tree) | The Weight Tree 1.0g | 2.6.6.2 | 49.83 | 9/4 | 1,3,2,3 | 6 | 1/2 | 32/62/1/12/35 | 142 | yes | 2022-02-05 | 1 | ok | +4/−0 (logic +4/−0) |
| 77 | [liamthecatguy/The-Upgradeverse-Tree](https://github.com/liamthecatguy/The-Upgradeverse-Tree) | The Upgradeverse Tree 1.1.0 | 2.7 | 49.8 | 6/5 | 1,1,2,1,1 | 5 | 1/0 | 3/36/0/0/0 | 39 | yes | 2026-03-02 | 1 | ok | +0/−0 (logic +0/−0) |
| 78 | [rainbowice975/The-Jax-Tree](https://github.com/rainbowice975/The-Jax-Tree) | The Jax Tree 0.2 | 2.7 | 49.68 | 3/2 | 1,2 | 2 | 0/0 | 4/38/0/0/8 | 50 | yes | 2026-05-09 | 1 | ok | +51/−2 (logic +48/−2) |
| 79 | [qcy00hou12/The-Periodic-Table-Tree](https://github.com/qcy00hou12/The-Periodic-Table-Tree) | The Periodic Table Tree 1.7.1 | 2.6.6.2 | 49.62 | 8/3 | 3,3,2 | 7 | 0/1 | 38/53/21/5/65 | 182 | yes | 2022-08-03 | 1 | ok ⚠nondet | +746/−35 (logic +34/−16) |
| 80 | [temptempa/The-Modding-Tree](https://github.com/temptempa/The-Modding-Tree) | The Douyuan Tree beta 1.1 | 2.7 | 49.6 | 4/2 | 1,3 | 4 | 2/1 | 3/23/0/0/0 | 26 | yes | 2025-05-05 | 1 | ok | +32/−32 (logic +7/−7) |
| 81 | [The-Alternate-Tree/A-Tree-About-Layers](https://github.com/The-Alternate-Tree/A-Tree-About-Layers) | A Tree About Layers 1.0 | 2.7 | 49.13 | 5/4 | 1,1,1,2 | 4 | 1/0 | 0/29/0/0/5 | 34 | yes | 2026-03-28 | 1 | ok | +2/−2 (logic +2/−2) |
| 82 | [shenmi124/The-Game-Tree](https://github.com/shenmi124/The-Game-Tree) | The Game Tree 0.6.3 | 2.6.5.1 | 49.09 | 10/4 | 3,3,3,1 | 10 | 2/2 | 12/78/8/7/7 | 112 | yes | 2021-09-27 | 1 | ok | +23/−5 (logic +11/−3) |
| 83 | [weyrhvwvrwuvureurw/The-Modding-Tree](https://github.com/weyrhvwvrwuvureurw/The-Modding-Tree) | The Unbalanced Tree 0.1.3 | 2.6.6.2 | 49.09 | 5/3 | 1,2,2 | 6 | 0/2 | 10/41/0/21/0 | 72 | yes | 2023-09-07 | 1 | ok | +0/−0 (logic +0/−0) |
| 84 | [CudjzikxmxR/The-Rainbow-Void-Tree](https://github.com/CudjzikxmxR/The-Rainbow-Void-Tree) | The Rainbow Void Tree 0.2 | 2.7 | 49.01 | 5/3 | 1,3,1 | 6 | 2/1 | 28/79/0/0/40 | 147 | no | 2026-02-12 | 1 | ok | +599/−43 (logic +497/−19) |
| 85 | [TheIcyIcicle/The-Modding-Tree](https://github.com/TheIcyIcicle/The-Modding-Tree) | The Layered Tree 0.0.1 | 2.6.6.2 | 48.94 | 4/4 | 1,1,1,1 | 0 | 0/0 | 0/29/1/0/13 | 43 | yes | 2026-04-28 | 1 | ok | +0/−0 (logic +0/−0) |
| 86 | [notadragon/counting-sheep-tree](https://github.com/notadragon/counting-sheep-tree) | Sheep Incremental? 0.0.4 | 2.7 | 48.93 | 4/2 | 1,3 | 3 | 1/0 | 11/24/1/0/0 | 36 | yes | 2025-07-06 | 1 | ok | +14/−2 (logic +2/−2) |
| 87 | [RaceproxateDev/The-Ultimate-Prestige-Tree](https://github.com/RaceproxateDev/The-Ultimate-Prestige-Tree) | The Ultimate Prestige Tree 0.1 | 2.7 | 48.34 | 4/4 | 1,1,1,1 | 3 | 0/0 | 22/15/0/1/0 | 38 | yes | 2026-03-01 | 1 | ok | +0/−0 (logic +0/−0) |
| 88 | [am30936/The-Modding-Tree](https://github.com/am30936/The-Modding-Tree) | An Operation Tree 0.3.1 | 2.7 | 48.17 | 7/3 | 2,2,3 | 7 | 2/1 | 31/56/2/6/29 | 124 | no | 2026-04-06 | 1 | ok | +5/−0 (logic +5/−0) |
| 89 | [DatMLGTaco/The-Modding-Tree](https://github.com/DatMLGTaco/The-Modding-Tree) | The Melge Tree 0.0 | 2.6.6.2 | 48.14 | 8/4 | 1,2,3,2 | 13 | 6/3 | 15/48/12/0/12 | 87 | no | 2025-03-12 | 1 | ok | +266/−20 (logic +51/−11) |
| 90 | [Yahkub7/The-Modding-Tree](https://github.com/Yahkub7/The-Modding-Tree) | The Cultree 0.0.6.9 | 2.6.6.2 | 48.13 | 5/4 | 1,2,1,1 | 4 | 1/1 | 7/27/9/26/14 | 83 | yes | 2023-01-06 | 1 | ok | +26/−15 (logic +23/−13) |
| 91 | [monkeh42/The-Modding-Tree](https://github.com/monkeh42/The-Modding-Tree) | The NecromanTree 0.3.2 | 2.3.4 | 47.78 | 10/4 | 1,2,5,2 | 10 | 4/2 | 20/28/3/0/0 | 51 | yes | 2021-09-08 | 1 | ok | +497/−46 (logic +402/−31) |
| 92 | [Hank17227/Weakling-Tree](https://github.com/Hank17227/Weakling-Tree) | Weakling Tree 0.8.10 | 2.7 | 47.72 | 5/2 | 2,3 | 3 | 1/0 | 69/69/3/8/45 | 194 | no | 2026-07-12 | 1 | ok | +8/−1 (logic +8/−1) |
| 93 | [Moosiqe/Coffee-Shop](https://github.com/Moosiqe/Coffee-Shop) | Coffee Shop 0.11 | 2.7 | 47.51 | 6/3 | 1,2,3 | 7 | 2/2 | 11/60/12/0/0 | 83 | no | 2026-09-07 | 1 | ok | +0/−0 (logic +0/−0) |
| 94 | [Dackel090/The-Universal-Tree](https://github.com/Dackel090/The-Universal-Tree) | The Universal Tree 0.2.0 | 2.6.6.2 | 47.46 | 4/2 | 2,2 | 5 | 1/1 | 12/19/8/0/0 | 39 | yes | 2024-03-25 | 1 | ok | +1/−1 (logic +0/−0) |
| 95 | [masutaki/videocointree](https://github.com/masutaki/videocointree) | The Video Coin Tree 0.1 | 2.7 | 47.44 | 3/2 | 1,2 | 2 | 1/0 | 6/15/0/3/0 | 24 | yes | 2026-08-13 | 1 | ok | +0/−0 (logic +0/−0) |
| 96 | [voidcons0le-is-dumb/The-Universal-Tree](https://github.com/voidcons0le-is-dumb/The-Universal-Tree) | The Universal Tree 0.0 | 2.7 | 47.41 | 7/3 | 2,3,2 | 14 | 4/5 | 11/27/6/0/14 | 58 | no | 2026-08-25 | 1 | ok | +213/−32 (logic +200/−26) |
| 97 | [Seder3214/Challenge-Tree](https://github.com/Seder3214/Challenge-Tree) | The Challenge Tree 0.99 | 2.6.6.2 | 47.35 | 9/7 | 1,1,3,1,1,1,1 | 8 | 1/0 | 1/6/0/39/0 | 46 | yes | 2024-05-26 | 1 | ok | +17/−6 (logic +3/−3) |
| 98 | [fluffydragon23/The-Modding-Tree](https://github.com/fluffydragon23/The-Modding-Tree) | The ??? Tree 0.7 | 2.6.6.2 | 47.16 | 3/2 | 1,2 | 2 | 1/0 | 2/21/0/1/4 | 28 | yes | 2025-04-16 | 1 | ok | +6/−6 (logic +0/−0) |
| 99 | [CharizUniv/The-Modding-Tree](https://github.com/CharizUniv/The-Modding-Tree) | The Energy Factory 0.1 | 2.6.6.2 | 47.06 | 3/2 | 1,2 | 2 | 1/0 | 15/25/18/6/18 | 82 | yes | 2023-02-22 | 1 | ok | +0/−0 (logic +0/−0) |
| 100 | [new42ur3jeans/Incremental-Adventure-Trees](https://github.com/new42ur3jeans/Incremental-Adventure-Trees) | Yet another Challenge Tree: Adventure 2.2.3.3 | 2.6.6.2 | 47 | 4/3 | 1,1,2 | 3 | 1/0 | 12/0/1/23/0 | 36 | yes | 2024-09-26 | 1 | ok | +2/−2 (logic +2/−2) |
| 101 | [hervioletness/My-Experience-Tree](https://github.com/hervioletness/My-Experience-Tree) | My Experience Tree Rebuilt 2.1 | 2.6.5.1 | 46.87 | 6/4 | 1,2,2,1 | 6 | 1/1 | 17/31/3/4/35 | 90 | yes | 2022-05-09 | 1 | ok | +0/−0 (logic +0/−0) |
| 102 | [ItzJustTeam/The-Modding-Tree](https://github.com/ItzJustTeam/The-Modding-Tree) | The Space Tree 0.0.1 | 2.6.6.2 | 46.62 | 4/3 | 1,2,1 | 4 | 1/1 | 7/23/0/0/0 | 30 | yes | 2024-05-29 | 1 | ok | +0/−0 (logic +0/−0) |
| 103 | [tekpixels/The-Final-Tree](https://github.com/tekpixels/The-Final-Tree) | The Final Tree 0.1.2 | 2.6.6.2 | 45.91 | 3/2 | 1,2 | 2 | 1/0 | 2/18/0/0/6 | 26 | yes | 2024-12-07 | 1 | ok | +1/−0 (logic +1/−0) |
| 104 | [Drachronic/Elemental-Tree](https://github.com/Drachronic/Elemental-Tree) | The Elemental Tree 0.1 | 2.6.6.2 | 45.85 | 5/4 | 1,1,1,2 | 1 | 0/0 | 54/83/34/3/0 | 174 | no | 2026-07-11 | 1 | ok | +2989/−2600 (logic +1495/−1210) |
| 105 | [liquidcashews/the-fysc-tree](https://github.com/liquidcashews/the-fysc-tree) | The FYSC Tree 1.22 | 2.7 | 45.47 | 3/2 | 1,2 | 2 | 0/0 | 2/17/1/1/0 | 21 | yes | 2026-04-18 | 1 | ok | +3/−3 (logic +2/−2) |
| 106 | [random-beta-tube/the-tube-tree](https://github.com/random-beta-tube/the-tube-tree) | The tube Tree 0.0.1 | 2.7 | 45.21 | 4/2 | 1,3 | 2 | 1/0 | 0/10/2/0/3 | 15 | yes | 2025-11-01 | 1 | ok | +0/−0 (logic +0/−0) |
| 107 | [catfish-in-a-nutshell/The-Chronicle-Tree](https://github.com/catfish-in-a-nutshell/The-Chronicle-Tree) | 编年史树 0.02 | 2.6.6.2 | 45.09 | 10/5 | 6,1,1,1,1 | 4 | 1/0 | 1/29/19/0/10 | 59 | yes | 2023-01-03 | 2: ajchen02/The-Chronicle-Tree, catfish-in-a-nutshell/The-Chronicle-Tree | ok | +345/−69 (logic +34/−10) |
| 108 | [my-first-tmt/The-Material-Tree](https://github.com/my-first-tmt/The-Material-Tree) | The Material Tree 1.00 | 2.7 | 44.99 | 3/3 | 1,1,1 | 1 | 0/0 | 2/17/0/0/0 | 19 | yes | 2026-02-27 | 1 | ok | +0/−0 (logic +0/−0) |
| 109 | [BskyTeam/The-Upgrades-Tree](https://github.com/BskyTeam/The-Upgrades-Tree) | The Upgrade Tree 0.1 | 2.6.6.2 | 44.95 | 6/5 | 1,1,1,2,1 | 6 | 1/1 | 6/20/1/0/0 | 27 | yes | 2023-12-11 | 1 | ok | +0/−0 (logic +0/−0) |
| 110 | [HiGamezYT/The-Modding-Tree](https://github.com/HiGamezYT/The-Modding-Tree) | The ??? Tree 0.0 | 2.7 | 44.44 | 3/2 | 1,2 | 3 | 1/1 | 4/158/19/2/42 | 225 | no | 2025-07-24 | 1 | ok | +0/−0 (logic +0/−0) |
| 111 | [blackestday7/The-Modding-Tree](https://github.com/blackestday7/The-Modding-Tree) | The Broken Tree 0.4 | 2.π | 44.33 | 6/3 | 1,2,3 | 6 | 3/1 | 10/15/1/0/0 | 26 | yes | 2022-09-13 | 1 | ok policy✗ | +0/−0 (logic +0/−0) |
| 112 | [mykupal/fot](https://github.com/mykupal/fot) | Function of Time 0.1 | 2.7 | 44.31 | 4/1 | 4 | 2 | 1/0 | 0/6/8/0/0 | 14 | yes | 2025-06-21 | 1 | ok | +11/−8 (logic +3/−0) |
| 113 | [Dystopia-user181/The-Modding-Tree](https://github.com/Dystopia-user181/The-Modding-Tree) | The Factoree 0.5.0 | 2.2.2 | 44.27 | 16/4 | 5,5,1,5 | 12 | 3/3 | 25/77/29/8/0 | 139 | no | 2022-04-26 | 1 | ok | +213/−77 (logic +22/−11) |
| 114 | [OfficialZygorg/The-Modding-Tree](https://github.com/OfficialZygorg/The-Modding-Tree) | The ABC Tree 0.4bf | 2.6.6.2 | 43.78 | 3/2 | 1,2 | 2 | 0/1 | 6/19/3/1/0 | 29 | yes | 2023-11-14 | 1 | ok | +1091/−1131 (logic +1091/−1131) |
| 115 | [MVF7/The-Modding-Tree](https://github.com/MVF7/The-Modding-Tree) | Testing Tree 0.3.1.1 | 2.6.6.2 | 43.74 | 6/3 | 1,2,3 | 8 | 3/2 | 11/14/0/0/0 | 25 | yes | 2022-01-03 | 1 | ok | +5/−0 (logic +0/−0) |
| 116 | [akivn/The-Origin-Railway-History-Tree](https://github.com/akivn/The-Origin-Railway-History-Tree) | The History Tree 0.1 | 2.6.6.2 | 43.42 | 3/3 | 1,1,1 | 3 | 0/0 | 6/15/0/2/4 | 27 | yes | 2024-05-25 | 2: akivn/The-Origin-Railway-History-Tree, Marxcalbre/The-Modding-Tree | ok | +0/−0 (logic +0/−0) |
| 117 | [cornucanis/The-Atomic-Tree](https://github.com/cornucanis/The-Atomic-Tree) | The Atomic Tree 0.5.1 | 2.6.6.2 | 43.33 | 6/3 | 1,3,2 | 8 | 3/2 | 22/24/9/0/0 | 55 | no | 2024-04-23 | 1 | ok | +17/−1 (logic +2/−1) |
| 118 | [theothernamesweretaken/Prestige-Tree](https://github.com/theothernamesweretaken/Prestige-Tree) | Prestige Tree Rewritten 1.3 | 2.2.1 | 43.25 | 28/7 | 1,2,5,4,5,6,5 | 45 | 14/16 | 85/172/52/9/80 | 398 | yes | 2022-04-23 | 1 | ✗ load() | +1142/−247 (logic +500/−118) |
| 119 | [Magmalis/The-Floppa-Tree](https://github.com/Magmalis/The-Floppa-Tree) | The Floppa Tree 1.31 | 2.6.6.2 | 43.18 | 3/2 | 2,1 | 1 | 0/0 | 0/23/0/3/11 | 37 | yes | 2023-09-10 | 1 | ok | +0/−0 (logic +0/−0) |
| 120 | [hhh101/The-Territory-Tree](https://github.com/hhh101/The-Territory-Tree) | The Territory Tree 0.0 | 2.6.6.2 | 42.3 | 4/4 | 1,1,1,1 | 3 | 1/0 | 19/22/6/6/0 | 53 | yes | 2024-07-02 | 1 | ok | +0/−0 (logic +0/−0) |
| 121 | [AppleLord1/The-Modding-Tree](https://github.com/AppleLord1/The-Modding-Tree) | The Dotree 1.0 | 2.6.6.2 | 41.76 | 7/4 | 1,2,1,3 | 13 | 4/3 | 9/20/13/0/0 | 42 | no | 2023-02-22 | 1 | ok | +0/−0 (logic +0/−0) |
| 122 | [The-Ultimate-Tree-Rewritten/The-Ultimate-Tree-Rewritten](https://github.com/The-Ultimate-Tree-Rewritten/The-Ultimate-Tree-Rewritten) | The Ultimate Tree Rewritten 1.00 | 2.7 | 41.66 | 4/3 | 1,2,1 | 3 | 1/0 | 0/39/0/2/16 | 57 | no | 2026-06-16 | 1 | ok | +0/−0 (logic +0/−0) |
| 123 | [TZR-byte/Inkrementalka](https://github.com/TZR-byte/Inkrementalka) | Zavrsni rad 1.0 | 2.7 | 41.6 | 13/6 | 2,3,3,2,2,1 | 12 | 1/1 | 4/43/1/0/0 | 48 | no | 2025-06-26 | 1 | ok | +11/−8 (logic +0/−0) |
| 124 | [Glennreble/The-Modding-Tree](https://github.com/Glennreble/The-Modding-Tree) | The Rocket Tree 0.3 Sacrifice | 2.6.6.2 | 41.29 | 3/3 | 1,1,1 | 2 | 0/0 | 0/6/0/0/12 | 18 | yes | 2024-04-27 | 1 | ok | +0/−0 (logic +0/−0) |
| 125 | [Redmountain0/The-Prestige-Tree](https://github.com/Redmountain0/The-Prestige-Tree) | The Prestige Tree 0.1.2a | 2.3.5 | 41.01 | 6/4 | 1,1,2,2 | 5 | 0/1 | 7/23/0/0/20 | 50 | yes | 2021-01-25 | 1 | ok | +50/−23 (logic +29/−12) |
| 126 | [ryan27367/The-Modding-Tree](https://github.com/ryan27367/The-Modding-Tree) | The GCI Tree 1.01 Beta | 2.6.6.2 | 40.92 | 3/2 | 1,2 | 2 | 0/1 | 7/14/0/0/9 | 30 | yes | 2022-08-29 | 1 | ok | +20/−20 (logic +20/−20) |
| 127 | [Kenjie3870/The-Modding-Tree-v1](https://github.com/Kenjie3870/The-Modding-Tree-v1) | small layers tree 0.2b | 2.6 | 40.81 | 3/2 | 1,2 | 2 | 1/0 | 8/28/4/8/0 | 48 | yes | 2021-06-12 | 1 | ok | +1/−1 (logic +1/−1) |
| 128 | [boknoy21/The-Modding-Tree](https://github.com/boknoy21/The-Modding-Tree) | The Yes Tree 1.6 | 2.6.6.2 | 40.56 | 22/10 | 1,3,2,3,2,1,1,3,4,2 | 29 | 0/4 | 3/83/0/0/1 | 87 | no | 2022-10-30 | 1 | ok | +0/−0 (logic +0/−0) |
| 129 | [lingluo3/The-Genesis-Tree](https://github.com/lingluo3/The-Genesis-Tree) | The Genesis Tree 0.0 | 2.6.6.2 | 40.51 | 5/3 | 1,3,1 | 5 | 1/1 | 8/36/2/0/4 | 50 | yes | 2022-12-20 | 1 | ok | +58/−8 (logic +58/−8) |
| 130 | [bunkeris/myfirsttree](https://github.com/bunkeris/myfirsttree) | MY FIRST Tree 0.0.4 | 2.7 | 40.41 | 5/5 | 1,1,1,1,1 | 4 | 0/0 | 46/0/0/0/12 | 58 | no | 2026-06-01 | 1 | ok | +0/−0 (logic +0/−0) |
| 131 | [IAmYhvr/The-Modding-Tree](https://github.com/IAmYhvr/The-Modding-Tree) | The Christmas Tree 0.3 | 2.3.5 | 40.16 | 4/2 | 1,3 | 3 | 1/0 | 7/22/9/4/0 | 42 | yes | 2020-12-27 | 1 | ok | +1333/−911 (logic +991/−731) |
| 132 | [okamii17/Prestige-Tree-Stardust](https://github.com/okamii17/Prestige-Tree-Stardust) | The Stardust Tree 0.0.3a | 2.1.3.1 | 39.92 | 4/3 | 1,2,1 | 3 | 1/0 | 0/25/15/0/0 | 40 | yes | 2020-10-28 | 1 | ok | +56/−43 (logic +0/−0) |
| 133 | [3k5m/The-Modding-Tree](https://github.com/3k5m/The-Modding-Tree) | The Hyperdimensions Tree 0.1.0 | 2.6.6.2 | 39.35 | 6/5 | 1,2,1,1,1 | 3 | 0/1 | 16/35/2/0/0 | 53 | no | 2024-12-02 | 1 | ok | +18/−2 (logic +0/−0) |
| 134 | [meme0846/Distance-Incremental](https://github.com/meme0846/Distance-Incremental) | Distance Incremental 0.2 Rocket Fuel | 2.1.3.1 | 39.31 | 3/3 | 1,1,1 | 2 | 0/0 | 0/0/1/0/16 | 17 | yes | 2023-08-22 | 1 | ok | +3/−2 (logic +3/−2) |
| 135 | [rowantrees/The-Modding-Tree](https://github.com/rowantrees/The-Modding-Tree) | The Testy Tree 0.1 | 2.6.6.2 | 39.27 | 4/3 | 1,2,1 | 4 | 1/1 | 2/10/1/4/5 | 22 | yes | 2022-01-25 | 1 | ok | +3/−3 (logic +1/−1) |
| 136 | [TerperSquared/The-Math-Tree](https://github.com/TerperSquared/The-Math-Tree) | The Mathematical Tree 0.5 | 2.5.11.1 | 38.98 | 5/4 | 1,2,1,1 | 3 | 1/0 | 6/27/0/0/0 | 33 | yes | 2021-05-31 | 1 | ok | +0/−0 (logic +0/−0) |
| 137 | [skralg/The-Modding-Tree](https://github.com/skralg/The-Modding-Tree) | The RPG Tree 0.3 | 2.7 | 38.57 | 14/4 | 7,3,2,2 | 5 | 1/1 | 9/10/2/2/0 | 23 | no | 2026-01-23 | 1 | ok | +2610/−912 (logic +3/−3) |
| 138 | [Idontknow73647/The-Loop-Tree-2](https://github.com/Idontknow73647/The-Loop-Tree-2) | The Loop Tree 2 1.0 | 2.7 | 38.52 | 4/3 | 1,2,1 | 2 | 1/0 | 5/12/0/0/13 | 30 | no | 2026-07-28 | 1 | ok | +2/−2 (logic +2/−2) |
| 139 | [Kolt3rbolt3r/The-Pain-Tree](https://github.com/Kolt3rbolt3r/The-Pain-Tree) | A game about Rocks 0.01 | 2.7 | 38.46 | 4/4 | 1,1,1,1 | 2 | 0/0 | 7/28/0/4/0 | 39 | no | 2026-09-09 | 1 | ok | +3/−3 (logic +0/−0) |
| 140 | [22edc/Gooby-Cat-Tree](https://github.com/22edc/Gooby-Cat-Tree) | Gooby Cat Tree 0.02b | 2.6.5.1 | 37.94 | 4/2 | 3,1 | 1 | 0/0 | 7/18/6/4/0 | 35 | no | 2026-08-14 | 1 | ok | +0/−0 (logic +0/−0) |
| 141 | [The-Alternate-Tree/The-Rank-Tree](https://github.com/The-Alternate-Tree/The-Rank-Tree) | The Rank Tree 1.0 | 2.7 | 37.94 | 5/5 | 1,1,1,1,1 | 4 | 0/0 | 35/0/0/0/0 | 35 | no | 2026-03-22 | 1 | ok | +0/−0 (logic +0/−0) |
| 142 | [Grassyhead13/The-Colour-Tree](https://github.com/Grassyhead13/The-Colour-Tree) | The Colour Tree 0.1 | 2.7 | 36.8 | 4/2 | 1,3 | 3 | 0/1 | 0/12/0/0/9 | 21 | no | 2026-09-03 | 1 | ok | +0/−0 (logic +0/−0) |
| 143 | [whatthefoxsay0/The-Modding-Tree](https://github.com/whatthefoxsay0/The-Modding-Tree) | The Notsomodding Tree 0.1 | 2.6.6.2 | 36.68 | 3/2 | 1,2 | 2 | 0/1 | 0/11/0/0/0 | 11 | yes | 2022-11-13 | 1 | ok | +0/−0 (logic +0/−0) |
| 144 | [tunethebee/The-Modding-Tree](https://github.com/tunethebee/The-Modding-Tree) | The Orchard Tree 0.0 | 2.7 | 35.81 | 4/2 | 2,2 | 3 | 1/0 | 6/42/0/0/0 | 48 | no | 2026-06-13 | 1 | ok ⚠nondet | +0/−0 (logic +0/−0) |
| 145 | [coolbro101/the-periodic-tree](https://github.com/coolbro101/the-periodic-tree) | The Periodic Tree 0.1 | 2.6.6.2 | 35.8 | 4/4 | 1,1,1,1 | 3 | 1/1 | 5/27/0/0/5 | 37 | no | 2024-06-21 | 1 | ok | +71/−16 (logic +66/−12) |
| 146 | [Lun4-R/The-Collab-Tree](https://github.com/Lun4-R/The-Collab-Tree) | The Collab Tree 0.0 | 2.6.6.2 | 35.75 | 6/3 | 2,3,1 | 5 | 2/2 | 10/21/10/3/15 | 59 | no | 2023-09-03 | 1 | ok | +7124/−5958 (logic +3426/−1855) |
| 147 | [incrementalguy/The-Layerverse-Tree](https://github.com/incrementalguy/The-Layerverse-Tree) | The Layerverse Tree 1.0 | 2.7 | 35.51 | 4/3 | 1,1,2 | 3 | 1/0 | 3/11/0/2/0 | 16 | no | 2026-05-19 | 1 | ok | +0/−0 (logic +0/−0) |
| 148 | [The-Alternate-Tree/The-Random-Update-Tree](https://github.com/The-Alternate-Tree/The-Random-Update-Tree) | The Random Updates Tree 3.1 | 2.7 | 34.54 | 3/2 | 1,2 | 2 | 1/0 | 4/8/0/1/0 | 13 | no | 2026-04-17 | 1 | ok | +0/−0 (logic +0/−0) |
| 149 | [AppleLord1space/The-Modding-Tree2](https://github.com/AppleLord1space/The-Modding-Tree2) | The Nova Tree 0.35.1 | 2.6.6.2 | 34.06 | 3/3 | 1,1,1 | 2 | 0/1 | 15/9/17/2/12 | 55 | no | 2023-02-19 | 1 | ok | +0/−0 (logic +0/−0) |
| 150 | [INVADERover/The-Modding-Tree-level](https://github.com/INVADERover/The-Modding-Tree-level) | Level Tree 0.0 | 2.6.6.2 | 33.99 | 4/2 | 1,3 | 0 | 0/0 | 18/26/4/2/7 | 57 | no | 2025-03-02 | 1 | ok | +126/−13 (logic +44/−11) |
| 151 | [SD-Redstone/The-Exponential-Tree](https://github.com/SD-Redstone/The-Exponential-Tree) | The Exponential Tree 0.5 | 2.6.6.2 | 33.21 | 3/3 | 1,1,1 | 2 | 0/0 | 2/10/1/0/0 | 13 | no | 2025-10-15 | 1 | ok | +4/−1 (logic +4/−1) |
| 152 | [WoodStuff/The-Egg-Tree](https://github.com/WoodStuff/The-Egg-Tree) | The Egg Tree 0.0 | 2.6.6.2 | 32.68 | 3/2 | 1,2 | 2 | 0/1 | 3/16/0/0/6 | 25 | yes | 2021-09-19 | 1 | ok | +50/−33 (logic +48/−31) |
| 153 | [snakeandre/Constellation-Tree](https://github.com/snakeandre/Constellation-Tree) | The Constellation Tree 0.1 | 2.7 | 32.03 | 12/4 | 3,3,4,2 | 1 | 0/0 | 2/9/0/0/0 | 11 | no | 2025-07-16 | 1 | ok | +29/−18 (logic +0/−0) |
| 154 | [SchoolSucks69/SchoolSucks69.github.io](https://github.com/SchoolSucks69/SchoolSucks69.github.io) | The Size Tree 0.3 | 2.6.6.2 | 31.94 | 3/3 | 1,1,1 | 0 | 0/0 | 0/34/0/0/0 | 34 | no | 2023-05-12 | 1 | ok | +0/−0 (logic +0/−0) |
| 155 | [nhunghoang2512-cmyk/The-Modding-Tree](https://github.com/nhunghoang2512-cmyk/The-Modding-Tree) | The ??? Tree 0.0 | 2.7 | 31.85 | 3/3 | 1,1,1 | 2 | 0/0 | 8/20/0/0/0 | 28 | no | 2026-07-31 | 1 | ok | +0/−0 (logic +0/−0) |
| 156 | 🔧 calibration:upgrade-land-tmt | Upgrade Land (TMT port) 0.1 | 2.7 | 31.33 | 27/7 | 5,5,4,4,4,3,2 | 4 | 1/0 | 0/0/0/0/0 | 0 | yes | 2026-09-14 |  | ok ⚠nondet | +3/−0 (logic +0/−0) |
| 157 | [hhrjfjjxg/The-Tree](https://github.com/hhrjfjjxg/The-Tree) | The Tree 0.0 | 2.7 | 31 | 5/3 | 1,2,2 | 5 | 2/1 | 0/10/0/0/0 | 10 | no | 2026-09-07 | 1 | ok | +0/−0 (logic +0/−0) |
| 158 | [Deltatron3/The-Modding-Tree](https://github.com/Deltatron3/The-Modding-Tree) | The Last Tree 0.0 | 2.7 | 30.59 | 4/2 | 3,1 | 3 | 0/1 | 1/18/0/0/0 | 19 | no | 2025-05-29 | 1 | ok | +4/−0 (logic +4/−0) |
| 159 | [Alexhupp/The-Modding-Tree](https://github.com/Alexhupp/The-Modding-Tree) | The World Tree Nordrasil 0.1B | 2.6.6.2 | 30.45 | 6/4 | 2,2,1,1 | 7 | 2/2 | 1/9/0/0/0 | 10 | no | 2022-12-12 | 1 | ok | +63/−46 (logic +25/−21) |
| 160 | [EndoBTD/The-Modding-Tree](https://github.com/EndoBTD/The-Modding-Tree) | The Dream Tree 1.4 | 2.6.6.2 | 30.34 | 7/4 | 1,2,3,1 | 0 | 0/0 | 0/30/0/0/0 | 30 | no | 2022-12-18 | 1 | ok | +560/−560 (logic +560/−560) |
| 161 | [gaimn/test-tree](https://github.com/gaimn/test-tree) | The Testing Tree 0.0 | 2.6.6.2 | 30.21 | 4/3 | 1,2,1 | 2 | 0/1 | 0/8/0/0/7 | 15 | no | 2025-09-20 | 1 | ok | +2/−1 (logic +0/−0) |
| 162 | [bubbacow2/The-Modding-Tree](https://github.com/bubbacow2/The-Modding-Tree) | The Dingus Tree 0.0 | 2.7 | 28.55 | 3/2 | 2,1 | 1 | 0/0 | 2/7/1/1/3 | 14 | no | 2025-11-22 | 1 | ok | +0/−0 (logic +0/−0) |
| 163 | [Shophaune/The-Modding-Tree](https://github.com/Shophaune/The-Modding-Tree) | The Reality Tree 0.1.5 | 2.6.6.2 | 28.34 | 4/3 | 1,2,1 | 2 | 0/1 | 4/18/0/0/0 | 22 | no | 2022-03-24 | 1 | ok | +0/−0 (logic +0/−0) |
| 164 | [Hadi-Serhan/The-Modding-Tree](https://github.com/Hadi-Serhan/The-Modding-Tree) | The mining tree 0.0 | 2.7 | 28.26 | 3/2 | 1,2 | 2 | 0/1 | 0/10/1/0/0 | 11 | no | 2025-06-30 | 1 | ok | +0/−0 (logic +0/−0) |
| 165 | [tzh391/The-Modding-Tree](https://github.com/tzh391/The-Modding-Tree) | The Incrementreeverse 1.0 The Abelian Tributary | 2.1.3.1 | 28.04 | 28/4 | 6,7,8,7 | 6 | 1/0 | 610/1040/225/63/12 | 1950 | yes | 2025-08-07 | 1 | ✗ load() | +147/−49 (logic +108/−37) |
| 166 | [TheRealComnet/The-Modding-Tree](https://github.com/TheRealComnet/The-Modding-Tree) | The ??? Tree 0.0 | 2.7 | 27.33 | 3/2 | 1,2 | 2 | 1/0 | 3/5/0/0/0 | 8 | no | 2026-02-07 | 1 | ok | +0/−0 (logic +0/−0) |
| 167 | [Preta-Crowz/Equilibrium](https://github.com/Preta-Crowz/Equilibrium) | Equilibrium 0.0 | 2.6.6.2 | 27.16 | 5/2 | 2,3 | 7 | 2/3 | 0/10/0/0/0 | 10 | no | 2023-02-05 | 1 | ok | +14/−1 (logic +14/−1) |
| 168 | [GabRioBlu/the-castle-wars-tree](https://github.com/GabRioBlu/the-castle-wars-tree) | The cw Tree 0.0 | 2.6.6.2 | 27.01 | 4/2 | 3,1 | 3 | 1/1 | 0/4/9/0/0 | 13 | no | 2024-02-27 | 1 | ok | +29/−6 (logic +17/−0) |
| 169 | [EmiPiplu/The-Matter-Tree](https://github.com/EmiPiplu/The-Matter-Tree) | The ??? Tree 0.0 | 2.6.6.2 | 26.56 | 4/2 | 1,3 | 4 | 1/1 | 4/27/7/0/0 | 38 | no | 2021-12-03 | 1 | ok | +0/−0 (logic +0/−0) |
| 170 | [OhManLolLol/BSED-Tree](https://github.com/OhManLolLol/BSED-Tree) | BSED Tree 0.0 | 2.6.6.2 | 26.07 | 5/3 | 2,2,1 | 4 | 1/1 | 7/20/3/2/4 | 36 | no | 2021-10-31 | 1 | ok | +0/−0 (logic +0/−0) |
| 171 | [Pheromosa-Club/Pheromosa-Club-Tree](https://github.com/Pheromosa-Club/Pheromosa-Club-Tree) | The Pheromosa Club  Tree 0.0 | 2.6.6.2 | 25.75 | 1/1 | 1 | 0 | 0/0 | 11/1/0/0/1 | 13 | no | 2024-09-19 | 1 | ok | +0/−0 (logic +0/−0) |
| 172 | [keyboardmannow/Romerium](https://github.com/keyboardmannow/Romerium) | The Romeo & Julliet Tree 0.1 | 2.3.3.1 | 25.5 | 4/3 | 1,2,1 | 4 | 1/1 | 3/9/0/0/0 | 12 | no | 2021-07-01 | 1 | ok | +0/−0 (logic +0/−0) |
| 173 | [horse-offender/The-Math-Tree](https://github.com/horse-offender/The-Math-Tree) | The Math Tree 0.0 | 2.6.6.2 | 24.67 | 3/2 | 1,2 | 2 | 1/0 | 0/9/0/0/0 | 9 | no | 2024-06-05 | 1 | ok | +0/−13 (logic +0/−0) |
| 174 | [FunBoiMeeper/The-Duck-Tree](https://github.com/FunBoiMeeper/The-Duck-Tree) | The Snake Tree 0.0 | 2.7 | 24.27 | 8/3 | 3,4,1 | 9 | 1/2 | 0/3/0/0/0 | 3 | no | 2025-01-13 | 1 | ok | +0/−0 (logic +0/−0) |
| 175 | [Pimvgd/The-Modding-Tree](https://github.com/Pimvgd/The-Modding-Tree) |   | 2.0.5.1 | 23.98 | 4/3 | 1,2,1 | 2 | 1/0 | 19/14/0/0/0 | 33 | no | 2020-10-17 | 1 | ok | +161/−229 (logic +80/−78) |
| 176 | [lockstepgithub/The-Modding-Tree](https://github.com/lockstepgithub/The-Modding-Tree) | The Pre-Brick Tree 0.2 | 2.6.6.2 | 23.93 | 4/3 | 1,2,1 | 3 | 1/0 | 0/7/0/0/0 | 7 | no | 2022-07-31 | 1 | ok | +0/−0 (logic +0/−0) |
| 177 | [superjakeyLKR/Reali-Tree](https://github.com/superjakeyLKR/Reali-Tree) | Reali-Tree 0.0 | 2.6.6.2 | 23.86 | 4/2 | 1,3 | 3 | 1/0 | 3/7/3/2/0 | 15 | no | 2023-03-01 | 1 | ok | +0/−0 (logic +0/−0) |
| 178 | [alexpra231/-1Clicker](https://github.com/alexpra231/-1Clicker) | +1 Clicker 0.0 | 2.6.6.2 | 23.84 | 6/6 | 1,1,1,1,1,1 | 5 | 1/0 | 0/5/3/0/0 | 8 | no | 2024-09-14 | 1 | ok | +0/−0 (logic +0/−0) |
| 179 | [thepasswordispasswor/The-Cookie-Tree](https://github.com/thepasswordispasswor/The-Cookie-Tree) | The Cookie Tree 0.2~ | 2.π.1 | 23.77 | 3/2 | 1,2 | 2 | 1/0 | 0/10/1/0/0 | 11 | no | 2021-05-03 | 1 | ok | +0/−0 (logic +0/−0) |
| 180 | [mysteryflower/The-Modding-Tree](https://github.com/mysteryflower/The-Modding-Tree) | stupid test tree 0.0 | 2.6.6.2 | 22.92 | 4/3 | 2,1,1 | 2 | 0/1 | 3/3/0/0/0 | 6 | no | 2024-06-10 | 1 | ok | +0/−0 (logic +0/−0) |
| 181 | [Algarvod914/The-Modding-Tree](https://github.com/Algarvod914/The-Modding-Tree) | Interstellar Exploration Report: USS Odyssey  | tmt-no-tmtNum | 22.42 | 9/5 | 1,2,3,2,1 | 12 | 4/4 | 0/12/4/0/0 | 16 | yes | 2026-04-23 | 1 | ✗ load() | — |
| 182 | [Sphinx-Omega/The-Universe-Tree--OLD-](https://github.com/Sphinx-Omega/The-Universe-Tree--OLD-) | The Universe Tree 0.1 | 2.7 | 21.98 | 3/2 | 1,2 | 2 | 1/0 | 12/19/4/0/7 | 42 | yes | 2025-03-22 | 1 | ✗ load() | +828/−249 (logic +781/−218) |
| 183 | [Shocks654/The-Infinite-Horizon-Tree](https://github.com/Shocks654/The-Infinite-Horizon-Tree) | The Infinite Horizon Tree 0.9 | 2.7 | 21.76 | 3/2 | 1,2 | 2 | 1/0 | 5/15/0/0/10 | 30 | yes | 2026-09-13 | 1 | ✗ census | +104/−140 (logic +0/−0) |
| 184 | [NuclearMK43/The-Modding-Tree](https://github.com/NuclearMK43/The-Modding-Tree) | The ??? Tree 0.0 | 2.6.6.2 | 21.14 | 3/2 | 1,2 | 2 | 1/0 | 4/7/0/0/0 | 11 | no | 2022-08-25 | 1 | ok | +0/−0 (logic +0/−0) |
| 185 | [thefinaluptake/The-Burning-Tree](https://github.com/thefinaluptake/The-Burning-Tree) |   | 2.0.4 | 21.07 | 3/2 | 1,2 | 2 | 1/0 | 6/12/0/0/0 | 18 | no | 2020-10-16 | 1 | ok | +229/−290 (logic +130/−105) |
| 186 | [caty-dev123/The-Modding-Tree](https://github.com/caty-dev123/The-Modding-Tree) | The Basics Tree 0.7 | 2.6.6.2 | 20.86 | 6/3 | 2,2,2 | 6 | 3/1 | 3/23/0/3/2 | 31 | yes | 2023-04-26 | 1 | ✗ ticks | +0/−0 (logic +0/−0) |
| 187 | [conbann/The-test-tree](https://github.com/conbann/The-test-tree) | The test Tree 0.01 | 2.6.6.2 | 20.46 | 3/2 | 1,2 | 4 | 1/2 | 2/8/0/0/0 | 10 | yes | 2025-08-31 | 1 | ✗ load() | +0/−0 (logic +0/−0) |
| 188 | [Losan33/The-Chroma-Tree](https://github.com/Losan33/The-Chroma-Tree) | The Chroma Tree 0.1 | 2.π.1 | 20.3 | 4/2 | 1,3 | 3 | 1/0 | 0/5/0/0/0 | 5 | no | 2021-04-11 | 1 | ok | +117/−31 (logic +34/−23) |
| 189 | [ObjectZAsy/The-Modding-Tree](https://github.com/ObjectZAsy/The-Modding-Tree) | The Mining Tree 0.0 | 2.6.5.1 | 19.19 | 3/2 | 1,2 | 3 | 1/1 | 2/7/0/0/0 | 9 | no | 2021-07-31 | 1 | ok | +4/−4 (logic +0/−0) |
| 191 | [jakub791/The-Collab-Tree](https://github.com/jakub791/The-Collab-Tree) | The Collab Tree 0.0 | 2.6.6.2 | 16.12 | 6/3 | 2,3,1 | 5 | 2/2 | 10/26/11/7/24 | 78 | no | 2023-09-20 | 1 | ✗ load() | +6998/−5343 (logic +3590/−1650) |
| 192 | [TelosNox/The-Modding-Tree](https://github.com/TelosNox/The-Modding-Tree) | The exp tree 0.0 | 2.6.6.2 | 15.28 | 2/2 | 1,1 | 0 | 0/0 | 0/2/4/0/0 | 6 | no | 2021-12-01 | 1 | ok | +0/−0 (logic +0/−0) |
| 193 | [Samakalt152416/The-Modding-Tree](https://github.com/Samakalt152416/The-Modding-Tree) | SamDBI V4 Again... ω | 2.7 | 15.12 | 3/3 | 1,1,1 | 2 | 0/0 | 8/12/0/0/0 | 20 | no | 2026-06-01 | 1 | ✗ load() | +42/−2784 (logic +8/−9) |
| 194 | [fifthless/The-Library-Tree](https://github.com/fifthless/The-Library-Tree) | The Portal Tree 0.6 Welcome to Jake | 2.6.6.2 | 14.97 | 3/2 | 1,2 | 2 | 0/0 | 5/9/0/0/0 | 14 | yes | 2022-04-03 | 1 | ✗ load() | +0/−0 (logic +0/−0) |
| 195 | 🔧 [calibration:The-Modding-Tree](https://github.com/Acamaeda/The-Modding-Tree) | The ??? Tree 0.0 | 2.7 | 12.81 | 1/1 | 1 | 0 | 0/0 | 0/0/0/0/0 | 0 | no | 2024-10-28 |  | ok | +0/−0 (logic +0/−0) |
| 196 | [humfr3y/Godlyverse-Tree](https://github.com/humfr3y/Godlyverse-Tree) | Godlyverse Tree 0.4 | 2.6.6.2 | 12.78 | 3/3 | 1,1,1 | 2 | 0/0 | 2/0/17/0/0 | 19 | no | 2023-12-04 | 1 | ✗ load() | +16/−2 (logic +7/−1) |
| 197 | [KillOrDeath/The-Button-Tree](https://github.com/KillOrDeath/The-Button-Tree) | The Button Tree 1.0 | 2.6.6.2 | 10.8 | 3/2 | 2,1 | 1 | 0/0 | 0/0/8/0/0 | 8 | no | 2023-12-11 | 1 | ✗ load() | +0/−0 (logic +0/−0) |
| 198 | [BSkyT/The-Button-Tree](https://github.com/BSkyT/The-Button-Tree) | The Button Tree 1.0 | 2.6.6.2 | 9.55 | 6/5 | 2,1,1,1,1 | 4 | 0/0 | 0/0/4/0/0 | 4 | no | 2024-02-13 | 1 | ✗ load() | +0/−0 (logic +0/−0) |

## Families not booted (static numbers only)

| # | repo | game / version | engine | score | layers/rows | width per row | edges | fork/join | ms/upg/buy/ch/ach | content | endgame | last push | members | boot | engine deviation vs stock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 190 | [RTXT25/RTreeXTree](https://github.com/RTXT25/RTreeXTree) | RTXT25.Github.io 2.3.1 | 2.6.6.2 | 18.81 | 3/2 | 2,1 | 3 | 0/0 | 0/0/0/0/0 | 0 | yes | 2022-03-24 | 1 | not booted | — |

## Calibration rows and their copies

A copy has the calibration tree's layer-id set and content counts (README, "Family collapse"); its whole family is listed here and left out of the ranking. ★ = the family's representative (booted); `~edited member` = a family member whose own static counts or layer ids differ from the calibration tree's.

### PTR (Prestige Tree Rewritten 1.3) — 16 copies

- [proxatines/The-Modding-Tree](https://github.com/proxatines/The-Modding-Tree) (2.6.6.2) ★
- [Vulpathy/Prestige-Tree](https://github.com/Vulpathy/Prestige-Tree) (2.2.1) ★
- [270882/Prestige-Tree-v1.3-](https://github.com/270882/Prestige-Tree-v1.3-) (2.2.1)
- [aarextiaokhiao/Prestige-Tree](https://github.com/aarextiaokhiao/Prestige-Tree) (2.2.1)
- [ageofambrosia/Prestige-Tree](https://github.com/ageofambrosia/Prestige-Tree) (2.2.1)
- [barcense/Prestige-Tree](https://github.com/barcense/Prestige-Tree) (2.2.1)
- [eninfamousvy/Prestige-Tree](https://github.com/eninfamousvy/Prestige-Tree) (2.2.1)
- [factorXXX/The-Modding-Tree](https://github.com/factorXXX/The-Modding-Tree) (2.2.1)
- [Gr00t97/Prestige-Tree](https://github.com/Gr00t97/Prestige-Tree) (2.2.1)
- [jaalte/Prestige-Tree](https://github.com/jaalte/Prestige-Tree) (2.2.1)
- [Kainen-1/Prestige-Tree---Rebuilt-The-Part](https://github.com/Kainen-1/Prestige-Tree---Rebuilt-The-Part) (2.2.1)
- [levijude/tree-of-297](https://github.com/levijude/tree-of-297) (2.2.1)
- [mcpower/Prestige-Tree](https://github.com/mcpower/Prestige-Tree) (2.2.1)
- [Traster101/Dijkstra](https://github.com/Traster101/Dijkstra) (2.2.1)
- [Victor-Leroy/Prestige-Tree](https://github.com/Victor-Leroy/Prestige-Tree) (2.2.1)
- [WattJust/Prestige-Tree-Trapped](https://github.com/WattJust/Prestige-Tree-Trapped) (2.2.1)

### TMT (The ??? Tree 0.0) — 0 copies

(none)

### upgrade-land-tmt (Upgrade Land (TMT port) 0.1) — 0 copies

(none)

## Boot failures

| repo | failed at | error |
|---|---|---|
| theothernamesweretaken/Prestige-Tree | load() | TypeError: Cannot read properties of undefined (reading 'upgrades') @ at hasUpgrade (js/utils.js:634:24) |
| tzh391/The-Modding-Tree | load() | TypeError: Cannot read properties of undefined (reading 'challenges') @ at challengeCompletions (js/utils.js:441:24) |
| Algarvod914/The-Modding-Tree | load() | ReferenceError: Cannot access 'boolNames' before initialization @ at setupTempData (js/technical/temp.js:84:4) |
| Sphinx-Omega/The-Universe-Tree--OLD- | load() | TypeError: Cannot set properties of undefined (setting 'sign') @ at Decimal (js/technical/break_eternity.js:200:17) |
| Shocks654/The-Infinite-Horizon-Tree | census | ReferenceError: layers is not defined @ at census:3:29 |
| caty-dev123/The-Modding-Tree | ticks | TypeError: player.th.gte is not a function @ at Object.done (js/layers.js:559:30) |
| conbann/The-test-tree | load() | TypeError: Cannot read properties of undefined (reading 'upgrades') @ at hasUpgrade (js/utils/easyAccess.js:2:25) |
| jakub791/The-Collab-Tree | load() | TypeError: Cannot read properties of undefined (reading 'upgrades') @ at hasUpgrade (js/utils/easyAccess.js:3:18) |
| Samakalt152416/The-Modding-Tree | load() | ReferenceError: modInfo is not defined @ at getModID (js/utils/save.js:2:36) |
| fifthless/The-Library-Tree | load() | TypeError: Cannot read properties of undefined (reading 'upgrades') @ at hasUpgrade (js/utils/easyAccess.js:2:25) |
| humfr3y/Godlyverse-Tree | load() | SyntaxError: Unexpected token  in JSON at position 0 @ at JSON.parse (<anonymous>) |
| KillOrDeath/The-Button-Tree | load() | TypeError: (intermediate value).add(...).times(...).sub(...).mult is not a function @ at Object.effect [as actualEffectFunction] (js/layers.js:103:113) |
| BSkyT/The-Button-Tree | load() | TypeError: Cannot read properties of undefined (reading 'effect') @ at Object.effect (js/layers.js:559:60) |

## Non-deterministic boots (idle leg) and the state paths that differ

| repo | paths |
|---|---|
| thecoolcookie366/The-Modding-Tree | rng.points, rng.total, rng.best |
| c0v1d-9119361/The-Plague-Tree | timePlayed, lastSave, info-tab.resetTime, options-tab.resetTime, changelog-tab.resetTime, tree-tab.resetTime, v.resetTime, i.resetTime, r.resetTime, u.resetTime, s.resetTime, d.resetTime, stat.resetTime, a.resetTime, uv.resetTime, f.resettime, f.sact, f.rt, f.bt, f.resetTime |
| ducdat0507/prestreestuck | saveId |
| medsal15/The-Gaming-Tree | xp.enemies, to.random |
| FallingMountain/The-Modding-Tree | Nanoprestige.corruption |
| qcy00hou12/The-Periodic-Table-Tree | N.id, N.word, N.alt, N.image |
| tunethebee/The-Modding-Tree | $.stamp, $.stamp2, $.updatedtime |
| calibration:upgrade-land-tmt | ul.lastSeen |
