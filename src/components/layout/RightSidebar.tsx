import { InventoryPane } from '../../features/inventory/InventoryPane';
import { ToolsPane } from '../../features/tools-pane/ToolsPane';

export function RightSidebar() {
  // TODO: Wire up editor selection to populate search term
  // For now, ToolsPane works with manual entry only
  const getSelectedText = () => null;

  return (
    <aside className="right-sidebar panel" aria-label="Right sidebar">
      <section className="sidebar-section tools-section">
        <ToolsPane getSelectedText={getSelectedText} />
      </section>
      
      <section className="sidebar-section inventory-section">
        <div className="sidebar-section-header">Inventory</div>
        <div className="sidebar-section-body">
          <InventoryPane />
        </div>
      </section>
    </aside>
  );
}
