/**
 * C-48 — the editor command bridge.
 *
 * `docs/product/DESIGN_PROPOSAL.md` §13.0: the Tiptap editor is created inside
 * `DraftEditor.tsx` with `useEditor(...)` and never leaves that component —
 * there is no context, no store, no ref, so nothing outside can read or write
 * the caret. This is the narrow bridge that lets the lookup-and-collect loop
 * (§13.1/§13.2, a different lane's work) reach it, following the existing
 * `lineMenuStore` / `sectionMenuStore` pattern.
 *
 * The critical design constraint: **expose commands, not the editor.** A
 * Tiptap `Editor` mutates on every keystroke; putting it (or anything that
 * changes that often) into reactive React/zustand state would force a
 * re-render of every subscriber on every keystroke. So the live command
 * surface is held in a plain module-level variable, mutated directly by
 * `register`/the returned unregister function — never via zustand's `set`.
 * The only thing zustand tracks reactively is `hasActiveDraft`, and that only
 * flips on mount/unmount/registration-swap, never on typing.
 */
import { create } from 'zustand';

/**
 * The narrow surface a registered draft editor exposes. Every command is a
 * safe no-op (`false`/`null`) when there is no active draft, the editor has
 * been unmounted, or the current selection isn't inside a text block —
 * callers must never see a throw.
 */
export interface ActiveEditorCommands {
  /** Insert text at the caret as one undo step. `false` when there is no caret to insert at. */
  insertAtCaret(text: string): boolean;
  /** The word under the caret, or the selected word. `null` for no draft, whitespace/punctuation, or a multi-word selection. */
  getFocusedWord(): string | null;
}

const NOOP_COMMANDS: ActiveEditorCommands = {
  insertAtCaret: () => false,
  getFocusedWord: () => null,
};

// Not part of the zustand store on purpose — see the module doc comment.
let activeCommands: ActiveEditorCommands | null = null;

interface ActiveEditorStore {
  /**
   * Whether a draft editor is currently registered. Reactive, but only
   * changes on register/unregister — never on a keystroke — so subscribing
   * to it does not cause per-keystroke re-renders.
   */
  hasActiveDraft: boolean;
  /**
   * Register a draft editor's command surface. Only the *draft* editor
   * should ever call this (never the workspace `RichTextEditor` — otherwise
   * a chip click could insert into the Brief while the writer thinks they
   * are editing a lyric). Returns an unregister function; call it on
   * unmount. Safe to call the returned function more than once, and safe to
   * call it after a *newer* registration has already replaced this one (it
   * only clears the store if it is still the active registration) — this
   * guards a stale cleanup (e.g. React StrictMode's double-invoke, or a
   * teardown that races a new mount) from clobbering a fresher registration.
   */
  register(commands: ActiveEditorCommands): () => void;
  /** Insert text at the caret of the active draft. `false` with no active draft. */
  insertAtCaret(text: string): boolean;
  /** The focused word in the active draft. `null` with no active draft. */
  getFocusedWord(): string | null;
}

export const useActiveEditorStore = create<ActiveEditorStore>((set) => ({
  hasActiveDraft: false,

  register(commands) {
    activeCommands = commands;
    set({ hasActiveDraft: true });

    let cleared = false;
    return () => {
      if (cleared) return;
      cleared = true;
      if (activeCommands !== commands) return; // a newer registration already took over
      activeCommands = null;
      set({ hasActiveDraft: false });
    };
  },

  insertAtCaret(text) {
    return (activeCommands ?? NOOP_COMMANDS).insertAtCaret(text);
  },

  getFocusedWord() {
    return (activeCommands ?? NOOP_COMMANDS).getFocusedWord();
  },
}));
