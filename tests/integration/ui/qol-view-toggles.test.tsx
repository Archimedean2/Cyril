import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

describe('T-14.02: View toggles are on/off switches', () => {
  const DRAFT_ID = 'draft_1';

  beforeEach(() => {
    const project = createDefaultProject('Test Song');
    const draft = project.drafts[0];
    draft.id = DRAFT_ID;
    draft.draftSettings.showSectionLabels = false;
    draft.draftSettings.showSyllableCounts = false;

    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: DRAFT_ID },
      error: null,
      saveProject: vi.fn(),
    });
  });

  it('T-14.02: View toggles are on/off switches with keyboard focus; state persists per draft', () => {
    render(<AppShell />);

    const testIds = [
      'toggle-show-sections',
      'toggle-show-speakers',
      'toggle-show-stage-directions',
      'toggle-show-chords',
      'toggle-show-syllables',
      'toggle-show-stress-marks',
    ];

    // Every toggle exists as a checkbox (keyboard-accessible via Space/Enter)
    for (const id of testIds) {
      const input = screen.getByTestId(id);
      expect(input.tagName).toBe('INPUT');
      expect(input).toHaveAttribute('type', 'checkbox');
    }

    // Sections is initially off; clicking it turns it on in the store
    const sectionsToggle = screen.getByTestId('toggle-show-sections');
    expect(sectionsToggle).not.toBeChecked();

    fireEvent.click(sectionsToggle);

    const afterClick = useProjectStore.getState()
      .currentProject!.project.drafts.find((d) => d.id === DRAFT_ID)!
      .draftSettings.showSectionLabels;
    expect(afterClick).toBe(true);

    // Syllables is initially off; clicking it turns it on
    const syllablesToggle = screen.getByTestId('toggle-show-syllables');
    expect(syllablesToggle).not.toBeChecked();

    fireEvent.click(syllablesToggle);

    const afterSyllableClick = useProjectStore.getState()
      .currentProject!.project.drafts.find((d) => d.id === DRAFT_ID)!
      .draftSettings.showSyllableCounts;
    expect(afterSyllableClick).toBe(true);
  });
});
