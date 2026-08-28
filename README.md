# Cyril

A desktop-first, local-first lyric editor for musical-theatre lyricists.

Cyril keeps everything for one song in one place — a brief, a structure outline, a hook lab, a
vocabulary world, and as many named drafts as the song needs — and gives you a real editor to
write them in: structured speaker and stage-direction lines, section blocks, concurrent
(duet) columns, syllable counts and stress marks, a chord lane, line-level alternates, rhyme and
thesaurus tools beside the page, and print output that looks like a lyric sheet rather than a
web page. Projects are plain `.cyril` files on your own disk.

Built with React, TypeScript, Vite, Tiptap/ProseMirror and Zustand.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

Chromium-based browsers get the full local-file experience via the File System Access API.

## The commands that matter

```bash
npm run status              # ← start here: gate state, git state, what's next
npm run build               # tsc + vite build
npm run lint                # eslint, 0 errors and 0 warnings
npm test                    # vitest (unit + integration)
npm run test:e2e            # playwright
npm run coverage:features   # regenerate the acceptance-criteria ledger
```

## Where the project stands

Run `npm run status`, or read these three files:

- **`STATUS.md`** — live gate status, and where the last working session stopped.
- **`BACKLOG.md`** — the ordered work queue.
- **`FEATURE_COVERAGE.md`** — the generated ledger of which acceptance criteria actually have a
  passing test behind them.

`CLAUDE.md` is the operating guide for anyone — human or agent — doing work here, and
`docs/process/DOC_MAP.md` maps every other document in the repo.

## A note on "done"

Cyril once had thirteen stages marked complete on top of a failing build, no lint config, and a
test suite that hung instead of finishing. `DEFINITION_OF_DONE.md` exists so that can't recur:
nothing is done until the build, lint, tests and the feature-coverage ledger all say so, and
every acceptance criterion is traceable to a test that carries its ID.
