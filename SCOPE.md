# Cyril — Product Scope

## Product Summary

Cyril is a desktop-first, local-first lyric editor for musical theatre lyricists and songwriters. It combines rich text editing with lyric-specific structure, draft management, song-specific inventory, contextual language tools, chord notation, and print/export.

## Primary User

The initial user is a semi-professional musical theatre lyricist/songwriter working mostly alone on desktop.

## Product Goals

Cyril should enable the user to:

1. Organize all materials for a song in one project
2. Maintain multiple named drafts
3. Write in a high-quality rich text editor
4. Replace formatting hacks with structured song metadata
5. Keep inventory visible while drafting
6. Use rhyme and language tools without leaving the app
7. Add chords for notation/reference
8. Print clean lyric sheets and chord sheets
9. Work primarily with local files

## Product Principles

1. Editor quality first
2. Structured metadata over formatting hacks
3. Local-first by default
4. Inventory beside the draft
5. Print is a core workflow
6. No speculative complexity before core drafting is excellent

## In Scope for v1

- Project CRUD
- `.cyril` local persistence
- Workspaces: Brief, Structure, Hook Lab, Vocabulary World
- Multiple named drafts
- Rich text draft editor
- Section blocks
- Metadata tags: speaker, stage direction, section type, spoken/sung
- Display toggles for metadata
- Draft-specific inventory pane
- Syllable count gutter
- Contextual tools sidebar
- Line-level alternates
- Draft-level chord mode with chord lane
- PDF export
- Markdown export

## Explicitly Out of Scope for v1

- AI lyric generation or rewriting
- Real-time collaboration
- Track changes / suggestion mode
- Mobile-first UX
- Audio recording or playback
- Chord playback, diagrams, or voicings
- DAW integration
- Notation software features
- Global idea vault across songs
- Roman numeral or Nashville-number systems
- Advanced permissions system
- Full cloud sync platform

## UI Layout Summary

Desktop layout should default to:
- left navigation/workspace list/draft list
- center main editor
- right split sidebar:
  - top = tools
  - bottom = inventory

## Local-First Rules

- The app must remain useful without cloud services
- Files must be user-owned and portable
- Cloud backup is desirable later but not required for v1

## Scope Control Rule

If a feature is not listed as in-scope for the current stage in `STAGES.md`, do not build it yet even if it appears in long-term product goals.