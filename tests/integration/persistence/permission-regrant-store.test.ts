import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectStore } from '../../../src/app/state/projectStore';
import * as fileManager from '../../../src/persistence/fileSystem/fileManager';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

vi.mock('../../../src/persistence/fileSystem/fileManager');

/**
 * Integration coverage for BACKLOG C-29's `projectStore.regrantPermission()`: the store
 * action the `PermissionBanner`'s "Reconnect" click calls. fileManager itself is mocked
 * (the low-level `requestPermission`/read behaviour is covered directly in
 * tests/unit/persistence/permission-regrant.test.ts) — this proves the store wires the
 * three outcomes to the right state.
 */
describe('projectStore.regrantPermission (C-29)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('T-1.31: no project loaded yet — a successful regrant adopts the reconnected file and clears the banner', async () => {
    useProjectStore.setState({
      currentProject: null,
      isProjectLoaded: false,
      permissionLockedFileName: 'reconnect-me.cyril',
      error: null,
    });
    const reconnected = createCyrilFile(createDefaultProject('Reconnected'));
    vi.mocked(fileManager.regrantFilePermission).mockResolvedValue(reconnected);
    vi.mocked(fileManager.hasPendingPermissionRequest).mockReturnValue(false);

    await useProjectStore.getState().regrantPermission();

    const state = useProjectStore.getState();
    expect(state.currentProject?.project.title).toBe('Reconnected');
    expect(state.isProjectLoaded).toBe(true);
    expect(state.permissionLockedFileName).toBeNull();
  });

  it('T-1.31: a project already loaded (e.g. from a recovery snapshot) keeps its own content on a successful regrant', async () => {
    const recovered = createCyrilFile(createDefaultProject('Recovered Locally'));
    useProjectStore.setState({
      currentProject: recovered,
      isProjectLoaded: true,
      permissionLockedFileName: 'reconnect-me.cyril',
      error: null,
    });
    const diskVersion = createCyrilFile(createDefaultProject('On Disk (Older)'));
    vi.mocked(fileManager.regrantFilePermission).mockResolvedValue(diskVersion);
    vi.mocked(fileManager.hasPendingPermissionRequest).mockReturnValue(false);

    await useProjectStore.getState().regrantPermission();

    const state = useProjectStore.getState();
    // The already-loaded in-memory project (from the recovery snapshot) is not clobbered
    // by the freshly re-read disk content — only the banner clears.
    expect(state.currentProject?.project.title).toBe('Recovered Locally');
    expect(state.permissionLockedFileName).toBeNull();
  });

  it('T-1.31: declining the permission prompt again leaves the banner up for another try', async () => {
    useProjectStore.setState({
      currentProject: null,
      isProjectLoaded: false,
      permissionLockedFileName: 'still-locked.cyril',
      error: null,
    });
    vi.mocked(fileManager.regrantFilePermission).mockResolvedValue(null);
    vi.mocked(fileManager.hasPendingPermissionRequest).mockReturnValue(true);

    await useProjectStore.getState().regrantPermission();

    expect(useProjectStore.getState().permissionLockedFileName).toBe('still-locked.cyril');
  });

  it('T-1.31: a file gone/corrupt by the time permission is regranted clears the banner (nothing left to reconnect to)', async () => {
    useProjectStore.setState({
      currentProject: null,
      isProjectLoaded: false,
      permissionLockedFileName: 'now-gone.cyril',
      error: null,
    });
    vi.mocked(fileManager.regrantFilePermission).mockResolvedValue(null);
    vi.mocked(fileManager.hasPendingPermissionRequest).mockReturnValue(false);

    await useProjectStore.getState().regrantPermission();

    expect(useProjectStore.getState().permissionLockedFileName).toBeNull();
  });
});
