import { useProjectStore, WorkspaceType } from '../../app/state/projectStore';

const WORKSPACES: { id: WorkspaceType; label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'structure', label: 'Structure' },
  { id: 'hookLab', label: 'Hook Lab' },
  { id: 'vocabularyWorld', label: 'Vocabulary World' }
];

export function WorkspaceNav() {
  const { activeView, setActiveView } = useProjectStore();

  return (
    <div className="workspace-nav">
      <p className="section-label">Project</p>
      <div className="nav-list">
        {WORKSPACES.map(ws => {
          const isActive = activeView.type === 'workspace' && activeView.workspace === ws.id;
          return (
            <div
              key={ws.id}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => setActiveView({ type: 'workspace', workspace: ws.id })}
              role="button"
              tabIndex={0}
              aria-selected={isActive}
            >
              {ws.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
