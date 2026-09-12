import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { InventoryPane } from '../../../src/features/inventory/InventoryPane';
import { DraftEditor } from '../../../src/components/editor/DraftEditor';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { useActiveEditorStore } from '../../../src/app/state/activeEditorStore';
import { createActiveEditorCommands } from '../../../src/editor/core/editorCommands';
import { getDraftEditorConfig } from '../../../src/editor/core/draftConfig';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { RichTextDocument } from '../../../src/domain/project/types';

function setUpProject(inventoryLines: string[]) {
  const project = createDefaultProject('Test Song');
  const draft = project.drafts[0];
  draft.id = 'draft_1';
  draft.inventory = {
    type: 'inventory',
    doc: {
      type: 'doc',
      content: inventoryLines.length === 0
        ? [{ type: 'paragraph' }]
        : inventoryLines.map((line) => ({ type: 'paragraph', content: [{ type: 'text', text: line }] })),
    },
  } as never;

  useProjectStore.setState({
    isProjectLoaded: true,
    currentProject: createCyrilFile(project),
    activeView: { type: 'draft', draftId: draft.id },
    error: null,
  });
}

const draftDoc: RichTextDocument = {
  type: 'doc',
  content: [
    { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'nothing ' }] } as never,
  ],
};

/**
 * C-42 / DESIGN_PROPOSAL.md §13.2 — "a chip puts the word in the lyric": the way
 * out of the Inventory, which until now only had a way in.
 */
describe('Inventory chips insert at the caret (C-42)', () => {
  afterEach(() => {
    cleanup();
    // Don't let a live registration leak into the next test.
    if (useActiveEditorStore.getState().hasActiveDraft) {
      useActiveEditorStore.getState().register({ insertAtCaret: () => false, getFocusedWord: () => null })();
    }
  });

  it('T-14.30: clicking a chip inserts its text into the live draft', async () => {
    setUpProject(['bereft']);
    render(<>
      <DraftEditor initialContent={draftDoc} onChange={() => {}} />
      <InventoryPane />
    </>);

    await waitFor(() => expect(useActiveEditorStore.getState().hasActiveDraft).toBe(true));
    const editorEl = document.querySelector('.ProseMirror') as HTMLElement;
    expect(editorEl.textContent).toBe('nothing ');

    fireEvent.click(screen.getByTestId('inventory-chip-insert'));

    await waitFor(() => expect(editorEl.textContent).toContain('bereft'));
  });

  it('T-14.30: with no draft editor mounted, a chip click is a no-op rather than an error', () => {
    setUpProject(['bereft']);
    render(<InventoryPane />);

    expect(useActiveEditorStore.getState().hasActiveDraft).toBe(false);

    const chip = screen.getByTestId('inventory-chip-insert') as HTMLButtonElement;
    // The control tells the truth about being unavailable…
    expect(chip.disabled).toBe(true);
    // …and the underlying command is a safe no-op even if something calls it anyway.
    expect(() => useActiveEditorStore.getState().insertAtCaret('bereft')).not.toThrow();
    expect(useActiveEditorStore.getState().insertAtCaret('bereft')).toBe(false);
  });

  it('T-14.30: every chip inserts its own text', async () => {
    setUpProject(['bereft', 'cleft']);
    render(<>
      <DraftEditor initialContent={draftDoc} onChange={() => {}} />
      <InventoryPane />
    </>);

    await waitFor(() => expect(useActiveEditorStore.getState().hasActiveDraft).toBe(true));
    const editorEl = document.querySelector('.ProseMirror') as HTMLElement;

    fireEvent.click(screen.getAllByTestId('inventory-chip-insert')[1]);

    await waitFor(() => expect(editorEl.textContent).toContain('cleft'));
    expect(editorEl.textContent).not.toContain('bereft');
  });

  it('T-14.30: removing a chip still works — the insert control did not swallow the remove', async () => {
    setUpProject(['bereft']);
    render(<InventoryPane />);

    fireEvent.click(screen.getByTestId('inventory-chip-remove'));

    await waitFor(() => expect(screen.queryByTestId('inventory-chip')).toBeNull());
  });
});

/**
 * The caret-exact half. jsdom cannot place a caret in a contenteditable through
 * simulated events, so — exactly as C-48's own tests do — this drives the same
 * command the chip calls, against a bare `Editor` where the selection can be set
 * precisely.
 */
describe('Inventory chip insertion is caret-exact and atomic (C-42)', () => {
  let editor: Editor;

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

  it('T-14.30: the text lands at the caret and the caret ends up after it', () => {
    editor = editorWith('nothing  to lose');
    const unregister = useActiveEditorStore.getState().register(createActiveEditorCommands(editor));

    // Caret in the gap after "nothing " (line starts at doc position 1).
    editor.commands.setTextSelection(1 + 8);
    expect(useActiveEditorStore.getState().insertAtCaret('left')).toBe(true);

    expect(editor.getText()).toBe('nothing left to lose');
    // "nothing " is 8 characters, "left" 4 → the caret sits at offset 12.
    expect(editor.state.selection.from).toBe(1 + 12);
    expect(editor.state.selection.empty).toBe(true);

    unregister();
  });

  it('T-14.31: the insertion is a single undo step', () => {
    editor = editorWith('nothing  to lose');
    const unregister = useActiveEditorStore.getState().register(createActiveEditorCommands(editor));

    editor.commands.setTextSelection(1 + 8);
    useActiveEditorStore.getState().insertAtCaret('left');
    expect(editor.getText()).toBe('nothing left to lose');

    // One undo, not four — a multi-character insert must not unwind letter by letter.
    editor.commands.undo();
    expect(editor.getText()).toBe('nothing  to lose');

    unregister();
  });

  it('T-14.31: a multi-word fragment also undoes in one step', () => {
    editor = editorWith('');
    const unregister = useActiveEditorStore.getState().register(createActiveEditorCommands(editor));

    useActiveEditorStore.getState().insertAtCaret('nothing left to lose');
    expect(editor.getText()).toBe('nothing left to lose');

    editor.commands.undo();
    expect(editor.getText()).toBe('');

    unregister();
  });
});
