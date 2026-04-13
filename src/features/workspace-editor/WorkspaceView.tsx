import { useProjectStore } from '../../app/state/projectStore';
import { RichTextEditor } from '../../components/editor/RichTextEditor';
import { RichTextDocument } from '../../domain/project/types';

export function WorkspaceView() {
  const { currentProject, activeView, renameProject } = useProjectStore();

  if (!currentProject || activeView.type !== 'workspace') return null;

  const workspaceKey = activeView.workspace;
  const workspaceDoc = currentProject.project.workspaces[workspaceKey]?.doc;
  
  const titles: Record<string, string> = {
    brief: 'Brief',
    structure: 'Structure',
    hookLab: 'Hook Lab',
    vocabularyWorld: 'Vocabulary World'
  };

  const handleUpdate = (doc: RichTextDocument) => {
    // In a real implementation we would have an updateWorkspace mutation in the store
    // For now, we'll mutate and call renameProject to trigger a save and re-render
    currentProject.project.workspaces[workspaceKey] = { doc };
    renameProject(currentProject.project.title);
  };

  return (
    <div className="workspace-view" style={{ padding: '0 24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{titles[workspaceKey]}</h2>
      </header>
      
      <div className="editor-container" style={{ maxWidth: '760px' }}>
        <RichTextEditor 
          initialContent={workspaceDoc}
          onChange={handleUpdate}
        />
      </div>
    </div>
  );
}
