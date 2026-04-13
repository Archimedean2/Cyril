import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { AppShell } from '../../src/components/layout/AppShell';
import { useProjectStore } from '../../src/app/state/projectStore';

describe('Stage 0: App Shell Integration', () => {
  beforeEach(() => {
    useProjectStore.setState({ isProjectLoaded: false });
  });

  it('T-0.01: App boots without runtime error', () => {
    expect(() => render(createElement(AppShell))).not.toThrow();
  });

  it('T-0.06: Empty state renders when no project is loaded', () => {
    render(createElement(AppShell));
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
      render(createElement(AppShell));
      expect(screen.getByText('Untitled Song')).toBeInTheDocument();
      expect(screen.getByText('Workspaces')).toBeInTheDocument();
      expect(screen.getByText('Drafts')).toBeInTheDocument();
    });

    it('T-0.03: Center pane renders', () => {
      render(createElement(AppShell));
      expect(screen.getAllByText('Draft 1')).toHaveLength(2);
      expect(screen.getByText('Editor will go here...')).toBeInTheDocument();
    });

    it('T-0.04: Right sidebar renders', () => {
      render(createElement(AppShell));
      expect(screen.getByText('Tools')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('T-0.05: Right sidebar has top and bottom sections', () => {
      render(createElement(AppShell));
      expect(screen.getByText('Rhyme, Dictionary, Thesaurus will go here...')).toBeInTheDocument();
      expect(screen.getByText('Draft scratchpad will go here...')).toBeInTheDocument();
    });
  });
});
