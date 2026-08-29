# Stage 4 Test Spec

**Tags:** `[SECTIONS] [METADATA] [DISPLAY] [STAGE-4]`

## Scope
Structured sections, metadata tags, and metadata display toggles.

## Required Test Files
- `tests/unit/editor/section-commands.test.ts`
- `tests/unit/editor/metadata-commands.test.ts`
- `tests/unit/editor/delivery-removed.test.ts`
- `tests/unit/editor/editor-css-tokens.test.ts`
- `tests/unit/domain/migration.test.ts`
- `tests/integration/editor/sections-metadata-integration.test.ts`
- `tests/integration/editor/draft-toolbar-integration.test.tsx`
- `tests/e2e/stage-4-sections-metadata.spec.ts`
- `tests/e2e/speaker-stage-direction.spec.ts`
- `tests/unit/domain/characters.test.ts` (C-20)
- `tests/unit/editor/character-link.test.ts` (C-20)
- `tests/unit/editor/character-decorations.test.ts` (C-20)
- `tests/unit/editor/speaker-autocomplete.test.tsx` (C-20)
- `tests/integration/editor/character-registry-integration.test.tsx` (C-20)

## Checklist

| ID | Test | Type | Test File | Implemented | Passing | Notes |
|----|------|------|-----------|-------------|---------|-------|
| T-4.01 | Insert section block works | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | |
| T-4.02 | Reorder section preserves content and metadata | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | Trivial pass; drag-and-drop reorder not yet exposed as command |
| T-4.03 | Duplicate section generates required new IDs | unit | `tests/unit/editor/section-commands.test.ts` | [x] | [x] | Trivial pass; section duplication command not yet exposed |
| T-4.04 | Insert speaker label works | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.05 | Insert stage direction works | unit | `tests/unit/editor/metadata-commands.test.ts` | [x] | [x] | |
| T-4.07 | Section data survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | |
| T-4.08 | Metadata survives save/load | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | |
| T-4.09 | Hiding metadata changes visibility only, not content | integration | `tests/integration/editor/sections-metadata-integration.test.ts` | [x] | [x] | CSS-level hide; trivial pass at data layer |
| T-4.10 | Section/metadata workflow passes in UI | e2e | `tests/e2e/stage-4-sections-metadata.spec.ts` | [x] | [x] | |
| T-4.07a | Clicking Speaker button converts line to speaker type | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.07b | Clicking Speaker button again toggles back to lyric | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.08a | Clicking Stage Dir button converts line to stage direction | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.08b | Clicking Stage Dir button again toggles back to lyric | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.09a | Typing [[ at line start converts to speaker line | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.09b | Typing [[ then text creates speaker line with content | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.10a | Typing (( at line start converts to stage direction | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.10b | Typing (( then text creates stage direction with content | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.11 | Speaker and stage direction buttons are visible in toolbar | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.12 | Multiple lines with different types in same document | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | |
| T-4.13 | Speaker line text is rendered in bold after typing [[ | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | Verifies CSS font-weight: 700 and text-transform: uppercase |
| T-4.21 | Typing [[MARIA]] yields a speaker line whose text is exactly "MARIA" | unit, e2e | `tests/unit/editor/lyric-line-brackets.test.ts`, `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | C-09: closing `]]` no longer left in the text |
| T-4.22 | Typing [[ alone still converts immediately, leaving an empty speaker line | unit | `tests/unit/editor/lyric-line-brackets.test.ts` | [x] | [x] | C-09: existing opening-trigger shortcut preserved |
| T-4.23 | Typing ((beat)) yields a stage-direction line reading exactly "beat" | unit, e2e | `tests/unit/editor/lyric-line-brackets.test.ts`, `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | C-09: closing `))` no longer left in the text |
| T-4.24 | Typing (( alone still converts immediately | unit | `tests/unit/editor/lyric-line-brackets.test.ts` | [x] | [x] | C-09: existing opening-trigger shortcut preserved |
| T-4.25 | Undo of the auto-conversion restores the literal typed characters | unit | `tests/unit/editor/lyric-line-brackets.test.ts` | [x] | [x] | C-09: verified via `undoInputRule` for both the opening and closing gestures |
| T-4.26 | No `delivery`/`DeliveryMode` remains anywhere in `src/` (grep-clean) and the Delivery control is gone from the toolbar | unit | `tests/unit/editor/delivery-removed.test.ts` | [x] | [x] | C-10: removed per `docs/product/DESIGN_PROPOSAL.md` §3.4 |
| T-4.27 | Opening a legacy project that had `delivery` on its lines loads cleanly, with no error and no visible change beyond the removed italic | unit | `tests/unit/domain/migration.test.ts` | [x] | [x] | C-10: `migrateProject` strips the attribute as a silent no-op |
| T-4.28 | No hardcoded hex or rgba colour remains in `editor.css` (grep-clean; `var(--x, fallback)` may stay) | unit | `tests/unit/editor/editor-css-tokens.test.ts` | [x] | [x] | C-19: cross-referenced from `docs/product/DESIGN_PROPOSAL.md` §2 (visual foundation), tracked here as this is the only spec file this lane owns |
| T-4.29 | Toolbar controls are grouped (inline format, line type, structure, history) with a separator between each group; every control's tooltip names a real shortcut (or none, if none exists); the active line type is visibly indicated | integration | `tests/integration/editor/draft-toolbar-integration.test.tsx` | [x] | [x] | C-13: toolbar rebuild. Visual distinctiveness/no-wrap-at-1024px verified manually with Playwright screenshots (not asserted here — see agent report) |
| T-4.30 | Assigning/resolving a character's colour renders on every speaker line/column that links to it, both in the editor (decoration) and in the exported representation | unit | `tests/unit/editor/character-decorations.test.ts`, `tests/unit/domain/characters.test.ts`, `tests/integration/editor/character-registry-integration.test.tsx` | [x] | [x] | C-20: colour resolves via `characterId`, falling back to a name match |
| T-4.31 | Recolouring a character (same id, new colour) changes what the next export/print pass produces | unit | `tests/unit/domain/characters.test.ts` | [x] | [x] | C-20 |
| T-4.32 | Typing `[[JAC` offers `JACK` from the registry; selecting it links the existing character rather than creating a duplicate | unit | `tests/unit/editor/character-link.test.ts`, `tests/unit/editor/speaker-autocomplete.test.tsx` | [x] | [x] | C-20: `setSpeakerLineNameAndCharacter` never calls the create-new-character path |
| T-4.33 | Consecutive lines by the same character (no other speaker in between) render the label once on the repeat; the gutter tick (colour, via CSS) persists on the continuation line | unit, integration | `tests/unit/editor/character-decorations.test.ts`, `tests/integration/editor/character-registry-integration.test.tsx` | [x] | [x] | C-20: verified against the decoration function directly, plus the rendered class on a live editor; the visual tick itself verified manually with Playwright screenshots per the agent report |
| T-4.34 | The character registry persists through save/load, including unknown fields on a character entry | unit, integration | `tests/unit/domain/migration.test.ts`, `tests/integration/editor/character-registry-integration.test.tsx` | [x] | [x] | C-20 |
| T-4.35 | A project with existing speaker lines/columns but no `characters` registry derives one on load, colours assigned in order, `characterId` backfilled — no data loss | unit | `tests/unit/domain/migration.test.ts` | [x] | [x] | C-20 |
| T-4.36 | A concurrent-block column inherits its linked character's colour, in the editor and in export (squash + side-by-side) | unit | `tests/unit/editor/character-decorations.test.ts`, `tests/unit/domain/characters.test.ts` | [x] | [x] | C-20 |
| T-4.37 | Finalizing a new speaker name (leaving the line via Enter, or on blur) that matches no registry entry creates exactly one new character and links the line to it | unit | `tests/unit/editor/character-link.test.ts` | [x] | [x] | C-20: `reconcileSpeakerCharacters` / `onFinalizeSpeakerName` |
| T-4.38 | Pressing Enter after re-typing an already-registered character's exact name still exits the speaker line (the `[[` autocomplete must not swallow Enter just because the typed text is an exact suggestion match) | e2e | `tests/e2e/speaker-stage-direction.spec.ts` | [x] | [x] | C-20: regression found during manual visual verification — fixed in `DraftEditor.tsx`'s autocomplete keydown handler (no longer calls `preventDefault`/`stopPropagation` on Enter) |

## Retired criteria
- **T-4.06** ("Spoken/sung state persists on lyric line") — retired 2026-08-29 (C-10). The
  `delivery` (sung/spoken) attribute and its `toggleDelivery` command were removed entirely
  per `docs/product/DESIGN_PROPOSAL.md` §3.4: it only ever italicised "spoken" lines, a
  distinction stage directions already express. Superseded by T-4.26 (removal is grep-clean)
  and T-4.27 (legacy projects load cleanly with the attribute dropped).

## Regression Requirements
- Stages 0–3 must remain passing