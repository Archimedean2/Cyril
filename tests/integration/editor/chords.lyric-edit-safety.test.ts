import { describe, it, expect, beforeEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { addChordToCurrentLine, getChordsForCurrentLine } from '../../../src/domain/editor/chord-commands';
import { ChordExtension } from '../../../src/editor/extensions/chords';
import StarterKit from '@tiptap/starter-kit';
import { LyricLine } from '../../../src/editor/nodes/lyricLine/lyricLine';

describe('I-9.04: Editing lyric text does not corrupt chord marker data', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: false,
          bulletList: false,
          orderedList: false,
          listItem: false,
          blockquote: false,
          code: false,
          codeBlock: false,
          horizontalRule: false,
          strike: false,
        }),
        LyricLine,
        ChordExtension.configure({
          showChords: true,
          draftMode: 'lyricsWithChords',
        }),
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'lyricLine',
            attrs: {
              id: 'line_001',
              delivery: 'sung',
              rhymeGroup: null,
              meta: {
                alternates: [],
                prosody: null,
                chords: [],
              },
            },
            content: [{ type: 'text', text: 'Amazing grace how sweet the sound' }],
          },
        ],
      },
    });
  });

  it('chord metadata persists after adding text to lyric line', () => {
    // Add a chord
    const result = addChordToCurrentLine(editor, 'Am', 8);
    expect(result).toBe(true);

    // Get initial chords
    const initialChords = getChordsForCurrentLine(editor);
    expect(initialChords).toHaveLength(1);
    expect(initialChords[0].symbol).toBe('Am');

    // Edit the text by inserting at position
    editor.commands.setTextSelection(5);
    editor.commands.insertContent('new ');

    // Verify chords still exist
    const chordsAfterEdit = getChordsForCurrentLine(editor);
    expect(chordsAfterEdit).toHaveLength(1);
    expect(chordsAfterEdit[0].symbol).toBe('Am');
    expect(chordsAfterEdit[0].id).toBe(initialChords[0].id);
  });

  it('chord metadata persists after deleting text from lyric line', () => {
    // Add a chord
    addChordToCurrentLine(editor, 'G', 10);

    const initialChords = getChordsForCurrentLine(editor);
    expect(initialChords).toHaveLength(1);

    // Delete some text
    editor.commands.setTextSelection({ from: 5, to: 12 });
    editor.commands.deleteSelection();

    // Verify chord still exists
    const chordsAfterDelete = getChordsForCurrentLine(editor);
    expect(chordsAfterDelete).toHaveLength(1);
    expect(chordsAfterDelete[0].symbol).toBe('G');
  });

  it('chord metadata persists after replacing entire line content', () => {
    // Add multiple chords
    addChordToCurrentLine(editor, 'Am', 0);
    addChordToCurrentLine(editor, 'G', 15);

    const initialChords = getChordsForCurrentLine(editor);
    expect(initialChords).toHaveLength(2);

    // Replace only the text content within the lyricLine (not the node itself)
    // lyricLine is the first block in the doc; its text content is inside pos 2..nodeSize-1
    const lyricLineNode = editor.state.doc.firstChild!;
    const lineTextStart = 2; // 1 (lyricLine open) + 1 (inside content)
    const lineTextEnd = lineTextStart + lyricLineNode.textContent.length;
    editor.commands.setTextSelection({ from: lineTextStart, to: lineTextEnd });
    editor.commands.insertContent('New lyric line text');

    // Verify chords still exist in metadata (node attrs survive text replacement)
    const chordsAfterReplace = getChordsForCurrentLine(editor);
    expect(chordsAfterReplace).toHaveLength(2);
    expect(chordsAfterReplace[0].symbol).toBe('Am');
    expect(chordsAfterReplace[1].symbol).toBe('G');
  });

  it('chord positions remain valid integers after various edits', () => {
    // Add a chord
    addChordToCurrentLine(editor, 'Em', 5);

    // Perform multiple edits
    editor.commands.setTextSelection(3);
    editor.commands.insertContent('word ');

    editor.commands.setTextSelection(10);
    editor.commands.insertContent(' more');

    // Get chords and verify positions are valid numbers
    const chords = getChordsForCurrentLine(editor);
    expect(chords).toHaveLength(1);
    expect(typeof chords[0].position.charOffset).toBe('number');
    expect(Number.isFinite(chords[0].position.charOffset)).toBe(true);
    expect(chords[0].position.charOffset).toBeGreaterThanOrEqual(0);
  });

  it('chord IDs remain stable across text edits', () => {
    // Add a chord
    addChordToCurrentLine(editor, 'C', 3);

    const initialId = getChordsForCurrentLine(editor)[0].id;

    // Multiple text edits
    editor.commands.setTextSelection(1);
    editor.commands.insertContent('Start ');

    editor.commands.setTextSelection(20);
    editor.commands.insertContent(' end');

    // Verify ID unchanged
    const chordsAfterEdits = getChordsForCurrentLine(editor);
    expect(chordsAfterEdits[0].id).toBe(initialId);
  });

  it('chord symbols remain unchanged after text formatting changes', () => {
    // Add a chord
    addChordToCurrentLine(editor, 'F#m7', 8);

    // Apply formatting (bold)
    editor.commands.setTextSelection({ from: 5, to: 15 });
    editor.commands.toggleBold();

    // Verify chord symbol unchanged
    const chords = getChordsForCurrentLine(editor);
    expect(chords).toHaveLength(1);
    expect(chords[0].symbol).toBe('F#m7');
  });

  it('chord array structure remains intact after rapid successive edits', () => {
    // Add chords
    addChordToCurrentLine(editor, 'C', 0);
    addChordToCurrentLine(editor, 'G', 10);
    addChordToCurrentLine(editor, 'Am', 20);

    expect(getChordsForCurrentLine(editor)).toHaveLength(3);

    // Rapid edits
    for (let i = 0; i < 5; i++) {
      editor.commands.setTextSelection(5 + i);
      editor.commands.insertContent('x');
    }

    // Verify all chords still present
    const chords = getChordsForCurrentLine(editor);
    expect(chords).toHaveLength(3);
    expect(chords.map(c => c.symbol)).toContain('C');
    expect(chords.map(c => c.symbol)).toContain('G');
    expect(chords.map(c => c.symbol)).toContain('Am');
  });
});
