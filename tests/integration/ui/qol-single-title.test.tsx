import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppShell } from '../../../src/components/layout/AppShell';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

// C-16: the song title used to appear both in the top bar and again as the
// LeftNav heading. This suite proves it now lives exactly once (top bar), and
// that the left nav leads with its own content instead of repeated identity.

function setup(title = 'My Great Song') {
  const project = createDefaultProject(title);
  useProjectStore.setState({
    isProjectLoaded: true,
    isInitializing: false,
    currentProject: createCyrilFile(project),
    activeView: { type: 'draft', draftId: project.drafts[0].id },
    error: null,
    saveProject: vi.fn(),
  });
  return project;
}

describe('T-14.06: the song title renders exactly once in the chrome', () => {
  beforeEach(() => {
    useProjectStore.setState({
      isProjectLoaded: false,
      isInitializing: false,
      currentProject: null,
      activeView: { type: 'draft', draftId: '' },
      error: null,
    });
  });

  it('T-14.06: the song title renders exactly once in the chrome (top bar only)', () => {
    const project = setup('My Great Song');
    render(<AppShell />);

    // The top bar is the one home for identity.
    expect(screen.getByTestId('topbar-project-title')).toHaveTextContent(project.title);

    // No other element in the rendered tree repeats the song title as a heading —
    // in particular the LeftNav must not render its own "project-title" node any more.
    expect(screen.queryByTestId('project-title')).toBeNull();
    expect(screen.queryByTestId('project-title-input')).toBeNull();

    const leftNav = document.querySelector('nav[aria-label="Left navigation"]');
    expect(leftNav).not.toBeNull();
    const headingsInNav = Array.from(leftNav!.querySelectorAll('h1, h2, h3')).filter(
      (el) => el.textContent?.trim() === project.title,
    );
    expect(headingsInNav).toHaveLength(0);

    // The title string itself is only present once across the whole rendered tree
    // (guards against it resurfacing under a different element/testid later).
    const allMatches = Array.from(document.querySelectorAll('body *')).filter(
      (el) => el.children.length === 0 && el.textContent?.trim() === project.title,
    );
    expect(allMatches).toHaveLength(1);
  });

  it('T-14.06: the left nav leads with its own content (Project / Drafts / View), not project identity', () => {
    setup('Another Song');
    render(<AppShell />);

    const leftNav = document.querySelector('nav[aria-label="Left navigation"]')!;
    const sectionLabels = Array.from(leftNav.querySelectorAll('.section-label')).map(
      (el) => el.textContent?.trim(),
    );

    // The nav's own sections lead immediately — Project, Drafts, View — with
    // nothing else (like a repeated project-title header) rendered before them.
    expect(sectionLabels).toEqual(
      expect.arrayContaining(['Project', 'Drafts', 'View']),
    );
    expect(leftNav.querySelector('.panel-header')).toBeNull();
  });

  it('T-14.06: click-to-rename still works from the top bar after the left-nav duplicate is removed', () => {
    setup('Rename Me');
    render(<AppShell />);

    const titleEl = screen.getByTestId('topbar-project-title');
    expect(titleEl).toHaveAttribute('title', 'Click to rename');
  });
});
