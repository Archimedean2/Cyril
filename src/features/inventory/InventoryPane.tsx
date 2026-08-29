import { useMemo, useState } from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { inventoryDocToItems, itemsToInventoryDoc } from './inventoryDoc';
import { extractDraftPlainText, tokenizeWords, isPhraseUsedInDraft } from '../../domain/tools/draftWordUsage';

/**
 * Inventory Pane - Draft-specific collected-words surface for spare lines, rhymes,
 * and fragments.
 *
 * Storage is unchanged: the inventory is still a `RichTextDocument` (one paragraph per
 * line) inside the `.cyril` file. This pane just renders each non-empty line as a
 * removable chip and offers an input to add new ones, instead of a raw textarea.
 */
export function InventoryPane() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeView = useProjectStore((s) => s.activeView);
  const updateDraftInventory = useProjectStore((s) => s.updateDraftInventory);

  const [newItemText, setNewItemText] = useState('');

  // Get the active draft's inventory
  const inventory = useMemo(() => {
    if (!currentProject || activeView.type !== 'draft') return null;

    const draft = currentProject.project.drafts.find(d => d.id === activeView.draftId);
    if (!draft) return null;

    return draft.inventory;
  }, [currentProject, activeView]);

  // C-44 / DESIGN_PROPOSAL.md §13.4: "used" is DERIVED from the live draft doc on
  // every render — never stored — so a chip un-dims the moment its word leaves the
  // draft, with no stale flag to clean up. Recomputed whenever the draft doc changes
  // (every keystroke updates the store — see DraftView's onChange -> updateDraftDoc).
  const draftWords = useMemo(() => {
    if (!currentProject || activeView.type !== 'draft') return [];
    const draft = currentProject.project.drafts.find(d => d.id === activeView.draftId);
    if (!draft) return [];
    return tokenizeWords(extractDraftPlainText(draft.doc));
  }, [currentProject, activeView]);

  // Get the active draft ID for updates
  const activeDraftId = useMemo(() => {
    if (activeView.type === 'draft') return activeView.draftId;
    return null;
  }, [activeView]);

  const items = useMemo(() => inventoryDocToItems(inventory?.doc), [inventory]);

  const commitItems = (nextItems: string[]) => {
    if (!activeDraftId) return;
    updateDraftInventory(activeDraftId, itemsToInventoryDoc(nextItems));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;

    commitItems([...items, trimmed]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    commitItems(items.filter((_, i) => i !== index));
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
      <div className="inventory-chips" data-testid="inventory-chips">
        {items.length === 0 ? (
          <p className="inventory-empty-state" data-testid="inventory-empty-state">
            Collect words, rhymes, and fragments as you write.
          </p>
        ) : (
          items.map((item, index) => {
            const isUsed = isPhraseUsedInDraft(item, draftWords);
            return (
            <span
              className={`inventory-chip${isUsed ? ' inventory-chip-used' : ''}`}
              data-testid="inventory-chip"
              key={`${item}-${index}`}
              title={isUsed ? `"${item}" is already in the draft` : undefined}
            >
              <span className="inventory-chip-text">{item}</span>
              <button
                type="button"
                className="inventory-chip-remove"
                data-testid="inventory-chip-remove"
                aria-label={`Remove "${item}" from inventory`}
                title="Remove"
                onClick={() => handleRemoveItem(index)}
              >
                ×
              </button>
            </span>
            );
          })
        )}
      </div>

      <form className="inventory-add-form" onSubmit={handleAddItem}>
        <input
          type="text"
          className="inventory-add-input"
          data-testid="inventory-add-input"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add a line, rhyme, or fragment…"
          aria-label="Add an inventory item"
        />
        <button
          type="submit"
          className="inventory-add-button"
          data-testid="inventory-add-button"
          disabled={!newItemText.trim()}
        >
          Add
        </button>
      </form>
    </div>
  );
}
