// Shared helpers: JSONL append/resume, cached HTTP with retry, bounded concurrency.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const p = (...a) => path.join(ROOT, ...a);

export function readJsonl(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}
export function appendJsonl(file, row) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, JSON.stringify(row) + '\n');
}
/** Last row per key wins (append-only files may carry re-runs). */
export function latestBy(rows, key = 'full_name') {
  const m = new Map();
  for (const r of rows) m.set(r[key], r);
  return m;
}

let token;
export function ghToken() {
  if (token === undefined) {
    try { token = execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim(); } catch { token = null; }
  }
  return token;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * GET with an on-disk cache. Returns {status, body, fromCache}. A 404 is cached and returned, not thrown.
 * Retries 3x with backoff on network errors, 5xx and 429.
 */
export async function cachedGet(url, cacheFile, { auth = true, accept } = {}) {
  const meta = cacheFile + '.meta.json';
  if (fs.existsSync(meta)) {
    const m = JSON.parse(fs.readFileSync(meta, 'utf8'));
    const body = m.status === 200 && fs.existsSync(cacheFile) ? fs.readFileSync(cacheFile, 'utf8') : null;
    return { status: m.status, body, fromCache: true };
  }
  const headers = { 'User-Agent': 'tmt-fork-census' };
  if (auth && ghToken()) headers.Authorization = `token ${ghToken()}`;
  if (accept) headers.Accept = accept;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await sleep(1000 * 2 ** attempt);
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429 || res.status >= 500) { lastErr = new Error(`HTTP ${res.status}`); continue; }
      if (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0') {
        const reset = Number(res.headers.get('x-ratelimit-reset')) * 1000;
        const wait = Math.max(0, reset - Date.now()) + 5000;
        console.error(`rate limited; sleeping ${Math.round(wait / 1000)} s`);
        await sleep(wait); attempt--; continue;
      }
      const body = res.status === 200 ? await res.text() : null;
      fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
      if (body !== null) fs.writeFileSync(cacheFile, body);
      fs.writeFileSync(meta, JSON.stringify({ url, status: res.status, fetched_at: new Date().toISOString() }));
      return { status: res.status, body, fromCache: false };
    } catch (e) { lastErr = e; }
  }
  return { status: -1, body: null, error: String(lastErr), fromCache: false };
}

export async function pool(items, n, fn) {
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; await fn(items[k], k); }
  });
  await Promise.all(workers);
}

export const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
export const safeName = (full) => full.replace('/', '__');
