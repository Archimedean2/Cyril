import { useProjectStore } from '../../app/state/projectStore';
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

  const { showSectionLabels, showSpeakerLabels, showStageDirections, showSyllableCounts, showStressMarks } = draft.draftSettings;
  const isChordMode = draft.mode === 'lyricsWithChords';

  return (
    <div className="display-controls" style={{ marginTop: '24px' }} data-testid="draft-mode-toggle">
      <p className="section-label">View</p>

      <div className="display-controls-group" data-testid="display-controls-group-structure">
        <p className="display-controls-group-label">Structure</p>
        <div className="nav-list" style={{ fontSize: '0.85rem' }}>
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
        </div>
      </div>

      <div className="display-controls-group" data-testid="display-controls-group-sound">
        <p className="display-controls-group-label">Sound</p>
        <div className="nav-list" style={{ fontSize: '0.85rem' }}>
          <ToggleSwitch
            label="Chords"
            checked={isChordMode}
            onChange={() => setDraftMode(draftId, isChordMode ? 'lyrics' : 'lyricsWithChords')}
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
    </div>
  );
}
