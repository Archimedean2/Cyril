import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { TopBar } from '../../../src/components/layout/TopBar';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

function setup() {
  const project = createDefaultProject('My Song');
  const draft = project.drafts[0];
  useProjectStore.setState({
    isProjectLoaded: true,
    currentProject: createCyrilFile(project),
    activeView: { type: 'draft', draftId: draft.id },
    error: null,
  });
  render(<TopBar onExportClick={() => {}} onSaveClick={() => {}} />);
  return { draftId: draft.id, draftName: draft.name };
}

describe('T-14.05: Song title and draft name in the top bar are click-to-edit; Enter/blur commits, Escape cancels', () => {
  beforeEach(() => {
    useProjectStore.setState({
      isProjectLoaded: false,
      currentProject: null,
      activeView: { type: 'draft', draftId: '' },
      error: null,
    });
  });

  it('T-14.05: clicking the project title shows an input pre-filled with the current title', () => {
    setup();
    fireEvent.click(screen.getByTestId('topbar-project-title'));
    const input = screen.getByTestId('topbar-title-input');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe('My Song');
  });

  it('T-14.05: Enter on the title input commits the rename', () => {
    setup();
    fireEvent.click(screen.getByTestId('topbar-project-title'));
    const input = screen.getByTestId('topbar-title-input');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByTestId('topbar-title-input')).toBeNull();
    expect(screen.getByTestId('topbar-project-title')).toHaveTextContent('New Title');
    expect(useProjectStore.getState().currentProject?.project.title).toBe('New Title');
  });

  it('T-14.05: Escape on the title input cancels without renaming', () => {
    setup();
    fireEvent.click(screen.getByTestId('topbar-project-title'));
    const input = screen.getByTestId('topbar-title-input');
    fireEvent.change(input, { target: { value: 'Abandoned Name' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByTestId('topbar-title-input')).toBeNull();
    expect(screen.getByTestId('topbar-project-title')).toHaveTextContent('My Song');
    expect(useProjectStore.getState().currentProject?.project.title).toBe('My Song');
  });

  it('T-14.05: clicking the draft name shows an input pre-filled with the current draft name', () => {
    setup();
    fireEvent.click(screen.getByTestId('topbar-draft-name'));
    const input = screen.getByTestId('topbar-draft-name-input');
    expect(input).toBeInTheDocument();
    expect((input as HTMLInputElement).value).not.toBe('');
  });

  it('T-14.05: Enter on the draft name input commits the rename and persists in store', () => {
    const { draftId } = setup();
    fireEvent.click(screen.getByTestId('topbar-draft-name'));
    const input = screen.getByTestId('topbar-draft-name-input');
    fireEvent.change(input, { target: { value: 'Verse Draft' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.queryByTestId('topbar-draft-name-input')).toBeNull();
    expect(screen.getByTestId('topbar-draft-name')).toHaveTextContent('Verse Draft');
    const stored = useProjectStore.getState().currentProject?.project.drafts.find(d => d.id === draftId);
    expect(stored?.name).toBe('Verse Draft');
  });

  it('T-14.05: Escape on the draft name input cancels without renaming', () => {
    const { draftName } = setup();
    fireEvent.click(screen.getByTestId('topbar-draft-name'));
    const input = screen.getByTestId('topbar-draft-name-input');
    fireEvent.change(input, { target: { value: 'Wrong Name' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByTestId('topbar-draft-name-input')).toBeNull();
    expect(screen.getByTestId('topbar-draft-name')).toHaveTextContent(draftName);
  });
});
