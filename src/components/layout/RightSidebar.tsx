import * as React from 'react';
import { InventoryPane } from '../../features/inventory/InventoryPane';
import { ToolsPane } from '../../features/tools-pane/ToolsPane';
import { Search, BookMarked } from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

const styles: Record<string, React.CSSProperties> = {
  toolsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    padding: '10px var(--space-3)',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-panel)',
    flexShrink: 0,
  },
  headerIcon: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  headerText: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  toolsBody: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
};

export function RightSidebar() {
  // TODO: Wire up editor selection to populate search term
  // For now, ToolsPane works with manual entry only
  const getSelectedText = () => null;

  return (
    <>
      {/* Tools Section */}
      <section className="sidebar-section tools-section">
        <div style={styles.toolsHeader}>
          <span style={styles.headerIcon}>
            <Search size={14} />
          </span>
          <span style={styles.headerText}>Tools</span>
        </div>
        <div style={styles.toolsBody}>
          <ErrorBoundary paneName="tools pane">
            <ToolsPane getSelectedText={getSelectedText} />
          </ErrorBoundary>
        </div>
      </section>

      {/* Inventory Section */}
      <section className="sidebar-section inventory-section">
        <div style={styles.toolsHeader}>
          <span style={styles.headerIcon}>
            <BookMarked size={14} />
          </span>
          <span style={styles.headerText}>Inventory</span>
        </div>
        <div className="sidebar-section-body">
          <ErrorBoundary paneName="inventory pane">
            <InventoryPane />
          </ErrorBoundary>
        </div>
      </section>
    </>
  );
}
