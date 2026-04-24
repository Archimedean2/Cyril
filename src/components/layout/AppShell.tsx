import { useState, useEffect } from 'react';
import { LeftNav } from './LeftNav';
import { CenterPane } from './CenterPane';
import { RightSidebar } from './RightSidebar';
import { TopBar } from './TopBar';
import { ExportDialog } from '../../features/export-panel/ExportDialog';
import { ShareImportDialog } from '../../features/share/ShareImportDialog';
import { EmptyState } from './EmptyState';
import { useProjectStore } from '../../app/state/projectStore';
import { useResizable } from '../../hooks/useResizable';

export function AppShell() {
  const isProjectLoaded = useProjectStore((state) => state.isProjectLoaded);
  const isInitializing = useProjectStore((state) => state.isInitializing);
  const initApp = useProjectStore((state) => state.initApp);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareImportOpen, setIsShareImportOpen] = useState(false);
  const importShare = useProjectStore((state) => state.importShare);

  const leftNav = useResizable({
    initialWidth: 240,
    minWidth: 160,
    maxWidth: 9999,
    storageKey: 'cyril:left-nav-width',
  });

  const rightSidebar = useResizable({
    initialWidth: 320,
    minWidth: 200,
    maxWidth: 9999,
    storageKey: 'cyril:right-sidebar-width',
    direction: 'left',
  });

  useEffect(() => {
    if (isInitializing && !isProjectLoaded) {
      initApp();
    }
  }, [isInitializing, isProjectLoaded, initApp]);

  if (!isProjectLoaded && !isInitializing) {
    return (
      <div style={{ height: '100vh', background: 'var(--bg-app, #f5f6f8)' }}>
        <EmptyState onImportShare={() => setIsShareImportOpen(true)} />
        <ShareImportDialog
          isOpen={isShareImportOpen}
          onClose={() => setIsShareImportOpen(false)}
          onImport={(blob) => importShare(blob)}
        />
      </div>
    );
  }

  if (!isProjectLoaded) {
    return (
      <div className="app-shell-loading" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-app, #f5f6f8)',
      }}>
        <span style={{ color: 'var(--text-muted, #738093)', fontSize: '14px' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell-topbar">
        <TopBar onExportClick={() => setIsExportDialogOpen(true)} />
      </div>

      <div className="app-shell-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left Navigation */}
        <nav
          className="left-nav panel"
          style={leftNav.style}
          aria-label="Left navigation"
        >
          <LeftNav onImportShare={() => setIsShareImportOpen(true)} />
        </nav>

        {/* Resize Handle - Left */}
        <div
          className={`resize-handle ${leftNav.isResizing ? 'resizing' : ''}`}
          onMouseDown={leftNav.startResizing}
          title="Drag to resize"
        />

        {/* Center Pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <CenterPane />
        </div>

        {/* Resize Handle - Right */}
        <div
          className={`resize-handle ${rightSidebar.isResizing ? 'resizing' : ''}`}
          onMouseDown={rightSidebar.startResizing}
          title="Drag to resize"
        />

        {/* Right Sidebar */}
        <aside
          className="right-sidebar panel"
          style={rightSidebar.style}
          aria-label="Right sidebar"
        >
          <RightSidebar />
        </aside>
      </div>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
      <ShareImportDialog
        isOpen={isShareImportOpen}
        onClose={() => setIsShareImportOpen(false)}
        onImport={(blob) => importShare(blob)}
      />
    </div>
  );
}
