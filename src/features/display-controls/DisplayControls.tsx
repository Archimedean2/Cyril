import { useProjectStore } from '../../app/state/projectStore';

export function DisplayControls() {
  const { currentProject, activeView, toggleDraftSetting } = useProjectStore();

  if (!currentProject || activeView.type !== 'draft') return null;

  const draftId = activeView.draftId;
  const draft = currentProject.project.drafts.find(d => d.id === draftId);

  if (!draft) return null;

  const { showSectionLabels, showSpeakerLabels, showStageDirections, showChords, showSyllableCounts } = draft.draftSettings;

  return (
    <div className="display-controls" style={{ marginTop: '24px' }}>
      <p className="section-label">View</p>
      <div className="nav-list" style={{ fontSize: '0.85rem' }}>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showSectionLabels} 
            onChange={() => toggleDraftSetting(draftId, 'showSectionLabels')}
            data-testid="toggle-show-sections"
          />
          <span>Sections</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showSpeakerLabels} 
            onChange={() => toggleDraftSetting(draftId, 'showSpeakerLabels')}
            data-testid="toggle-show-speakers"
          />
          <span>Speakers</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showStageDirections} 
            onChange={() => toggleDraftSetting(draftId, 'showStageDirections')}
            data-testid="toggle-show-stage-directions"
          />
          <span>Stage Dir</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.5 }}>
          <input 
            type="checkbox" 
            checked={showChords} 
            disabled
            title="Coming in Stage 9"
          />
          <span>Chords</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', opacity: 0.5 }}>
          <input 
            type="checkbox" 
            checked={showSyllableCounts} 
            disabled
            title="Coming in Stage 6"
          />
          <span>Syllables</span>
        </label>
      </div>
    </div>
  );
}
