// Scores shared by stage 3's shortlist and rank.mjs — the formulas the README documents.

/** Stage-2 shortlist score: branch edges × non-trivial content (0 for trivial rows). */
export const shortlistScore = (s) => (s.trivial ? 0 : (s.branchiness?.branchEdges || 0) * (s.content_total || 0));

/** Family key: same layer-id set on the same engine version = the same game (copies and light edits). */
export const familyKey = (s) => `${(s.layer_ids || []).slice().sort().join(',')}@${s.tmtNum || s.engine}`;

/**
 * Composite rank score in [0, 100]: branchiness 40 + content 30 + completeness 30.
 *  branchiness = 40 × min(1, (forkNodes + joinNodes) / 30) × (linear ? 0.25 : 1)      (PTR: 30 → full)
 *  content     = 30 × min(1, log10(1 + content) / log10(1 + 400))                      (PTR: 398 → ~full)
 *  completeness= 10 endgame changed from the stock demo's
 *              + 10 × recency (pushed within 1 y → 1, linear to 0 at 5 y)
 *              +  5 version string not the demo's "0.0"
 *              +  5 not archived... inverted: archived repos are finished more often than abandoned, so 5 either way
 *                   is useless — instead +5 when the repo has ≥ 1 star (someone found it worth marking)
 * Uses boot-exact numbers when a boot row exists, else stage-2 static numbers.
 */
export function composite(r, now = Date.parse('2026-09-14')) {
  const b = r.branchiness || {};
  const nodes = (b.forkNodes || 0) + (b.joinNodes || 0);
  const branch = 40 * Math.min(1, nodes / 30) * (b.linear ? 0.25 : 1);
  const content = 30 * Math.min(1, Math.log10(1 + (r.content_total || 0)) / Math.log10(401));
  const ageY = r.pushed_at ? (now - Date.parse(r.pushed_at)) / 3.156e10 : 5;
  const recency = ageY <= 1 ? 1 : Math.max(0, (5 - ageY) / 4);
  const endgame = r.endgame && !/e280000000/.test(r.endgame) ? 10 : 0;
  const version = r.version_num && r.version_num !== '0.0' ? 5 : 0;
  const stars = (r.stars || 0) >= 1 ? 5 : 0;
  const completeness = endgame + 10 * recency + version + stars;
  return { total: +(branch + content + completeness).toFixed(2), branch: +branch.toFixed(2), content: +content.toFixed(2), completeness: +completeness.toFixed(2) };
}
