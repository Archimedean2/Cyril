import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { useSaveStatusStore } from '../../../src/app/state/saveStatusStore';
import { startAutosave, stopAutosave, DEBOUNCE_MS } from '../../../src/persistence/autosave';
import { openProject } from '../../../src/persistence/fileSystem/fileManager';
import { serializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

/**
 * Integration coverage for HARDENING_PERSISTENCE.md §H1: this exercises the real
 * fileManager + autosave + saveStatusStore wiring together (no mocked fileManager),
 * so it proves the end-to-end behaviour the criteria promise, not just the unit
 * in isolation.
 */
function makeDeniedHandle() {
  const validJson = serializeProject(createCyrilFile(createDefaultProject('Denied Handle')));
  return {
    kind: 'file' as const,
    name: 'denied.cyril',
    getFile: vi.fn().mockResolvedValue({ text: () => Promise.resolve(validJson) }),
    queryPermission: vi.fn().mockResolvedValue('denied' as PermissionState),
    requestPermission: vi.fn().mockResolvedValue('denied' as PermissionState),
    createWritable: vi.fn(),
  };
}

describe('Autosave + write permission integration', () => {
  beforeEach(() => {
    useSaveStatusStore.setState({ status: 'idle' });
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
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
    vi.restoreAllMocks();
  });

  it("T-1.21: a 'denied' handle never reports 'saved' via autosave; status ends 'error'", async () => {
    const handle = makeDeniedHandle();
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle]);

    // Resolve the file open with real timers — fake-indexeddb's internal request
    // scheduling relies on real timer/microtask ticks that fake timers would stall.
    const file = await openProject();
    expect(file).not.toBeNull();

    vi.useFakeTimers();
    useProjectStore.setState({ currentProject: file!, isProjectLoaded: true });
    startAutosave();

    const setStatusSpy = vi.spyOn(useSaveStatusStore.getState(), 'setStatus');

    // Trigger a change so autosave schedules a flush.
    useProjectStore.setState({
      currentProject: {
        ...file!,
        project: { ...file!.project, updatedAt: new Date().toISOString() },
      },
    });

    vi.advanceTimersByTime(DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    // Autosave has no user gesture: it must never try to re-request permission,
    // and must never actually attempt the write.
    expect(handle.requestPermission).not.toHaveBeenCalled();
    expect(handle.createWritable).not.toHaveBeenCalled();

    // The save status must never have been reported 'saved', and must end 'error'.
    expect(setStatusSpy).not.toHaveBeenCalledWith('saved');
    expect(useSaveStatusStore.getState().status).toBe('error');
  });
});
