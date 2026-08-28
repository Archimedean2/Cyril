import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openProject, saveProject } from '../../../src/persistence/fileSystem/fileManager';
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
