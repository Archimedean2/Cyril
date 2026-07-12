import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createCyrilFile, createDefaultProject } from '../../../src/domain/project/defaults';

function loadedProjectState() {
  const project = createCyrilFile(createDefaultProject('Focus Mode Test'));
  project.project.drafts = [{
    id: 'draft_focus',
    name: 'Main Draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mode: 'lyrics' as const,
    doc: { type: 'doc', content: [] } as any,
    inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
    draftSettings: {
      showChords: false, showSectionLabels: true, showSpeakerLabels: true,
      showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false,
    },
  }];
  return {
    isProjectLoaded: true,
    isInitializing: false,
    currentProject: project,
    activeView: { type: 'draft' as const, draftId: 'draft_focus' },
    error: null,
    saveProject: vi.fn(),
  };
}

describe('T-15.01: focus mode button toggles both rails', () => {
  beforeEach(() => {
    useProjectStore.setState(loadedProjectState());
  });

  it('hides left nav and right sidebar when focus mode button is clicked', () => {
    render(<AppShell />);

    const btn = screen.getByTestId('focus-mode-btn');
    const leftNav = screen.getByRole('navigation', { name: /left navigation/i });
    const rightSidebar = screen.getByRole('complementary', { name: /right sidebar/i });

    // Before: rails are visible (non-zero width style)
    expect(leftNav.style.width).not.toBe('0px');
    expect(rightSidebar.style.width).not.toBe('0px');

    fireEvent.click(btn);

    // After: rails collapsed
    expect(leftNav.style.width).toBe('0px');
    expect(rightSidebar.style.width).toBe('0px');

    // Button reflects active state
    expect(btn).toHaveAttribute('aria-pressed', 'true');

    // Click again to restore
    fireEvent.click(btn);
    expect(leftNav.style.width).not.toBe('0px');
    expect(rightSidebar.style.width).not.toBe('0px');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('T-15.02: Cmd+\\ keyboard shortcut toggles focus mode', () => {
  beforeEach(() => {
    useProjectStore.setState(loadedProjectState());
  });

  it('toggles rails via Cmd+\\ keydown', () => {
    render(<AppShell />);

    const leftNav = screen.getByRole('navigation', { name: /left navigation/i });
    const rightSidebar = screen.getByRole('complementary', { name: /right sidebar/i });

    expect(leftNav.style.width).not.toBe('0px');

    fireEvent.keyDown(window, { key: '\\', metaKey: true });

    expect(leftNav.style.width).toBe('0px');
    expect(rightSidebar.style.width).toBe('0px');

    fireEvent.keyDown(window, { key: '\\', metaKey: true });

    expect(leftNav.style.width).not.toBe('0px');
  });
});
