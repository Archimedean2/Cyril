import { useState, useEffect, useCallback } from 'react';
import { LeftNav } from './LeftNav';
import { CenterPane } from './CenterPane';
import { RightSidebar } from './RightSidebar';
import { TopBar } from './TopBar';
import { ErrorBoundary } from './ErrorBoundary';
import { CommandMenu } from './CommandMenu';
import { ExportDialog } from '../../features/export-panel/ExportDialog';
import { ShareImportDialog } from '../../features/share/ShareImportDialog';
import { EmptyState } from './EmptyState';
import { useProjectStore } from '../../app/state/projectStore';
import { useResizable } from '../../hooks/useResizable';
import { startAutosave } from '../../persistence/autosave';
import { useSaveStatusStore } from '../../app/state/saveStatusStore';

export function AppShell() {
  const isProjectLoaded = useProjectStore((state) => state.isProjectLoaded);
  const isInitializing = useProjectStore((state) => state.isInitializing);
  const initApp = useProjectStore((state) => state.initApp);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareImportOpen, setIsShareImportOpen] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
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

  useEffect(() => {
    return startAutosave();
  }, []);

  const handleManualSave = useCallback(async () => {
    const store = useProjectStore.getState();
    if (!store.currentProject) return;
    useSaveStatusStore.getState().setStatus('saving');
    try {
      await store.saveProject();
      useSaveStatusStore.getState().setStatus('saved');
      setTimeout(() => {
        if (useSaveStatusStore.getState().status === 'saved') {
          useSaveStatusStore.getState().setStatus('idle');
        }
      }, 2000);
    } catch {
      useSaveStatusStore.getState().setStatus('error');
    }
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleManualSave();
        }
        if (e.key.toLowerCase() === 'e' && e.shiftKey) {
          e.preventDefault();
          setIsExportDialogOpen(true);
        }
        if (e.key === '\\') {
          e.preventDefault();
          setFocusModeActive((v) => !v);
        }
        if (e.key === 'k') {
          e.preventDefault();
          setIsCommandMenuOpen((v) => !v);
        }
        if (e.key === '[' || e.key === ']') {
          const draftList = useProjectStore.getState().currentProject?.project.drafts;
          const view = useProjectStore.getState().activeView;
          if (!draftList || draftList.length < 2 || view.type !== 'draft') return;
          const idx = draftList.findIndex((d) => d.id === view.draftId);
          if (idx === -1) return;
          e.preventDefault();
          const next = e.key === '[' ? idx - 1 : idx + 1;
          if (next >= 0 && next < draftList.length) {
            useProjectStore.getState().setActiveView({ type: 'draft', draftId: draftList[next].id });
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleManualSave]);

  if (!isProjectLoaded && !isInitializing) {
    return (
      <div style={{ height: '100vh', background: 'var(--bg-app)', display: 'flex', flexDirection: 'column' }}>
        <div className="app-shell-topbar">
          <TopBar
            onExportClick={() => setIsExportDialogOpen(true)}
            onImportShare={() => setIsShareImportOpen(true)}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmptyState onImportShare={() => setIsShareImportOpen(true)} />
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
        {isCommandMenuOpen && <CommandMenu onClose={() => setIsCommandMenuOpen(false)} />}
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
        background: 'var(--bg-app)',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell-topbar">
        <TopBar
          onExportClick={() => setIsExportDialogOpen(true)}
          onSaveClick={handleManualSave}
          onImportShare={() => setIsShareImportOpen(true)}
          focusModeActive={focusModeActive}
          onToggleFocusMode={() => setFocusModeActive((v) => !v)}
        />
      </div>

      <div className="app-shell-body" style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left Navigation */}
        <nav
          className="left-nav panel"
          style={focusModeActive
            ? { width: 0, minWidth: 0, overflow: 'hidden', transition: 'width 0.18s ease, min-width 0.18s ease' }
            : { ...leftNav.style, transition: leftNav.isResizing ? undefined : 'width 0.18s ease' }
          }
          aria-label="Left navigation"
        >
          <ErrorBoundary paneName="left panel">
            <LeftNav />
          </ErrorBoundary>
        </nav>

        {/* Resize Handle - Left */}
        {!focusModeActive && (
          <div
            className={`resize-handle ${leftNav.isResizing ? 'resizing' : ''}`}
            onMouseDown={leftNav.startResizing}
            title="Drag to resize"
          />
        )}

        {/* Center Pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <CenterPane />
        </div>

        {/* Resize Handle - Right */}
        {!focusModeActive && (
          <div
            className={`resize-handle ${rightSidebar.isResizing ? 'resizing' : ''}`}
            onMouseDown={rightSidebar.startResizing}
            title="Drag to resize"
          />
        )}

        {/* Right Sidebar */}
        <aside
          className="right-sidebar panel"
          style={focusModeActive
            ? { width: 0, minWidth: 0, overflow: 'hidden', transition: 'width 0.18s ease, min-width 0.18s ease' }
            : { ...rightSidebar.style, transition: rightSidebar.isResizing ? undefined : 'width 0.18s ease' }
          }
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
      {isCommandMenuOpen && <CommandMenu onClose={() => setIsCommandMenuOpen(false)} />}
    </div>
  );
}
