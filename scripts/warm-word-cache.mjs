#!/usr/bin/env node
/**
 * warm-word-cache.mjs
 *
 * A polite, resumable Datamuse cache warmer — NOT a scraper.
 *
 * Read this before running it:
 *   · Datamuse is free for non-commercial use up to 100,000 requests/day with no key,
 *     and requests beyond that may be rate-limited without notice.
 *   · From 1 January 2027 an API key is required, still capped at 100,000/day per key.
 *     Request one now if Cyril is going to keep calling the API.
 *   · Mirroring the whole corpus is neither permitted nor useful: it is millions of
 *     head-words across a dozen relations, and their terms point bulk users at a
 *     commercial agreement. Use the open dumps for bulk (see build-rhyme-index.cjs and
 *     build-family-index.mjs) and use this script only to warm the words YOU write.
 *
 * What it does: takes a vocabulary list, queries a chosen set of relations for each
 * word at a fixed polite rate, and writes one NDJSON line per (word, mode) plus an
 * import file the app can load straight into its IndexedDB tool cache. It checkpoints
 * after every response, so Ctrl-C and re-run resumes where it stopped.
 *
 *   # 1. build a vocabulary: your own drafts first, then a frequency list
 *   node scripts/extract-vocabulary.mjs ~/songs/*.cyril > vocab.txt   # see note below
 *
 *   # 2. warm it (safe to leave running; ~8 req/s = ~29k requests/hour)
 *   node scripts/warm-word-cache.mjs vocab.txt --modes=rhyme,near,syn --rps=8
 *
 *   # 3. import cache/warm-import.json from the app's Settings → Offline data
 *
 * NOTE on step 1: a .cyril file is JSON — `jq -r '..|.text?|strings' song.cyril |
 * tr ' ' '\n'` is enough to get started; sort by frequency and cap at ~20k words.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const vocabFile = args.find((a) => !a.startsWith('--'));
const opt = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};

if (!vocabFile) {
  console.error('usage: node scripts/warm-word-cache.mjs <vocab.txt> [--modes=rhyme,near,syn,define,family] [--rps=8] [--max=100000]');
  process.exit(1);
}

const RPS = Math.min(Number(opt('rps', 8)), 10);        // hard ceiling: be a good citizen
const MAX = Number(opt('max', 100_000));                // daily cap
const MODES = opt('modes', 'rhyme,near,syn').split(',');
const API_KEY = process.env.DATAMUSE_KEY || '';         // required from 2027-01-01

const OUT_DIR = 'cache';
const RAW = path.join(OUT_DIR, 'warm-raw.ndjson');
const DONE = path.join(OUT_DIR, 'warm-done.txt');
const IMPORT = path.join(OUT_DIR, 'warm-import.json');

/** mode → query params. Mirrors src/domain/tools/datamuse-provider.ts. */
const QUERY = {
  rhyme:  (w) => `rel_rhy=${w}&md=s&max=200`,
  near:   (w) => `rel_nry=${w}&md=s&max=200`,
  syn:    (w) => `ml=${w}&md=s&max=50`,
  define: (w) => `sp=${w}&md=d&md=p&max=10`,
  // Family facets — see docs/product/DESIGN_PROPOSAL.md §6 (Word Families). Prefer the ConceptNet dump for
  // these; this is only for spot-checking a handful of head-words.
  family: (w) => `rel_trg=${w}&md=ps&max=50`,
};

