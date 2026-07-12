import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createCyrilFile, createDefaultProject } from '../../../src/domain/project/defaults';
import type { Draft } from '../../../src/domain/project/types';

function makeDraft(id: string, name: string): Draft {
  return {
    id, name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: 'lyrics',
    doc: { type: 'doc', content: [] },
    inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
    draftSettings: { showChords: false, showSectionLabels: true, showSpeakerLabels: true, showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false },
  };
}

function threeProjectState() {
  const project = createCyrilFile(createDefaultProject('Shortcuts Test'));
  project.project.drafts = [
    makeDraft('d1', 'Draft 1'),
    makeDraft('d2', 'Draft 2'),
    makeDraft('d3', 'Draft 3'),
  ];
  return {
    isProjectLoaded: true,
    isInitializing: false,
    currentProject: project,
    activeView: { type: 'draft' as const, draftId: 'd1' },
    error: null,
    saveProject: vi.fn(),
  };
}

describe('T-15.06: Cmd+[ switches to the previous draft', () => {
  beforeEach(() => { useProjectStore.setState(threeProjectState()); });

  it('moves from draft 2 to draft 1 with Cmd+[', () => {
    useProjectStore.setState({ activeView: { type: 'draft', draftId: 'd2' } });
    render(<AppShell />);

    fireEvent.keyDown(window, { key: '[', metaKey: true });

    expect(useProjectStore.getState().activeView).toEqual({ type: 'draft', draftId: 'd1' });
  });

  it('does nothing when already on the first draft', () => {
    render(<AppShell />); // starts at d1

    fireEvent.keyDown(window, { key: '[', metaKey: true });

    expect(useProjectStore.getState().activeView).toEqual({ type: 'draft', draftId: 'd1' });
  });
});

describe('T-15.07: Cmd+] switches to the next draft', () => {
  beforeEach(() => { useProjectStore.setState(threeProjectState()); });

  it('moves from draft 1 to draft 2 with Cmd+]', () => {
    render(<AppShell />); // starts at d1

    fireEvent.keyDown(window, { key: ']', metaKey: true });

    expect(useProjectStore.getState().activeView).toEqual({ type: 'draft', draftId: 'd2' });
  });

  it('does nothing when already on the last draft', () => {
    useProjectStore.setState({ activeView: { type: 'draft', draftId: 'd3' } });
    render(<AppShell />);

    fireEvent.keyDown(window, { key: ']', metaKey: true });

    expect(useProjectStore.getState().activeView).toEqual({ type: 'draft', draftId: 'd3' });
  });
});
