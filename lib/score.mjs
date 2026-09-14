// Scores shared by stage 3's shortlist and rank.mjs — the formulas README.md documents.

/** Stage-2 shortlist score: branch edges × content (milestones+upgrades+buyables+challenges+achievements); 0 if trivial. */
export const shortlistScore = (s) => (s.trivial ? 0 : (s.branchiness?.branchEdges || 0) * (s.content_total || 0));

/** Family key: the same layer-id set on the same engine version = the same game (copies and light edits). */
export const familyKey = (s) => `${(s.layer_ids || []).slice().sort().join(',')}@${s.tmtNum || s.engine}`;

/**
 * Composite rank score, 0–100 = branchiness 40 + content 30 + completeness 30.
 *   branchiness  = 40 × min(1, (forkNodes + joinNodes) / 30), × 0.25 when linear (max row width ≤ 1).  PTR = 30 nodes.
 *   content      = 30 × min(1, log10(1 + content) / log10(401)).                                         PTR = 398.
 *   completeness = 10 if the endgame differs from the stock demo's (e280000000)
 *                + 10 × recency: last push ≤ 1 y before the census date → 1, falling linearly to 0 at 5 y
 *                +  5 if the version string is not the demo's "0.0"
 *                +  5 if it boots headless (2.5 when not booted, 0 when the boot failed)
 * A failed boot then HALVES the total: a game that crashes at load in its own engine is not a candidate until fixed.
 * `archived` is shown but not scored (a finished game and an abandoned one both get archived).
 * Engine deviation (port cost) is a separate column, deliberately NOT folded in: it answers a different question.
 * Boot-exact numbers are used where a boot row exists, else stage-2 static numbers.
 */
export function composite(r, now = Date.parse('2026-09-14')) {
  const nodes = (r.forkNodes || 0) + (r.joinNodes || 0);
  const branch = 40 * Math.min(1, nodes / 30) * (r.linear ? 0.25 : 1);
  const content = 30 * Math.min(1, Math.log10(1 + (r.content || 0)) / Math.log10(401));
  const ageY = r.pushed_at ? (now - Date.parse(r.pushed_at)) / 3.156e10 : 5;
  const recency = ageY <= 1 ? 1 : Math.max(0, (5 - ageY) / 4);
  const endgame = r.endgame && !/e280000000/.test(r.endgame) ? 10 : 0;
  const version = r.version_num && r.version_num !== '0.0' ? 5 : 0;
  const boots = r.boot_ok === true ? 5 : r.boot_ok === false ? 0 : 2.5;
  const completeness = endgame + 10 * recency + version + boots;
  const f = (x) => +x.toFixed(2);
  const total = (branch + content + completeness) * (r.boot_ok === false ? 0.5 : 1);
  return { score: f(total), s_branch: f(branch), s_content: f(content), s_complete: f(completeness) };
}
