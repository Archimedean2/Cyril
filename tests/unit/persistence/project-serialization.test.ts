import { describe, it, expect } from 'vitest';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { serializeProject, deserializeProject } from '../../../src/persistence/serializers/projectSerializer';

describe('Project Serialization (T-1.05)', () => {
  it('preserves unknown extra fields during serialization/deserialization', () => {
    const defaultProject = createDefaultProject('Extensible Project');
    const file = createCyrilFile(defaultProject);

    // Add an unknown field not typed or validated
    const extendedFile = {
      ...file,
      project: {
        ...file.project,
        customExperimentalPluginData: { foo: 'bar', count: 42 },
      }
    };

    // Serialize
    const serialized = serializeProject(extendedFile as any);
    expect(serialized).toContain('customExperimentalPluginData');

    // Deserialize
    const loaded = deserializeProject(serialized);

    // Assert the unknown field remains intact
    expect(loaded.project.customExperimentalPluginData).toBeDefined();
    expect(loaded.project.customExperimentalPluginData.foo).toBe('bar');
    expect(loaded.project.customExperimentalPluginData.count).toBe(42);
  });
});
