import { describe, it, expect } from 'vitest';
import { createDefaultProject, SCHEMA_VERSION } from '../../../src/domain/project/defaults';
import { validateCyrilFile } from '../../../src/domain/project/validation';

describe('Project Defaults (T-1.01)', () => {
  it('should generate a valid default project matching the schema', () => {
    const project = createDefaultProject('Test Song');
    const file = {
      schemaVersion: SCHEMA_VERSION,
      project,
    };

    // The validation function should not throw
    expect(() => validateCyrilFile(file)).not.toThrow();
    
    // Check specific fields
    expect(file.schemaVersion).toBe('1.0.0');
    expect(file.project.title).toBe('Test Song');
    expect(file.project.workspaces).toHaveProperty('brief');
    expect(file.project.workspaces).toHaveProperty('vocabularyWorld');
    
    expect(file.project.drafts.length).toBe(1);
    expect(file.project.drafts[0].name).toBe('Draft 1');
    expect(file.project.activeDraftId).toBeNull();
  });
});
