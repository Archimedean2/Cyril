import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../src/persistence/fileSystem/fileManager', () => ({
  hasFileHandle: vi.fn(() => false),
  saveProject: vi.fn(() => Promise.resolve(true)),
  openProject: vi.fn(),
  createNewProject: vi.fn(),
  duplicateProject: vi.fn(),
  tryReopenLastProject: vi.fn(),
  hasPendingPermissionRequest: vi.fn(() => false),
  getPendingPermissionFileName: vi.fn(() => null),
  regrantFilePermission: vi.fn(),
}));

import { tryReopenLastProject } from '../../../src/persistence/fileSystem/fileManager';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { writeRecoverySnapshot, readRecoverySnapshot, clearRecoverySnapshot } from '../../../src/persistence/indexeddb/recoveryStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

/**
 * Integration coverage for HARDENING_PERSISTENCE.md §H2 (C-04): on init, a recovery
 * snapshot newer than whatever was opened (or nothing was opened at all) must be offered;
 * accepting restores it exactly, declining discards it.
 */
describe('Recovery offer on init (T-1.23)', () => {
  beforeEach(async () => {
    await clearRecoverySnapshot();
    useProjectStore.setState({
      currentProject: null,
      isProjectLoaded: false,
      isInitializing: true,
      error: null,
      recoverySnapshot: null,
    });
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await clearRecoverySnapshot();
  });

  it('T-1.23: with no file at all, a snapshot is offered', async () => {
    vi.mocked(tryReopenLastProject).mockResolvedValue(null);
    const snapshotFile = createCyrilFile(createDefaultProject('Unsaved Snapshot'));
    await writeRecoverySnapshot(snapshotFile);

    await useProjectStore.getState().initApp();

    const state = useProjectStore.getState();
    expect(state.recoverySnapshot).not.toBeNull();
    expect(state.recoverySnapshot!.project.title).toBe('Unsaved Snapshot');
    // Nothing was auto-loaded yet — the offer is still pending a decision.
    expect(state.isProjectLoaded).toBe(false);
  });

  it('T-1.23: a snapshot newer than the reopened file is offered', async () => {
    const onDiskProject = createCyrilFile(createDefaultProject('On Disk'));
    onDiskProject.project.updatedAt = '2020-01-01T00:00:00.000Z';
    vi.mocked(tryReopenLastProject).mockResolvedValue(onDiskProject);

    const newerSnapshot = createCyrilFile(createDefaultProject('On Disk'));
    newerSnapshot.project.id = onDiskProject.project.id;
    newerSnapshot.project.updatedAt = '2025-06-01T00:00:00.000Z';
    newerSnapshot.project.title = 'On Disk (edited, unsaved)';
    await writeRecoverySnapshot(newerSnapshot);

    await useProjectStore.getState().initApp();

    const state = useProjectStore.getState();
    expect(state.recoverySnapshot).not.toBeNull();
    expect(state.recoverySnapshot!.project.title).toBe('On Disk (edited, unsaved)');
    // The file that was actually on disk is still loaded in the background so the user
    // can decline and keep working with it.
    expect(state.currentProject?.project.title).toBe('On Disk');
  });

  it('T-1.23: accepting the offer restores the snapshot exactly as currentProject and clears the offer', async () => {
    vi.mocked(tryReopenLastProject).mockResolvedValue(null);
    const snapshotFile = createCyrilFile(createDefaultProject('Recover Me'));
    await writeRecoverySnapshot(snapshotFile);

    await useProjectStore.getState().initApp();
    expect(useProjectStore.getState().recoverySnapshot).not.toBeNull();

    useProjectStore.getState().acceptRecovery();

    const state = useProjectStore.getState();
    expect(state.recoverySnapshot).toBeNull();
    expect(state.isProjectLoaded).toBe(true);
    expect(state.currentProject).toEqual(snapshotFile);
  });

  it('T-1.23: declining the offer clears the snapshot from IndexedDB and dismisses the prompt', async () => {
    vi.mocked(tryReopenLastProject).mockResolvedValue(null);
    const snapshotFile = createCyrilFile(createDefaultProject('Discard Me'));
    await writeRecoverySnapshot(snapshotFile);

    await useProjectStore.getState().initApp();
    expect(useProjectStore.getState().recoverySnapshot).not.toBeNull();

    useProjectStore.getState().declineRecovery();
    // clearRecoverySnapshot is fire-and-forget inside declineRecovery; give its promise a tick.
    await Promise.resolve();
    await Promise.resolve();

    const state = useProjectStore.getState();
    expect(state.recoverySnapshot).toBeNull();
    expect(await readRecoverySnapshot()).toBeNull();
  });

  it('a snapshot no newer than the reopened file is not offered and is cleared quietly', async () => {
    const onDiskProject = createCyrilFile(createDefaultProject('Already Saved'));
    onDiskProject.project.updatedAt = '2025-06-01T00:00:00.000Z';
    vi.mocked(tryReopenLastProject).mockResolvedValue(onDiskProject);

    const staleSnapshot = createCyrilFile(createDefaultProject('Already Saved'));
    staleSnapshot.project.id = onDiskProject.project.id;
    staleSnapshot.project.updatedAt = '2020-01-01T00:00:00.000Z';
    await writeRecoverySnapshot(staleSnapshot);

    await useProjectStore.getState().initApp();

    const state = useProjectStore.getState();
    expect(state.recoverySnapshot).toBeNull();
    expect(state.currentProject?.project.title).toBe('Already Saved');
    expect(await readRecoverySnapshot()).toBeNull();
  });

  it('a snapshot belonging to a different project than the reopened file is not offered (stale cross-project leftover)', async () => {
    const onDiskProject = createCyrilFile(createDefaultProject('Project B'));
    onDiskProject.project.updatedAt = '2020-01-01T00:00:00.000Z';
    vi.mocked(tryReopenLastProject).mockResolvedValue(onDiskProject);

    // A snapshot from an unrelated, previously-open project — newer by timestamp, but not
    // the same project.id, so it must not be offered as recovery for Project B.
    const unrelatedSnapshot = createCyrilFile(createDefaultProject('Project A'));
    unrelatedSnapshot.project.updatedAt = '2025-06-01T00:00:00.000Z';
    await writeRecoverySnapshot(unrelatedSnapshot);

    await useProjectStore.getState().initApp();

    const state = useProjectStore.getState();
    expect(state.recoverySnapshot).toBeNull();
    expect(state.currentProject?.project.title).toBe('Project B');
  });
});
