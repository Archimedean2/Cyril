import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { InventoryPane } from '../../../src/features/inventory/InventoryPane';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

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
        : inventoryLines.map((line) => ({
            type: 'paragraph',
            content: line ? [{ type: 'text', text: line }] : [],
          })),
    },
  };

  useProjectStore.setState({
    isProjectLoaded: true,
    currentProject: createCyrilFile(project),
    activeView: { type: 'draft', draftId: draft.id },
    error: null,
  });

  return draft.id;
}

describe('Inventory chips (C-11)', () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it('T-14.09: no native textarea/resize grabber; collected items render as chips', () => {
    setUpProject(['Moonlight', 'Sunlight']);
    render(<InventoryPane />);

    // No native textarea (and therefore no browser resize grabber)
    expect(screen.queryByTestId('inventory-textarea')).not.toBeInTheDocument();
    expect(document.querySelector('textarea')).toBeNull();

    const chips = screen.getAllByTestId('inventory-chip');
    expect(chips).toHaveLength(2);
    expect(within(chips[0]).getByText('Moonlight')).toBeInTheDocument();
    expect(within(chips[1]).getByText('Sunlight')).toBeInTheDocument();
  });

  it('T-14.10: adding an item via the add-input persists it to the draft inventory', () => {
    const draftId = setUpProject(['Moonlight']);
    render(<InventoryPane />);

    const input = screen.getByTestId('inventory-add-input');
    fireEvent.change(input, { target: { value: 'Starlight' } });
    fireEvent.submit(input.closest('form')!);

    // New chip appears in the UI
    expect(screen.getAllByTestId('inventory-chip')).toHaveLength(2);
    expect(screen.getByText('Starlight')).toBeInTheDocument();

    // And it round-trips through the store's persisted inventory doc
    const draft = useProjectStore.getState()
      .currentProject!.project.drafts.find((d) => d.id === draftId)!;
    const texts = draft.inventory.doc.content.map((n) =>
      (n.content ?? []).map((c) => c.text ?? '').join('')
    );
    expect(texts).toEqual(['Moonlight', 'Starlight']);

    // The add-input clears after a successful add
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('T-14.10: the add-input ignores blank/whitespace-only submissions', () => {
    setUpProject(['Moonlight']);
    render(<InventoryPane />);

    const input = screen.getByTestId('inventory-add-input');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getAllByTestId('inventory-chip')).toHaveLength(1);
  });

  it('T-14.11: removing a chip persists the removal to the draft inventory', () => {
    const draftId = setUpProject(['Moonlight', 'Sunlight']);
    render(<InventoryPane />);

    const removeButtons = screen.getAllByTestId('inventory-chip-remove');
    fireEvent.click(removeButtons[0]);

    expect(screen.queryByText('Moonlight')).not.toBeInTheDocument();
    expect(screen.getByText('Sunlight')).toBeInTheDocument();

    const draft = useProjectStore.getState()
      .currentProject!.project.drafts.find((d) => d.id === draftId)!;
    const texts = draft.inventory.doc.content.map((n) =>
      (n.content ?? []).map((c) => c.text ?? '').join('')
    );
    expect(texts).toEqual(['Sunlight']);
  });

  it('T-14.12: an empty inventory shows an inviting, sentence-case, verb-first empty state', () => {
    setUpProject([]);
    render(<InventoryPane />);

    expect(screen.queryByTestId('inventory-chip')).not.toBeInTheDocument();

    const emptyState = screen.getByTestId('inventory-empty-state');
    const text = emptyState.textContent ?? '';

    // Sentence case: starts with a capital letter, not all-caps / not a checklist label.
    expect(text.length).toBeGreaterThan(0);
    const firstWord = text.trim().split(/\s+/)[0];
    expect(firstWord[0]).toBe(firstWord[0].toUpperCase());
    expect(firstWord).not.toBe(firstWord.toUpperCase()); // not e.g. "INVENTORY"

    // Verb-first: the opening word is an action verb, not a noun like "Inventory" or "No items".
    expect(/^(Collect|Gather|Save|Add|Jot)/i.test(text.trim())).toBe(true);
  });

  it('T-14.13: existing multi-line legacy inventory text loads with its content intact as chips', () => {
    const lines = ['Spare line 1', 'Spare line 2', 'Rhyme: time, rhyme, sublime'];
    setUpProject(lines);
    render(<InventoryPane />);

    const chips = screen.getAllByTestId('inventory-chip');
    expect(chips).toHaveLength(lines.length);
    for (const line of lines) {
      expect(screen.getByText(line)).toBeInTheDocument();
    }
  });
});
