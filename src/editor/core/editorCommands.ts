import { Editor } from '@tiptap/core';
import { EditorState } from '@tiptap/pm/state';
import { ActiveEditorCommands } from '../../app/state/activeEditorStore';

/** Word characters for `getFocusedWord` — letters plus the marks that
 * commonly sit inside a single lyric word (apostrophes, hyphens). */
const WORD_RE = /[A-Za-z']+(?:-[A-Za-z']+)*/g;

/** True for a character that can sit inside a word ("don't", "half-light"). */
export function isWordChar(char: string | undefined): boolean {
  return char !== undefined && /[A-Za-z'-]/.test(char);
}

/**
 * The word occupying `offset` within `text`, or `null` if that offset is not in
 * one. The range is inclusive at both ends, so a caret resting immediately
 * *after* a word still counts as being in it — which is what a writer means by
 * "the word I'm typing". Shared by the caret path (`getFocusedWord`) and the
 * double-click path (C-41) so the two can never drift apart on what a word is.
 */
export function findWordAt(text: string, offset: number): string | null {
  WORD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = WORD_RE.exec(text))) {
    if (match.index <= offset && offset <= match.index + match[0].length) {
      return match[0];
    }
  }
  return null;
}

/**
 * The word the selection is "on": a single selected word, or the word under a
 * collapsed caret. `null` for an empty/multi-word selection or a non-text block.
 * Split out from the command surface so the C-41 lookup extension can ask the
 * same question of a bare `EditorState`, without an `Editor` in hand.
 */
export function focusedWordIn(state: EditorState): string | null {
  const { $from, $to, empty } = state.selection;
  if (!$from.parent.isTextblock) return null;

  if (!empty) {
    const trimmed = state.doc.textBetween($from.pos, $to.pos, ' ').trim();
    if (!trimmed || /\s/.test(trimmed)) return null; // multi-word selection
    return trimmed;
  }

  return findWordAt($from.parent.textContent, $from.parentOffset);
}

/**
 * Builds the C-48 command surface (`docs/product/DESIGN_PROPOSAL.md` §13.0)
 * for a live Tiptap editor instance. Kept as a pure function of `editor`
 * rather than inlined in `DraftEditor` so it's unit-testable against a bare
 * `Editor` — see `tests/unit/editor/active-editor-bridge.test.ts` — without
 * mounting any DOM or React tree (jsdom cannot reliably simulate caret
 * placement in a contenteditable via keyboard/mouse events, so exercising
 * this logic through a rendered component is not a reliable test).
 * `DraftEditor` wires this same function into `activeEditorStore` on mount.
 */
export function createActiveEditorCommands(editor: Editor): ActiveEditorCommands {
  return {
    insertAtCaret(text: string): boolean {
      if (editor.isDestroyed) return false;
      const { $from } = editor.state.selection;
      if (!$from.parent.isTextblock) return false;
      // `.chain()...run()` applies every command in the chain to a single
      // transaction and dispatches it once — the insertion (and the
      // `focus()` call alongside it) is one undo step.
      return editor.chain().focus().insertContent(text).run();
    },

    getFocusedWord(): string | null {
      if (editor.isDestroyed) return null;
      return focusedWordIn(editor.state);
    },
  };
}
