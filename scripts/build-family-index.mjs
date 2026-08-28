#!/usr/bin/env node
/**
 * build-family-index.mjs
 *
 * Builds the offline Word Families index from the ConceptNet 5.7 assertions dump.
 * This is the honest answer to "can I mirror Datamuse": you can't (and shouldn't),
 * but ConceptNet is the same class of associative data, downloadable in one file,
 * under CC BY-SA 4.0.
 *
 *   1. curl -O https://s3.amazonaws.com/conceptnet/downloads/2019/edges/conceptnet-assertions-5.7.0.csv.gz
 *   2. node scripts/build-family-index.mjs conceptnet-assertions-5.7.0.csv.gz
 *
 * One pass, streamed, ~10 GB uncompressed — expect 20-40 minutes and a few hundred
 * MB of RAM. No weekend required.
 *
 * ATTRIBUTION IS A LICENCE CONDITION. If you ship this index, the app must show:
 *   "This work includes data from ConceptNet 5, which was compiled by the Commonsense
 *    Computing Initiative. ConceptNet 5 is freely available under the Creative Commons
 *    Attribution-ShareAlike licence (CC BY-SA 4.0) from https://conceptnet.io."
 * ShareAlike also applies to the derived index — keep it CC BY-SA, and keep it in its
 * own file so it never contaminates your source licence.
 *
 * Emits src/domain/tools/family-index.json:
 *   { "v":1, "src":"conceptnet-5.7.0",
 *     "terms": { "lamp": { "things":[...], "actions":[...], "props":[...],
 *                          "kinds":[...], "parts":[...] } } }
 */

import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import path from 'node:path';

const IN = process.argv[2];
const OUT = path.join('src', 'domain', 'tools', 'family-index.json');

if (!IN) {
  console.error('usage: node scripts/build-family-index.mjs <conceptnet-assertions-5.7.0.csv.gz>');
  process.exit(1);
}

/** ConceptNet relation → Cyril facet. Anything not listed is ignored. */
const FACET = {
  '/r/RelatedTo': 'things',
  '/r/SimilarTo': 'things',
  '/r/CapableOf': 'actions',
  '/r/UsedFor': 'actions',
  '/r/ReceivesAction': 'actions',
  '/r/HasProperty': 'props',
  '/r/IsA': 'kinds',
  '/r/InstanceOf': 'kinds',
  '/r/PartOf': 'parts',
  '/r/HasA': 'parts',
  '/r/MadeOf': 'parts',
  '/r/AtLocation': 'things',
};

const MIN_WEIGHT = 1.0;   // drop the long tail of noisy crowd assertions
const PER_FACET = 24;     // keep more than the UI shows (9) so filters have room
const MAX_WORDS = 2;      // "gas lamp" is useful; a 6-word phrase is not

/** /c/en/street_lamp/n → "street lamp", or null if not an English term. */
function term(uri) {
  if (!uri.startsWith('/c/en/')) return null;
  const seg = uri.slice(6).split('/')[0];
  if (!seg) return null;
  const word = seg.replace(/_/g, ' ');
  if (!/^[a-z][a-z '-]*$/.test(word)) return null;
  if (word.split(' ').length > MAX_WORDS) return null;
  return word;
}

const terms = new Map();   // word → facet → Map<word, weight>

function add(from, facet, to, weight) {
  if (from === to) return;
  let facets = terms.get(from);
  if (!facets) terms.set(from, (facets = new Map()));
  let bucket = facets.get(facet);
  if (!bucket) facets.set(facet, (bucket = new Map()));
  const prev = bucket.get(to) ?? 0;
  if (weight > prev) bucket.set(to, weight);
}

const rl = readline.createInterface({
  input: fs.createReadStream(IN).pipe(zlib.createGunzip()),
  crlfDelay: Infinity,
});

let lines = 0, kept = 0;
const started = Date.now();

for await (const line of rl) {
  if (++lines % 2_000_000 === 0) {
    const mins = ((Date.now() - started) / 60000).toFixed(1);
    console.log(`${(lines / 1e6).toFixed(0)}M lines · ${kept} edges kept · ${terms.size} terms · ${mins} min`);
  }

  // <edge-uri>\t<rel>\t<start>\t<end>\t<json>
  const f = line.split('\t');
  if (f.length < 5) continue;

  const facet = FACET[f[1]];
  if (!facet) continue;

  const a = term(f[2]);
  if (!a) continue;
  const b = term(f[3]);
  if (!b) continue;

  let weight = 1;
  try { weight = JSON.parse(f[4]).weight ?? 1; } catch { /* keep default */ }
  if (weight < MIN_WEIGHT) continue;

  add(a, facet, b, weight);
  // Symmetric relations read usefully both ways; hierarchical ones do not.
  if (facet === 'things' || facet === 'props') add(b, facet, a, weight);
  kept++;
}

const out = { v: 1, src: 'conceptnet-5.7.0', license: 'CC BY-SA 4.0', terms: {} };
for (const [word, facets] of terms) {
  const entry = {};
  for (const [facet, bucket] of facets) {
    entry[facet] = [...bucket.entries()]
      .sort((x, y) => y[1] - x[1])
      .slice(0, PER_FACET)
      .map(([w]) => w);
  }
  // A term with one thin facet is noise in the UI.
  if (Object.values(entry).reduce((n, arr) => n + arr.length, 0) >= 4) out.terms[word] = entry;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(`\nterms:   ${Object.keys(out.terms).length}`);
console.log(`written: ${OUT} (${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB)`);
console.log('\nRemember the CC BY-SA attribution in the app UI.');
