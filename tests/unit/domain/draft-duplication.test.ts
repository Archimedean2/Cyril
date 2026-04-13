import { describe, it, expect } from 'vitest';
import { createDraft } from '../../../src/domain/project/drafts';

describe('Draft Duplication', () => {
  it('T-3.01: Draft duplication creates new draft IDs', () => {
    const draft = createDraft('Original Draft');
    expect(draft.id).toBeDefined();

    const duplicated = createDraft('Duplicated Draft', draft, 'blank');
    expect(duplicated.id).toBeDefined();
    expect(duplicated.id).not.toBe(draft.id);
    expect(duplicated.name).toBe('Duplicated Draft');
  });

  // Test placeholder for T-3.02.
  // In Stage 3, doc content is just rich text, so there are no nested IDs to regenerate yet.
  // We'll update this test in Stage 4 when Section Blocks and Metadata tags are added.
  it('T-3.02: Draft duplication regenerates nested entity IDs where required', () => {
    const draft = createDraft('Original Draft');
    const duplicated = createDraft('Duplicated Draft', draft, 'text');
    
    expect(duplicated.doc).toBeDefined();
    // For now, just verifying the doc content was copied
    expect(duplicated.doc).toEqual(draft.doc);
  });
  
  it('creates a blank draft by default', () => {
    const draft = createDraft('Blank Draft');
    
    expect(draft.name).toBe('Blank Draft');
    expect(draft.doc.content.length).toBe(1);
    expect(draft.doc.content[0].type).toBe('paragraph');
    expect(draft.inventory.doc.content.length).toBe(1);
  });

  it('duplicates text only', () => {
    const source = createDraft('Source');
    source.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello lyrics' }] }] as any;
    source.inventory.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello inventory' }] }] as any;

    const duplicated = createDraft('Dup', source, 'text');
    
    expect(duplicated.doc.content).toEqual(source.doc.content);
    // Inventory should be blank
    expect(duplicated.inventory.doc.content).toEqual([{ type: 'paragraph' }]);
  });

  it('duplicates inventory only', () => {
    const source = createDraft('Source');
    source.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello lyrics' }] }] as any;
    source.inventory.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello inventory' }] }] as any;

    const duplicated = createDraft('Dup', source, 'inventory');
    
    // Text should be blank
    expect(duplicated.doc.content).toEqual([{ type: 'paragraph' }]);
    expect(duplicated.inventory.doc.content).toEqual(source.inventory.doc.content);
  });

  it('duplicates both text and inventory', () => {
    const source = createDraft('Source');
    source.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello lyrics' }] }] as any;
    source.inventory.doc.content = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello inventory' }] }] as any;

    const duplicated = createDraft('Dup', source, 'both');
    
    expect(duplicated.doc.content).toEqual(source.doc.content);
    expect(duplicated.inventory.doc.content).toEqual(source.inventory.doc.content);
  });
});
