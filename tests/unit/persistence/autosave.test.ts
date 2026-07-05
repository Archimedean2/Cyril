import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { useSaveStatusStore } from '../../../src/app/state/saveStatusStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

vi.mock('../../../src/persistence/fileSystem/fileManager', () => ({
  hasFileHandle: vi.fn(() => true),
  saveProject: vi.fn(() => Promise.resolve()),
  openProject: vi.fn(),
  createNewProject: vi.fn(),
  duplicateProject: vi.fn(),
  tryReopenLastProject: vi.fn(() => Promise.resolve(null)),
}));

import { hasFileHandle, saveProject } from '../../../src/persistence/fileSystem/fileManager';
import { startAutosave, stopAutosave, DEBOUNCE_MS } from '../../../src/persistence/autosave';

function makeProject() {
  return createCyrilFile(createDefaultProject('Test'));
}

describe('Autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(hasFileHandle).mockReturnValue(true);
    vi.mocked(saveProject).mockResolvedValue(undefined);
    useProjectStore.setState({
      currentProject: null,
      isProjectLoaded: false,
      isInitializing: false,
      error: null,
    });
  });

  afterEach(() => {
    stopAutosave();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('saves after debounce when project changes', async () => {
    const project = makeProject();
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    // Trigger a change
    useProjectStore.setState({
      currentProject: {
        ...project,
        project: { ...project.project, updatedAt: new Date().toISOString() },
      },
    });

    expect(saveProject).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(saveProject).toHaveBeenCalledTimes(1);
  });

  it('does not save when autosave is disabled', async () => {
    const project = makeProject();
    project.project.projectSettings.autosave = false;
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    useProjectStore.setState({
      currentProject: {
        ...project,
        project: { ...project.project, updatedAt: new Date().toISOString() },
      },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(saveProject).not.toHaveBeenCalled();
  });

  it('does not save when no file handle exists', async () => {
    vi.mocked(hasFileHandle).mockReturnValue(false);
    const project = makeProject();
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    useProjectStore.setState({
      currentProject: {
        ...project,
        project: { ...project.project, updatedAt: new Date().toISOString() },
      },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(saveProject).not.toHaveBeenCalled();
  });

  it('debounces rapid changes into a single save', async () => {
    const project = makeProject();
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    // Rapid changes
    for (let i = 0; i < 5; i++) {
      useProjectStore.setState({
        currentProject: {
          ...project,
          project: { ...project.project, title: `change-${i}`, updatedAt: new Date().toISOString() },
        },
      });
      vi.advanceTimersByTime(500);
    }

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(saveProject).toHaveBeenCalledTimes(1);
  });

  it('stops saving after stopAutosave is called', async () => {
    const project = makeProject();
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();
    stopAutosave();

    useProjectStore.setState({
      currentProject: {
        ...project,
        project: { ...project.project, updatedAt: new Date().toISOString() },
      },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(saveProject).not.toHaveBeenCalled();
  });

  it('silently handles save errors', async () => {
    vi.mocked(saveProject).mockRejectedValueOnce(new Error('disk full'));
    const project = makeProject();
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    useProjectStore.setState({
      currentProject: {
        ...project,
        project: { ...project.project, updatedAt: new Date().toISOString() },
      },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(saveProject).toHaveBeenCalledTimes(1);
    // No error thrown — autosave failures are silent
  });

  it('transitions save status: unsaved → saving → saved → idle', async () => {
    const project = makeProject();
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    useProjectStore.setState({
      currentProject: {
        ...project,
        project: { ...project.project, updatedAt: new Date().toISOString() },
      },
    });

    expect(useSaveStatusStore.getState().status).toBe('unsaved');

    vi.advanceTimersByTime(DEBOUNCE_MS);
    // Flush the async save chain (mock resolves in microtasks)
    await vi.advanceTimersByTimeAsync(0);

    expect(useSaveStatusStore.getState().status).toBe('saved');

    await vi.advanceTimersByTimeAsync(2000);
    expect(useSaveStatusStore.getState().status).toBe('idle');
  });

  it('sets status to error on save failure', async () => {
    vi.mocked(saveProject).mockRejectedValueOnce(new Error('disk full'));
    const project = makeProject();
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    useProjectStore.setState({
      currentProject: {
        ...project,
        project: { ...project.project, updatedAt: new Date().toISOString() },
      },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(useSaveStatusStore.getState().status).toBe('error');
  });
});
