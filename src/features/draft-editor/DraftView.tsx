import { useProjectStore } from '../../app/state/projectStore';
import { DraftEditor } from '../../components/editor/DraftEditor';
import { DraftDocument } from '../../domain/project/types';

export function DraftView() {
  const { currentProject, activeView, renameProject } = useProjectStore();

  if (!currentProject || activeView.type !== 'draft') return null;

  const draftId = activeView.draftId;
  const draft = currentProject.project.drafts.find(d => d.id === draftId);
  
  if (!draft) return <div>Draft not found</div>;

  const handleUpdate = (doc: any) => {
    // In a real implementation we would have an updateDraft mutation in the store
    // For now, we'll mutate and call renameProject to trigger a save and re-render
    draft.doc = doc as DraftDocument;
    renameProject(currentProject.project.title);
  };

  return (
    <div className="draft-view" style={{ padding: '0 24px' }}>
      <header style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Draft: {draft.name}</h2>
      </header>
      
      <div style={{ maxWidth: '760px' }}>
        <DraftEditor 
          // Cast is safe here because DraftDocument extends RichTextDocument in practice
          initialContent={draft.doc as any}
          settings={draft.draftSettings}
          onChange={handleUpdate}
        />
      </div>
    </div>
  );
}
