#!/usr/bin/env node
/**
 * build-rhyme-index.cjs
 *
 * Builds a FULL offline rhyme + prosody index from cmudict (already a dependency).
 * This is what removes Datamuse from the critical path: exact rhymes, near rhymes,
 * syllable counts and stress all resolve locally, in memory, in microseconds.
 *
 * The existing scripts/build-stress-dict.cjs throws the phonemes away and keeps only
 * the stress pattern, which is why rhyme lookups still need the network. This keeps
 * the rime.
 *
 *   node scripts/build-rhyme-index.cjs
 *
 * Emits src/domain/prosody/rhyme-index.json:
 *   {
 *     "v": 1,
 *     "words": { "light": ["AY1 T", 1, "S", "AY_T", "AY"] , ... },
 *              //           rime  syll stress exactKey assonanceKey
 *     "exact":  { "AY_T": ["bright","flight","light",...] },
 *     "near":   { "AY":   ["alive","time","light",...] }
 *   }
 *
 * Size guide: ~125k words → ~9 MB raw, ~2.5 MB gzipped. Load it lazily on first
 * lookup, not at boot.
 */

const fs = require('fs');
const path = require('path');

const DICT = path.join(__dirname, '..', 'node_modules', 'cmudict', 'lib', 'cmu', 'cmudict.0.7a');
const OUT = path.join(__dirname, '..', 'src', 'domain', 'prosody', 'rhyme-index.json');

/** A phoneme is a vowel if it carries a stress digit. */
const isVowel = (ph) => /[012]$/.test(ph);
const bare = (ph) => ph.replace(/[012]$/, '');

function analyse(phonemes) {
  const parts = phonemes.split(/\s+/).filter(Boolean);
  const vowelIdx = [];
  parts.forEach((ph, i) => { if (isVowel(ph)) vowelIdx.push(i); });
  if (vowelIdx.length === 0) return null;

  const stress = vowelIdx.map((i) => (parts[i].endsWith('0') ? 'u' : 'S')).join('');

  // Rime for an exact rhyme = from the LAST stressed vowel to the end of the word.
  // Fall back to the last vowel when nothing is stressed (function words).
  let startIdx = vowelIdx[vowelIdx.length - 1];
  for (let k = vowelIdx.length - 1; k >= 0; k--) {
    if (!parts[vowelIdx[k]].endsWith('0')) { startIdx = vowelIdx[k]; break; }
  }

  const rimeParts = parts.slice(startIdx).map(bare);
  const exactKey = rimeParts.join('_');

  // Near rhyme / assonance = the vowel spine from that point on, consonants dropped.
  const assonanceKey = parts.slice(startIdx).filter(isVowel).map(bare).join('_');

  return {
    rime: rimeParts.join(' '),
    syllables: vowelIdx.length,
    stress,
    exactKey,
    assonanceKey,
    endsStressed: !parts[vowelIdx[vowelIdx.length - 1]].endsWith('0'),
  };
}

function main() {
  if (!fs.existsSync(DICT)) {
    console.error(`cmudict not found at ${DICT}\nRun: npm i cmudict`);
    process.exit(1);
  }

  const words = {};
  const exact = Object.create(null);
  const near = Object.create(null);
  let skipped = 0;

  for (const line of fs.readFileSync(DICT, 'utf8').split('\n')) {
    if (!line || line.startsWith(';')) continue;
    const sep = line.indexOf('  ');
    if (sep === -1) continue;

    const raw = line.slice(0, sep).trim();
    if (/\(\d+\)$/.test(raw)) continue;            // alternate pronunciation
    const word = raw.toLowerCase();
    if (!/^[a-z][a-z'-]*$/.test(word)) { skipped++; continue; }

    const a = analyse(line.slice(sep).trim());
    if (!a) { skipped++; continue; }

    words[word] = [a.rime, a.syllables, a.stress, a.exactKey, a.assonanceKey];
    (exact[a.exactKey] ||= []).push(word);
    (near[a.assonanceKey] ||= []).push(word);
  }

  // Deterministic order, and drop rime buckets with a single member (nothing rhymes).
  for (const map of [exact, near]) {
    for (const key of Object.keys(map)) {
      if (map[key].length < 2) { delete map[key]; continue; }
      map[key].sort();
    }
  }

  fs.writeFileSync(OUT, JSON.stringify({ v: 1, words, exact, near }));
  const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
  console.log(`words:        ${Object.keys(words).length}`);
  console.log(`exact rimes:  ${Object.keys(exact).length}`);
  console.log(`near rimes:   ${Object.keys(near).length}`);
  console.log(`skipped:      ${skipped}`);
  console.log(`written:      ${OUT} (${kb} KB)`);
}

main();
