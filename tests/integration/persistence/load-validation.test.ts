import 'fake-indexeddb/auto';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { openProject, tryReopenLastProject } from '../../../src/persistence/fileSystem/fileManager';
import { serializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { useProjectStore } from '../../../src/app/state/projectStore';

/**
 * Integration coverage for HARDENING_PERSISTENCE.md §H5 (C-02): every open is routed
 * through validation end-to-end (real fileManager, real deserializeProject), and a
 * corrupt / wrong-schema / newer-schema file never crashes the app — it surfaces as a
 * friendly error the caller (projectStore) can show without a white screen.
 */
function mockHandleWithContent(content: string, name = 'broken.cyril') {
  return {
    kind: 'file' as const,
    name,
    getFile: vi.fn().mockResolvedValue({ text: () => Promise.resolve(content) }),
    queryPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
    requestPermission: vi.fn().mockResolvedValue('granted' as PermissionState),
    createWritable: vi.fn(),
  };
}

describe('Load validation integration (C-02)', () => {
  afterEach(() => {
    delete (window as unknown as { showOpenFilePicker?: unknown }).showOpenFilePicker;
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('T-1.26: opening a corrupt .cyril file through the real fileManager surfaces a friendly error, never throws to a crash', async () => {
    const handle = mockHandleWithContent('{ this is not valid json');
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle]);

    await expect(openProject()).rejects.toThrow(/failed to open project/i);
  });

  it('T-1.26: the project store surfaces the error as state, not a thrown render crash', async () => {
    const handle = mockHandleWithContent('{ this is not valid json');
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle]);

    useProjectStore.setState({ currentProject: null, isProjectLoaded: false, isInitializing: false, error: null });

    await expect(useProjectStore.getState().openProject()).resolves.not.toThrow();

    const state = useProjectStore.getState();
    expect(state.isProjectLoaded).toBe(false);
    expect(state.error).toMatch(/failed to open project/i);
  });

  it('T-1.26: opening a well-formed but unrelated JSON document surfaces a friendly error, not a blank project', async () => {
    const handle = mockHandleWithContent(JSON.stringify({ hello: 'world' }));
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle]);

    await expect(openProject()).rejects.toThrow(/not a valid cyril project/i);
  });

  it('T-1.27: opening a file with a newer schemaVersion surfaces a friendly error, not a corrupted load', async () => {
    const validJson = JSON.stringify({
      schemaVersion: '99.0.0',
      project: {
        id: 'p_future',
        title: 'Future',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        drafts: [],
      },
    });
    const handle = mockHandleWithContent(validJson);
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle]);

    await expect(openProject()).rejects.toThrow(/newer version of cyril/i);
  });

  it('T-1.26: a valid .cyril file still opens normally end-to-end (regression guard)', async () => {
    const validJson = serializeProject(createCyrilFile(createDefaultProject('Real Project')));
    const handle = mockHandleWithContent(validJson, 'real.cyril');
    (window as unknown as { showOpenFilePicker: unknown }).showOpenFilePicker = vi
      .fn()
      .mockResolvedValue([handle]);

    const file = await openProject();
    expect(file?.project.title).toBe('Real Project');
  });
});

/**
 * fileManager's own handle store persists the `FileSystemFileHandle` straight into
 * IndexedDB. Real browsers can structured-clone that opaque host object; fake-indexeddb
 * cannot clone a plain mock object with function properties (it throws "could not be
 * cloned"), which fileManager's `storeFileHandle` already swallows — so a mock handle
 * pushed through the real store/get round-trip would silently vanish, defeating the
 * point of these tests. Instead, stub `indexedDB.open` itself for the scope of one test
 * so `getStoredFileHandle()` gets our exact mock object back, no cloning involved. This
 * tests tryReopenLastProject's own decision logic, not IndexedDB's clone algorithm.
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

describe('tryReopenLastProject: permission-lost vs corrupt/gone (HARDENING §H5)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('keeps the stored handle reference when read permission was revoked (not corrupt/gone)', async () => {
    localStorage.setItem('cyril-last-project-name', 'perm.cyril');
    const handle = {
      kind: 'file' as const,
      name: 'perm.cyril',
      getFile: vi.fn().mockRejectedValue(new DOMException('no permission', 'NotAllowedError')),
    };
    const restore = installFakeHandleDB(handle);

    try {
      const result = await tryReopenLastProject();

      expect(result).toBeNull();
      expect(handle.getFile).toHaveBeenCalled();
      // Permission lost, not corrupt/gone — the stored reference must survive so a future
      // reopen (once permission is re-granted) can still succeed.
      expect(localStorage.getItem('cyril-last-project-name')).toBe('perm.cyril');
    } finally {
      restore();
    }
  });

  it('T-1.26: clears the stored handle reference when the file content is corrupt', async () => {
    localStorage.setItem('cyril-last-project-name', 'corrupt.cyril');
    const handle = {
      kind: 'file' as const,
      name: 'corrupt.cyril',
      getFile: vi.fn().mockResolvedValue({ text: () => Promise.resolve('{ not valid json') }),
    };
    const restore = installFakeHandleDB(handle);

    try {
      const result = await tryReopenLastProject();

      expect(result).toBeNull();
      expect(localStorage.getItem('cyril-last-project-name')).toBeNull();
    } finally {
      restore();
    }
  });

  it('clears the stored handle reference when the file is gone (NotFoundError)', async () => {
    localStorage.setItem('cyril-last-project-name', 'gone.cyril');
    const handle = {
      kind: 'file' as const,
      name: 'gone.cyril',
      getFile: vi.fn().mockRejectedValue(new DOMException('gone', 'NotFoundError')),
    };
    const restore = installFakeHandleDB(handle);

    try {
      const result = await tryReopenLastProject();

      expect(result).toBeNull();
      expect(localStorage.getItem('cyril-last-project-name')).toBeNull();
    } finally {
      restore();
    }
  });
});
