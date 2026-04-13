import { describe, it, expect } from 'vitest';
import { migrateProject } from '../../../src/domain/project/migration';
import { SCHEMA_VERSION } from '../../../src/domain/project/defaults';

describe('Project Migration (T-1.04)', () => {
  it('normalizes missing optional fields to defaults', () => {
    // Minimal raw project missing drafts, displaySettings, etc.
    const rawData = {
      project: {
        id: 'proj_test',
        title: 'Legacy Project',
        createdAt: '2026-04-12T12:00:00.000Z',
        updatedAt: '2026-04-12T12:00:00.000Z',
      }
    };

    const migrated = migrateProject(rawData);

    // Assert schemaVersion added
    expect(migrated.schemaVersion).toBe(SCHEMA_VERSION);

    // Assert missing required fields added with defaults
    expect(migrated.project.drafts).toEqual([]);
    expect(migrated.project.workspaces.brief).toBeDefined();
    expect(migrated.project.displaySettings.defaultShowChords).toBe(true);
    expect(migrated.project.exportSettings.pageDensity).toBe('normal');
    expect(migrated.project.title).toBe('Legacy Project');
  });

  it('preserves existing values during migration', () => {
    const rawData = {
      project: {
        id: 'proj_test_2',
        title: 'Has Settings',
        displaySettings: {
          defaultShowChords: false, // Changed from default
        }
      }
    };

    const migrated = migrateProject(rawData);

    expect(migrated.project.displaySettings.defaultShowChords).toBe(false);
    expect(migrated.project.displaySettings.defaultShowSectionLabels).toBe(true); // Default applied for missing sibling
  });
});
