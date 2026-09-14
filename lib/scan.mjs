// Regex/lexer census of TMT layer source (stage 2). No AST: a tiny lexer that skips strings, template
// literals and comments so brace matching and depth-0 key detection are right on ordinary layer files.

function skipNonCode(s, i) {
  const c = s[i], d = s[i + 1];
  if (c === '/' && d === '/') { const j = s.indexOf('\n', i); return j < 0 ? s.length : j; }
  if (c === '/' && d === '*') { const j = s.indexOf('*/', i + 2); return j < 0 ? s.length : j + 2; }
  if (c === '"' || c === "'") {
    let j = i + 1;
    while (j < s.length && s[j] !== c && s[j] !== '\n') j += s[j] === '\\' ? 2 : 1;
    return j + 1;
  }
  if (c === '`') {
    let j = i + 1, depth = 0;
    while (j < s.length) {
      if (s[j] === '\\') { j += 2; continue; }
      if (depth === 0 && s[j] === '`') return j + 1;
      if (s[j] === '$' && s[j + 1] === '{') { depth++; j += 2; continue; }
      if (depth > 0 && s[j] === '}') depth--;
      j++;
    }
    return j;
  }
  return i;
}

/** Index just past the bracket matching the one at `open`. */
export function matchBracket(s, open) {
  const pairs = { '{': '}', '[': ']', '(': ')' };
  const stack = [pairs[s[open]]];
  let i = open + 1;
  while (i < s.length && stack.length) {
    const k = skipNonCode(s, i); if (k !== i) { i = k; continue; }
    const c = s[i];
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === '}' || c === ']' || c === ')') stack.pop();
    i++;
  }
  return i;
}

/** Depth-0 entries of an object literal body s[start..end): [{key, valueStart, valueEnd}]. */
export function entries(s, start, end) {
  const out = [];
  let i = start, depth = 0, expectKey = true;
  while (i < end) {
    const k = skipNonCode(s, i);
    if (k !== i) {
      if (depth === 0 && expectKey && (s[i] === '"' || s[i] === "'")) {
        const key = s.slice(i + 1, k - 1);
        const m = /^\s*:/.exec(s.slice(k, k + 50));
        if (m) { const vs = k + m[0].length; const ve = valueEnd(s, vs, end); out.push({ key, valueStart: vs, valueEnd: ve }); i = ve; expectKey = true; continue; }
      }
      i = k; continue;
    }
    const c = s[i];
    if (c === '{' || c === '[' || c === '(') { depth++; i++; continue; }
    if (c === '}' || c === ']' || c === ')') { depth--; i++; continue; }
    if (depth === 0) {
      if (c === ',') { expectKey = true; i++; continue; }
      if (expectKey && /[\w$]/.test(c)) {
        const m = /^(?:(?:async|get|set)\s+)?([\w$]+)\s*(:|\()/.exec(s.slice(i, i + 200));
        if (m) {
          const vs = i + m[0].length - (m[2] === '(' ? 1 : 0);
          const ve = valueEnd(s, vs, end);
          out.push({ key: m[1], valueStart: vs, valueEnd: ve, method: m[2] === '(' });
          i = ve; expectKey = true; continue;
        }
        expectKey = false;
      } else if (!/\s/.test(c)) expectKey = false;
    }
    i++;
  }
  return out;
}

function valueEnd(s, i, end) {
  let depth = 0;
  while (i < end) {
    const k = skipNonCode(s, i); if (k !== i) { i = k; continue; }
    const c = s[i];
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') { if (depth === 0) return i; depth--; }
    else if (c === ',' && depth === 0) return i;
    i++;
  }
  return end;
}

const strings = (t) => [...t.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2]);

