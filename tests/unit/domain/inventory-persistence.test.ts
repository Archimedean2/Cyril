import { describe, test, expect } from 'vitest';
import { createDefaultProject } from '../../../src/domain/project/defaults';
import { createDraft } from '../../../src/domain/project/drafts';
import { Draft } from '../../../src/domain/project/types';

describe('Inventory Persistence', () => {
  test('T-5.01: Inventory persists as draft-specific data', () => {
    const project = createDefaultProject('Test Song');
    
    // Each draft should have its own inventory
    expect(project.drafts.length).toBeGreaterThan(0);
    
    project.drafts.forEach(draft => {
      expect(draft.inventory).toBeDefined();
      expect(draft.inventory.type).toBe('inventory');
      expect(draft.inventory.doc).toBeDefined();
      expect(draft.inventory.doc.type).toBe('doc');
    });
  });

  test('T-5.02: Inventory duplication follows selected draft creation mode', () => {
    // Create a source draft with custom inventory
    const sourceDraft: Draft = {
      id: 'draft_source',
      name: 'Source Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: 'lyrics',
      doc: { type: 'doc', content: [] },
      inventory: {
        type: 'inventory',
        doc: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Spare line 1' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Spare line 2' }] }
          ]
        }
      },
      draftSettings: {
        showChords: false,
        showSectionLabels: true,
        showSpeakerLabels: true,
        showStageDirections: true,
        showSummaries: true,
        showSyllableCounts: false
      }
    };

    // Test duplicating text only - inventory should be blank
    const textOnlyDuplicate = createDraft('Text Only', sourceDraft, 'text');
    expect(textOnlyDuplicate.inventory.doc.content).toEqual([{ type: 'paragraph' }]);

    // Test duplicating inventory only - inventory should be copied
    const inventoryOnlyDuplicate = createDraft('Inventory Only', sourceDraft, 'inventory');
    expect(inventoryOnlyDuplicate.inventory.doc.content).toEqual(sourceDraft.inventory.doc.content);

    // Test duplicating both - inventory should be copied
    const bothDuplicate = createDraft('Both', sourceDraft, 'both');
    expect(bothDuplicate.inventory.doc.content).toEqual(sourceDraft.inventory.doc.content);

    // Test blank creation - inventory should be blank
    const blankDraft = createDraft('Blank', sourceDraft, 'blank');
    expect(blankDraft.inventory.doc.content).toEqual([{ type: 'paragraph' }]);
  });
});
