import { useCallback } from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { DraftEditor } from '../../components/editor/DraftEditor';
import { DraftDocument, RichTextDocument } from '../../domain/project/types';
import { createCharacter, findCharacterByName } from '../../domain/project/characters';

export function DraftView() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeView = useProjectStore((s) => s.activeView);
  const updateDraftDoc = useProjectStore((s) => s.updateDraftDoc);
  const addCharacter = useProjectStore((s) => s.addCharacter);

  // C-20: resolves a finalized speaker name to a character id, creating a
  // new registry entry (auto-assigned colour) when nothing matches by name.
  // Reads the store's live state via `getState()` rather than the `currentProject`
  // closed over above — this runs from inside the editor's own commands
  // (Enter / blur), potentially well after this render, and must never act on
  // a stale registry snapshot.
  const handleFinalizeSpeakerName = useCallback((name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const project = useProjectStore.getState().currentProject?.project;
    if (!project) return null;

    const existing = project.characters ?? [];
    const match = findCharacterByName(existing, trimmed);
    if (match) return match.id;

    const created = createCharacter(trimmed, existing);
    addCharacter(created);
    return created.id;
  }, [addCharacter]);

  if (!currentProject || activeView.type !== 'draft') return null;

  const draftId = activeView.draftId;
  const draft = currentProject.project.drafts.find(d => d.id === draftId);

  if (!draft) return <div>Draft not found</div>;

  const handleUpdate = (doc: RichTextDocument) => {
    updateDraftDoc(draftId, doc as DraftDocument);
  };

  return (
    <div className="draft-view">
      <div className="draft-view-canvas">
        <DraftEditor
          // Cast is safe here because DraftDocument extends RichTextDocument in practice
          initialContent={draft.doc as unknown as RichTextDocument}
          settings={draft.draftSettings}
          draftMode={draft.mode}
          onChange={handleUpdate}
          characters={currentProject.project.characters ?? []}
          onFinalizeSpeakerName={handleFinalizeSpeakerName}
        />
      </div>
    </div>
  );
}
