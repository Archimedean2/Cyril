import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { useSaveStatusStore } from '../../../src/app/state/saveStatusStore';
import { startAutosave, stopAutosave, DEBOUNCE_MS } from '../../../src/persistence/autosave';
import { openProject } from '../../../src/persistence/fileSystem/fileManager';
import { serializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

/**
 * Integration coverage for HARDENING_PERSISTENCE.md §H6 (C-07): this exercises the real
 * fileManager + autosave + saveStatusStore wiring together (no mocked fileManager), so it
 * proves autosave genuinely refuses to overwrite a file that changed on disk outside Cyril
 * — it must fail loudly (status 'error'), never clobber it silently.
 */
function makeHandleWithChangingLastModified(sequence: number[]) {
  const validJson = serializeProject(createCyrilFile(createDefaultProject('External Change Song')));
  let call = 0;
  const getFile = vi.fn().mockImplementation(() => {
    const lastModified = sequence[Math.min(call, sequence.length - 1)];
    call += 1;
    return Promise.resolve({ text: () => Promise.resolve(validJson), lastModified });
  });
  const write = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  return {
    handle: {
      kind: 'file' as const,
      name: 'external-change-song.cyril',
      getFile,
      queryPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
      requestPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
      createWritable: vi.fn().mockResolvedValue({ write, close }),
    },
    write,
    close,
  };
}

describe('Autosave + external-change guard integration', () => {
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

  it("T-1.28: autosave never clobbers a file that changed outside Cyril — status ends 'error', write is never called", async () => {
    // 1000 at Open (baseline); 2000 at autosave's pre-write check — someone/something else
    // touched the file on disk in between.
    const { handle, write } = makeHandleWithChangingLastModified([1000, 2000]);
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

    // The write must never happen — autosave has no user gesture to ask "overwrite
    // anyway?" with, so a detected external change must be a hard failure, not a silent
    // clobber and not a silent no-op either.
    expect(write).not.toHaveBeenCalled();
    expect(setStatusSpy).not.toHaveBeenCalledWith('saved');
    expect(useSaveStatusStore.getState().status).toBe('error');
  });
});
