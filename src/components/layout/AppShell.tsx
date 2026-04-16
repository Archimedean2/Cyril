import { useState, useEffect } from 'react';
import { LeftNav } from './LeftNav';
import { CenterPane } from './CenterPane';
import { RightSidebar } from './RightSidebar';
import { TopBar } from './TopBar';
import { ExportDialog } from '../../features/export-panel/ExportDialog';
import { useProjectStore } from '../../app/state/projectStore';

export function AppShell() {
  const isProjectLoaded = useProjectStore((state) => state.isProjectLoaded);
  const isInitializing = useProjectStore((state) => state.isInitializing);
  const initApp = useProjectStore((state) => state.initApp);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  useEffect(() => {
    if (isInitializing && !isProjectLoaded) {
      initApp();
    }
  }, [isInitializing, isProjectLoaded, initApp]);

  if (!isProjectLoaded) {
    return (
      <div className="app-shell-loading" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f8fafc'
      }}>
        <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell-topbar">
        <TopBar onExportClick={() => setIsExportDialogOpen(true)} />
      </div>
      <LeftNav />
      <CenterPane />
      <RightSidebar />
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
}
