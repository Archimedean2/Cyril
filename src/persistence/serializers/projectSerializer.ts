import { CyrilFile } from '../../domain/project/types';
import { validateCyrilFile } from '../../domain/project/validation';
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
  } catch (error) {
    throw new Error('Failed to parse .cyril file as JSON');
  }

  // 1. Migrate (fills defaults, handles unknown/missing fields safely)
  const migrated = migrateProject(rawData);

  // 2. Validate against current schema
  validateCyrilFile(migrated);

  return migrated;
}
