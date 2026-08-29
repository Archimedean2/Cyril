import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { InventoryPane } from '../../../src/features/inventory/InventoryPane';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { DraftDocument } from '../../../src/domain/project/types';

/**
 * C-44 / DESIGN_PROPOSAL.md §13.4: an Inventory chip whose text appears in the active
 * draft renders "used" — dimmed/ticked — and returns to normal the moment the word
 * leaves the draft. The state must be DERIVED from the live draft doc on every render,
 * never stored on the chip/inventory item itself.
 */

function lyricLineDoc(text: string): DraftDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'lyricLine',
        attrs: { id: 'l1', rhymeGroup: null, lineType: 'lyric' },
        meta: { alternates: [], prosody: null, chords: [] },
        content: text ? [{ type: 'text', text }] : [],
      } as any,
    ],
  };
}

function setUpProject(inventoryLines: string[], draftText: string) {
  const project = createDefaultProject('Test Song');
  const draft = project.drafts[0];
  draft.id = 'draft_1';
  draft.doc = lyricLineDoc(draftText);
  draft.inventory = {
    type: 'inventory',
    doc: {
      type: 'doc',
      content: inventoryLines.length === 0
        ? [{ type: 'paragraph' }]
        : inventoryLines.map((line) => ({ type: 'paragraph', content: [{ type: 'text', text: line }] })),
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

describe('Inventory "used" state (C-44)', () => {
  beforeEach(() => cleanup());
  afterEach(() => cleanup());

  it('T-14.21: a chip whose word appears in the active draft renders in a used state', () => {
    setUpProject(['moonlight'], 'the moonlight fades away');
    render(<InventoryPane />);

    const chip = screen.getByTestId('inventory-chip');
    expect(chip.className).toMatch(/inventory-chip-used/);
  });

  it('T-14.21: a chip whose word does NOT appear in the draft is not marked used', () => {
    setUpProject(['starlight'], 'the moonlight fades away');
    render(<InventoryPane />);

    const chip = screen.getByTestId('inventory-chip');
    expect(chip.className).not.toMatch(/inventory-chip-used/);
  });

  it('T-14.21: "low" is not used merely because the draft contains "below" (whole-word match only)', () => {
    setUpProject(['low'], 'the stars are below the moon');
    render(<InventoryPane />);

    const chip = screen.getByTestId('inventory-chip');
    expect(chip.className).not.toMatch(/inventory-chip-used/);
  });

  it('T-14.21: is case-insensitive and punctuation-insensitive', () => {
    setUpProject(['Moonlight'], 'oh, moonlight! so bright.');
    render(<InventoryPane />);

    const chip = screen.getByTestId('inventory-chip');
    expect(chip.className).toMatch(/inventory-chip-used/);
  });

  it('T-14.21: the used state is derived — removing the word from the draft un-dims the chip', () => {
    const draftId = setUpProject(['moonlight'], 'the moonlight fades away');
    const { rerender } = render(<InventoryPane />);

    expect(screen.getByTestId('inventory-chip').className).toMatch(/inventory-chip-used/);

    // Edit the draft — as a keystroke would via updateDraftDoc — removing the word.
    act(() => {
      useProjectStore.getState().updateDraftDoc(draftId, lyricLineDoc('the sun rises high'));
    });

    rerender(<InventoryPane />);

    expect(screen.getByTestId('inventory-chip').className).not.toMatch(/inventory-chip-used/);
  });
});
