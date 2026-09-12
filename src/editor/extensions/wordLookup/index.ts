import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { EditorState } from '@tiptap/pm/state';
import { useWordLookupStore } from '../../../app/state/wordLookupStore';
import { findWordAt, isWordChar, focusedWordIn } from '../../core/editorCommands';

export const wordLookupPluginKey = new PluginKey('wordLookup');

/**
 * C-41 — double-click a word in the lyric to look it up
 * (`docs/product/DESIGN_PROPOSAL.md` §13.1).
 *
 * Three things in the spec decide whether this feels like an instrument or a
 * mode switch, and all three are load-bearing here:
 *
 * 1. **Never steal focus.** The handler returns `false` in every path, so
 *    ProseMirror still performs its own double-click word selection and the
 *    caret stays exactly where the writer put it. The rail updates beside them.
 * 2. **Only a double-click**, never selection-following: dragging across three
 *    words to delete them must not make the rail lurch (§13.1).
 * 3. **A keyboard twin**, so the feature isn't mouse-only — `Mod-Shift-L`
 *    looks up the word under the caret via the same path.
 *
 * The word is read from the document at the clicked position rather than from
 * the selection afterwards: at `handleDoubleClick` time ProseMirror has not yet
 * applied its word selection, and waiting for it would mean a timing hack.
 */
export const WordLookupExtension = Extension.create({
  name: 'wordLookup',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: wordLookupPluginKey,
        props: {
          handleDoubleClick(view, pos) {
            requestLookupAtPosition(view.state, pos);
            // ALWAYS false: we observe the gesture, we never consume it.
            // Returning true would suppress the browser's word selection and
            // make double-click feel broken.
            return false;
          },

          handleKeyDown(view, event) {
            if (!isLookupShortcut(event)) return false;
            // Consume the key only when it did something, so the shortcut
            // stays out of the way when there is no word under the caret.
            const raised = useWordLookupStore.getState().requestLookup(focusedWordIn(view.state));
            if (raised) event.preventDefault();
            return raised;
          },
        },
      }),
    ];
  },
});

/**
 * `Mod-Shift-L` — the keyboard twin of the double-click.
 *
 * Matched by hand rather than through Tiptap's `addKeyboardShortcuts` for the
 * same reason `SpeakerGutter`'s `Mod-Shift-A` is: `prosemirror-keymap`
 * normalises "Mod" against the platform and falls back to `keyCode` for
 * shifted letters, neither of which behaves predictably outside a real browser.
 * Accepting either modifier is also simply correct — the writer's muscle
 * memory is Cmd on a Mac and Ctrl elsewhere, and nothing else binds this.
 */
function isLookupShortcut(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'l';
}

/**
 * Raise a lookup for the word at document position `pos`. Exported for unit
 * tests, which can call it against a bare `EditorState` without needing jsdom
 * to produce a real double-click (jsdom has no layout, so `posAtCoords` — the
 * thing a synthetic mouse event would go through — cannot work).
 *
 * Returns whether a lookup was actually raised.
 */
export function requestLookupAtPosition(state: EditorState, pos: number): boolean {
  if (pos < 0 || pos > state.doc.content.size) return false;

  const $pos = state.doc.resolve(pos);
  if (!$pos.parent.isTextblock) return false;

  const text = $pos.parent.textContent;
  const offset = $pos.parentOffset;

  // The click must land on a word. `pos` is a point between characters, and
  // which side of a glyph you get depends on which half of it was clicked, so
  // a word counts as hit when EITHER neighbouring character belongs to one.
  // That keeps double-clicking the last letter of a word working, while a
  // click in open whitespace or on free-standing punctuation raises nothing.
  if (!isWordChar(text[offset]) && !isWordChar(text[offset - 1])) return false;

  return useWordLookupStore.getState().requestLookup(findWordAt(text, offset));
}
