import { describe, test, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';
import { createActiveEditorCommands } from '../../../src/editor/core/editorCommands';

/**
 * C-48 — the editor command bridge (`docs/product/DESIGN_PROPOSAL.md` §13.0):
 * `createActiveEditorCommands` against a real (bare) Tiptap `Editor`
 * instance. Deliberately bypasses the DOM/React tree — jsdom cannot
 * reliably simulate caret placement inside a contenteditable via
 * keyboard/mouse events, so this is the reliable way to exercise exact
 * caret/selection behaviour (same pattern as
 * `tests/unit/editor/character-link.test.ts`). Registration lifecycle
 * (mount/unmount/no-op) is covered in
 * `tests/integration/editor/active-editor-bridge-integration.test.tsx`.
 */
describe('C-48: createActiveEditorCommands', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  function docWithOneLyricLine(text: string) {
    return {
      type: 'doc',
      content: [{
        type: 'lyricLine',
        attrs: { id: 'l1', lineType: 'lyric' },
        content: text ? [{ type: 'text', text }] : [],
      }],
    };
  }

  test('T-4.40: insertAtCaret inserts at the caret as one undo step', () => {
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('hello world') }));
    const commands = createActiveEditorCommands(editor);

    // Caret right after "hello " (pos 1 is line start; "hello ".length === 6).
    editor.commands.setTextSelection(1 + 6);

    const ok = commands.insertAtCaret('brave new ');
    expect(ok).toBe(true);
    expect(editor.getText()).toBe('hello brave new world');

    editor.commands.undo();
    expect(editor.getText()).toBe('hello world');
  });

  test('T-4.48: insertAtCaret replaces a non-empty selection (still one undo step)', () => {
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('hello world') }));
    const commands = createActiveEditorCommands(editor);

    // Select "world" (positions relative to doc: line starts at 1, "hello " is 6 chars).
    editor.commands.setTextSelection({ from: 1 + 6, to: 1 + 11 });

    expect(commands.insertAtCaret('there')).toBe(true);
    expect(editor.getText()).toBe('hello there');

    editor.commands.undo();
    expect(editor.getText()).toBe('hello world');
  });

  test('T-4.39: insertAtCaret/getFocusedWord are safe no-ops once the editor is destroyed', () => {
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('hello world') }));
    const commands = createActiveEditorCommands(editor);
    editor.destroy();

    expect(() => commands.insertAtCaret('x')).not.toThrow();
    expect(commands.insertAtCaret('x')).toBe(false);
    expect(() => commands.getFocusedWord()).not.toThrow();
    expect(commands.getFocusedWord()).toBeNull();
  });

  test('T-4.47: getFocusedWord returns the word the caret sits inside', () => {
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('hello world') }));
    const commands = createActiveEditorCommands(editor);

    editor.commands.setTextSelection(1 + 2); // inside "hello"
    expect(commands.getFocusedWord()).toBe('hello');

    editor.commands.setTextSelection(1 + 8); // inside "world"
    expect(commands.getFocusedWord()).toBe('world');
  });

  test('T-4.47: getFocusedWord returns null when the caret sits on whitespace', () => {
    // Two spaces so there's a genuine interior offset touching neither word —
    // a single-space gap only has two offsets, and both sit at a word
    // boundary (adjacent to "hello" or to "world"), which correctly counts
    // as being on that word (matches how double-click-to-select behaves at
    // a word edge).
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('hello  world') }));
    const commands = createActiveEditorCommands(editor);

    editor.commands.setTextSelection(1 + 6); // between the two spaces, touching neither word
    expect(commands.getFocusedWord()).toBeNull();
  });

  test('T-4.47: getFocusedWord returns the text of a single-word selection', () => {
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('hello world') }));
    const commands = createActiveEditorCommands(editor);

    editor.commands.setTextSelection({ from: 1, to: 1 + 5 }); // "hello"
    expect(commands.getFocusedWord()).toBe('hello');
  });

  test('T-4.47: getFocusedWord returns null for a multi-word selection', () => {
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('hello world') }));
    const commands = createActiveEditorCommands(editor);

    editor.commands.setTextSelection({ from: 1, to: 1 + 11 }); // "hello world"
    expect(commands.getFocusedWord()).toBeNull();
  });

  test('T-4.39: getFocusedWord returns null on an empty line (nothing to focus)', () => {
    editor = new Editor(getDraftEditorConfig({ content: docWithOneLyricLine('') }));
    const commands = createActiveEditorCommands(editor);
    editor.commands.setTextSelection(1);
    expect(commands.getFocusedWord()).toBeNull();
  });
});
