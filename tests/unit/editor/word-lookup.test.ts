import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';
import { requestLookupAtPosition } from '../../../src/editor/extensions/wordLookup';
import { useWordLookupStore } from '../../../src/app/state/wordLookupStore';

/**
 * C-41 — double-click a word to look it up (`docs/product/DESIGN_PROPOSAL.md` §13.1),
 * exercised against a real (bare) Tiptap editor.
 *
 * Why the plugin's position handler is tested directly rather than by dispatching a
 * `dblclick` event: ProseMirror resolves a click to a document position via
 * `posAtCoords`, which needs real layout. jsdom has none — every coordinate is 0 —
 * so a synthetic mouse event would exercise the mock, not the feature. The gesture
 * wiring (that a double-click reaches this function at all) is covered end-to-end in
 * `tests/e2e/stage-14-lookup.spec.ts`, in a browser that does have layout.
 */
describe('C-41: lookup on double-click', () => {
  let editor: Editor;

  beforeEach(() => {
    useWordLookupStore.setState({ enabled: true, request: null });
  });

  afterEach(() => {
    editor?.destroy();
  });

  function editorWith(text: string) {
    return new Editor(getDraftEditorConfig({
      content: {
        type: 'doc',
        content: [{
          type: 'lyricLine',
          attrs: { id: 'l1', lineType: 'lyric' },
          content: text ? [{ type: 'text', text }] : [],
        }],
      },
    }));
  }

  /** Document position of `offset` characters into the single lyric line. */
  const at = (offset: number) => 1 + offset;

  test('T-14.24: double-clicking a word raises a lookup for exactly that word', () => {
    editor = editorWith('nothing left to lose');

    // "left" occupies offsets 8-12.
    expect(requestLookupAtPosition(editor.state, at(10))).toBe(true);
    expect(useWordLookupStore.getState().request?.term).toBe('left');
  });

  test('T-14.24: the same word twice in a row raises two distinct requests', () => {
    editor = editorWith('left left');

    requestLookupAtPosition(editor.state, at(1));
    const first = useWordLookupStore.getState().request;
    requestLookupAtPosition(editor.state, at(1));
    const second = useWordLookupStore.getState().request;

    expect(first?.term).toBe('left');
    expect(second?.term).toBe('left');
    // A rail keyed on the term alone would not react the second time.
    expect(second?.nonce).toBeGreaterThan(first!.nonce);
  });

  test('T-14.24: the gesture never moves the caret or consumes the selection', () => {
    editor = editorWith('nothing left to lose');
    editor.commands.setTextSelection(at(3));
    const before = editor.state.selection.from;

    requestLookupAtPosition(editor.state, at(10));

    // The handler reads the document; it must not dispatch a transaction.
    expect(editor.state.selection.from).toBe(before);
  });

  test('T-14.28: whitespace and free-standing punctuation raise no lookup', () => {
    editor = editorWith('left — right');

    // The em dash at offset 5, with a space on either side.
    expect(requestLookupAtPosition(editor.state, at(5))).toBe(false);
    // The space at offset 4 is flanked by the word "left", so it resolves to it;
    // the space at offset 6 is flanked by the dash and resolves to nothing.
    expect(requestLookupAtPosition(editor.state, at(6))).toBe(false);
    expect(useWordLookupStore.getState().request).toBeNull();
  });

  test('T-14.28: an empty line raises no lookup', () => {
    editor = editorWith('');

    expect(requestLookupAtPosition(editor.state, at(0))).toBe(false);
    expect(useWordLookupStore.getState().request).toBeNull();
  });

  test('T-14.24: a click on the trailing edge of a word still resolves to that word', () => {
    editor = editorWith('nothing left to lose');

    // Clicking the right half of the final "t" puts `pos` after the word.
    expect(requestLookupAtPosition(editor.state, at(12))).toBe(true);
    expect(useWordLookupStore.getState().request?.term).toBe('left');
  });

  test('T-14.24: words with an apostrophe or hyphen look up whole', () => {
    editor = editorWith("don't half-light");

    requestLookupAtPosition(editor.state, at(2));
    expect(useWordLookupStore.getState().request?.term).toBe("don't");

    requestLookupAtPosition(editor.state, at(9));
    expect(useWordLookupStore.getState().request?.term).toBe('half-light');
  });

  test('T-14.27: with the setting off, the gesture raises nothing', () => {
    editor = editorWith('nothing left to lose');
    useWordLookupStore.getState().setEnabled(false);

    expect(requestLookupAtPosition(editor.state, at(10))).toBe(false);
    expect(useWordLookupStore.getState().request).toBeNull();

    // …and turning it back on restores the behaviour, without a reload.
    useWordLookupStore.getState().setEnabled(true);
    expect(requestLookupAtPosition(editor.state, at(10))).toBe(true);
  });

  test('T-14.26: Mod-Shift-L looks up the word under the caret', () => {
    editor = editorWith('nothing left to lose');
    editor.commands.setTextSelection(at(10));

    const handled = editor.view.someProp('handleKeyDown', (fn) =>
      fn(editor.view, new KeyboardEvent('keydown', { key: 'L', code: 'KeyL', shiftKey: true, ctrlKey: true }))
    );

    expect(handled).toBe(true);
    expect(useWordLookupStore.getState().request?.term).toBe('left');
  });

  test('T-14.26: the shortcut is a no-op (and stays unconsumed) with no word under the caret', () => {
    editor = editorWith('');

    const handled = editor.view.someProp('handleKeyDown', (fn) =>
      fn(editor.view, new KeyboardEvent('keydown', { key: 'L', code: 'KeyL', shiftKey: true, metaKey: true }))
    );

    expect(handled).toBeFalsy();
    expect(useWordLookupStore.getState().request).toBeNull();
  });
});

describe('C-41: wordLookupStore', () => {
  beforeEach(() => {
    useWordLookupStore.setState({ enabled: true, request: null });
  });

  test('T-14.28: a multi-word phrase is not a lookup', () => {
    expect(useWordLookupStore.getState().requestLookup('nothing left')).toBe(false);
    expect(useWordLookupStore.getState().request).toBeNull();
  });

  test('T-14.28: null, empty and whitespace-only terms are safe no-ops', () => {
    const { requestLookup } = useWordLookupStore.getState();
    expect(requestLookup(null)).toBe(false);
    expect(requestLookup(undefined)).toBe(false);
    expect(requestLookup('')).toBe(false);
    expect(requestLookup('   ')).toBe(false);
    expect(useWordLookupStore.getState().request).toBeNull();
  });

  test('T-14.27: the preference survives a store rebuild via localStorage', () => {
    useWordLookupStore.getState().setEnabled(false);
    expect(window.localStorage.getItem('cyril.lookupOnDoubleClick')).toBe('off');

    useWordLookupStore.getState().setEnabled(true);
    expect(window.localStorage.getItem('cyril.lookupOnDoubleClick')).toBe('on');
  });

  test('T-14.27: a localStorage that throws does not break the lookup', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => { throw new Error('denied'); };

    try {
      expect(() => useWordLookupStore.getState().setEnabled(false)).not.toThrow();
      // The in-memory preference still took effect, even though it could not be stored.
      expect(useWordLookupStore.getState().enabled).toBe(false);
      expect(useWordLookupStore.getState().requestLookup('left')).toBe(false);
    } finally {
      window.localStorage.setItem = original;
    }
  });
});
