import { useProjectStore } from '../../app/state/projectStore';
import { DraftMode } from '../../domain/project/types';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';

export function DisplayControls() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const activeView = useProjectStore((s) => s.activeView);
  const toggleDraftSetting = useProjectStore((s) => s.toggleDraftSetting);
  const setDraftMode = useProjectStore((s) => s.setDraftMode);

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
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mode</span>
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => handleModeChange('lyrics')}
              disabled={!isChordMode && draft.mode === 'lyrics'}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: '0.8rem',
                border: `1px solid ${draft.mode === 'lyrics' ? 'var(--border-strong)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-xs)',
                background: draft.mode === 'lyrics' ? 'var(--bg-active)' : 'var(--bg-editor)',
                color: draft.mode === 'lyrics' ? 'var(--text-primary)' : 'var(--text-secondary)',
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
                border: `1px solid ${draft.mode === 'lyricsWithChords' ? 'var(--border-strong)' : 'var(--border-default)'}`,
                borderRadius: 'var(--radius-xs)',
                background: draft.mode === 'lyricsWithChords' ? 'var(--bg-active)' : 'var(--bg-editor)',
                color: draft.mode === 'lyricsWithChords' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              data-testid="draft-mode-option-lyrics-with-chords"
            >
              Lyrics + Chords
            </button>
          </div>
        </div>
        <ToggleSwitch
          label="Sections"
          checked={showSectionLabels}
          onChange={() => toggleDraftSetting(draftId, 'showSectionLabels')}
          data-testid="toggle-show-sections"
        />
        <ToggleSwitch
          label="Speakers"
          checked={showSpeakerLabels}
          onChange={() => toggleDraftSetting(draftId, 'showSpeakerLabels')}
          data-testid="toggle-show-speakers"
        />
        <ToggleSwitch
          label="Stage Dir"
          checked={showStageDirections}
          onChange={() => toggleDraftSetting(draftId, 'showStageDirections')}
          data-testid="toggle-show-stage-directions"
        />
        <ToggleSwitch
          label="Chords"
          checked={showChords}
          onChange={() => toggleDraftSetting(draftId, 'showChords')}
          disabled={!isChordMode}
          title={isChordMode ? 'Show chord lane' : 'Enable chord mode to use chords'}
          data-testid="toggle-show-chords"
        />
        <ToggleSwitch
          label="Syllables"
          checked={showSyllableCounts}
          onChange={() => toggleDraftSetting(draftId, 'showSyllableCounts')}
          data-testid="toggle-show-syllables"
        />
        <ToggleSwitch
          label="Stress marks"
          checked={showStressMarks}
          onChange={() => toggleDraftSetting(draftId, 'showStressMarks')}
          data-testid="toggle-show-stress-marks"
        />
      </div>
    </div>
  );
}
