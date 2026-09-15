// Classify a LICENSE file's TEXT, which is a different question from the one GitHub answers.
//
// licensee reads NOASSERTION for nearly the whole TMT lineage (README §5): the repos carry a standard MIT text
// whose copyright line is non-standard ("Modding Tree Copyright (c) 2020 Acamaeda") beside a second file,
// Prestige-tree-license. That is a matcher result about file IDENTITY, not a reading of the words. This module
// reads the words: strip the copyright line, normalise whitespace, and compare what is left against the canonical
// MIT template — this repository's own LICENSE, which is stock MIT.
import fs from 'node:fs';
import path from 'node:path';
import { p } from './util.mjs';

/** Lines, whitespace-normalised, blank lines dropped — so an indent or a rewrap is not a difference. */
const norm = (t) => String(t).replace(/\r\n?/g, '\n').replace(/^﻿/, '')
  .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

const COPYRIGHT = /copyright\s*(\(c\)|©)/i;
const PERMISSION = /Permission is hereby granted, free of charge/i;
const WARRANTY = /THE SOFTWARE IS PROVIDED "AS IS"/i;

let templateCache;
/** The canonical MIT text: this repository's own LICENSE, minus its copyright line. */
export function mitTemplate() {
  if (!templateCache) templateCache = norm(fs.readFileSync(p('LICENSE'), 'utf8')).filter((l) => !COPYRIGHT.test(l));
  return templateCache;
}

/**
 * classifyLicenseText(text) → { verdict, copyright, diff }
 *   verdict      "MIT"          — identical to the MIT template once the copyright line is removed;
 *                "MIT-modified" — still carries the MIT permission and warranty paragraphs, but the text differs;
 *                "other"        — not an MIT text at all.
 *   copyright    the copyright line as written (null when the file has none).
 *   diff         null for "MIT", else the first line that differs from the template (or what is missing/extra).
 */
export function classifyLicenseText(text, template = mitTemplate()) {
  const all = norm(text);
  const copyright = all.find((l) => COPYRIGHT.test(l)) ?? null;
  const body = all.filter((l) => !COPYRIGHT.test(l));
  let diff = null;
  for (let i = 0; i < Math.max(body.length, template.length); i++) {
    if (body[i] === template[i]) continue;
    diff = body[i] === undefined ? `missing: ${template[i]}`
      : template[i] === undefined ? `extra: ${body[i]}`
      : `line ${i + 1}: ${body[i]}`;
    break;
  }
  if (!diff) return { verdict: 'MIT', copyright, diff: null };
  const joined = body.join(' ');
  return { verdict: PERMISSION.test(joined) && WARRANTY.test(joined) ? 'MIT-modified' : 'other', copyright, diff };
}

/** License-like files at a directory's top level: LICENSE*, anything with "license"/"licence" in the name, COPYING*. */
export function licenseFilesIn(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /^licen[cs]e|licen[cs]e|^copying/i.test(f) && fs.statSync(path.join(dir, f)).isFile())
    .sort();
}

/** {file: verdict} for every license-like file at `dir`, read from the files themselves. */
export function classifyLicenseDir(dir) {
  const out = {};
  for (const f of licenseFilesIn(dir)) out[f] = classifyLicenseText(fs.readFileSync(path.join(dir, f), 'utf8'));
  return out;
}
