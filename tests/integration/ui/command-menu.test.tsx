import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createCyrilFile, createDefaultProject } from '../../../src/domain/project/defaults';
import type { Draft } from '../../../src/domain/project/types';

function makeDraft(id: string): Draft {
  return {
    id, name: 'Draft',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    mode: 'lyrics',
    doc: { type: 'doc', content: [] },
    inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
    draftSettings: { showChords: false, showSectionLabels: true, showSpeakerLabels: true, showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false },
  };
}

function loadedState() {
  const project = createCyrilFile(createDefaultProject('Command Menu Test'));
  project.project.drafts = [makeDraft('d1')];
  return { isProjectLoaded: true, isInitializing: false, currentProject: project, activeView: { type: 'draft' as const, draftId: 'd1' }, error: null, saveProject: vi.fn() };
}

describe('T-15.08: Cmd+K opens the command menu', () => {
  beforeEach(() => { useProjectStore.setState(loadedState()); });

  it('command menu is not visible before Cmd+K', () => {
    render(<AppShell />);
    expect(screen.queryByTestId('command-menu')).toBeNull();
  });

  it('Cmd+K opens the command menu dialog', () => {
    render(<AppShell />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByTestId('command-menu')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toBeInTheDocument();
  });

  it('Cmd+K again closes the command menu', () => {
    render(<AppShell />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByTestId('command-menu')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.queryByTestId('command-menu')).toBeNull();
  });
});

describe('T-15.09: command menu lists shortcuts and closes on Escape', () => {
  beforeEach(() => { useProjectStore.setState(loadedState()); });

  it('lists key shortcuts including Cmd+S and Cmd+\\', () => {
    render(<AppShell />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const menu = screen.getByTestId('command-menu');
    // Check several expected shortcut labels are visible inside the menu
    expect(menu).toHaveTextContent('Save project');
    expect(menu).toHaveTextContent('Toggle focus mode');
    expect(menu).toHaveTextContent('Export');
    expect(menu).toHaveTextContent('Previous draft');
    expect(menu).toHaveTextContent('Next draft');
  });

  it('closes on Escape', () => {
    render(<AppShell />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByTestId('command-menu')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('command-menu')).toBeNull();
  });

  it('closes via the ✕ close button', () => {
    render(<AppShell />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    fireEvent.click(screen.getByTestId('command-menu-close'));
    expect(screen.queryByTestId('command-menu')).toBeNull();
  });
});
