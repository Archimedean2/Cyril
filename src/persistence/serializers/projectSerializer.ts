import { CyrilFile } from '../../domain/project/types';
import { validateCyrilFile, assertSupportedSchemaVersion, assertLooksLikeCyrilData } from '../../domain/project/validation';
import { migrateProject } from '../../domain/project/migration';

export function serializeProject(file: CyrilFile): string {
  // Validate before saving to ensure we don't serialize invalid state
  validateCyrilFile(file);
  return JSON.stringify(file, null, 2);
}

export function deserializeProject(jsonString: string): CyrilFile {
  let rawData: unknown;
  try {
    rawData = JSON.parse(jsonString);
  } catch {
    throw new Error('Failed to parse .cyril file as JSON');
  }

  // 1. Never blindly "migrate" (and thereby risk corrupting) a file from a newer,
  //    unsupported schema, and never silently coerce unrelated JSON into a blank
  //    project — surface a clear, friendly error before touching migration at all
  //    (HARDENING_PERSISTENCE.md §H5 / C-02).
  assertSupportedSchemaVersion(rawData);
  assertLooksLikeCyrilData(rawData);

  // 2. Migrate (fills defaults, handles unknown/missing fields safely)
  const migrated = migrateProject(rawData);

  // 3. Validate against current schema
  validateCyrilFile(migrated);

  return migrated;
}
