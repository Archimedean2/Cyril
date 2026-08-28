import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';

/**
 * C-09 — `[[NAME]]` / `((text))` must accept their closing brackets.
 *
 * Every doc in this repo describes the speaker/stage-direction gesture as
 * `[[NAME]]` / `((text))`, but the input rules only ever matched the opening
 * trigger (`/^\[\[$/`, `/^\(\($/`). Typing the full gesture converted the line
 * correctly but left the literal closing brackets in the text (`MARIA]]`,
 * `beat))`). These tests exercise the fix: a matching pair of input rules
 * that swallow the closing brackets once the opening trigger has already
 * converted the line.
 */

/**
 * Simulates real keystroke-by-keystroke typing by feeding characters through
 * ProseMirror's `handleTextInput` hook — the same code path a live keypress
 * exercises — so input rules fire exactly as they would for a person typing
 * into the editor. Plain `editor.commands.insertContent()` bypasses input
 * rules entirely and would not reproduce (or verify the fix for) the bug
 * this suite guards against.
 */
function typeText(editor: Editor, text: string) {
  const { view } = editor;
  for (const ch of text) {
    const { from, to } = view.state.selection;
    const handled = view.someProp('handleTextInput', (f) => f(view, from, to, ch, () => view.state.tr));
    if (!handled) {
      editor.commands.insertContent(ch);
    }
  }
}

function firstLineType(editor: Editor): unknown {
  return editor.getJSON().content?.[0]?.attrs?.lineType;
}

function resetToEmptyLine(editor: Editor) {
  editor.commands.setContent('<div data-type="lyricLine"></div>');
  editor.commands.focus('start');
}

describe('LyricLine speaker/stage-direction bracket gestures (C-09)', () => {
  let editor: Editor;

  beforeEach(() => {
    editor = new Editor(getDraftEditorConfig());
    resetToEmptyLine(editor);
  });

  afterEach(() => {
    editor.destroy();
  });

  test('T-4.21: Typing [[MARIA]] yields a speaker line whose text is exactly "MARIA"', () => {
    typeText(editor, '[[MARIA]]');

    expect(firstLineType(editor)).toBe('speaker');
    expect(editor.getText()).toBe('MARIA');
    expect(editor.getText()).not.toContain(']]');
    expect(editor.getText()).not.toContain('[[');
  });

  test('T-4.22: Typing [[ alone still converts immediately, leaving an empty speaker line', () => {
    typeText(editor, '[[');

    expect(firstLineType(editor)).toBe('speaker');
    expect(editor.getText()).toBe('');
  });

  test('T-4.23: Typing ((beat)) yields a stage-direction line reading exactly "beat"', () => {
    typeText(editor, '((beat))');

    expect(firstLineType(editor)).toBe('stageDirection');
    expect(editor.getText()).toBe('beat');
    expect(editor.getText()).not.toContain('))');
    expect(editor.getText()).not.toContain('((');
  });

  test('T-4.24: Typing (( alone still converts immediately', () => {
    typeText(editor, '((');

    expect(firstLineType(editor)).toBe('stageDirection');
    expect(editor.getText()).toBe('');
  });

  test('T-4.25: Undo of the auto-conversion restores the literal typed characters', () => {
    // Closing-bracket conversion (the new behaviour): undoing the ]] swallow
    // must restore the literal characters, not just delete them.
    typeText(editor, '[[MARIA]]');
    expect(editor.getText()).toBe('MARIA');

    let undone = editor.commands.undoInputRule();
    expect(undone).toBe(true);
    expect(editor.getText()).toBe('MARIA]]');
    expect(firstLineType(editor)).toBe('speaker');

    // Opening-bracket conversion (the pre-existing shortcut), tested in
    // isolation: undoing the [[ swallow must also restore its literal chars.
    resetToEmptyLine(editor);
    typeText(editor, '[[');
    expect(firstLineType(editor)).toBe('speaker');

    undone = editor.commands.undoInputRule();
    expect(undone).toBe(true);
    expect(editor.getText()).toBe('[[');
    expect(firstLineType(editor)).toBe('lyric');

    // Same round-trip for the stage-direction closing gesture.
    resetToEmptyLine(editor);
    typeText(editor, '((beat))');
    expect(editor.getText()).toBe('beat');

    undone = editor.commands.undoInputRule();
    expect(undone).toBe(true);
    expect(editor.getText()).toBe('beat))');
    expect(firstLineType(editor)).toBe('stageDirection');
  });

  test('regression: a mid-line [[ does not convert the whole line', () => {
    editor.commands.setContent('<div data-type="lyricLine">hello</div>');
    editor.commands.focus('end');
    typeText(editor, '[[world]]');

    expect(firstLineType(editor)).toBe('lyric');
    expect(editor.getText()).toContain('hello');
    // Mid-line, the brackets are never swallowed either — they're only
    // special at the very start of an otherwise-empty line.
    expect(editor.getText()).toContain('[[world]]');
  });
});
