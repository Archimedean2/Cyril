import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

const DRAFT_ID = 'draft_chord_test';

function getActiveDraft() {
  return useProjectStore.getState().currentProject!.project.drafts.find(
    (d) => d.id === DRAFT_ID,
  )!;
}

describe('T-14.03: Chords control is a single reconciled switch', () => {
  beforeEach(() => {
    const project = createDefaultProject('Test Song');
    const draft = project.drafts[0];
    draft.id = DRAFT_ID;
    draft.mode = 'lyrics';
    draft.draftSettings.showChords = false;

    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: DRAFT_ID },
      error: null,
      saveProject: vi.fn(),
    });
  });

  it('T-14.03: Exactly one Chords control: enabling it enters chord mode, disabling it exits without data loss', () => {
    render(<AppShell />);

    // Exactly one chords control in the view panel
    const chordsToggles = screen.getAllByTestId('toggle-show-chords');
    expect(chordsToggles).toHaveLength(1);

    // No mode segmented buttons
    expect(screen.queryByTestId('draft-mode-option-lyrics')).toBeNull();
    expect(screen.queryByTestId('draft-mode-option-lyrics-with-chords')).toBeNull();

    // Initially off (lyrics mode)
    expect(chordsToggles[0]).not.toBeChecked();
    expect(getActiveDraft().mode).toBe('lyrics');

    // Turn on → enters lyricsWithChords
    fireEvent.click(chordsToggles[0]);
    expect(getActiveDraft().mode).toBe('lyricsWithChords');
    expect(getActiveDraft().draftSettings.showChords).toBe(true);

    // Turn off → returns to lyrics, showChords=false (data not deleted)
    fireEvent.click(chordsToggles[0]);
    expect(getActiveDraft().mode).toBe('lyrics');
    expect(getActiveDraft().draftSettings.showChords).toBe(false);
  });
});
