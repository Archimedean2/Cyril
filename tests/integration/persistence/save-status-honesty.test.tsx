import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { useSaveStatusStore } from '../../../src/app/state/saveStatusStore';
import { clearRecoverySnapshot } from '../../../src/persistence/indexeddb/recoveryStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

/**
 * Integration coverage for HARDENING_PERSISTENCE.md §H7 (C-06): the save-status
 * indicator must never claim `saved` (or a clean, quiet `idle`) when there is no file
 * on disk reflecting the current project. This exercises the real autosave +
 * recoveryStore wiring together (fileManager itself is mocked — disk I/O is not what
 * this criterion is about) and the real TopBar rendering of the resulting status.
 */
vi.mock('../../../src/persistence/fileSystem/fileManager', () => ({
  hasFileHandle: vi.fn(() => false),
  saveProject: vi.fn(() => Promise.resolve()),
  openProject: vi.fn(),
  createNewProject: vi.fn(),
  duplicateProject: vi.fn(),
  tryReopenLastProject: vi.fn(() => Promise.resolve(null)),
}));

import { hasFileHandle } from '../../../src/persistence/fileSystem/fileManager';
import { startAutosave, stopAutosave, DEBOUNCE_MS } from '../../../src/persistence/autosave';
import { TopBar } from '../../../src/components/layout/TopBar';

function makeProject(title = 'Test') {
  return createCyrilFile(createDefaultProject(title));
}

describe('T-1.29: save status is never a lie when there is no file on disk', () => {
  beforeEach(async () => {
    await clearRecoverySnapshot();
    vi.mocked(hasFileHandle).mockReturnValue(false);
    vi.useFakeTimers();
    useSaveStatusStore.setState({ status: 'idle' });
    useProjectStore.setState({
      currentProject: null,
      isProjectLoaded: false,
      isInitializing: false,
      error: null,
      recoverySnapshot: null,
    });
  });

  afterEach(async () => {
    stopAutosave();
    vi.useRealTimers();
    vi.restoreAllMocks();
    await clearRecoverySnapshot();
  });

  it("T-1.29: no file handle + edits pending never reports 'saved' or settles to a clean 'idle' — it reports 'local-only' once the recovery snapshot lands", async () => {
    const project = makeProject('Never Saved Song');
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

    startAutosave();

    const setStatusSpy = vi.spyOn(useSaveStatusStore.getState(), 'setStatus');

    useProjectStore.setState({
      currentProject: { ...project, project: { ...project.project, updatedAt: new Date().toISOString() } },
    });

    // Immediately after the edit: honestly 'unsaved', not a lie either way.
    expect(useSaveStatusStore.getState().status).toBe('unsaved');

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    // Once the debounce flush lands (recovery snapshot written, no file to write to),
    // status must be the honest third state — never 'saved', never a bare 'idle'.
    expect(useSaveStatusStore.getState().status).toBe('local-only');
    expect(setStatusSpy).not.toHaveBeenCalledWith('saved');
    expect(setStatusSpy).not.toHaveBeenCalledWith('idle');
  });

  it('T-1.29: a recovery-snapshot write failure with no file handle reports \'error\', never \'saved\'/\'idle\'', async () => {
    // Simulate IndexedDB being unusable (private browsing / quota exceeded), matching
    // the recovery store's own degrade-gracefully contract (recovery-store.test.ts).
    const realOpen = indexedDB.open;
    (indexedDB as unknown as { open: unknown }).open = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };

    try {
      const project = makeProject('Quota Exceeded Song');
      useProjectStore.setState({ currentProject: project, isProjectLoaded: true });

      startAutosave();

      const setStatusSpy = vi.spyOn(useSaveStatusStore.getState(), 'setStatus');

      useProjectStore.setState({
        currentProject: { ...project, project: { ...project.project, updatedAt: new Date().toISOString() } },
      });

      vi.advanceTimersByTime(DEBOUNCE_MS);
      await vi.runAllTimersAsync();

      expect(useSaveStatusStore.getState().status).toBe('error');
      expect(setStatusSpy).not.toHaveBeenCalledWith('saved');
      expect(setStatusSpy).not.toHaveBeenCalledWith('idle');
    } finally {
      (indexedDB as unknown as { open: unknown }).open = realOpen;
    }
  });

  it("T-1.29: the top-bar indicator surfaces 'local-only' with copy a writer understands, not a bare dot", async () => {
    const project = makeProject('Never Saved Song');
    useProjectStore.setState({ currentProject: project, isProjectLoaded: true });
    render(<TopBar onExportClick={() => {}} onSaveClick={() => {}} />);

    startAutosave();

    act(() => {
      useProjectStore.setState({
        currentProject: { ...project, project: { ...project.project, updatedAt: new Date().toISOString() } },
      });
    });

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
      await vi.runAllTimersAsync();
    });

    expect(useSaveStatusStore.getState().status).toBe('local-only');
    const indicator = screen.getByTestId('save-status');
    // Never a bare/empty indicator, and never the literal word the app uses for a real
    // on-disk save — a writer should be able to tell these two states apart from copy.
    expect(indicator.textContent).not.toBe('');
    expect(indicator.textContent).not.toBe('Saved');
    expect(indicator.textContent?.toLowerCase()).toContain('not on disk');
  });
});
