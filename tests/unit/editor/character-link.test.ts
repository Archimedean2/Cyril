import { describe, test, expect, afterEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';

/**
 * C-20 — linking a speaker line's typed name to a `Character` in the
 * project's registry: the `[[NAME]]` gesture stays exactly as it was
 * (T-4.21–T-4.25 continue to cover it); these tests cover what's new —
 * resolving/creating the character and recording `characterId` on the line.
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

function firstLine(editor: Editor): any {
  return editor.getJSON().content?.[0];
}

/**
 * Dispatches a real Enter keydown to the editor's own DOM, exactly like a
 * live keypress. `editor.commands.keyboardShortcut('Enter')` looks
 * equivalent but wraps dispatch in Tiptap's `captureTransaction`, which does
 * not thread state between the sequential `editor.commands.X()` calls our
 * Enter handler makes (splitBlock, then setLineType, then
 * reconcileSpeakerCharacters) — each would see the pre-split document. A
 * direct `handleKeyDown` call (what a real keydown listener invokes) doesn't
 * have that limitation.
 */
function pressEnter(editor: Editor) {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
  editor.view.someProp('handleKeyDown', (f) => f(editor.view, event));
}

describe('C-20: speaker line ↔ character registry linking', () => {
  let editor: Editor;

  afterEach(() => {
    editor?.destroy();
  });

  test('T-4.37: pressing Enter after typing a new speaker name resolves it via onFinalizeSpeakerName and links characterId', () => {
    const resolve = vi.fn((name: string) => (name === 'JACK' ? 'char_jack_new' : null));
    editor = new Editor(getDraftEditorConfig({ onFinalizeSpeakerName: resolve }));
    editor.commands.setContent('<div data-type="lyricLine"></div>');
    editor.commands.focus('start');

    typeText(editor, '[[JACK');
    expect(firstLine(editor)?.attrs?.lineType).toBe('speaker');
    expect(firstLine(editor)?.attrs?.characterId).toBeFalsy();

    pressEnter(editor);

    expect(resolve).toHaveBeenCalledWith('JACK');
    expect(firstLine(editor)?.attrs?.characterId).toBe('char_jack_new');
  });

  test('T-4.37: a second, unrelated new speaker name resolves independently (no cross-contamination)', () => {
    const seen: string[] = [];
    const resolve = vi.fn((name: string) => {
      seen.push(name);
      return `char_${name.toLowerCase()}`;
    });
    editor = new Editor(getDraftEditorConfig({ onFinalizeSpeakerName: resolve }));
    editor.commands.setContent('<div data-type="lyricLine"></div>');
    editor.commands.focus('start');

    typeText(editor, '[[JACK');
    pressEnter(editor);
    // Cursor is now on a fresh lyric line — re-enter speaker mode for a new name.
    typeText(editor, '[[JILL');
    pressEnter(editor);

    expect(seen).toEqual(['JACK', 'JILL']);
    const [jackLine, jillLine] = editor.getJSON().content as any[];
    expect(jackLine.attrs.characterId).toBe('char_jack');
    expect(jillLine.attrs.characterId).toBe('char_jill');
  });

  test('reconcileSpeakerCharacters is a no-op without onFinalizeSpeakerName configured', () => {
    editor = new Editor(getDraftEditorConfig());
    editor.commands.setContent('<div data-type="lyricLine"></div>');
    editor.commands.focus('start');
    typeText(editor, '[[JACK');

    const changed = editor.commands.reconcileSpeakerCharacters();
    expect(changed).toBe(false);
    expect(firstLine(editor)?.attrs?.characterId).toBeFalsy();
  });

  test('reconcileSpeakerCharacters never overwrites an already-linked characterId', () => {
    const resolve = vi.fn(() => 'should-not-be-used');
    editor = new Editor(getDraftEditorConfig({ onFinalizeSpeakerName: resolve }));
    editor.commands.setContent({
      type: 'doc',
      content: [{
        type: 'lyricLine',
        attrs: { id: 'l1', lineType: 'speaker', characterId: 'already_linked' },
        content: [{ type: 'text', text: 'JACK' }],
      }],
    });

    editor.commands.reconcileSpeakerCharacters();

    expect(firstLine(editor)?.attrs?.characterId).toBe('already_linked');
    expect(resolve).not.toHaveBeenCalled();
  });

  test('T-4.32: setSpeakerLineNameAndCharacter (the autocomplete "pick JACK" action) sets the exact name and characterId without calling onFinalizeSpeakerName — selecting an existing character never creates a duplicate', () => {
    const resolve = vi.fn(() => 'should-not-be-called');
    editor = new Editor(getDraftEditorConfig({ onFinalizeSpeakerName: resolve }));
    editor.commands.setContent({
      type: 'doc',
      content: [{
        type: 'lyricLine',
        attrs: { id: 'l1', lineType: 'speaker' },
        content: [{ type: 'text', text: 'JAC' }],
      }],
    });

    editor.commands.setSpeakerLineNameAndCharacter(0, 'JACK', 'char_jack_existing');

    const line = firstLine(editor);
    expect(line.content).toEqual([{ type: 'text', text: 'JACK' }]);
    expect(line.attrs.characterId).toBe('char_jack_existing');
    expect(resolve).not.toHaveBeenCalled();
  });

  test('setLineType away from "speaker" clears a stale characterId', () => {
    editor = new Editor(getDraftEditorConfig());
    editor.commands.setContent({
      type: 'doc',
      content: [{
        type: 'lyricLine',
        attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' },
        content: [{ type: 'text', text: 'JACK' }],
      }],
    });
    editor.commands.focus('start');

    editor.commands.setLineType('lyric');

    expect(firstLine(editor)?.attrs?.lineType).toBe('lyric');
    expect(firstLine(editor)?.attrs?.characterId).toBeFalsy();
  });
});
