import { describe, test, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';

/**
 * C-36 (§12.2) — the speaker gutter's paint command. `EDGE_CASES.md` §5
 * flags structural atomicity as the clearest hazard here: painting a range
 * must be one undo step, and must never touch line text (only the
 * `characterId` attribute) or the lines it isn't supposed to touch
 * (section headers, stage directions).
 */
describe('C-36: paintCharacterRange', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  function linePositions(): number[] {
    const positions: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'lyricLine') positions.push(pos);
    });
    return positions;
  }

  test('T-4.51: paints every qualifying line in one transaction — 8 lines undo in a single Cmd+Z', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: Array.from({ length: 8 }, (_, i) => ({
          type: 'lyricLine',
          attrs: { id: `l${i}`, lineType: 'lyric' },
          content: [{ type: 'text', text: `line ${i}` }],
        })),
      },
    }));

    const positions = linePositions();
    expect(positions).toHaveLength(8);

    const changed = editor.commands.paintCharacterRange(positions, 'char_jack');
    expect(changed).toBe(true);

    const attrsAfter = (editor.getJSON().content as any[]).map((l) => l.attrs.characterId);
    expect(attrsAfter).toEqual(Array(8).fill('char_jack'));

    editor.commands.undo();
    const attrsUndone = (editor.getJSON().content as any[]).map((l) => l.attrs.characterId ?? null);
    expect(attrsUndone).toEqual(Array(8).fill(null));
  });

  test('T-4.52: a stage-direction line inside the range is skipped, not painted', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'a' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'stageDirection' }, content: [{ type: 'text', text: '(pause)' }] },
          { type: 'lyricLine', attrs: { id: 'l3', lineType: 'lyric' }, content: [{ type: 'text', text: 'b' }] },
        ],
      },
    }));

    const positions = linePositions();
    editor.commands.paintCharacterRange(positions, 'char_jack');

    const lines = editor.getJSON().content as any[];
    expect(lines[0].attrs.characterId).toBe('char_jack');
    expect(lines[1].attrs.characterId).toBeFalsy(); // stage direction never painted
    expect(lines[1].content).toEqual([{ type: 'text', text: '(pause)' }]); // and untouched
    expect(lines[2].attrs.characterId).toBe('char_jack');
  });

  test('T-4.53: a position that is not a lyricLine (e.g. a section header) is skipped without erroring', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'a' }] },
        ],
      },
    }));

    // Position 0 is a real lyricLine; throw in an out-of-range/garbage
    // position that resolves to something other than a lyricLine (here,
    // past the end of the doc) to prove it's skipped rather than throwing.
    const garbagePos = editor.state.doc.content.size + 50;
    expect(() => editor.commands.paintCharacterRange([0, garbagePos], 'char_jack')).not.toThrow();

    const lines = editor.getJSON().content as any[];
    expect(lines[0].attrs.characterId).toBe('char_jack');
  });

  test('T-4.54: painting never touches line text — a speaker line in the range keeps its displayed name', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'Howdy' }] },
        ],
      },
    }));

    const positions = linePositions();
    editor.commands.paintCharacterRange(positions, 'char_jill');

    const lines = editor.getJSON().content as any[];
    // characterId changed on both...
    expect(lines[0].attrs.characterId).toBe('char_jill');
    expect(lines[1].attrs.characterId).toBe('char_jill');
    // ...but the speaker line's displayed text is untouched (rename is the
    // colour-dot's job, C-35 — not the gutter's).
    expect(lines[0].content).toEqual([{ type: 'text', text: 'JACK' }]);
  });

  test('a line already carrying the target characterId is a true no-op for that position (still reports overall change if others differ)', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric', characterId: 'char_jack' }, content: [{ type: 'text', text: 'a' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'b' }] },
        ],
      },
    }));

    const positions = linePositions();
    const changed = editor.commands.paintCharacterRange(positions, 'char_jack');
    expect(changed).toBe(true);
    const lines = editor.getJSON().content as any[];
    expect(lines[0].attrs.characterId).toBe('char_jack');
    expect(lines[1].attrs.characterId).toBe('char_jack');
  });

  test('painting with no qualifying positions is a safe no-op returning false', () => {
    editor = new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'stageDirection' }, content: [{ type: 'text', text: '(pause)' }] },
        ],
      },
    }));

    const positions = linePositions();
    const changed = editor.commands.paintCharacterRange(positions, 'char_jack');
    expect(changed).toBe(false);
  });
});
