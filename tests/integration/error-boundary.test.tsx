import * as React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ErrorBoundary } from '../../src/components/layout/ErrorBoundary';

// Hoisted flags so vi.mock factories (which run before module-level code) can read them.
const flags = vi.hoisted(() => ({
  throwInTools: false,
  throwInInventory: false,
  throwInDraft: false,
}));

vi.mock('../../src/features/tools-pane/ToolsPane', () => ({
  ToolsPane: () => {
    if (flags.throwInTools) throw new Error('tools pane explosion');
    return <div data-testid="tools-pane">tools pane ok</div>;
  },
}));

vi.mock('../../src/features/inventory/InventoryPane', () => ({
  InventoryPane: () => {
    if (flags.throwInInventory) throw new Error('inventory pane explosion');
    return (
      <div data-testid="inventory-pane">
        <textarea data-testid="inventory-textarea" />
      </div>
    );
  },
}));

vi.mock('../../src/features/draft-editor/DraftView', () => ({
  DraftView: () => {
    if (flags.throwInDraft) throw new Error('draft view explosion');
    return <div data-testid="draft-editor">draft editor ok</div>;
  },
}));

// Imports must come after vi.mock declarations so the mocks take effect.
import { AppShell } from '../../src/components/layout/AppShell';
import { useProjectStore } from '../../src/app/state/projectStore';
import { createDefaultProject } from '../../src/domain/project/defaults';

function loadProjectIntoStore() {
  const project = createDefaultProject('Test Project');
  useProjectStore.setState({
    isProjectLoaded: true,
    isInitializing: false,
    currentProject: {
      schemaVersion: '1.0.0',
      project: { ...project, activeDraftId: project.drafts[0].id },
    },
    activeView: { type: 'draft', draftId: project.drafts[0].id },
  });
}

const Boom: React.FC = () => {
  throw new Error('boom');
};

describe('Step 6: ErrorBoundary component', () => {
  beforeEach(() => {
    flags.throwInTools = false;
    flags.throwInInventory = false;
    flags.throwInDraft = false;
    // React logs caught errors to console.error by default; silence it for these tests
    // so the run output stays focused on assertion failures.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <span data-testid="happy-path">all good</span>
      </ErrorBoundary>
    );
    expect(screen.getByTestId('happy-path')).toBeInTheDocument();
  });

  it('renders the default fallback (with Reload button + paneName) when a child throws', () => {
    render(
      <ErrorBoundary paneName="test pane">
        <Boom />
      </ErrorBoundary>
    );
    const fallback = screen.getByTestId('error-boundary-fallback');
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveTextContent(/test pane/i);
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('invokes the onReload prop when the Reload button is clicked', () => {
    const onReload = vi.fn();
    render(
      <ErrorBoundary onReload={onReload}>
        <Boom />
      </ErrorBoundary>
    );
    screen.getByRole('button', { name: /reload/i }).click();
    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('renders a custom fallback when one is provided', () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">custom</div>}>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).toBeNull();
  });

  it('forwards caught errors to the onError prop', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Boom />
      </ErrorBoundary>
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const err = onError.mock.calls[0][0] as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
  });
});

describe('Step 6: AppShell pane isolation', () => {
  beforeEach(() => {
    flags.throwInTools = false;
    flags.throwInInventory = false;
    flags.throwInDraft = false;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useProjectStore.setState({ isProjectLoaded: false, isInitializing: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isolates a tools pane crash; editor and inventory still render', () => {
    flags.throwInTools = true;
    loadProjectIntoStore();
    render(<AppShell />);

    // Editor and inventory still mount normally.
    expect(screen.getByTestId('draft-editor')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-pane')).toBeInTheDocument();

    // Exactly one error fallback is shown, and it identifies the tools pane.
    const fallbacks = screen.getAllByTestId('error-boundary-fallback');
    expect(fallbacks).toHaveLength(1);
    expect(fallbacks[0]).toHaveTextContent(/tools pane/i);

    // App shell chrome (sidebar headers) remains functional.
    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('isolates an inventory pane crash; editor and tools still render', () => {
    flags.throwInInventory = true;
    loadProjectIntoStore();
    render(<AppShell />);

    expect(screen.getByTestId('draft-editor')).toBeInTheDocument();
    expect(screen.getByTestId('tools-pane')).toBeInTheDocument();

    const fallbacks = screen.getAllByTestId('error-boundary-fallback');
    expect(fallbacks).toHaveLength(1);
    expect(fallbacks[0]).toHaveTextContent(/inventory pane/i);

    expect(screen.getByText('Tools')).toBeInTheDocument();
    expect(screen.getByText('Inventory')).toBeInTheDocument();
  });

  it('isolates an editor crash; tools and inventory still render', () => {
    flags.throwInDraft = true;
    loadProjectIntoStore();
    render(<AppShell />);

    expect(screen.getByTestId('tools-pane')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-pane')).toBeInTheDocument();

    const fallbacks = screen.getAllByTestId('error-boundary-fallback');
    expect(fallbacks).toHaveLength(1);
    expect(fallbacks[0]).toHaveTextContent(/editor/i);
  });

  it('renders cleanly with no fallbacks when no pane throws', () => {
    loadProjectIntoStore();
    render(<AppShell />);

    expect(screen.getByTestId('draft-editor')).toBeInTheDocument();
    expect(screen.getByTestId('tools-pane')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-pane')).toBeInTheDocument();
    expect(screen.queryByTestId('error-boundary-fallback')).toBeNull();
  });
});
