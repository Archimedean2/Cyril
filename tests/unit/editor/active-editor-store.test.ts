import { describe, test, expect, afterEach } from 'vitest';
import { useActiveEditorStore, ActiveEditorCommands } from '../../../src/app/state/activeEditorStore';

/**
 * C-48 — the editor command bridge (`docs/product/DESIGN_PROPOSAL.md` §13.0).
 * Pure store-level semantics: registration lifecycle, safe no-ops, and the
 * "does not re-render on every keystroke" property. `DraftEditor`'s actual
 * wiring (a real Tiptap editor registering itself) is covered separately in
 * `tests/integration/editor/active-editor-bridge-integration.test.tsx`.
 */
describe('C-48: activeEditorStore', () => {
  afterEach(() => {
    // Leave no registration behind for the next test.
    const state = useActiveEditorStore.getState();
    if (state.hasActiveDraft) {
      // Force-clear via a throwaway register/unregister round-trip.
      state.register({ insertAtCaret: () => false, getFocusedWord: () => null })();
    }
  });

  test('T-4.39: with no draft registered, every command is a safe no-op returning false/null', () => {
    const store = useActiveEditorStore.getState();
    expect(store.hasActiveDraft).toBe(false);
    expect(() => store.insertAtCaret('word')).not.toThrow();
    expect(store.insertAtCaret('word')).toBe(false);
    expect(store.getFocusedWord()).toBeNull();
  });

  test('T-4.40: insertAtCaret/getFocusedWord delegate to the registered commands while active', () => {
    const calls: string[] = [];
    const commands: ActiveEditorCommands = {
      insertAtCaret: (text) => {
        calls.push(`insert:${text}`);
        return true;
      },
      getFocusedWord: () => {
        calls.push('getFocusedWord');
        return 'left';
      },
    };

    const unregister = useActiveEditorStore.getState().register(commands);
    expect(useActiveEditorStore.getState().hasActiveDraft).toBe(true);
    expect(useActiveEditorStore.getState().insertAtCaret('hello')).toBe(true);
    expect(useActiveEditorStore.getState().getFocusedWord()).toBe('left');
    expect(calls).toEqual(['insert:hello', 'getFocusedWord']);

    unregister();
  });

  test('T-4.41: unregistering clears the registration; a later call is a safe no-op', () => {
    const commands: ActiveEditorCommands = {
      insertAtCaret: () => true,
      getFocusedWord: () => 'word',
    };
    const unregister = useActiveEditorStore.getState().register(commands);
    expect(useActiveEditorStore.getState().insertAtCaret('x')).toBe(true);

    unregister();

    expect(useActiveEditorStore.getState().hasActiveDraft).toBe(false);
    expect(useActiveEditorStore.getState().insertAtCaret('x')).toBe(false);
    expect(useActiveEditorStore.getState().getFocusedWord()).toBeNull();

    // Calling the same unregister function again must not throw or affect
    // a (nonexistent) newer registration.
    expect(() => unregister()).not.toThrow();
  });

  test('T-4.42: switching drafts re-registers; an insert lands in the newly-active draft, never the old one', () => {
    const oldCalls: string[] = [];
    const newCalls: string[] = [];
    const oldDraft: ActiveEditorCommands = {
      insertAtCaret: (t) => { oldCalls.push(t); return true; },
      getFocusedWord: () => null,
    };
    const newDraft: ActiveEditorCommands = {
      insertAtCaret: (t) => { newCalls.push(t); return true; },
      getFocusedWord: () => null,
    };

    const unregisterOld = useActiveEditorStore.getState().register(oldDraft);
    // The old draft unmounts only *after* the new one has already mounted and
    // registered — the realistic ordering for a fast draft switch, and the
    // one the "still active?" guard in `register`'s returned closure exists
    // for.
    const unregisterNew = useActiveEditorStore.getState().register(newDraft);
    unregisterOld();

    useActiveEditorStore.getState().insertAtCaret('hello');

    expect(newCalls).toEqual(['hello']);
    expect(oldCalls).toEqual([]);
    // The store must still report an active draft — the old unmount's
    // cleanup must not have clobbered the newer registration.
    expect(useActiveEditorStore.getState().hasActiveDraft).toBe(true);

    unregisterNew();
    expect(useActiveEditorStore.getState().hasActiveDraft).toBe(false);
  });

  test('T-4.43: subscribing to the store does not re-render on every keystroke-equivalent call', () => {
    let renderCount = 0;
    // Simulate a component's `useActiveEditorStore(s => s.hasActiveDraft)`
    // subscription without mounting React: subscribe directly and count how
    // many times the selected slice actually changes.
    let lastSeen = useActiveEditorStore.getState().hasActiveDraft;
    const unsubscribe = useActiveEditorStore.subscribe((state) => {
      if (state.hasActiveDraft !== lastSeen) {
        lastSeen = state.hasActiveDraft;
        renderCount++;
      }
    });

    const commands: ActiveEditorCommands = { insertAtCaret: () => true, getFocusedWord: () => null };
    const unregister = useActiveEditorStore.getState().register(commands);
    expect(renderCount).toBe(1); // false -> true, one transition

    // "Typing" — many calls to the command surface, none of which touch
    // zustand state at all.
    for (let i = 0; i < 50; i++) {
      useActiveEditorStore.getState().insertAtCaret('a');
      useActiveEditorStore.getState().getFocusedWord();
    }
    expect(renderCount).toBe(1); // unchanged — no re-render caused by "keystrokes"

    unregister();
    expect(renderCount).toBe(2); // true -> false, the second (and last) transition

    unsubscribe();
  });
});
