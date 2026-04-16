import { useProjectStore } from '../../app/state/projectStore';
import { WorkspaceView } from '../../features/workspace-editor/WorkspaceView';
import { DraftView } from '../../features/draft-editor/DraftView';

export function CenterPane() {
  const { currentProject, activeView } = useProjectStore();
  
  if (!currentProject) {
    return (
      <main className="center-pane panel" aria-label="Center content area">
        <div className="center-pane-body">
          <p>No project loaded.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="center-pane panel" aria-label="Center content area">
      <div className="center-pane-body">
        {activeView.type === 'workspace' ? <WorkspaceView /> : <DraftView />}
      </div>
    </main>
  );
}
