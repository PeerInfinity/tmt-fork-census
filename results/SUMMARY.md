# TMT fork census — results

Generated 2026-09-14 by `scripts/rank.mjs` from `data/*.jsonl`. Every number below is read from those rows.
🔧 = calibration row (local clone, not a fork). Score = branchiness 40 + content 30 + completeness 30 (formula: README, `lib/score.mjs`).

## Funnel

| stage | count |
|---|---|
| forks listed (both roots + one level of forks-of-forks) | 1914 |
| … untouched (`pushed_at <= created_at`) | 817 |
| … touched | 1097 |
| static-censused (stage 2) | 1097 (fetch errors 0; no `js/game.js` 16) |
| non-trivial | 234 |
| static-censused rows whose `js/layers.js` is byte-identical (after CRLF/trim normalization) to a stock demo | 294 |
| distinct non-trivial families (layer-id set + engine version) | 196 (with a shortlist score > 0: 195) |
| shortlisted for boot | 60 |
| boot rows (shortlist + calibration) | 63 — ok 60, failed 3; idle-deterministic 53; policy leg ok 60 |
| static census agrees with the live boot census (layers, branch edges, content all equal) | 39 of 57 booted forks with a census |

Engines (stage 2): tmt 1075 · prestige-tree-legacy 2 · no-game-js 16 · tmt-no-tmtNum 3 · unknown 1.
Trivial reasons as recorded by stage 2 (a row may have several; "demo unchanged" was run as: demo `layers.js` and no other content file): <=2 layers 800 · no branches 805 · demo unchanged 2.

## Booted rows, ranked

