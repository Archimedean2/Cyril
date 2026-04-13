import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectStore } from '../../../src/app/state/projectStore';
import * as fileManager from '../../../src/persistence/fileSystem/fileManager';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

vi.mock('../../../src/persistence/fileSystem/fileManager');

describe('Project CRUD Integration', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useProjectStore.setState({
      isProjectLoaded: false,
      currentProject: null,
      error: null,
    });
  });

  it('T-1.07: Create project flow succeeds', () => {
    const store = useProjectStore.getState();
    const newFile = createCyrilFile(createDefaultProject('New Test'));
    vi.mocked(fileManager.createNewProject).mockReturnValue(newFile);

    store.createProject('New Test');
    
    const updated = useProjectStore.getState();
    expect(updated.isProjectLoaded).toBe(true);
    expect(updated.currentProject?.project.title).toBe('New Test');
  });

  it('T-1.08: Rename project title persists in state', () => {
    const store = useProjectStore.getState();
    const newFile = createCyrilFile(createDefaultProject('Initial'));
    vi.mocked(fileManager.createNewProject).mockReturnValue(newFile);

    store.createProject('Initial');
    useProjectStore.getState().renameProject('Renamed');
    
    const updated = useProjectStore.getState();
    expect(updated.currentProject?.project.title).toBe('Renamed');
  });

  it('T-1.09: Duplicate project generates new IDs', () => {
    const store = useProjectStore.getState();
    const originalFile = createCyrilFile(createDefaultProject('Original'));
    vi.mocked(fileManager.createNewProject).mockReturnValue(originalFile);
    
    store.createProject('Original');
    
    const originalId = useProjectStore.getState().currentProject?.project.id;
    
    // Mock the duplicate return
    const duplicatedFile = createCyrilFile({
      ...originalFile.project,
      id: 'proj_new123',
      title: 'Original (Copy)',
    });
    vi.mocked(fileManager.duplicateProject).mockReturnValue(duplicatedFile);

    useProjectStore.getState().duplicateProject('Original (Copy)');
    
    const duplicated = useProjectStore.getState();
    expect(duplicated.currentProject?.project.title).toBe('Original (Copy)');
    expect(duplicated.currentProject?.project.id).not.toBe(originalId);
  });

  it('T-1.06: Save/load round trip preserves project content via mocked fileSystem', async () => {
    const file = createCyrilFile(createDefaultProject('Roundtrip'));
    vi.mocked(fileManager.openProject).mockResolvedValue(file);
    
    const store = useProjectStore.getState();
    await store.openProject();
    
    expect(useProjectStore.getState().isProjectLoaded).toBe(true);
    expect(useProjectStore.getState().currentProject?.project.title).toBe('Roundtrip');

    // Simulate save
    vi.mocked(fileManager.saveProject).mockResolvedValue(undefined);
    await useProjectStore.getState().saveProject();
    
    expect(fileManager.saveProject).toHaveBeenCalled();
  });

  it('T-1.10: Invalid project file fails gracefully', async () => {
    const store = useProjectStore.getState();
    vi.mocked(fileManager.openProject).mockRejectedValue(new Error('Failed to parse .cyril file as JSON'));

    await store.openProject();
    
    const updated = useProjectStore.getState();
    expect(updated.isProjectLoaded).toBe(false);
    expect(updated.error).toBe('Failed to parse .cyril file as JSON');
  });
});
