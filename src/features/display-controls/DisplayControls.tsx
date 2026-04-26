import { useProjectStore } from '../../app/state/projectStore';
import { DraftMode } from '../../domain/project/types';

export function DisplayControls() {
  const { currentProject, activeView, toggleDraftSetting, setDraftMode } = useProjectStore();

  if (!currentProject || activeView.type !== 'draft') return null;

  const draftId = activeView.draftId;
  const draft = currentProject.project.drafts.find(d => d.id === draftId);

  if (!draft) return null;

  const { showSectionLabels, showSpeakerLabels, showStageDirections, showChords, showSyllableCounts, showStressMarks } = draft.draftSettings;
  const isChordMode = draft.mode === 'lyricsWithChords';

  const handleModeChange = (mode: DraftMode) => {
    setDraftMode(draftId, mode);
  };

  return (
    <div className="display-controls" style={{ marginTop: '24px' }}>
      <p className="section-label">View</p>
      <div className="nav-list" style={{ fontSize: '0.85rem' }} data-testid="draft-mode-toggle">
        <div style={{ marginBottom: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: '#666' }}>Mode</span>
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => handleModeChange('lyrics')}
              disabled={!isChordMode && draft.mode === 'lyrics'}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: '0.8rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: draft.mode === 'lyrics' ? '#e0e0e0' : 'white',
                cursor: 'pointer',
              }}
              data-testid="draft-mode-option-lyrics"
            >
              Lyrics
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('lyricsWithChords')}
              disabled={isChordMode && draft.mode === 'lyricsWithChords'}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: '0.8rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: draft.mode === 'lyricsWithChords' ? '#e0e0e0' : 'white',
                cursor: 'pointer',
              }}
              data-testid="draft-mode-option-lyrics-with-chords"
            >
              Lyrics + Chords
            </button>
          </div>
        </div>
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
        <label 
          className="nav-item" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: isChordMode ? 'pointer' : 'not-allowed',
            opacity: isChordMode ? 1 : 0.5 
          }}
        >
          <input 
            type="checkbox" 
            checked={showChords} 
            onChange={() => isChordMode && toggleDraftSetting(draftId, 'showChords')}
            disabled={!isChordMode}
            data-testid="toggle-show-chords"
            title={isChordMode ? 'Show chord lane' : 'Enable chord mode in draft settings to use chords'}
          />
          <span>Chords</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showSyllableCounts} 
            onChange={() => toggleDraftSetting(draftId, 'showSyllableCounts')}
            data-testid="toggle-show-syllables"
          />
          <span>Syllables</span>
        </label>
        <label className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showStressMarks} 
            onChange={() => toggleDraftSetting(draftId, 'showStressMarks')}
            data-testid="toggle-show-stress-marks"
          />
          <span>Stress marks</span>
        </label>
      </div>
    </div>
  );
}
