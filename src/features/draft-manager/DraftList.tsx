import * as React from 'react';
import { useProjectStore } from '../../app/state/projectStore';
import { DraftListItem } from './DraftListItem';
import { NewDraftDialog } from './NewDraftDialog';

export function DraftList() {
  const { currentProject, activeView, setActiveView } = useProjectStore();
  const [isNewDraftDialogOpen, setIsNewDraftDialogOpen] = React.useState(false);

  if (!currentProject) return null;

  return (
    <div className="draft-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="section-label spacer-lg" style={{ margin: 0 }}>Drafts</p>
      </div>
      
      <div className="nav-list">
        {currentProject.project.drafts.map(draft => (
          <DraftListItem
            key={draft.id}
            name={draft.name}
            isActive={activeView.type === 'draft' && activeView.draftId === draft.id}
            onSelect={() => setActiveView({ type: 'draft', draftId: draft.id })}
          />
        ))}
        
        <div 
          className="nav-item" 
          style={{ color: 'var(--accent-primary)', marginTop: '4px' }}
          role="button"
          tabIndex={0}
          onClick={() => setIsNewDraftDialogOpen(true)}
        >
          + New Draft
        </div>
      </div>

      <NewDraftDialog 
        isOpen={isNewDraftDialogOpen} 
        onClose={() => setIsNewDraftDialogOpen(false)} 
      />
    </div>
  );
}
