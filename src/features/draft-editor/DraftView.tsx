import { useProjectStore } from '../../app/state/projectStore';
import { DraftEditor } from '../../components/editor/DraftEditor';
import { DraftDocument } from '../../domain/project/types';

export function DraftView() {
  const { currentProject, activeView, updateDraftDoc } = useProjectStore();

  if (!currentProject || activeView.type !== 'draft') return null;

  const draftId = activeView.draftId;
  const draft = currentProject.project.drafts.find(d => d.id === draftId);
  
  if (!draft) return <div>Draft not found</div>;

  const handleUpdate = (doc: any) => {
    updateDraftDoc(draftId, doc as DraftDocument);
  };

  return (
    <div className="draft-view">
      <header className="draft-view-header">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Draft: {draft.name}</h2>
      </header>
      <div className="draft-view-canvas">
        <DraftEditor
          // Cast is safe here because DraftDocument extends RichTextDocument in practice
          initialContent={draft.doc as any}
          settings={draft.draftSettings}
          draftMode={draft.mode}
          onChange={handleUpdate}
        />
      </div>
    </div>
  );
}
