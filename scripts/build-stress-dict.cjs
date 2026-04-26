/**
 * Build-time script: parse cmudict.0.7a and emit a compact JSON file
 * mapping lowercase word → stress pattern string (e.g. "amazing" → "uSu").
 *
 * Stress encoding: 'S' = primary/secondary stress (1 or 2), 'u' = unstressed (0).
 * Only one entry per word (skip alternate pronunciations like WORD(2)).
 *
 * Run: node scripts/build-stress-dict.cjs
 * Output: src/domain/prosody/stress-dict.json
 */

const fs = require('fs');
const path = require('path');

const dictPath = path.join(__dirname, '..', 'node_modules', 'cmudict', 'lib', 'cmu', 'cmudict.0.7a');
const outPath = path.join(__dirname, '..', 'src', 'domain', 'prosody', 'stress-dict.json');

const lines = fs.readFileSync(dictPath, 'utf8').split('\n');
const result = {};

for (const line of lines) {
  // Skip comments and empty lines
  if (!line || line.startsWith(';')) continue;

  const tabIdx = line.indexOf('  ');
  if (tabIdx === -1) continue;

  const wordRaw = line.slice(0, tabIdx).trim();
  const phonemes = line.slice(tabIdx).trim();

  // Skip alternate pronunciations: WORD(2), WORD(3) etc.
  if (/\(\d+\)$/.test(wordRaw)) continue;

  // Only plain alphabetic words (skip abbreviations with dots, numbers, apostrophes)
  const word = wordRaw.toLowerCase();
  if (!/^[a-z]+$/.test(word)) continue;

  // Build stress pattern from vowel phonemes (those ending in 0/1/2)
  const stressChars = [];
  for (const ph of phonemes.split(/\s+/)) {
    const m = ph.match(/[012]$/);
    if (m) {
      stressChars.push(m[0] === '0' ? 'u' : 'S');
    }
  }

  if (stressChars.length > 0) {
    result[word] = stressChars.join('');
  }
}

fs.writeFileSync(outPath, JSON.stringify(result));
console.log(`Written ${Object.keys(result).length} entries to ${outPath}`);
console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(0)} KB`);
