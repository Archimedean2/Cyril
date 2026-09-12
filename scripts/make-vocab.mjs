#!/usr/bin/env node
/**
 * make-vocab.mjs
 *
 * Builds a vocab.txt for warm-word-cache.mjs when you don't have drafts to mine yet.
 *
 *   node scripts/make-vocab.mjs                 # 12000 words, default
 *   node scripts/make-vocab.mjs --size=20000    # everything the list has
 *   node scripts/make-vocab.mjs --size=6000 --out=vocab-small.txt
 *
 * Source: first20hours/google-10000-english `20k.txt` — 20k English words in
 * frequency order, derived from the Google Web Trillion Word Corpus (Brants & Franz,
 * distributed by the LDC; subsets by Peter Norvig; cleanup by Josh Kaufman). The
 * repo's licence permits educational and personal/research use; it explicitly does
 * NOT recommend commercial use without an LDC licence. Fine for your own writing
 * tool — do not ship the list inside a product you sell.
 *
 * It filters the list against src/domain/prosody/rhyme-index.json, so every word
 * queued is one cmudict actually knows — no wasted requests on words that will never
 * return rhymes. Run build-rhyme-index.cjs first.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const h = args.find((a) => a.startsWith(`--${n}=`)); return h ? h.split('=')[1] : d; };

const SIZE = Number(opt('size', 12000));
const OUT = opt('out', 'vocab.txt');
const SRC = 'https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt';
const INDEX = path.join('src', 'domain', 'prosody', 'rhyme-index.json');

/** Words with nothing to say to a lyricist. Rhyming "the" is not a use case. */
const SKIP = new Set(`a an and are as at be been but by for from had has have he her his i if in is it
its me my not of on or our she that the their them there they this to was we were what when which who
will with you your his hers ours yours am been being do does did done can could would should shall may
might must`.split(/\s+/));

async function main() {
  if (!fs.existsSync(INDEX)) {
    console.error(`${INDEX} not found — run: node scripts/build-rhyme-index.cjs`);
    process.exit(1);
  }

  console.log('reading rhyme index…');
  const known = new Set(Object.keys(JSON.parse(fs.readFileSync(INDEX, 'utf8')).words));

  console.log(`downloading ${SRC}`);
  const res = await fetch(SRC);
  if (!res.ok) {
    console.error(`download failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const raw = (await res.text()).split(/\r?\n/);

  const out = [];
  let unknown = 0, skipped = 0;
  for (const line of raw) {
    const w = line.trim().toLowerCase();
    if (!/^[a-z][a-z'-]{2,}$/.test(w)) { skipped++; continue; }
    if (SKIP.has(w)) { skipped++; continue; }
    if (!known.has(w)) { unknown++; continue; }
    out.push(w);
    if (out.length >= SIZE) break;
  }

  fs.writeFileSync(OUT, out.join('\n') + '\n');
  console.log(`\nsource lines:   ${raw.length}`);
  console.log(`not in cmudict: ${unknown} (dropped)`);
  console.log(`filtered out:   ${skipped}`);
  console.log(`written:        ${OUT} — ${out.length} words, frequency order`);
  console.log(`\nnext: node scripts/warm-word-cache.mjs ${OUT} --modes=rhyme,near,syn --rps=8`);
  console.log(`      ~${(out.length * 3 / 8 / 3600).toFixed(1)} h at 8 req/s`);
}

main();
