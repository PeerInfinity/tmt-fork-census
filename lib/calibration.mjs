// The calibration rows (local clones, not forks) — shared by stage 3 and rank. Paths resolve under CC_DIR
// (default ~/CC); nothing absolute is committed.
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { findLayers, censusLayer, modInfoOf, scriptSrcs } from './scan.mjs';
import { stockMap, stockTree } from './tmt-stock.mjs';

export const CC_DIR = process.env.CC_DIR || path.join(os.homedir(), 'CC');
export const CALIBRATION = [
  { full_name: 'calibration:Prestige-Tree', short: 'PTR', local: path.join(CC_DIR, 'Prestige-Tree'), upstream: 'Jacorb90/Prestige-Tree' },
  { full_name: 'calibration:The-Modding-Tree', short: 'TMT', local: path.join(CC_DIR, 'The-Modding-Tree'), upstream: 'Acamaeda/The-Modding-Tree' },
];

/** Every .js/.html/.css path in any stock TMT commit, minus the demo/mod files (which are content). Stage 2's rule. */
let enginePaths;
export function stockEnginePaths() {
  if (enginePaths) return enginePaths;
  enginePaths = new Set();
  for (const v of stockMap().values()) for (const f of stockTree(v.commit)) if (/\.(js|html|css)$/.test(f)) enginePaths.add(f);
  for (const f of ['js/layers.js', 'js/tree.js', 'js/mod.js']) enginePaths.delete(f);
  return enginePaths;
}

/** Stage 2's static census (layer ids + content counts) run on a local clone instead of raw URLs. */
export function localStatic(dir) {
  const read = (f) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch { return null; } };
  const mi = modInfoOf(read('js/mod.js'));
  const content = new Set();
  for (const s of scriptSrcs(read('index.html')).filter((x) => !/^(https?:)?\/\//i.test(x)).map((x) => path.posix.normalize(x.replace(/^\.?\//, ''))))
    if (s.endsWith('.js') && !stockEnginePaths().has(s) && !/vue/i.test(s)) content.add(s);
  for (const m of mi.modFiles || []) content.add(path.posix.normalize('js/' + m));
  content.add('js/layers.js'); content.delete('js/mod.js');
  const all = [...content].map(read).filter((x) => x != null).join('\n;\n');
  const lrows = findLayers(all).layers.map(censusLayer);
  const sum = (k) => lrows.reduce((a, l) => a + l[k], 0);
  return { layer_ids: lrows.map((l) => l.id), milestones: sum('milestones'), upgrades: sum('upgrades'), buyables: sum('buyables'), challenges: sum('challenges'), achievements: sum('achievements') };
}
