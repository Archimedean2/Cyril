import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

describe('T-14.04: Project actions in top bar', () => {
  beforeEach(() => {
    const project = createDefaultProject('Test Song');
    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: project.drafts[0].id },
      error: null,
      saveProject: vi.fn(),
    });
  });

  it('T-14.04: Project actions are in the top bar on one row; primary actions one click, secondary in overflow menu', () => {
    render(<AppShell />);

    // Primary buttons are immediately visible
    expect(screen.getByTestId('topbar-open-btn')).toBeInTheDocument();
    expect(screen.getByTestId('topbar-save-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-button')).toBeInTheDocument();

    // Overflow menu trigger is visible
    expect(screen.getByTestId('topbar-overflow-btn')).toBeInTheDocument();

    // Overflow menu is closed by default (secondary items not visible)
    expect(screen.queryByTestId('topbar-overflow-menu')).toBeNull();
    expect(screen.queryByTestId('topbar-save-as-btn')).toBeNull();
    expect(screen.queryByTestId('topbar-close-btn')).toBeNull();

    // Opening the overflow reveals the secondary actions
    fireEvent.click(screen.getByTestId('topbar-overflow-btn'));
    expect(screen.getByTestId('topbar-overflow-menu')).toBeInTheDocument();
    expect(screen.getByTestId('topbar-save-as-btn')).toBeInTheDocument();
    expect(screen.getByTestId('topbar-close-btn')).toBeInTheDocument();

    // Secondary items are visible inside the open menu
    expect(screen.getByRole('menuitem', { name: /Save As/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Close/ })).toBeInTheDocument();
  });
});
