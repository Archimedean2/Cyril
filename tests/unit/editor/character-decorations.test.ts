import { describe, test, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';
import { buildCharacterDecorations } from '../../../src/editor/extensions/characters/characterDecorations';
import { Character } from '../../../src/domain/project/types';

/**
 * C-20 — colour decoration + "consecutive lines by the same character"
 * detection. Tested directly against the pure decoration-building function
 * (rather than asserting on rendered CSS) so these stay fast and precise;
 * `docs/product/DESIGN_PROPOSAL.md` §3.1's visual claim (colour dot + small
 * caps, gutter tick) is verified manually with Playwright screenshots per
 * the task brief.
 */

const CHARACTERS: Character[] = [
  { id: 'char_jack', name: 'JACK', color: 'blue' },
  { id: 'char_jill', name: 'JILL', color: 'rose' },
];

// DecorationSet.find(from, to) uses inclusive-touching overlap semantics
// (`span.from <= end && span.to >= start`), so two adjacent node decorations
// (e.g. sibling columns) can both "overlap" a query at their shared
// boundary. Look up by the decoration's exact `from` instead of relying on
// range-overlap absence/presence.
function findDecoration(decorations: ReturnType<typeof buildCharacterDecorations>, pos: number) {
  return decorations.find().find((d) => d.from === pos);
}

describe('buildCharacterDecorations (C-20)', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  test('T-4.30: a speaker line linked by characterId gets a `--speaker-color` decoration matching the registry', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
        ],
      },
    }));

    const decorations = buildCharacterDecorations(editor.state.doc, CHARACTERS);
    const deco = findDecoration(decorations, 0);
    expect(deco).toBeDefined();
    expect((deco as any).type.attrs.style).toContain('var(--section-blue)');
    expect((deco as any).type.attrs.class).toContain('has-character-color');
  });

  test('an unlinked speaker line falls back to matching its literal text against the registry', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker' }, content: [{ type: 'text', text: 'jill' }] },
        ],
      },
    }));

    const decorations = buildCharacterDecorations(editor.state.doc, CHARACTERS);
    const deco = findDecoration(decorations, 0);
    expect((deco as any).type.attrs.style).toContain('var(--section-rose)');
  });

  test('a speaker line matching no registry entry gets no colour decoration', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker' }, content: [{ type: 'text', text: 'NOBODY' }] },
        ],
      },
    }));

    const decorations = buildCharacterDecorations(editor.state.doc, CHARACTERS);
    expect(findDecoration(decorations, 0)).toBeUndefined();
  });

  test('T-4.33: a second speaker line for the same character (no other speaker in between) is marked as a continuation', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'Howdy!' }] },
          { type: 'lyricLine', attrs: { id: 'l3', lineType: 'stageDirection' }, content: [{ type: 'text', text: '(pause)' }] },
          { type: 'lyricLine', attrs: { id: 'l4', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
        ],
      },
    }));

    const decorations = buildCharacterDecorations(editor.state.doc, CHARACTERS);
    const json = editor.getJSON().content as any[];
    const firstLinePos = 0;
    // Second line's position: sum of preceding node sizes in the ProseMirror doc.
    const doc = editor.state.doc;
    let secondSpeakerPos = -1;
    doc.descendants((node, pos) => {
      if (node.type.name === 'lyricLine' && node.attrs.id === 'l4') secondSpeakerPos = pos;
    });

    const firstDeco = findDecoration(decorations, firstLinePos);
    const secondDeco = findDecoration(decorations, secondSpeakerPos);

    expect((firstDeco as any).type.attrs.class).not.toContain('speaker-continuation');
    expect((secondDeco as any).type.attrs.class).toContain('speaker-continuation');
    // The continuation still carries the colour (for the gutter tick).
    expect((secondDeco as any).type.attrs.style).toContain('var(--section-blue)');
    expect(json).toHaveLength(4); // sanity: doc round-tripped as expected
  });

  test('a different character\'s speaker line in between resets continuation tracking', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'speaker', characterId: 'char_jill' }, content: [{ type: 'text', text: 'JILL' }] },
          { type: 'lyricLine', attrs: { id: 'l3', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
        ],
      },
    }));

    const decorations = buildCharacterDecorations(editor.state.doc, CHARACTERS);
    let l3Pos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.attrs?.id === 'l3') l3Pos = pos;
    });
    const l3Deco = findDecoration(decorations, l3Pos);
    // JACK's third appearance follows JILL, not another JACK line — not a continuation.
    expect((l3Deco as any).type.attrs.class).not.toContain('speaker-continuation');
  });

  test('T-4.36: a concurrent-block column linked by characterId gets the same colour decoration as a speaker line', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [{
          type: 'concurrentBlock',
          attrs: { id: 'cb1' },
          content: [
            { type: 'speakerColumn', attrs: { id: 'col1', speakerName: 'JACK', characterId: 'char_jack' }, content: [{ type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [] }] },
            { type: 'speakerColumn', attrs: { id: 'col2', speakerName: 'Unregistered' }, content: [{ type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [] }] },
          ],
        }],
      },
    }));

    const decorations = buildCharacterDecorations(editor.state.doc, CHARACTERS);
    let col1Pos = -1;
    let col2Pos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.attrs?.id === 'col1') col1Pos = pos;
      if (node.attrs?.id === 'col2') col2Pos = pos;
    });

    const col1Deco = findDecoration(decorations, col1Pos);
    expect((col1Deco as any).type.attrs.style).toContain('var(--section-blue)');
    expect(findDecoration(decorations, col2Pos)).toBeUndefined();
  });
});
