import { InventoryPane } from '../../features/inventory/InventoryPane';

export function RightSidebar() {
  return (
    <aside className="right-sidebar panel" aria-label="Right sidebar">
      <section className="sidebar-section">
        <div className="sidebar-section-header">Tools</div>
        <div className="sidebar-section-body">
          <div>
            Rhyme, Dictionary, Thesaurus will go here...
          </div>
        </div>
      </section>
      
      <section className="sidebar-section">
        <div className="sidebar-section-header">Inventory</div>
        <div className="sidebar-section-body">
          <InventoryPane />
        </div>
      </section>
    </aside>
  );
}
