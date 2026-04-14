import { useMemo } from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { RichTextDocument } from '../../domain/project/types';

/**
 * Inventory Pane - Draft-specific scratchpad for spare lines, rhymes, and fragments.
 * 
 * For v1, this uses a simple textarea for rich text entry.
 * The content is stored as plain text in a RichTextDocument structure.
 */
export function InventoryPane() {
  const { currentProject, activeView, updateDraftInventory } = useProjectStore();

  // Get the active draft's inventory
  const inventory = useMemo(() => {
    if (!currentProject || activeView.type !== 'draft') return null;
    
    const draft = currentProject.project.drafts.find(d => d.id === activeView.draftId);
    if (!draft) return null;
    
    return draft.inventory;
  }, [currentProject, activeView]);

  // Get the active draft ID for updates
  const activeDraftId = useMemo(() => {
    if (activeView.type === 'draft') return activeView.draftId;
    return null;
  }, [activeView]);

  // Convert inventory doc to plain text for textarea
  const textValue = useMemo(() => {
    if (!inventory || !inventory.doc || !inventory.doc.content) return '';
    
    // Extract text from the RichTextDocument
    // For v1, we flatten the content to simple text
    return inventory.doc.content
      .map(node => {
        if (node.type === 'paragraph') {
          // Extract text from paragraph content
          if (node.content) {
            return node.content
              .map(child => child.text || '')
              .join('');
          }
          return '';
        }
        return '';
      })
      .join('\n');
  }, [inventory]);

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeDraftId) return;

    const newText = e.target.value;
    
    // Convert plain text to RichTextDocument
    const lines = newText.split('\n');
    const content = lines.map(line => ({
      type: 'paragraph',
      content: line ? [{ type: 'text', text: line }] : []
    }));

    const newInventoryDoc: RichTextDocument = {
      type: 'doc',
      content
    };

    updateDraftInventory(activeDraftId, newInventoryDoc);
  };

  // If no project or no active draft, show a placeholder
  if (!currentProject || !activeDraftId || !inventory) {
    return (
      <div className="inventory-pane" data-testid="inventory-pane">
        <div className="inventory-placeholder">
          Open a project to view draft inventory
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-pane" data-testid="inventory-pane">
      <textarea
        className="inventory-textarea"
        data-testid="inventory-textarea"
        value={textValue}
        onChange={handleChange}
        placeholder="Spare lines, rhymes, and useful fragments..."
        spellCheck={false}
      />
    </div>
  );
}
