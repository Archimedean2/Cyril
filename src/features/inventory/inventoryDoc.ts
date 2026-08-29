import { RichTextDocument } from '../../domain/project/types';

/**
 * Inventory documents are stored as a `RichTextDocument` — one `paragraph` node per
 * line, exactly like before the chip UI existed. These helpers convert between that
 * storage shape and a flat list of "collected items" (one per non-empty line), so the
 * data model never changes: an existing project's inventory loads and saves through
 * the same shape, we just render it as chips instead of a raw textarea.
 */

/** Extract non-empty, trimmed lines from an inventory doc as chip items. */
export function inventoryDocToItems(doc: RichTextDocument | null | undefined): string[] {
  if (!doc || !doc.content) return [];

  return doc.content
    .map((node) => {
      if (node.type !== 'paragraph' || !node.content) return '';
      return node.content.map((child) => child.text || '').join('');
    })
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Build an inventory doc (one paragraph per item) from a list of chip items. */
export function itemsToInventoryDoc(items: string[]): RichTextDocument {
  if (items.length === 0) {
    return { type: 'doc', content: [{ type: 'paragraph' }] };
  }

  return {
    type: 'doc',
    content: items.map((item) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: item }],
    })),
  };
}
