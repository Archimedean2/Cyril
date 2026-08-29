import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { CenterPane } from '../../../src/components/layout/CenterPane';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

// C-13: the draft toolbar was rebuilt into grouped, tooltipped controls.
describe('Draft Toolbar Integration (C-13)', () => {
  beforeEach(() => {
    const project = createDefaultProject('Toolbar Test');
    project.drafts = [{
      id: 'draft_toolbar',
      name: 'Toolbar Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: 'lyrics',
      doc: {
        type: 'doc',
        content: [{
          type: 'lyricLine',
          attrs: { id: 'line_1', lineType: 'lyric', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } },
          content: [{ type: 'text', text: 'Hello there' }],
        }] as any,
      },
      inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
      draftSettings: {
        showChords: true, showSectionLabels: true, showSpeakerLabels: true,
        showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false,
      },
    }];

    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: 'draft_toolbar' },
      error: null,
      saveProject: vi.fn(),
    });
  });

  it('T-4.29: toolbar controls are grouped in order (inline format, line type, structure, history) with a separator between each group', async () => {
    render(<CenterPane />);

    const toolbar = await screen.findByTestId('editor-toolbar');
    const groups = toolbar.querySelectorAll(':scope > .toolbar-group');

    // Group 1: inline format
    expect(groups[0].querySelector('[data-testid="editor-bold-button"]')).toBeTruthy();
    expect(groups[0].querySelector('[data-testid="editor-italic-button"]')).toBeTruthy();

    // Group 2: line type
    expect(groups[1].querySelector('[data-testid="toolbar-speaker"]')).toBeTruthy();
    expect(groups[1].querySelector('[data-testid="toolbar-stage-dir"]')).toBeTruthy();

    // Group 3: structure (section + concurrent)
    expect(groups[2].querySelector('[data-testid="editor-add-section-button"]')).toBeTruthy();
    expect(groups[2].querySelector('[data-testid="toolbar-insert-concurrent"]')).toBeTruthy();

    // Last group: history (undo/redo), regardless of whether a chord group is
    // rendered in between (mode is 'lyrics' here, so it isn't).
    const lastGroup = groups[groups.length - 1];
    expect(lastGroup.querySelector('[data-testid="editor-undo-button"]')).toBeTruthy();
    expect(lastGroup.querySelector('[data-testid="editor-redo-button"]')).toBeTruthy();

    // Every group after the first has a visible separator (border-left is set
    // via the `.toolbar-group + .toolbar-group` CSS rule — jsdom doesn't
    // resolve CSS files, so this locks in the DOM shape the rule targets:
    // each group is a direct, consecutive sibling of the one before it).
    for (let i = 1; i < groups.length; i++) {
      expect(groups[i].previousElementSibling).toBe(groups[i - 1]);
    }
  });

  it('T-4.29: every toolbar control has a tooltip, and it names a real keyboard/typed shortcut where one exists', async () => {
    render(<CenterPane />);
    await screen.findByTestId('editor-toolbar');

    expect(screen.getByTestId('editor-bold-button')).toHaveAttribute('title', 'Bold (Ctrl+B)');
    expect(screen.getByTestId('editor-italic-button')).toHaveAttribute('title', 'Italic (Ctrl+I)');
    expect(screen.getByTestId('toolbar-speaker').getAttribute('title')).toMatch(/\[\[/);
    expect(screen.getByTestId('toolbar-stage-dir').getAttribute('title')).toMatch(/\(\(/);
    expect(screen.getByTestId('editor-add-section-button').getAttribute('title')).toMatch(/<</);
    expect(screen.getByTestId('editor-undo-button')).toHaveAttribute('title', 'Undo (Ctrl+Z)');
    expect(screen.getByTestId('editor-redo-button')).toHaveAttribute('title', 'Redo (Ctrl+Y)');

    // No keyboard shortcut actually inserts a concurrent block (verified by
    // grep: no keydown handler anywhere binds it) — the tooltip must not
    // claim one that doesn't exist.
    const concurrentTitle = screen.getByTestId('toolbar-insert-concurrent').getAttribute('title') || '';
    expect(concurrentTitle.toLowerCase()).not.toMatch(/ctrl|cmd|⌘/);
  });

  it('T-4.29: the active line type is visibly indicated on its toolbar button', async () => {
    const user = userEvent.setup();
    render(<CenterPane />);
    await screen.findByTestId('editor-toolbar');

    const speakerButton = screen.getByTestId('toolbar-speaker');
    expect(speakerButton.className).not.toMatch(/active/);

    await user.click(screen.getByText('Hello there'));
    await user.click(speakerButton);

    await waitFor(() => {
      expect(screen.getByTestId('toolbar-speaker').className).toMatch(/active/);
    });
  });
});
