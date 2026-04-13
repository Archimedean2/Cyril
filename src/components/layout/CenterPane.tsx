import { useProjectStore } from '../../app/state/projectStore';
import { RichTextEditor } from '../editor/RichTextEditor';
import { RichTextDocument } from '../../domain/project/types';

export function CenterPane() {
  const { currentProject, saveProject } = useProjectStore();
  
  if (!currentProject) {
    return (
      <main className="center-pane panel" aria-label="Center content area">
        <div className="center-pane-body">
          <p>No project loaded.</p>
        </div>
      </main>
    );
  }

  // Use the first draft's document or fallback to a blank document if no drafts exist
  // We'll build real draft switching in Stage 3.
  const activeDraft = currentProject.project.drafts[0];
  const initialContent: RichTextDocument = activeDraft 
    ? activeDraft.doc as unknown as RichTextDocument // Temporary cast until Stage 4 structured nodes
    : { type: 'doc', content: [{ type: 'paragraph' }] };

  const handleEditorChange = (newContent: RichTextDocument) => {
    // In Stage 3 we'll target the correct active draft/workspace.
    // For now, if we have a draft, update its doc and trigger a save.
    if (activeDraft) {
      activeDraft.doc = newContent as any;
      saveProject(); // Note: we'll probably debounce this in the future or rely on autosave
    }
  };

  return (
    <main className="center-pane panel" aria-label="Center content area">
      <header className="panel-header">
        <h1>{activeDraft ? activeDraft.name : 'Draft 1'}</h1>
      </header>
      <div className="center-pane-body" style={{ padding: 0 }}>
        <RichTextEditor 
          initialContent={initialContent} 
          onChange={handleEditorChange} 
        />
      </div>
    </main>
  );
}
