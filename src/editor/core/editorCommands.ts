import { Editor } from '@tiptap/core';
import { ActiveEditorCommands } from '../../app/state/activeEditorStore';

/** Word characters for `getFocusedWord` — letters plus the marks that
 * commonly sit inside a single lyric word (apostrophes, hyphens). */
const WORD_RE = /[A-Za-z']+(?:-[A-Za-z']+)*/g;

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
      const { selection } = editor.state;
      const { $from, $to, empty } = selection;
      if (!$from.parent.isTextblock) return null;

      if (!empty) {
        const text = editor.state.doc.textBetween($from.pos, $to.pos, ' ');
        const trimmed = text.trim();
        if (!trimmed || /\s/.test(trimmed)) return null; // multi-word selection
        return trimmed;
      }

      const text = $from.parent.textContent;
      const offset = $from.parentOffset;
      WORD_RE.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = WORD_RE.exec(text))) {
        if (match.index <= offset && offset <= match.index + match[0].length) {
          return match[0];
        }
      }
      return null; // caret sits on whitespace/punctuation, not a word
    },
  };
}
