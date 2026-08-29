import 'fake-indexeddb/auto';
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  tryReopenLastProject,
  hasPendingPermissionRequest,
  getPendingPermissionFileName,
  regrantFilePermission,
  hasFileHandle,
} from '../../../src/persistence/fileSystem/fileManager';
import { serializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

/**
 * Unit coverage for BACKLOG C-29: the permission re-grant path fileManager exposes to the
 * top-of-editor banner (`PermissionBanner.tsx` / `projectStore.regrantPermission`).
 *
 * Reuses the same real-IndexedDB-bypass technique as
 * `load-validation.test.ts`'s `installFakeHandleDB`: fileManager's own handle store
 * persists the `FileSystemFileHandle` straight into IndexedDB, and fake-indexeddb can't
 * structured-clone a plain mock object with function properties. Stubbing `indexedDB.open`
 * for the scope of one test lets `getStoredFileHandle()` return our exact mock, no cloning
 * involved.
 */
function installFakeHandleDB(storedHandle: unknown) {
  const realIndexedDB = globalThis.indexedDB;
  const microtaskRequest = <T,>(result: T) => {
    const request = { result, onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
    queueMicrotask(() => request.onsuccess?.());
    return request;
  };
  const fakeStore = {
    get: () => microtaskRequest(storedHandle),
    put: () => microtaskRequest(undefined),
    delete: () => microtaskRequest(undefined),
  };
  const fakeDb = {
    objectStoreNames: { contains: () => true },
    transaction: () => ({ objectStore: () => fakeStore }),
    close: () => {},
  };
  (globalThis as unknown as { indexedDB: unknown }).indexedDB = {
    open: () => microtaskRequest(fakeDb),
  };
  return () => {
    (globalThis as unknown as { indexedDB: unknown }).indexedDB = realIndexedDB;
  };
}

/** Puts fileManager into the "permission lost" state `tryReopenLastProject` produces on a
 * `NotAllowedError`, using a handle whose `getFile()` rejects with it exactly once. */
async function lockPermission(name = 'locked-project.cyril') {
  localStorage.setItem('cyril-last-project-name', name);
  const handle = {
    kind: 'file' as const,
    name,
    getFile: vi.fn().mockRejectedValueOnce(new DOMException('no permission', 'NotAllowedError')),
    requestPermission: vi.fn(),
  };
  const restore = installFakeHandleDB(handle);
  const result = await tryReopenLastProject();
  restore();
  expect(result).toBeNull();
  expect(hasPendingPermissionRequest()).toBe(true);
  return handle;
}

describe('fileManager permission re-grant (C-29)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('T-1.31: a NotAllowedError on reopen flags a pending permission request with the file name', async () => {
    const handle = await lockPermission('song-in-progress.cyril');
    expect(getPendingPermissionFileName()).toBe('song-in-progress.cyril');
    expect(handle.getFile).toHaveBeenCalled();
  });

  it('T-1.31: regrantFilePermission requests permission and, on grant, resumes without re-picking the file', async () => {
    const handle = await lockPermission('reconnect-me.cyril');
    const validJson = serializeProject(createCyrilFile(createDefaultProject('Reconnected Song')));
    handle.getFile.mockResolvedValue({ text: () => Promise.resolve(validJson), lastModified: 555 });
    handle.requestPermission.mockResolvedValue('granted' as PermissionState);

    const file = await regrantFilePermission();

    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(file?.project.title).toBe('Reconnected Song');
    // Resumed saving without re-picking: the handle is now the active one, and the
    // banner's job is done — no more pending request.
    expect(hasFileHandle()).toBe(true);
    expect(hasPendingPermissionRequest()).toBe(false);
  });

  it('T-1.31: declining the permission prompt again keeps the pending handle for another try', async () => {
    const handle = await lockPermission('still-locked.cyril');
    handle.requestPermission.mockResolvedValue('denied' as PermissionState);

    const file = await regrantFilePermission();

    expect(file).toBeNull();
    expect(hasPendingPermissionRequest()).toBe(true);
    expect(getPendingPermissionFileName()).toBe('still-locked.cyril');
  });

  it('T-1.31: a file gone/corrupt by the time permission is regranted clears the pending handle', async () => {
    const handle = await lockPermission('now-corrupt.cyril');
    handle.requestPermission.mockResolvedValue('granted' as PermissionState);
    handle.getFile.mockResolvedValue({ text: () => Promise.resolve('{ not valid json') });

    const file = await regrantFilePermission();

    expect(file).toBeNull();
    // Nothing left to reconnect to — matches tryReopenLastProject's own gone/corrupt
    // handling, which also gives up on the stored reference rather than looping forever.
    expect(hasPendingPermissionRequest()).toBe(false);
  });

  it('regrantFilePermission resolves null when there is nothing pending', async () => {
    // No lockPermission() call in this test — fileManager may still carry state from a
    // previous test in this file, so first drive it back to "nothing pending" via a
    // normal successful reopen, then assert the null-pending contract.
    localStorage.setItem('cyril-last-project-name', 'clean.cyril');
    const validJson = serializeProject(createCyrilFile(createDefaultProject('Clean Song')));
    const cleanHandle = {
      kind: 'file' as const,
      name: 'clean.cyril',
      getFile: vi.fn().mockResolvedValue({ text: () => Promise.resolve(validJson), lastModified: 1 }),
    };
    const restore = installFakeHandleDB(cleanHandle);
    await tryReopenLastProject();
    restore();

    expect(hasPendingPermissionRequest()).toBe(false);
    await expect(regrantFilePermission()).resolves.toBeNull();
  });
});
