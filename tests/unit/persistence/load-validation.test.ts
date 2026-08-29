import { describe, it, expect } from 'vitest';
import { deserializeProject, serializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile, SCHEMA_VERSION } from '../../../src/domain/project/defaults';

/**
 * Unit coverage for HARDENING_PERSISTENCE.md §H5 (C-02): every open is routed through
 * validation, and a corrupt / non-JSON / wrong-schema / newer-than-supported file must
 * surface a friendly error rather than crashing or being silently coerced into a blank
 * project.
 */
describe('Load validation (C-02 / HARDENING §H5)', () => {
  it('T-1.26: truncated/non-JSON content surfaces a friendly parse error, not a crash', () => {
    expect(() => deserializeProject('{ "schemaVersion": "1.0.0", "project": { tru')).toThrow(/json/i);
  });

  it('T-1.26: empty string content surfaces a friendly error, not a crash', () => {
    expect(() => deserializeProject('')).toThrow();
  });

  it('T-1.26: a well-formed but unrelated JSON document is rejected instead of silently becoming a blank project', () => {
    const unrelated = JSON.stringify({ hello: 'world', count: 42 });

    expect(() => deserializeProject(unrelated)).toThrow(/not a valid cyril project/i);
  });

  it('T-1.26: a JSON array or primitive at the top level is rejected, not crashed on', () => {
    expect(() => deserializeProject('42')).toThrow();
    expect(() => deserializeProject('null')).toThrow();
    expect(() => deserializeProject('[1,2,3]')).toThrow();
  });

  it('T-1.26: valid project content still loads normally (regression guard against over-rejecting)', () => {
    const file = createCyrilFile(createDefaultProject('Regular Song'));
    const json = serializeProject(file);

    expect(() => deserializeProject(json)).not.toThrow();
    expect(deserializeProject(json).project.title).toBe('Regular Song');
  });

  it('T-1.26: legacy raw project data with no wrapper still migrates normally (regression guard)', () => {
    const legacy = JSON.stringify({
      id: 'proj_legacy',
      title: 'Legacy Unwrapped',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      drafts: [],
    });

    const result = deserializeProject(legacy);
    expect(result.project.title).toBe('Legacy Unwrapped');
    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('T-1.27: a newer schemaVersion than this app supports is rejected rather than blindly migrated', () => {
    const file = createCyrilFile(createDefaultProject('Future Song'));
    const future = { ...file, schemaVersion: '99.0.0' };

    expect(() => deserializeProject(JSON.stringify(future))).toThrow(/newer version of cyril/i);
  });

  it('T-1.27: a schemaVersion equal to the current SCHEMA_VERSION still loads normally', () => {
    const file = createCyrilFile(createDefaultProject('Same Version Song'));
    const json = serializeProject(file);

    const result = deserializeProject(json);
    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.project.title).toBe('Same Version Song');
  });

  it('T-1.27: an older schemaVersion still migrates normally (forward-compat guard does not over-reject)', () => {
    const file = createCyrilFile(createDefaultProject('Older Version Song'));
    const older = { ...file, schemaVersion: '0.9.0' };

    expect(() => deserializeProject(JSON.stringify(older))).not.toThrow();
  });
});
