import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import * as React from 'react';
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
      useProjectStore.setState({ isProjectLoaded: true });
    });

    it('T-0.02: Left nav renders', () => {
      render(<AppShell />);
      expect(screen.getByText('Cyril')).toBeInTheDocument();
      expect(screen.getByText('Workspaces')).toBeInTheDocument();
      expect(screen.getByText('Drafts')).toBeInTheDocument();
    });

    it('T-0.03: Center pane renders', () => {
      render(<AppShell />);
      expect(screen.getAllByText('Draft 1')).toHaveLength(2);
      expect(screen.getByText('Editor will go here...')).toBeInTheDocument();
    });

    it('T-0.04: Right sidebar renders', () => {
      render(<AppShell />);
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('T-0.05: Right sidebar has top and bottom sections', () => {
      render(<AppShell />);
      expect(screen.getByText('Rhyme, Dictionary, Thesaurus will go here...')).toBeInTheDocument();
      expect(screen.getByText('Draft scratchpad will go here...')).toBeInTheDocument();
    });
  });
});
