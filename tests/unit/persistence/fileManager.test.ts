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