for (const m of MODES) {
  if (!QUERY[m]) { console.error(`unknown mode: ${m}`); process.exit(1); }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const done = new Set(
  fs.existsSync(DONE) ? fs.readFileSync(DONE, 'utf8').split('\n').filter(Boolean) : []
);

const vocab = [...new Set(
  fs.readFileSync(vocabFile, 'utf8')
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => /^[a-z][a-z'-]{1,24}$/.test(w))
)];

const jobs = [];
for (const word of vocab) {
  for (const mode of MODES) {
    const key = `${mode}:${word}`;
    if (!done.has(key)) jobs.push({ key, word, mode });
  }
}

console.log(`vocab ${vocab.length} · modes ${MODES.join(',')} · queued ${jobs.length} (${done.size} already done)`);
if (jobs.length > MAX) console.log(`capping this run at ${MAX}; re-run tomorrow to continue`);
console.log(`rate ${RPS}/s → about ${(Math.min(jobs.length, MAX) / RPS / 3600).toFixed(1)} h\n`);

const rawStream = fs.createWriteStream(RAW, { flags: 'a' });
const doneStream = fs.createWriteStream(DONE, { flags: 'a' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let ok = 0, empty = 0, failed = 0, stop = false;
process.on('SIGINT', () => { console.log('\nstopping after the current request…'); stop = true; });

const started = Date.now();

for (const [i, job] of jobs.slice(0, MAX).entries()) {
  if (stop) break;

  const url = `https://api.datamuse.com/words?${QUERY[job.mode](encodeURIComponent(job.word))}`
    + (API_KEY ? `&key=${API_KEY}` : '');

  let attempt = 0;
  while (attempt < 4) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Cyril-cache-warmer/1.0 (personal writing tool)' } });

      // Back off hard on a rate-limit signal rather than hammering.
      if (res.status === 429 || res.status >= 500) {
        const wait = 30_000 * (attempt + 1);
        console.warn(`  ${res.status} on ${job.key} — backing off ${wait / 1000}s`);
        await sleep(wait);
        attempt++;
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const body = await res.json();
      rawStream.write(JSON.stringify({ mode: job.mode, term: job.word, results: body, at: new Date().toISOString() }) + '\n');
      doneStream.write(job.key + '\n');
      if (Array.isArray(body) && body.length) ok++; else empty++;
      break;
    } catch (err) {
      attempt++;
      if (attempt >= 4) { failed++; console.warn(`  giving up on ${job.key}: ${err.message}`); break; }
      await sleep(5_000 * attempt);
    }
  }

  if ((i + 1) % 500 === 0) {
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`${i + 1}/${Math.min(jobs.length, MAX)} · ok ${ok} · empty ${empty} · failed ${failed} · ${mins} min`);
  }

  await sleep(1000 / RPS);
}

rawStream.end();
doneStream.end();

// Fold the NDJSON into one import file shaped like ToolQueryCacheEntry[]
// (src/domain/tools/types.ts) so the app can put() it straight into IndexedDB.
const entries = new Map();
for (const line of fs.readFileSync(RAW, 'utf8').split('\n')) {
  if (!line) continue;
  let rec;
  try { rec = JSON.parse(line); } catch { continue; }
  const mode = { rhyme: 'rhyme-exact', near: 'rhyme-near', syn: 'thesaurus', define: 'dictionary', family: 'family' }[rec.mode] || rec.mode;
  entries.set(`${mode}|${rec.term}`, {
    key: `${mode}|${rec.term}`,
    term: rec.term,
    mode,
    provider: 'datamuse',
    results: (rec.results || []).map((r) => ({
      word: r.word,
      score: r.score,
      numSyllables: r.numSyllables,
      definition: r.defs?.[0]?.split('\t')?.slice(-1)[0],
      partOfSpeech: r.defs?.[0]?.includes('\t') ? r.defs[0].split('\t')[0] : undefined,
    })),
    fetchedAt: rec.at,
    lastUsedAt: rec.at,
  });
}

fs.writeFileSync(IMPORT, JSON.stringify([...entries.values()]));
console.log(`\nok ${ok} · empty ${empty} · failed ${failed}`);
console.log(`cache entries: ${entries.size}`);
console.log(`written: ${IMPORT} (${(fs.statSync(IMPORT).size / 1048576).toFixed(1)} MB)`);
console.log('Acknowledge the Datamuse API in the app documentation.');
