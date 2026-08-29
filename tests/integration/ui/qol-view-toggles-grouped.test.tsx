import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

describe('T-14.08: View toggles are grouped under Structure and Sound labels', () => {
  const DRAFT_ID = 'draft_1';

  beforeEach(() => {
    const project = createDefaultProject('Test Song');
    const draft = project.drafts[0];
    draft.id = DRAFT_ID;

    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: DRAFT_ID },
      error: null,
      saveProject: vi.fn(),
    });
  });

  it('T-14.08: Structure group contains Sections, Speakers, Stage Dir under a quiet sub-label', () => {
    render(<AppShell />);

    const structureGroup = screen.getByTestId('display-controls-group-structure');
    expect(within(structureGroup).getByText('Structure')).toBeInTheDocument();
    expect(within(structureGroup).getByTestId('toggle-show-sections')).toBeInTheDocument();
    expect(within(structureGroup).getByTestId('toggle-show-speakers')).toBeInTheDocument();
    expect(within(structureGroup).getByTestId('toggle-show-stage-directions')).toBeInTheDocument();

    // Sound-only toggles must not leak into the Structure group
    expect(within(structureGroup).queryByTestId('toggle-show-chords')).not.toBeInTheDocument();
  });

  it('T-14.08: Sound group contains Chords, Syllables, Stress marks under a quiet sub-label', () => {
    render(<AppShell />);

    const soundGroup = screen.getByTestId('display-controls-group-sound');
    expect(within(soundGroup).getByText('Sound')).toBeInTheDocument();
    expect(within(soundGroup).getByTestId('toggle-show-chords')).toBeInTheDocument();
    expect(within(soundGroup).getByTestId('toggle-show-syllables')).toBeInTheDocument();
    expect(within(soundGroup).getByTestId('toggle-show-stress-marks')).toBeInTheDocument();

    // Structure-only toggles must not leak into the Sound group
    expect(within(soundGroup).queryByTestId('toggle-show-sections')).not.toBeInTheDocument();
  });

  it('T-14.08: each grouped toggle remains a working, keyboard-focusable switch whose state persists per draft', () => {
    render(<AppShell />);

    const stageDirToggle = screen.getByTestId('toggle-show-stage-directions');
    expect(stageDirToggle).toHaveAttribute('type', 'checkbox');
    expect(stageDirToggle).toBeChecked();

    fireEvent.click(stageDirToggle);

    const afterClick = useProjectStore.getState()
      .currentProject!.project.drafts.find((d) => d.id === DRAFT_ID)!
      .draftSettings.showStageDirections;
    expect(afterClick).toBe(false);

    // Focus ring: the underlying input must be able to take keyboard focus.
    stageDirToggle.focus();
    expect(document.activeElement).toBe(stageDirToggle);
  });
});
