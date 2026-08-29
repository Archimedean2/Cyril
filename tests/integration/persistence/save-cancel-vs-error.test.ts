import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectStore } from '../../../src/app/state/projectStore';
import * as fileManager from '../../../src/persistence/fileSystem/fileManager';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

vi.mock('../../../src/persistence/fileSystem/fileManager');

/**
 * projectStore.saveProject()/saveProjectAs() must let callers (the save-status indicator)
 * tell apart three outcomes of fileManager.saveProject() (HARDENING §H6 / C-07):
 *  - resolves `true`  → actually wrote to disk
 *  - resolves `false` → cancelled on purpose (picker dismissed, or the user declined to
 *    overwrite a file that changed outside Cyril) — not an error, nothing to report
 *  - rejects          → a genuine failure (permission denied, disk error, autosave
 *    detecting an external change with no gesture to ask with, ...)
 */
describe('projectStore save contract: cancelled vs. failed', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(createDefaultProject('Contract Test')),
      error: null,
    });
  });

  it('T-1.28: a cancelled save (fileManager resolves false) resolves false and records no error', async () => {
    vi.mocked(fileManager.saveProject).mockResolvedValue(false);

    const wrote = await useProjectStore.getState().saveProject();

    expect(wrote).toBe(false);
    expect(useProjectStore.getState().error).toBeNull();
  });

  it('T-1.28: a genuine save failure rejects and records the error', async () => {
    vi.mocked(fileManager.saveProject).mockRejectedValue(new Error('disk full'));

    await expect(useProjectStore.getState().saveProject()).rejects.toThrow('disk full');
    expect(useProjectStore.getState().error).toBe('disk full');
  });

  it('T-1.28: saveProjectAs mirrors the same cancelled-vs-failed contract', async () => {
    vi.mocked(fileManager.saveProject).mockResolvedValue(false);
    await expect(useProjectStore.getState().saveProjectAs()).resolves.toBe(false);
    expect(useProjectStore.getState().error).toBeNull();

    vi.mocked(fileManager.saveProject).mockRejectedValue(new Error('permission denied'));
    await expect(useProjectStore.getState().saveProjectAs()).rejects.toThrow('permission denied');
    expect(useProjectStore.getState().error).toBe('permission denied');
  });
});
