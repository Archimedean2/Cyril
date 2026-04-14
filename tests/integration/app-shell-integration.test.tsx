import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { AppShell } from '../../src/components/layout/AppShell';
import { useProjectStore } from '../../src/app/state/projectStore';

describe('Stage 0: App Shell Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    useProjectStore.setState({ isProjectLoaded: false });
  });

  it('T-0.01: App boots without runtime error (renders Empty State by default)', () => {
    expect(() => render(<AppShell />)).not.toThrow();
  });

  it('T-0.06: Empty state renders when no project is loaded', () => {
    render(<AppShell />);
    expect(screen.getByText('Welcome to Cyril')).toBeInTheDocument();
    expect(screen.getByText('Open an existing project or create a new one.')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
    expect(screen.getByText('Open Project')).toBeInTheDocument();
  });

  describe('When project is loaded', () => {
    beforeEach(() => {
      useProjectStore.setState({ 
        isProjectLoaded: true,
        currentProject: {
          schemaVersion: '1.0.0',
          project: {
            id: 'proj_1',
            title: 'Untitled Song',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            workspaces: {
              brief: { doc: { type: 'doc', content: [] } },
              structure: { doc: { type: 'doc', content: [] } },
              hookLab: { doc: { type: 'doc', content: [] } },
              vocabularyWorld: { doc: { type: 'doc', content: [] } },
            },
            drafts: [{
              id: 'draft_1',
              name: 'Draft 1',
              mode: 'lyrics',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              doc: { type: 'doc', content: [{ type: 'paragraph' }] } as any,
              inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
              draftSettings: {
                showChords: true, showSectionLabels: true, showSpeakerLabels: true,
                showStageDirections: true, showSummaries: true, showSyllableCounts: false
              }
            }],
            activeDraftId: null,
            displaySettings: {
              defaultShowChords: true, defaultShowSectionLabels: true,
              defaultShowSpeakerLabels: true, defaultShowStageDirections: true,
              defaultShowSummaries: true, defaultShowSyllableCounts: false,
              rhymeColorMode: 'off'
            },
            exportSettings: {
              includeSectionLabels: true, includeSpeakerLabels: true,
              includeStageDirections: true, includeChords: false,
              fontPreset: 'default', pageDensity: 'normal'
            },
            projectSettings: {
              autosave: true, preferredExportMode: 'lyricsOnly'
            }
          }
        },
        activeView: { type: 'draft', draftId: 'draft_1' }
      });
    });

    it('T-0.02: Left nav renders', () => {
      render(<AppShell />);
      expect(screen.getByText('Untitled Song')).toBeInTheDocument();
      expect(screen.getByText('Project')).toBeInTheDocument();
      expect(screen.getByText('Drafts')).toBeInTheDocument();
    });

    it('T-0.03: Center pane renders', () => {
      render(<AppShell />);
      // We expect 'Draft 1' to appear in the nav and the center pane header
      expect(screen.getAllByText('Draft 1').length).toBeGreaterThanOrEqual(1);
      // Editor should render (look for draft-editor testid)
      expect(screen.getByTestId('draft-editor')).toBeInTheDocument();
    });

    it('T-0.04: Right sidebar renders', () => {
      render(<AppShell />);
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('T-0.05: Right sidebar has top and bottom sections', () => {
      render(<AppShell />);
      expect(screen.getByText('Rhyme, Dictionary, Thesaurus will go here...')).toBeInTheDocument();
      // Inventory pane should now render with the textarea
      expect(screen.getByTestId('inventory-pane')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-textarea')).toBeInTheDocument();
    });
  });
});
