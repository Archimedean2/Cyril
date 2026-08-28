# Cyril — offline word-data scripts

These scripts live in this repo. Run them from the
**repo root** (not from inside `scripts/`). Node 18+ is required — all three use built-in
`fetch`, `fs/promises` and streaming gzip with no dependencies of their own.

```bash
cp scripts/build-rhyme-index.cjs  ~/path/to/Cyril/scripts/
cp scripts/build-family-index.mjs ~/path/to/Cyril/scripts/
cp scripts/make-vocab.mjs         ~/path/to/Cyril/scripts/
cp scripts/warm-word-cache.mjs    ~/path/to/Cyril/scripts/
cd ~/path/to/Cyril
```

---

## 1. Rhyme index — do this one first

Takes seconds, needs no network, and removes Datamuse from the writing loop.

```bash
npm i cmudict          # only if node_modules/cmudict is missing
node scripts/build-rhyme-index.cjs
```

Writes `src/domain/prosody/rhyme-index.json` (~125k words). Expect output like:

```
words:        125000
exact rimes:  22000
near rimes:   4800
written:      src/domain/prosody/rhyme-index.json (9100 KB)
```

It sits alongside the existing `stress-dict.json` — it does not replace it, and the existing
`build-stress-dict.cjs` still works. Load the new file lazily on first lookup, never at boot.

Add to `package.json`:

```json
"scripts": { "build:rhymes": "node scripts/build-rhyme-index.cjs" }
```

---

## 2. Word Families index — one long pass, unattended

```bash
curl -O https://s3.amazonaws.com/conceptnet/downloads/2019/edges/conceptnet-assertions-5.7.0.csv.gz
node scripts/build-family-index.mjs conceptnet-assertions-5.7.0.csv.gz
```

~1.2 GB download, ~10 GB uncompressed streamed through in 20–40 minutes. It logs progress every
2M lines, so you can watch it or walk away. Writes `src/domain/tools/family-index.json`.

Tuning knobs at the top of the file: `MIN_WEIGHT` (raise to 1.5 for a stricter, smaller index),
`PER_FACET` (words kept per facet), `MAX_WORDS` (phrase length).

**Licence:** the ConceptNet data is CC BY-SA 4.0. Attribution is a condition, and ShareAlike
applies to this derived index — keep it in its own file and show the attribution string
(printed by the script) somewhere in the app.

---

## 3. Cache warmer — optional, and only for words you'll actually use

### No drafts yet? Generate the vocabulary

```bash
node scripts/make-vocab.mjs                 # 12000 words
node scripts/make-vocab.mjs --size=20000    # the whole list
```

Downloads a 20k frequency-ordered English word list (`first20hours/google-10000-english`,
derived from the Google Web Trillion Word Corpus) and filters it against the rhyme index from
step 1, so every queued word is one cmudict actually knows — no wasted requests. Function words
are dropped. Writes `vocab.txt` in frequency order, so if you stop the warmer early you've
warmed the words you're most likely to type.

That list is licensed for educational and personal/research use and its own licence advises
against commercial use without an LDC licence — fine for your own tool, don't bundle it into
something you sell.

### Once you have drafts, mine them instead

Your own words are worth more than any frequency list:

```bash
jq -r '..|.text?|strings' ~/songs/*.cyril \
  | tr '[:upper:] ' '[:lower:]\n' \
  | grep -E '^[a-z][a-z'"'"'-]{2,}$' \
  | sort | uniq -c | sort -rn | awk '{print $2}' | head -20000 > vocab.txt
```

### Warm it

```bash
node scripts/warm-word-cache.mjs vocab.txt --modes=rhyme,near,syn --rps=8
```

20k words × 3 modes at 8 req/s ≈ 2 hours (12k ≈ 1.2 h). Ctrl-C any time — `cache/warm-done.txt`
checkpoints after every response, so re-running resumes where it stopped. Flags: `--rps` (capped
at 10), `--max` (daily request cap, default 100000), `--modes`
(`rhyme,near,syn,define,family`).

Output `cache/warm-import.json` is an array shaped like `ToolQueryCacheEntry` from
`src/domain/tools/types.ts`, ready to `put()` straight into the existing IndexedDB tool cache.

**From 1 January 2027** Datamuse requires an API key (100k requests/day per key). Once you have
one:

```bash
DATAMUSE_KEY=your-key node scripts/warm-word-cache.mjs vocab.txt
```

Don't run this to mirror the corpus — steps 1 and 2 are how you get bulk data. And note that
after step 1 you may not need the warmer at all: rhymes, near rhymes, syllables and stress are
already local. It only adds Datamuse's synonyms and scoring. See `docs/product/DESIGN_PROPOSAL.md`
`@sec:offline-data`.