| # | repo | game / version | engine | score | layers/rows | width per row | edges | fork/join | ms/upg/buy/ch/ach | content | endgame | last push | family | boot | engine deviation vs stock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | [crazkingda1st/PrestigeTreeNGPlus-edited-](https://github.com/crazkingda1st/PrestigeTreeNGPlus-edited-) | Prestige Tree NG+ 1.6 | 2.2.1 | 100 | 34/9 | 1,2,5,4,5,6,5,5,1 | 63 | 20/21 | 113/253/57/9/121 | 553 | yes | 2026-06-11 | 3 | ok | +1164/−243 (logic +520/−114) |
| 2 | [Vulpathy/Prestige-Tree](https://github.com/Vulpathy/Prestige-Tree) | Testing Tree 1.0 (= PTR tree) | 2.2.1 | 99.94 | 28/7 | 1,2,5,4,5,6,5 | 45 | 15/15 | 85/172/52/9/80 | 398 | yes | 2025-09-09 | 15 | ok | +1137/−242 (logic +495/−113) |
| 3 | [thecuttlefish123213/The-Cosmic-Tree](https://github.com/thecuttlefish123213/The-Cosmic-Tree) | The Cosmic Tree 0.1.1 | 2.7 | 98.67 | 23/7 | 2,4,5,4,4,1,3 | 38 | 15/14 | 43/175/134/17/63 | 432 | yes | 2026-09-10 | 1 | ok | +1884/−1180 (logic +685/−569) |
| 4 | [CrazyHighNumbers69/The-Modding-Tree](https://github.com/CrazyHighNumbers69/The-Modding-Tree) | The Pro Tree 0.9c | 2.6.0.1 | 95.06 | 40/12 | 1,2,3,4,5,6,7,8,1,1,1,1 | 64 | 24/23 | 95/1207/34/72/187 | 1595 | yes | 2023-09-23 | 1 | ok | +1899/−3692 (logic +266/−189) |
| 5 | [skylafalls/Extended-Tree](https://github.com/skylafalls/Extended-Tree) | The Extended Tree 1.4.1 | 2.2.1 | 94.22 | 35/9 | 1,2,5,6,5,6,5,3,2 | 64 | 23/22 | 103/233/58/12/80 | 486 | yes | 2023-05-23 | 1 | ok | +1172/−275 (logic +497/−115) |
| 6 | 🔧 calibration:Prestige-Tree | Prestige Tree Rewritten 1.3 | 2.2.1 | 89.97 | 28/7 | 1,2,5,4,5,6,5 | 45 | 15/15 | 85/172/52/9/80 | 398 | yes | 2021-05-25 |  | ok | +1137/−242 (logic +495/−113) |
| 7 | [Omega-pgg/The-Modding-Tree](https://github.com/Omega-pgg/The-Modding-Tree) | The Omega Tree 2.3.0: Update 13 | 2.6.6.2 | 86.18 | 25/10 | 1,4,1,4,4,4,1,2,1,3 | 38 | 12/10 | 112/569/19/17/170 | 887 | yes | 2024-06-09 | 1 | ok | +490/−55 (logic +485/−54) |
| 8 | [Askinga/The-MJ-Tree](https://github.com/Askinga/The-MJ-Tree) | The MJ Tree 2.4.0 | 2.6.6.2 | 77.67 | 15/6 | 3,1,1,7,2,1 | 23 | 8/7 | 15/147/2/15/72 | 251 | yes | 2026-09-13 | 1 | ok | +11/−6 (logic +7/−3) |
| 9 | [Dressygithub/The-Dressy-Tree](https://github.com/Dressygithub/The-Dressy-Tree) | The Dressy Tree 1 | 2.7 | 77.25 | 16/5 | 8,4,2,1,1 | 18 | 5/9 | 17/238/12/9/25 | 301 | yes | 2026-07-14 | 1 | ok | +31/−5 (logic +12/−3) |
| 10 | [thecoolcookie366/The-Modding-Tree](https://github.com/thecoolcookie366/The-Modding-Tree) | The Cookie Tree 1.03 | 2.7 | 77.21 | 32/8 | 5,5,7,6,3,3,2,1 | 43 | 7/9 | 24/113/0/2/36 | 175 | yes | 2026-08-28 | 1 | ok ⚠nondet | +15/−14 (logic +15/−13) |
| 11 | [haram0614/The-Modding-Tree](https://github.com/haram0614/The-Modding-Tree) | The Quantum Tree 1.1 | 2.6.6.2 | 77.07 | 25/5 | 6,7,6,4,2 | 26 | 8/8 | 0/184/0/0/23 | 207 | yes | 2025-04-24 | 1 | ok | +0/−0 (logic +0/−0) |
| 12 | [CoolBoris/The-Galactic-Tree](https://github.com/CoolBoris/The-Galactic-Tree) | The Galactic Tree 3.0.2 | no-game-js | 76.67 | 39/12 | 2,6,4,5,4,4,2,1,3,3,3,2 | 38 | 9/11 | 214/421/33/17/177 | 862 | no | 2026-04-28 | 3 | ok | — |
| 13 | [Justcubing97/JC97sSomethingTree](https://github.com/Justcubing97/JC97sSomethingTree) | Justcubing97's Something Tree 0.5.9 | 2.7 | 76.36 | 14/7 | 1,1,3,4,1,2,2 | 22 | 9/4 | 68/175/23/11/52 | 329 | yes | 2026-08-02 | 1 | ok | +51/−11 (logic +49/−9) |
| 14 | [SIGMA-HOPEDY/The-PP-Tree](https://github.com/SIGMA-HOPEDY/The-PP-Tree) | The PP Tree 0.1 | 2.7 | 76.01 | 12/6 | 1,2,3,1,2,3 | 21 | 6/7 | 45/172/14/12/64 | 307 | yes | 2026-08-31 | 1 | ok | +208/−127 (logic +149/−83) |
| 15 | [c0v1d-9119361/The-Plague-Tree](https://github.com/c0v1d-9119361/The-Plague-Tree) | Plague Tree (Vorona Cirus Treesease) 0.6.25 | 2.6.6.2 | 75.49 | 16/5 | 2,4,4,5,1 | 24 | 8/6 | 372/1131/319/40/169 | 2031 | yes | 2024-06-07 | 8 | ok ⚠nondet | +1057/−270 (logic +920/−238) |
| 16 | [SSansssssssssssss/Excavation-Tree](https://github.com/SSansssssssssssss/Excavation-Tree) | Excavation Tree 1.3 | 2.6.6.2 | 75.08 | 21/5 | 10,2,3,4,2 | 25 | 6/6 | 22/172/61/10/86 | 351 | yes | 2025-08-05 | 1 | ok | +500/−15 (logic +392/−4) |
| 17 | [p-u/The-Point-Tree](https://github.com/p-u/The-Point-Tree) | The Point Tree 3.6S | 2.7 | 74.67 | 11/8 | 1,1,1,1,1,3,2,1 | 22 | 5/6 | 255/712/24/6/226 | 1223 | yes | 2026-08-11 | 2 | ok | +281/−28 (logic +243/−13) |
| 18 | [certainjellyfish9204/The-Modding-Tree](https://github.com/certainjellyfish9204/The-Modding-Tree) | The Classic+ Tree 0.9 | 2.7 | 74.67 | 14/9 | 1,3,2,2,1,2,1,1,1 | 20 | 5/6 | 105/223/72/40/164 | 604 | yes | 2026-09-11 | 1 | ok | +1579/−3211 (logic +1369/−453) |
| 19 | [FlareZ0000/The-Modding-Tree](https://github.com/FlareZ0000/The-Modding-Tree) | The Alphabetree 1.2.6 | 2.6.6.2 | 73.35 | 46/27 | 1,2,2,3,1,2,2,1,2,3,2,1,1,2,3,1,3,1,1,3,2,1,2,1,1,1,1 | 77 | 23/20 | 11/20/0/0/0 | 31 | no | 2024-02-07 | 1 | ok | +0/−0 (logic +0/−0) |
| 20 | [ducdat0507/prestreestuck](https://github.com/ducdat0507/prestreestuck) | The Prestreestuck 0.1.1.2.6 | 2.5.2.1 | 70.9 | 19/11 | 2,1,2,2,2,1,1,2,3,2,1 | 21 | 6/3 | 77/166/162/8/0 | 413 | yes | 2025-04-05 | 1 | ok ⚠nondet 0-layers→static | +1313/−350 (logic +713/−239) |
| 21 | [denisolenison/The-Leveling-Tree](https://github.com/denisolenison/The-Leveling-Tree) | The Leveling Tree 0.2.0.1 | 2.6.6.2 | 68.5 | 8/4 | 2,3,2,1 | 15 | 6/6 | 60/100/6/9/0 | 175 | yes | 2024-05-07 | 2 | ok | +673/−611 (logic +589/−584) |
| 22 | [MegaLaad/Infinity-Tree2](https://github.com/MegaLaad/Infinity-Tree2) | The Infinity Tree 1.0.4 | 2.6.6.2 | 67.81 | 14/6 | 1,2,3,4,1,3 | 19 | 7/4 | 41/67/26/3/29 | 166 | yes | 2024-09-17 | 1 | ok | +5/−4 (logic +4/−3) |
| 23 | [pg132/The-Modding-Tree](https://github.com/pg132/The-Modding-Tree) | The Incrementreeverse 1.0 The Abelian Tributary | 2.1.3.1 | 67.17 | 16/5 | 2,5,4,3,2 | 18 | 5/3 | 31/245/30/16/0 | 322 | yes | 2024-09-26 | 6 | ok | +147/−49 (logic +108/−37) |
| 24 | [epicstatbattles/Low-Taper-Fade](https://github.com/epicstatbattles/Low-Taper-Fade) | The Low Taper Fade Tree 5.6.1 | 2.7 | 65.35 | 13/6 | 1,2,3,2,3,2 | 16 | 4/3 | 27/127/18/8/0 | 180 | yes | 2026-08-06 | 1 | ok | +5/−3 (logic +5/−3) |
| 25 | [KremboMC/Ultimate-Prestige-Tree](https://github.com/KremboMC/Ultimate-Prestige-Tree) | Ultimate Prestige Tree 0.2.3 | 2.7 | 65.2 | 11/4 | 1,3,3,4 | 13 | 3/6 | 23/64/15/0/0 | 102 | yes | 2026-09-05 | 1 | ok | +0/−0 (logic +0/−0) |
| 26 | [Thaness0/The-reset-tree](https://github.com/Thaness0/The-reset-tree) | The Reset Tree 0.3 | 2.6.6.2 | 64.77 | 12/6 | 1,2,3,3,2,1 | 31 | 10/8 | 19/69/6/4/36 | 134 | no | 2024-03-09 | 1 | ok | +13/−4 (logic +13/−4) |
| 27 | [liamhmn/The-Modding-Tree](https://github.com/liamhmn/The-Modding-Tree) | The Number Tree 0.3.2 | 2.6.6.2 | 64.32 | 14/6 | 1,3,3,5,1,1 | 18 | 3/4 | 153/160/24/64/49 | 450 | yes | 2023-09-12 | 1 | ok | +566/−564 (logic +560/−560) |
| 28 | [ThePrestigeTreeGuy/The-Modding-Tree](https://github.com/ThePrestigeTreeGuy/The-Modding-Tree) | The Doors Tree 0.7 | 2.6.6.2 | 63.49 | 8/4 | 3,3,1,1 | 10 | 1/5 | 32/112/12/2/4 | 162 | yes | 2026-09-08 | 1 | ok | +10/−10 (logic +0/−0) |
| 29 | [danickverse/The-Modding-Tree](https://github.com/danickverse/The-Modding-Tree) | Universal Expansion 0.2.5 | 2.6.6.2 | 63.16 | 6/2 | 3,3 | 8 | 2/2 | 37/127/38/2/55 | 259 | yes | 2026-07-10 | 1 | ok | +172/−34 (logic +68/−16) |
| 30 | [ArmeKnockedOut/the-element-tree](https://github.com/ArmeKnockedOut/the-element-tree) | The Element Tree ersion: alpha 0.4 | 2.6.5.1 | 63.13 | 9/5 | 2,2,3,1,1 | 7 | 2/2 | 45/135/8/13/56 | 257 | yes | 2026-06-24 | 1 | ok | +74/−2 (logic +31/−2) |
| 31 | [unsoftcapped4/Prestige-Tree-Rewritten](https://github.com/unsoftcapped4/Prestige-Tree-Rewritten) | Prestige Tree Rewritten 1.0 | 2.2.1 | 63.04 | 16/6 | 1,2,5,4,3,1 | 22 | 6/6 | 45/119/17/8/32 | 221 | yes | 2020-12-26 | 1 | ok | +515/−126 (logic +277/−67) |
| 32 | [peacefulwar/Arc-Tree](https://github.com/peacefulwar/Arc-Tree) | Arc Tree 0.0.4 | 2.7 | 62.28 | 13/6 | 1,2,2,4,3,1 | 12 | 3/0 | 65/170/17/13/65 | 330 | yes | 2025-05-25 | 1 | ok | +17/−1 (logic +1/−1) |
| 33 | [BanaCubed/Create-Incremental-Legacy-TMT](https://github.com/BanaCubed/Create-Incremental-Legacy-TMT) | Create Incremental 0.4 | 2.7 | 61.25 | 14/4 | 1,1,3,9 | 13 | 2/2 | 44/88/15/7/55 | 209 | yes | 2025-05-12 | 1 | ok | +2316/−1780 (logic +1604/−1241) |
| 34 | [e205-idle-beta/normaltree.github.io](https://github.com/e205-idle-beta/normaltree.github.io) | The Normal Tree 0.1.4 | 2.6.6.2 | 60.48 | 18/12 | 1,1,2,1,2,1,3,1,2,1,2,1 | 19 | 3/5 | 34/78/0/3/0 | 115 | yes | 2024-02-09 | 1 | ok | +3/−3 (logic +0/−0) |
| 35 | [The-Alternate-Tree/The-Incremental-Tree](https://github.com/The-Alternate-Tree/The-Incremental-Tree) | The Incremental Tree 5.0.0 | 2.7 | 60.37 | 8/5 | 1,2,2,2,1 | 10 | 2/3 | 3/100/0/10/0 | 113 | yes | 2026-03-06 | 1 | ok | +2/−2 (logic +0/−0) |
| 36 | [The179UCETile/wextwall-tree](https://github.com/The179UCETile/wextwall-tree) | The TextWall Tree 0.2 | 2.7 | 59.91 | 7/6 | 1,1,2,1,1,1 | 9 | 2/3 | 14/67/3/4/15 | 103 | yes | 2026-09-04 | 1 | ok | +175/−55 (logic +75/−17) |
| 37 | [mirc3a22000/the-lime-upgrade-tree](https://github.com/mirc3a22000/the-lime-upgrade-tree) | The Lime Upgrade Tree 0.9 | 2.6.6.2 | 59.26 | 7/4 | 2,1,2,2 | 6 | 2/0 | 0/166/5/0/31 | 202 | yes | 2026-04-30 | 1 | ok | +44/−35 (logic +27/−27) |
| 38 | [MsliAghtlyD/A-Tree-For-Sure](https://github.com/MsliAghtlyD/A-Tree-For-Sure) | A Tree For Sure 0.04999d | 2.6.6.2 | 59.01 | 7/3 | 1,3,3 | 6 | 2/1 | 13/82/9/11/32 | 147 | yes | 2026-07-21 | 1 | ok | +26/−3 (logic +25/−2) |
| 39 | [Sersseras/The-Modding-Tree](https://github.com/Sersseras/The-Modding-Tree) | The Algebra Tree 0.0 | 2.7 | 58.57 | 16/7 | 1,2,4,4,2,1,2 | 24 | 7/8 | 24/57/29/0/0 | 110 | no | 2026-03-25 | 1 | ok | +6/−6 (logic +0/−0) |
| 40 | [MSpekkio/The-Mana-Tree](https://github.com/MSpekkio/The-Mana-Tree) | The Mana Tree 0.4 | 2.7 | 58.48 | 9/3 | 3,3,3 | 9 | 2/2 | 11/63/11/0/18 | 103 | yes | 2025-08-29 | 1 | ok | +10/−0 (logic +10/−0) |
| 41 | [Onesmartshark/Earth-Tree](https://github.com/Onesmartshark/Earth-Tree) | The Earth Tree 1.11 | 2.6.6.2 | 58.09 | 11/5 | 1,2,3,3,2 | 10 | 3/0 | 18/78/2/4/20 | 122 | yes | 2026-07-30 | 1 | ok | +0/−0 (logic +0/−0) |
| 42 | [medsal15/The-Gaming-Tree](https://github.com/medsal15/The-Gaming-Tree) | The Gaming Tree R0.B.6 | 2.6.6.2 | 57.62 | 17/4 | 8,6,2,1 | 13 | 1/0 | 11/153/61/16/116 | 357 | yes | 2024-06-11 | 1 | ok ⚠nondet | +982/−511 (logic +723/−348) |
| 44 | [cyxw/Arctree](https://github.com/cyxw/Arctree) | ArcTree 0.0.7.0 | 2.6.6.2 | 56.83 | 32/6 | 1,4,6,6,7,8 | 15 | 3/0 | 73/220/18/27/90 | 428 | yes | 2022-10-31 | 1 | ok | +208/−34 (logic +49/−10) |
| 45 | [IEmory/TreeQuest](https://github.com/IEmory/TreeQuest) | TreeQuest 0.2.1-SR | 2.6.6.2 | 56.77 | 24/3 | 2,16,6 | 30 | 8/1 | 4/2/80/0/0 | 86 | yes | 2022-09-02 | 1 | ok | +57/−19 (logic +13/−3) |
| 47 | [Inferno-Inc/The-Primordial-Tree](https://github.com/Inferno-Inc/The-Primordial-Tree) | The Primordial Tree 2.3 | 2.6.6.2 | 56.49 | 13/5 | 1,3,4,3,2 | 12 | 1/2 | 144/138/13/5/72 | 372 | yes | 2022-11-04 | 2 | ok | +2284/−3453 (logic +1223/−1353) |
| 50 | [XxXOLEGXxX/Shenanigans-Tree](https://github.com/XxXOLEGXxX/Shenanigans-Tree) | The Shenanigans Tree: Rewritten 1.0.1 | 2.6.0.1 | 53.58 | 6/3 | 2,3,1 | 7 | 1/1 | 13/117/9/5/36 | 180 | yes | 2023-08-29 | 1 | ok | +13/−13 (logic +0/−0) |
| 51 | [murapix/Universal-Reconstruction](https://github.com/murapix/Universal-Reconstruction) | Universal Reconstruction 0.8.2 | 2.6.5.1 | 53.32 | 11/4 | 5,1,3,2 | 6 | 2/1 | 18/78/56/2/0 | 154 | yes | 2023-05-02 | 1 | ok | +609/−121 (logic +236/−48) |
| 52 | [qwerty2281444/The-Fly-Eating-Tree](https://github.com/qwerty2281444/The-Fly-Eating-Tree) | Devourer of Flies 0.4 | 2.7 | 52.94 | 9/4 | 1,2,3,3 | 11 | 4/2 | 24/110/3/8/0 | 145 | no | 2026-09-06 | 1 | ok | +4/−0 (logic +4/−0) |
| 54 | [XtremeRusher/The-Modding-Tree](https://github.com/XtremeRusher/The-Modding-Tree) | Collection of Everything 0.3 | 2.6.6.2 | 52.64 | 10/4 | 3,5,1,1 | 11 | 2/2 | 9/26/4/4/13 | 56 | yes | 2024-07-13 | 1 | ok | +4/−4 (logic +1/−1) |
| 56 | [mikosss2/TFoTremake](https://github.com/mikosss2/TFoTremake) | The Function of Time Tree 1.5.n+1 | 2.6.6.2 | 52.34 | 15/3 | 6,6,3 | 9 | 2/1 | 5/61/36/7/72 | 181 | yes | 2022-08-14 | 1 | ok | +14/−3 (logic +1/−0) |
| 61 | [FallingMountain/The-Modding-Tree](https://github.com/FallingMountain/The-Modding-Tree) | Falling Mountain's AlterPrestige 0.4.0c Beta | 2.6.4.3 | 51.32 | 10/5 | 1,2,4,2,1 | 4 | 0/0 | 37/107/27/5/69 | 245 | yes | 2023-03-18 | 1 | ok ⚠nondet | +2/−2 (logic +1/−1) |
| 65 | [qcy00hou12/The-Periodic-Table-Tree](https://github.com/qcy00hou12/The-Periodic-Table-Tree) | The Periodic Table Tree 1.7.1 | 2.6.6.2 | 49.62 | 8/3 | 3,3,2 | 7 | 0/1 | 38/53/21/5/65 | 182 | yes | 2022-08-03 | 1 | ok ⚠nondet | +746/−35 (logic +34/−16) |
| 67 | [shenmi124/The-Game-Tree](https://github.com/shenmi124/The-Game-Tree) | The Game Tree 0.6.3 | 2.6.5.1 | 49.09 | 10/4 | 3,3,3,1 | 10 | 2/2 | 12/78/8/7/7 | 112 | yes | 2021-09-27 | 1 | ok | +23/−5 (logic +11/−3) |
| 68 | [CudjzikxmxR/The-Rainbow-Void-Tree](https://github.com/CudjzikxmxR/The-Rainbow-Void-Tree) | The Rainbow Void Tree 0.2 | 2.7 | 49.01 | 5/3 | 1,3,1 | 6 | 2/1 | 28/79/0/0/40 | 147 | no | 2026-02-12 | 1 | ok | +599/−43 (logic +497/−19) |
| 74 | [am30936/The-Modding-Tree](https://github.com/am30936/The-Modding-Tree) | An Operation Tree 0.3.1 | 2.7 | 48.17 | 7/3 | 2,2,3 | 7 | 2/1 | 31/56/2/6/29 | 124 | no | 2026-04-06 | 1 | ok | +5/−0 (logic +5/−0) |
| 75 | [DatMLGTaco/The-Modding-Tree](https://github.com/DatMLGTaco/The-Modding-Tree) | The Melge Tree 0.0 | 2.6.6.2 | 48.14 | 8/4 | 1,2,3,2 | 13 | 6/3 | 15/48/12/0/12 | 87 | no | 2025-03-12 | 1 | ok | +266/−20 (logic +51/−11) |
| 106 | [Dystopia-user181/The-Modding-Tree](https://github.com/Dystopia-user181/The-Modding-Tree) | The Factoree 0.5.0 | 2.2.2 | 44.27 | 16/4 | 5,5,1,5 | 12 | 3/3 | 25/77/29/8/0 | 139 | no | 2022-04-26 | 1 | ok | +213/−77 (logic +22/−11) |
| 111 | [theothernamesweretaken/Prestige-Tree](https://github.com/theothernamesweretaken/Prestige-Tree) | Prestige Tree Rewritten 1.3 | 2.2.1 | 43.25 | 28/7 | 1,2,5,4,5,6,5 | 45 | 14/16 | 85/172/52/9/80 | 398 | yes | 2022-04-23 | 1 | ✗ load() | +1142/−247 (logic +500/−118) |
| 125 | [boknoy21/The-Modding-Tree](https://github.com/boknoy21/The-Modding-Tree) | The Yes Tree 1.6 | 2.6.6.2 | 40.56 | 22/10 | 1,3,2,3,2,1,1,3,4,2 | 29 | 0/4 | 3/83/0/0/1 | 87 | no | 2022-10-30 | 1 | ok | +0/−0 (logic +0/−0) |
| 126 | [proxatines/The-Modding-Tree](https://github.com/proxatines/The-Modding-Tree) | Prestige Tree Revised 1.0 | 2.6.6.2 | 40.3 | 28/7 | 1,2,5,4,5,6,5 | 45 | 15/15 | 85/172/52/9/80 | 398 | no | 2023-12-15 | 1 | ✗ load() | +0/−0 (logic +0/−0) |
| 159 | 🔧 calibration:upgrade-land-tmt | Upgrade Land (TMT port) 0.1 | 2.7 | 31.33 | 27/7 | 5,5,4,4,4,3,2 | 4 | 1/0 | 0/0/0/0/0 | 0 | yes | 2026-09-14 |  | ok ⚠nondet | +3/−0 (logic +0/−0) |
| 170 | [tzh391/The-Modding-Tree](https://github.com/tzh391/The-Modding-Tree) | The Incrementreeverse 1.0 The Abelian Tributary | 2.1.3.1 | 28.04 | 28/4 | 6,7,8,7 | 6 | 1/0 | 610/1040/225/63/12 | 1950 | yes | 2025-08-07 | 1 | ✗ load() | +147/−49 (logic +108/−37) |
| 199 | 🔧 calibration:The-Modding-Tree | The ??? Tree 0.0 | 2.7 | 12.81 | 1/1 | 1 | 0 | 0/0 | 0/0/0/0/0 | 0 | no | 2024-10-28 |  | ok | +0/−0 (logic +0/−0) |

## Top non-booted families (static numbers only)

| # | repo | game / version | engine | score | layers/rows | width per row | edges | fork/join | ms/upg/buy/ch/ach | content | endgame | last push | family | boot | engine deviation vs stock |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 43 | [The-Alternate-Tree/The-Loop-Tree](https://github.com/The-Alternate-Tree/The-Loop-Tree) | The Loop Tree 1.42 | 2.7 | 57.08 | 8/4 | 1,2,3,2 | 6 | 3/1 | 19/61/9/4/33 | 126 | yes | 2026-04-04 | 1 | not booted | — |
| 46 | [hanlaosan1/The-Wall-Tree](https://github.com/hanlaosan1/The-Wall-Tree) | 墙树 1.0 | 2.7 | 56.55 | 5/3 | 1,3,1 | 9 | 3/3 | 9/66/1/5/0 | 81 | yes | 2025-04-19 | 1 | not booted | — |
| 48 | [nolhan42/The-Greek-Tree](https://github.com/nolhan42/The-Greek-Tree) | The Greek Tree 0.1 | 2.7 | 56.21 | 4/3 | 1,2,1 | 4 | 1/1 | 23/116/16/0/26 | 181 | yes | 2026-07-05 | 1 | not booted | — |
| 49 | [liamkelly4123-jpg/The-Incremental-Tree](https://github.com/liamkelly4123-jpg/The-Incremental-Tree) | The Incremental Tree 4.0.0 | 2.7 | 55.98 | 7/4 | 1,2,2,2 | 8 | 2/2 | 1/90/0/10/0 | 101 | yes | 2026-03-04 | 1 | not booted | — |
| 53 | [Cubedey/The-Tree-Prestige](https://github.com/Cubedey/The-Tree-Prestige) | The Tree Prestige 1.11111 | 2.1.1 | 52.87 | 8/4 | 1,2,3,2 | 10 | 4/3 | 9/28/19/0/0 | 56 | yes | 2024-01-08 | 1 | not booted | — |
| 55 | [Slicedberg/Ore-Tree](https://github.com/Slicedberg/Ore-Tree) | The Ore Tree INDEV | 2.7 | 52.46 | 5/3 | 1,2,2 | 4 | 2/0 | 9/49/7/2/18 | 85 | yes | 2026-04-28 | 1 | not booted | — |
| 57 | [xiajibazuo/Layer-Tree](https://github.com/xiajibazuo/Layer-Tree) | 层级树 0.2 | 2.7 | 52.16 | 7/6 | 1,2,1,1,1,1 | 7 | 1/2 | 22/16/9/14/0 | 61 | yes | 2026-08-10 | 1 | not booted | — |
| 58 | [great0108/The-Modding-Tree](https://github.com/great0108/The-Modding-Tree) | The mechanic Tree 0.3 | 2.7 | 52.08 | 3/2 | 1,2 | 2 | 1/0 | 5/84/14/0/0 | 103 | yes | 2026-06-24 | 1 | not booted | — |
| 59 | [ArkSayCode/The-Question-Tree](https://github.com/ArkSayCode/The-Question-Tree) | The Question Tree 0.0.4 | 2.6.6.2 | 51.83 | 6/4 | 1,2,2,1 | 9 | 2/4 | 9/15/9/4/8 | 45 | yes | 2024-07-26 | 1 | not booted | — |
| 60 | [quwpsss/The-Modding-Tree](https://github.com/quwpsss/The-Modding-Tree) | The Danus Tree 0.9.2 | 2.6.6.2 | 51.37 | 10/5 | 2,2,2,2,2 | 1 | 0/0 | 20/120/8/0/0 | 148 | yes | 2025-03-26 | 1 | not booted | — |
| 62 | [beterbriffin/Moding-Tree-game-or-something](https://github.com/beterbriffin/Moding-Tree-game-or-something) | The Tree of some random ideas and is probably bad 1.0 | 2.6.6.2 | 51.14 | 5/3 | 1,1,3 | 4 | 1/1 | 35/14/1/5/10 | 65 | yes | 2026-08-29 | 2 | not booted | — |
| 63 | [brendonjaygarcia2011-dot/Universal-Shifting-Tree](https://github.com/brendonjaygarcia2011-dot/Universal-Shifting-Tree) | The Universal Shifting Tree 0.20.1.2 | 2.7 | 51.08 | 6/4 | 1,2,2,1 | 6 | 2/1 | 15/34/0/0/0 | 49 | yes | 2026-05-04 | 1 | not booted | — |
| 64 | [cosmology101-active/The-H2O-Tree](https://github.com/cosmology101-active/The-H2O-Tree) | The H2O Tree 1.0 | 2.6.6.2 | 50.38 | 7/3 | 2,3,2 | 8 | 2/3 | 6/27/2/0/7 | 42 | yes | 2024-08-27 | 1 | not booted | — |
| 66 | [MartianCreations/The-Congratulations-Tree](https://github.com/MartianCreations/The-Congratulations-Tree) | The Congratulations Tree 0.13 (DEMO) | 2.7 | 49.16 | 6/3 | 2,3,1 | 5 | 1/0 | 0/52/0/0/5 | 57 | yes | 2026-02-17 | 1 | not booted | — |
| 69 | [The-Alternate-Tree/The-Prestige-Galaxy](https://github.com/The-Alternate-Tree/The-Prestige-Galaxy) | The Prestige Galaxy 1.03 | 2.7 | 48.98 | 3/2 | 1,2 | 2 | 1/0 | 1/34/0/1/19 | 55 | yes | 2026-04-23 | 1 | not booted | — |
| 70 | [Increveloper/The-Hyperoperator-Tree](https://github.com/Increveloper/The-Hyperoperator-Tree) | The Hyperoperator Tree 2.0 | 2.5.11.1 | 48.83 | 4/4 | 1,1,1,1 | 3 | 0/0 | 19/45/6/0/0 | 70 | yes | 2026-07-25 | 1 | not booted | — |
| 71 | [HothUH33/The-ExisReality-Tree](https://github.com/HothUH33/The-ExisReality-Tree) | The Tree of Existence and Reality 0.4 | 2.6.6.2 | 48.58 | 10/5 | 3,3,2,1,1 | 9 | 3/1 | 5/30/14/4/18 | 71 | yes | 2023-06-09 | 1 | not booted | — |
| 72 | [usi1947/The-Fruit-Tree](https://github.com/usi1947/The-Fruit-Tree) | The Fruit Tree 1.3 | 2.6.6.2 | 48.49 | 5/3 | 2,2,1 | 5 | 2/2 | 8/82/0/0/0 | 90 | yes | 2022-12-07 | 1 | not booted | — |
| 73 | [QnoraeT/The-Modding-Tree](https://github.com/QnoraeT/The-Modding-Tree) | The TearonQ (i have no creative names) 0.0 | 2.7 | 48.42 | 3/2 | 1,2 | 2 | 1/0 | 23/98/0/14/0 | 135 | yes | 2026-09-14 | 1 | not booted | — |
| 76 | [liam43210/The-Prestige-Tree-2](https://github.com/liam43210/The-Prestige-Tree-2) | The Prestige Tree 2 1.0.0 | 2.7 | 48.1 | 4/3 | 1,2,1 | 4 | 1/1 | 3/21/0/0/11 | 35 | yes | 2026-04-12 | 2 | not booted | — |
| 77 | [Jeehan2561/The-Numbruh-Tree](https://github.com/Jeehan2561/The-Numbruh-Tree) | The Numbruh Tree .1.2.1 | 2.6.6.2 | 48.04 | 3/3 | 1,1,1 | 2 | 0/0 | 13/44/17/0/50 | 124 | yes | 2024-04-01 | 2 | not booted | — |
| 78 | [gapples2/The-Modding-Tree](https://github.com/gapples2/The-Modding-Tree) | The Basic Tree 1.6.2.1 | 2.2.1 | 47.49 | 6/3 | 2,2,2 | 9 | 3/4 | 14/11/0/0/36 | 61 | yes | 2021-08-19 | 1 | not booted | — |
| 79 | [Efsoone/The-Modding-Tree](https://github.com/Efsoone/The-Modding-Tree) | The Reborn Incremental Tree 0.2a Part1 | 2.7 | 47.42 | 4/3 | 1,1,2 | 3 | 1/0 | 15/25/0/0/0 | 40 | yes | 2026-06-27 | 1 | not booted | — |
| 80 | [Algarvod914/The-Modding-Tree](https://github.com/Algarvod914/The-Modding-Tree) | Interstellar Exploration Report: USS Odyssey  | tmt-no-tmtNum | 47.35 | 9/5 | 1,2,3,2,1 | 12 | 4/4 | 0/12/4/0/0 | 16 | yes | 2026-04-23 | 1 | not booted | — |
| 81 | [difficultcomplexity/The-Modding-Tree](https://github.com/difficultcomplexity/The-Modding-Tree) | The Weight Tree 1.0g | 2.6.6.2 | 47.33 | 9/4 | 1,3,2,3 | 6 | 1/2 | 32/62/1/12/35 | 142 | yes | 2022-02-05 | 1 | not booted | — |
| 82 | [liamthecatguy/The-Upgradeverse-Tree](https://github.com/liamthecatguy/The-Upgradeverse-Tree) | The Upgradeverse Tree 1.1.0 | 2.7 | 47.3 | 6/5 | 1,1,2,1,1 | 5 | 1/0 | 3/36/0/0/0 | 39 | yes | 2026-03-02 | 1 | not booted | — |
| 83 | [rainbowice975/The-Jax-Tree](https://github.com/rainbowice975/The-Jax-Tree) | The Jax Tree 0.2 | 2.7 | 47.18 | 3/2 | 1,2 | 2 | 0/0 | 4/38/0/0/8 | 50 | yes | 2026-05-09 | 1 | not booted | — |
| 84 | [temptempa/The-Modding-Tree](https://github.com/temptempa/The-Modding-Tree) | The Douyuan Tree beta 1.1 | 2.7 | 47.1 | 4/2 | 1,3 | 4 | 2/1 | 3/23/0/0/0 | 26 | yes | 2025-05-05 | 1 | not booted | — |
| 85 | [The-Alternate-Tree/A-Tree-About-Layers](https://github.com/The-Alternate-Tree/A-Tree-About-Layers) | A Tree About Layers 1.0 | 2.7 | 46.63 | 5/4 | 1,1,1,2 | 4 | 1/0 | 0/29/0/0/5 | 34 | yes | 2026-03-28 | 1 | not booted | — |
| 86 | [weyrhvwvrwuvureurw/The-Modding-Tree](https://github.com/weyrhvwvrwuvureurw/The-Modding-Tree) | The Unbalanced Tree 0.1.3 | 2.6.6.2 | 46.59 | 5/3 | 1,2,2 | 6 | 0/2 | 10/41/0/21/0 | 72 | yes | 2023-09-07 | 1 | not booted | — |
| 87 | [Sphinx-Omega/The-Universe-Tree--OLD-](https://github.com/Sphinx-Omega/The-Universe-Tree--OLD-) | The Universe Tree 0.1 | 2.7 | 46.46 | 3/2 | 1,2 | 2 | 1/0 | 12/19/4/0/7 | 42 | yes | 2025-03-22 | 1 | not booted | — |
| 88 | [TheIcyIcicle/The-Modding-Tree](https://github.com/TheIcyIcicle/The-Modding-Tree) | The Layered Tree 0.0.1 | 2.6.6.2 | 46.44 | 4/4 | 1,1,1,1 | 1 | 0/0 | 0/29/1/0/13 | 43 | yes | 2026-04-28 | 1 | not booted | — |
| 89 | [notadragon/counting-sheep-tree](https://github.com/notadragon/counting-sheep-tree) | Sheep Incremental? 0.0.4 | 2.7 | 46.43 | 4/2 | 1,3 | 3 | 1/0 | 11/24/1/0/0 | 36 | yes | 2025-07-06 | 1 | not booted | — |
| 90 | [Shocks654/The-Infinite-Horizon-Tree](https://github.com/Shocks654/The-Infinite-Horizon-Tree) | The Infinite Horizon Tree 0.9 | 2.7 | 46.02 | 3/2 | 1,2 | 2 | 1/0 | 5/15/0/0/10 | 30 | yes | 2026-09-13 | 1 | not booted | — |
| 91 | [RaceproxateDev/The-Ultimate-Prestige-Tree](https://github.com/RaceproxateDev/The-Ultimate-Prestige-Tree) | The Ultimate Prestige Tree 0.1 | 2.7 | 45.84 | 4/4 | 1,1,1,1 | 3 | 0/0 | 22/15/0/1/0 | 38 | yes | 2026-03-01 | 1 | not booted | — |
| 92 | [Yahkub7/The-Modding-Tree](https://github.com/Yahkub7/The-Modding-Tree) | The Cultree 0.0.6.9 | 2.6.6.2 | 45.63 | 5/4 | 1,2,1,1 | 4 | 1/1 | 7/27/9/26/14 | 83 | yes | 2023-01-06 | 1 | not booted | — |
| 93 | [monkeh42/The-Modding-Tree](https://github.com/monkeh42/The-Modding-Tree) | The NecromanTree 0.3.2 | 2.3.4 | 45.28 | 10/4 | 1,2,5,2 | 10 | 4/2 | 20/28/3/0/0 | 51 | yes | 2021-09-08 | 1 | not booted | — |
| 94 | [Hank17227/Weakling-Tree](https://github.com/Hank17227/Weakling-Tree) | Weakling Tree 0.8.10 | 2.7 | 45.22 | 5/2 | 2,3 | 3 | 1/0 | 69/69/3/8/45 | 194 | no | 2026-07-12 | 1 | not booted | — |
| 95 | [Moosiqe/Coffee-Shop](https://github.com/Moosiqe/Coffee-Shop) | Coffee Shop 0.11 | 2.7 | 45.01 | 6/3 | 1,2,3 | 7 | 2/2 | 11/60/12/0/0 | 83 | no | 2026-09-07 | 1 | not booted | — |
| 96 | [Dackel090/The-Universal-Tree](https://github.com/Dackel090/The-Universal-Tree) | The Universal Tree 0.2.0 | 2.6.6.2 | 44.96 | 4/2 | 2,2 | 5 | 1/1 | 12/19/8/0/0 | 39 | yes | 2024-03-25 | 1 | not booted | — |

## Boot failures

| repo | failed at | error |
|---|---|---|
| theothernamesweretaken/Prestige-Tree | load() | TypeError: Cannot read properties of undefined (reading 'upgrades') @ at hasUpgrade (js/utils.js:634:24) |
| proxatines/The-Modding-Tree | load() | TypeError: value.lte is not a function @ at softcap (js/game.js:73:12) |
| tzh391/The-Modding-Tree | load() | TypeError: Cannot read properties of undefined (reading 'challenges') @ at challengeCompletions (js/utils.js:441:24) |

## Non-deterministic boots (idle leg) and the state paths that differ

| repo | paths |
|---|---|
| thecoolcookie366/The-Modding-Tree | rng.points, rng.total, rng.best |
| c0v1d-9119361/The-Plague-Tree | timePlayed, lastSave, info-tab.resetTime, options-tab.resetTime, changelog-tab.resetTime, tree-tab.resetTime, v.resetTime, i.resetTime, r.resetTime, u.resetTime, s.resetTime, d.resetTime, stat.resetTime, a.resetTime, uv.resetTime, f.resettime, f.sact, f.rt, f.bt, f.resetTime |
| ducdat0507/prestreestuck | saveId |
| medsal15/The-Gaming-Tree | xp.enemies, to.random |
| FallingMountain/The-Modding-Tree | Nanoprestige.corruption |
| qcy00hou12/The-Periodic-Table-Tree | N.id, N.word, N.alt, N.image |
| calibration:upgrade-land-tmt | ul.lastSeen |
