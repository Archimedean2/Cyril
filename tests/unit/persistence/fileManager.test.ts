import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openProject, saveProject, ExternalChangeCancelledError } from '../../../src/persistence/fileSystem/fileManager';
import { serializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

/**
 * Builds a minimal mock FileSystemFileHandle. `queryPermission`/`requestPermission`
 * mirror the real File System Access API contract: both resolve to a
 * PermissionState ('granted' | 'denied' | 'prompt').
 */
function makeMockHandle(overrides: {
  queryPermission?: PermissionState;
  requestPermission?: PermissionState;
} = {}) {
  const write = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  const validJson = serializeProject(createCyrilFile(createDefaultProject('Permission Test')));

  const handle = {
    kind: 'file' as const,
    name: 'permission-test.cyril',
    getFile: vi.fn().mockResolvedValue({ text: () => Promise.resolve(validJson) }),
    queryPermission: vi.fn().mockResolvedValue(overrides.queryPermission ?? 'granted'),
    requestPermission: vi.fn().mockResolvedValue(overrides.requestPermission ?? 'granted'),
    createWritable: vi.fn().mockResolvedValue({ write, close }),
  };

  return { handle, write, close };
}

/** Opens a project through the real fileManager, using a mocked file picker, so the
 * module's private `fileHandle` is set to our mock handle without touching internals. */
async function openWithHandle(handle: unknown) {
  (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi
    .fn()
    .mockResolvedValue([handle]);
  const file = await openProject();
  expect(file).not.toBeNull();
  return file!;
}

describe('fileManager write permission (C-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
  });

  it("T-1.20: saving on a handle whose permission is 'prompt' requests permission, then writes", async () => {
    const { handle, write, close } = makeMockHandle({ queryPermission: 'prompt', requestPermission: 'granted' });
    const file = await openWithHandle(handle);

    await saveProject(file, false);

    expect(handle.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(handle.createWritable).toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it("T-1.20: a handle already 'granted' writes without requesting permission", async () => {
    const { handle, write } = makeMockHandle({ queryPermission: 'granted' });
    const file = await openWithHandle(handle);

    await saveProject(file, false);

    expect(handle.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(handle.requestPermission).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
  });

  it("T-1.21: a 'denied' handle never writes and the save rejects (manual Save re-requests first)", async () => {
    const { handle, write } = makeMockHandle({ queryPermission: 'prompt', requestPermission: 'denied' });
    const file = await openWithHandle(handle);

    await expect(saveProject(file, false)).rejects.toThrow(/permission/i);

    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(handle.createWritable).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('T-1.21: autosave (allowPermissionPrompt: false) never prompts and rejects immediately on a non-granted handle', async () => {
    const { handle, write } = makeMockHandle({ queryPermission: 'denied' });
    const file = await openWithHandle(handle);

    await expect(saveProject(file, false, { allowPermissionPrompt: false })).rejects.toThrow(/permission/i);

    // Autosave has no user gesture — it must never call requestPermission.
    expect(handle.requestPermission).not.toHaveBeenCalled();
    expect(handle.createWritable).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });
});

/**
 * Builds a mock handle whose `getFile().lastModified` follows a fixed sequence across
 * successive calls (baseline read at Open, the external-change check inside `saveProject`,
 * and — if the write proceeds — the post-write refresh). The last value repeats once the
 * sequence is exhausted.
 */
function makeMockHandleWithModifiedSequence(sequence: number[]) {
  const write = vi.fn().mockResolvedValue(undefined);
  const close = vi.fn().mockResolvedValue(undefined);
  const validJson = serializeProject(createCyrilFile(createDefaultProject('External Change Test')));
  let call = 0;
  const getFile = vi.fn().mockImplementation(() => {
    const lastModified = sequence[Math.min(call, sequence.length - 1)];
    call += 1;
    return Promise.resolve({ text: () => Promise.resolve(validJson), lastModified });
  });

  const handle = {
    kind: 'file' as const,
    name: 'external-change-test.cyril',
    getFile,
    queryPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
    requestPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
    createWritable: vi.fn().mockResolvedValue({ write, close }),
  };

  return { handle, write, close, getFile };
}

describe('fileManager external-change guard (C-07 / HARDENING §H6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
  });

  it('T-1.28: a changed lastModified triggers confirmOverwrite; declining cancels without writing', async () => {
    // 1000 at Open (baseline), 2000 at the pre-write check — the file changed on disk.
    const { handle, write } = makeMockHandleWithModifiedSequence([1000, 2000]);
    const file = await openWithHandle(handle);

    const confirmOverwrite = vi.fn().mockReturnValue(false);
    const wrote = await saveProject(file, false, { confirmOverwrite });

    expect(confirmOverwrite).toHaveBeenCalledWith('external-change-test.cyril');
    expect(write).not.toHaveBeenCalled();
    expect(wrote).toBe(false);
  });

  it('T-1.28: a changed lastModified triggers confirmOverwrite; accepting writes anyway', async () => {
    // 1000 at Open, 2000 detected as changed at the pre-write check, 3000 after the write.
    const { handle, write } = makeMockHandleWithModifiedSequence([1000, 2000, 3000]);
    const file = await openWithHandle(handle);

    const confirmOverwrite = vi.fn().mockReturnValue(true);
    const wrote = await saveProject(file, false, { confirmOverwrite });

    expect(confirmOverwrite).toHaveBeenCalledWith('external-change-test.cyril');
    expect(write).toHaveBeenCalled();
    expect(wrote).toBe(true);
  });

  it('T-1.28: an unchanged lastModified never prompts and writes normally', async () => {
    const { handle, write } = makeMockHandleWithModifiedSequence([1000, 1000, 1000]);
    const file = await openWithHandle(handle);

    const confirmOverwrite = vi.fn().mockReturnValue(true);
    const wrote = await saveProject(file, false, { confirmOverwrite });

    expect(confirmOverwrite).not.toHaveBeenCalled();
    expect(write).toHaveBeenCalled();
    expect(wrote).toBe(true);
  });

  it("T-1.28: autosave (allowPermissionPrompt: false) never confirms; a changed lastModified rejects without writing", async () => {
    const { handle, write } = makeMockHandleWithModifiedSequence([1000, 2000]);
    const file = await openWithHandle(handle);

    const confirmOverwrite = vi.fn().mockReturnValue(true);
    await expect(
      saveProject(file, false, { allowPermissionPrompt: false, confirmOverwrite })
    ).rejects.toThrow(/changed outside Cyril/i);

    // No user gesture available: must never ask, and must never overwrite silently.
    expect(confirmOverwrite).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('T-1.28: a Save As pick is treated as fresh — no baseline to compare, so it never prompts', async () => {
    // Even though the (freshly picked) target's lastModified differs from whatever the
    // previously-open file reported, Save As always establishes a new baseline rather than
    // comparing against the old file's history.
    const opened = makeMockHandleWithModifiedSequence([1000]);
    await openWithHandle(opened.handle);

    const saveAsTarget = makeMockHandleWithModifiedSequence([9999, 9999]);
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = vi
      .fn()
      .mockResolvedValue(saveAsTarget.handle);

    const confirmOverwrite = vi.fn().mockReturnValue(true);
    const file = createCyrilFile(createDefaultProject('Save As Target'));
    const wrote = await saveProject(file, true, { confirmOverwrite });

    expect(confirmOverwrite).not.toHaveBeenCalled();
    expect(saveAsTarget.write).toHaveBeenCalled();
    expect(wrote).toBe(true);

    delete (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker;
  });

  it('ExternalChangeCancelledError identifies itself for callers that want to distinguish it', () => {
    const error = new ExternalChangeCancelledError();
    expect(error.name).toBe('ExternalChangeCancelledError');
    expect(error).toBeInstanceOf(Error);
  });
});

/**
 * Builds a mock handle whose `createWritable()` write is content-labelled and whose
 * `close()` delay is controllable per label, so a test can force two concurrent saves'
 * disk writes to complete in whichever order it wants — independent of which save was
 * *started* first. Used to reproduce EDGE_CASES.md §8's 🟠 "autosave debounce racing a
 * manual save": without serialization, whichever `close()` lands last wins on disk.
 */
function makeMockHandleWithControllableWrites(closeDelayMs: Record<string, number>) {
  const validJson = serializeProject(createCyrilFile(createDefaultProject('Race Test')));
  let modified = 1000;
  let finalContent = '';
  const getFile = vi
    .fn()
    .mockImplementation(() => Promise.resolve({ text: () => Promise.resolve(validJson), lastModified: modified }));
  const handle = {
    kind: 'file' as const,
    name: 'race-test.cyril',
    getFile,
    queryPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
    requestPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
    createWritable: vi.fn().mockImplementation(() => {
      let pending = '';
      return Promise.resolve({
        write: vi.fn().mockImplementation(async (content: string) => {
          pending = content;
        }),
        close: vi.fn().mockImplementation(async () => {
          const label = pending.includes('autosave-content') ? 'autosave' : 'manual';
          const delay = closeDelayMs[label] ?? 0;
          if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
          modified += 1;
          // Whichever close() actually finishes last determines what's "on disk" here,
          // matching the real File System Access API's atomic-rename-on-close semantics.
          finalContent = pending;
        }),
      });
    }),
  };
  return { handle, getFinalContent: () => finalContent };
}

describe('fileManager save serialization (autosave vs. manual save race, EDGE_CASES §8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
  });

  it('T-1.32: an autosave save started first, but slower to complete, never clobbers a faster manual save that was invoked after it', async () => {
    // Autosave's write is slow (simulating real disk latency); the manual save that follows
    // it is fast. Without serialization, autosave's `close()` would land last and silently
    // overwrite the manual save's newer content on disk even though its own caller (the
    // manual Save button) still reports `true` ("saved").
    const { handle, getFinalContent } = makeMockHandleWithControllableWrites({ autosave: 50, manual: 0 });
    const file = await openWithHandle(handle);

    const autosaveContent = { ...file, project: { ...file.project, title: 'autosave-content-stale' } };
    const manualContent = { ...file, project: { ...file.project, title: 'manual-content-newer' } };

    const autosaveCall = saveProject(autosaveContent, false, { allowPermissionPrompt: false });
    const manualCall = saveProject(manualContent, false);

    const [autosaveResult, manualResult] = await Promise.all([autosaveCall, manualCall]);

    expect(autosaveResult).toBe(true);
    expect(manualResult).toBe(true);
    // The save invoked *later* (manual) must always be the one reflected on disk, regardless
    // of which save's I/O happens to finish first.
    expect(getFinalContent()).toContain('manual-content-newer');
    expect(getFinalContent()).not.toContain('autosave-content-stale');
  });

  it('T-1.32: two overlapping manual saves resolve in call order — the later call always wins on disk', async () => {
    const { handle, getFinalContent } = makeMockHandleWithControllableWrites({ manual: 0 });
    const file = await openWithHandle(handle);

    const first = { ...file, project: { ...file.project, title: 'manual-content-first' } };
    const second = { ...file, project: { ...file.project, title: 'manual-content-second' } };

    const firstCall = saveProject(first, false);
    const secondCall = saveProject(second, false);

    await expect(firstCall).resolves.toBe(true);
    await expect(secondCall).resolves.toBe(true);
    expect(getFinalContent()).toContain('manual-content-second');
  });
});

describe('fileManager save failure on a file deleted/renamed externally (EDGE_CASES §8 🔴)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
  });

  it('T-1.33: a file removed from disk after Open causes the next save to reject loudly, never to silently report success', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const validJson = serializeProject(createCyrilFile(createDefaultProject('Deleted File Test')));
    let call = 0;
    const getFile = vi.fn().mockImplementation(() => {
      call += 1;
      if (call === 1) {
        // Baseline read at Open: file still exists.
        return Promise.resolve({ text: () => Promise.resolve(validJson), lastModified: 1000 });
      }
      // Every subsequent read (the pre-write external-change check) — the file is gone.
      return Promise.reject(new DOMException('File not found', 'NotFoundError'));
    });
    const handle = {
      kind: 'file' as const,
      name: 'deleted-test.cyril',
      getFile,
      queryPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
      requestPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
      createWritable: vi.fn().mockResolvedValue({ write, close }),
    };
    const file = await openWithHandle(handle);

    // The save must fail loudly (reject) rather than resolving `true`/`false` as if nothing
    // was wrong, and must never fall through to writing a "new" file silently.
    await expect(saveProject(file, false)).rejects.toThrow();
    expect(handle.createWritable).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('T-1.33: autosave hitting the same deleted-file condition also rejects (never silently no-ops as "saved")', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const validJson = serializeProject(createCyrilFile(createDefaultProject('Deleted File Autosave Test')));
    let call = 0;
    const getFile = vi.fn().mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({ text: () => Promise.resolve(validJson), lastModified: 1000 });
      }
      return Promise.reject(new DOMException('File not found', 'NotFoundError'));
    });
    const handle = {
      kind: 'file' as const,
      name: 'deleted-autosave-test.cyril',
      getFile,
      queryPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
      requestPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
      createWritable: vi.fn().mockResolvedValue({ write, close }),
    };
    const file = await openWithHandle(handle);

    await expect(saveProject(file, false, { allowPermissionPrompt: false })).rejects.toThrow();
    expect(write).not.toHaveBeenCalled();
  });
});
