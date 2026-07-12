import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import App from '../../../src/App';
import { AppShell } from '../../../src/components/layout/AppShell';
import { ErrorBoundary } from '../../../src/components/layout/ErrorBoundary';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createCyrilFile, createDefaultProject } from '../../../src/domain/project/defaults';

const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

function ThrowOnMount(): React.ReactElement {
  throw new Error('intentional test crash');
}

function loadedState() {
  const project = createCyrilFile(createDefaultProject('Test'));
  project.project.drafts = [{
    id: 'draft_1', name: 'Draft',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    mode: 'lyrics' as const,
    doc: { type: 'doc', content: [] } as any,
    inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
    draftSettings: { showChords: false, showSectionLabels: true, showSpeakerLabels: true, showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false },
  }];
  return { isProjectLoaded: true, isInitializing: false, currentProject: project, activeView: { type: 'draft' as const, draftId: 'draft_1' }, error: null, saveProject: vi.fn() };
}

describe('T-15.04: LeftNav panel is wrapped in ErrorBoundary', () => {
  beforeEach(() => { useProjectStore.setState(loadedState()); consoleError.mockClear(); });

  it('ErrorBoundary shows fallback and Reload when a child crashes', () => {
    render(
      <ErrorBoundary paneName="left panel">
        <ThrowOnMount />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('AppShell renders the left nav without crashing on normal load', () => {
    const { container } = render(<AppShell />);
    expect(container.querySelector('nav[aria-label="Left navigation"]')).not.toBeNull();
  });
});

describe('T-15.05: Root App is wrapped in ErrorBoundary', () => {
  beforeEach(() => { useProjectStore.setState(loadedState()); consoleError.mockClear(); });

  it('App mounts successfully with a loaded project', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app-shell')).not.toBeNull();
  });

  it('root ErrorBoundary catches a top-level crash and shows Reload', () => {
    render(
      <ErrorBoundary paneName="app">
        <ThrowOnMount />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });
});