/** Find layers: addLayer("id", {...}) calls, or the legacy `var layers = { id: {...}, ... }`. */
export function findLayers(src) {
  const layers = [];
  for (const m of src.matchAll(/\baddLayer\s*\(\s*(["'`])([^"'`]+)\1\s*,\s*/g)) {
    const at = m.index + m[0].length;
    if (src[at] !== '{') { layers.push({ id: m[2], body: null }); continue; }
    const close = matchBracket(src, at);
    layers.push({ id: m[2], src, start: at + 1, end: close - 1 });
  }
  let legacy = false;
  if (!layers.length) {
    const lm = /\b(?:var|let|const)\s+layers\s*=\s*\{/.exec(src);
    if (lm) {
      legacy = true;
      const at = lm.index + lm[0].length - 1; const close = matchBracket(src, at);
      for (const e of entries(src, at + 1, close - 1)) {
        if (src[e.valueStart] === '{' || /^\s*\{/.test(src.slice(e.valueStart, e.valueStart + 5))) {
          const o = src.indexOf('{', e.valueStart);
          layers.push({ id: e.key, src, start: o + 1, end: matchBracket(src, o) - 1 });
        }
      }
    }
  }
  return { layers, legacy };
}

const COUNTED = ['milestones', 'upgrades', 'buyables', 'challenges', 'achievements', 'clickables', 'infoboxes'];

export function censusLayer(L) {
  const r = { id: L.id, row: null, branches: [], branches_dynamic: false };
  for (const k of COUNTED) r[k] = 0;
  if (L.start == null) { r.unparsed = true; return r; }
  const { src } = L;
  for (const e of entries(src, L.start, L.end)) {
    const v = src.slice(e.valueStart, e.valueEnd).trim();
    if (e.key === 'row' && !e.method) {
      const m = /^["'`]?(\d+|side)["'`]?$/.exec(v); r.row = m ? (m[1] === 'side' ? 'side' : Number(m[1])) : `expr:${v.slice(0, 30)}`;
    } else if (e.key === 'branches') {
      if (v.startsWith('[')) {
        const inner = entriesOfArray(src, src.indexOf('[', e.valueStart));
        for (const el of inner) { const ss = strings(el); if (ss.length) r.branches.push(ss[0]); }
      } else { r.branches_dynamic = true; r.branches.push(...new Set(strings(v))); }
    } else if (COUNTED.includes(e.key) && v.startsWith('{')) {
      const o = src.indexOf('{', e.valueStart);
      r[e.key] = entries(src, o + 1, matchBracket(src, o) - 1).filter((x) => /^\d+$/.test(x.key)).length;
    }
  }
  return r;
}

function entriesOfArray(s, open) {
  const close = matchBracket(s, open) - 1; const out = []; let i = open + 1;
  while (i < close) { const ve = valueEnd(s, i, close); const t = s.slice(i, ve).trim(); if (t) out.push(t); i = ve + 1; }
  return out;
}

/** Branchiness over layers with a numeric row (same semantics as probes/branchiness.mjs). */
export function branchiness(layerRows) {
  const game = layerRows.filter((l) => typeof l.row === 'number');
  const ids = new Set(game.map((l) => l.id));
  const rows = {}; for (const l of game) (rows[l.row] ??= []).push(l.id);
  const edges = [], indeg = {}, outdeg = {};
  for (const l of game) for (const p of l.branches || []) { edges.push([p, l.id]); outdeg[p] = (outdeg[p] || 0) + 1; indeg[l.id] = (indeg[l.id] || 0) + 1; }
  const rowKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);
  const width = rowKeys.map((k) => rows[k].length);
  const maxWidth = width.length ? Math.max(...width) : 0;
  return {
    layers: game.length, rows: rowKeys.length, widthPerRow: width, maxWidth,
    branchEdges: edges.length, branchEdgesInternal: edges.filter(([p]) => ids.has(p)).length,
    forkNodes: game.filter((l) => (outdeg[l.id] || 0) >= 2).length,
    joinNodes: game.filter((l) => (indeg[l.id] || 0) >= 2).length,
    linear: maxWidth <= 1,
  };
}

export function modInfoOf(modSrc) {
  if (!modSrc) return {};
  const pick = (re) => (modSrc.match(re) || [])[1] ?? null;
  const mi = /\bmodInfo\s*=\s*\{/.exec(modSrc);
  const out = { name: null, id: null, author: null, modFiles: null, modInfo_endgame: null };
  if (mi) {
    const o = mi.index + mi[0].length - 1;
    for (const e of entries(modSrc, o + 1, matchBracket(modSrc, o) - 1)) {
      const v = modSrc.slice(e.valueStart, e.valueEnd).trim();
      if (['name', 'id', 'author'].includes(e.key)) out[e.key] = strings(v)[0] ?? v.slice(0, 60);
      if (e.key === 'modFiles') out.modFiles = strings(v);
      if (e.key === 'endgame') out.modInfo_endgame = v.slice(0, 120);
    }
  }
  out.version_num = pick(/VERSION\s*=\s*\{[^}]*?num\s*:\s*["'`]([^"'`]*)/s);
  out.version_name = pick(/VERSION\s*=\s*\{[^}]*?name\s*:\s*["'`]([^"'`]*)/s);
  const ie = /function\s+isEndgame\s*\(\s*\)\s*\{/.exec(modSrc);
  out.endgame = ie ? modSrc.slice(ie.index + ie[0].length, matchBracket(modSrc, ie.index + ie[0].length - 1) - 1).replace(/\s+/g, ' ').trim().slice(0, 160) : null;
  if (!out.endgame) out.endgame = pick(/\b(?:ENDGAME|endgame|endPoints)\s*[:=]\s*([^\n;,]{1,120})/);
  return out;
}

export const scriptSrcs = (html) => html ? [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]) : [];
export const normalize = (t) => t == null ? null : t.replace(/\r\n/g, '\n').replace(/^﻿/, '').trim();
