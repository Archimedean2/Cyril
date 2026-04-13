import { describe, it, expect } from 'vitest';
import { validateCyrilFile } from '../../../src/domain/project/validation';
import { createDefaultProject, SCHEMA_VERSION } from '../../../src/domain/project/defaults';

describe('Project Validation', () => {
  it('T-1.02: accepts valid minimal project', () => {
    const project = createDefaultProject('Minimal Valid');
    const validData = {
      schemaVersion: SCHEMA_VERSION,
      project,
    };
    
    expect(() => validateCyrilFile(validData)).not.toThrow();
  });

  it('T-1.03: rejects missing required fields', () => {
    const project = createDefaultProject('Invalid');
    
    // Test missing title
    const { title, ...projectWithoutTitle } = project;
    const missingTitleData = {
      schemaVersion: SCHEMA_VERSION,
      project: projectWithoutTitle,
    };

    expect(() => validateCyrilFile(missingTitleData)).toThrow();

    // Test missing schemaVersion
    const missingSchemaData = {
      project,
    };

    expect(() => validateCyrilFile(missingSchemaData)).toThrow();
  });
});
