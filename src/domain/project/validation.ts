import { z } from 'zod';
import { SCHEMA_VERSION } from './defaults';

// Core structural types
const RichTextNodeSchema: z.ZodType<unknown> = z.lazy(() => z.object({
  type: z.string(),
  text: z.string().optional(),
  attrs: z.record(z.string(), z.unknown()).optional(),
  content: z.array(RichTextNodeSchema).optional(),
  marks: z.array(z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.unknown()).optional(),
  })).optional(),
}).passthrough());

const RichTextDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(RichTextNodeSchema),
}).passthrough();

const WorkspaceDocumentSchema = z.object({
  doc: RichTextDocumentSchema,
}).passthrough();

const WorkspacesSchema = z.object({
  brief: WorkspaceDocumentSchema,
  structure: WorkspaceDocumentSchema,
  hookLab: WorkspaceDocumentSchema,
  vocabularyWorld: WorkspaceDocumentSchema,
}).passthrough();

// Nested entities
const WriterSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string().optional(),
  email: z.string().optional(),
}).passthrough();

// C-20: character registry
const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.enum(['blue', 'green', 'gold', 'rose', 'violet']),
}).passthrough();

// Draft schema
const DraftSettingsSchema = z.object({
  showChords: z.boolean(),
  showSectionLabels: z.boolean(),
  showSpeakerLabels: z.boolean(),
  showStageDirections: z.boolean(),
  showSummaries: z.boolean(),
  showSyllableCounts: z.boolean(),
}).passthrough();

const DraftDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(RichTextNodeSchema), // Will enforce section blocks loosely here for now
}).passthrough();

const InventoryDocumentSchema = z.object({
  type: z.literal('inventory'),
  doc: RichTextDocumentSchema,
}).passthrough();

const DraftSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  mode: z.enum(['lyrics', 'lyricsWithChords']),
  doc: DraftDocumentSchema,
  inventory: InventoryDocumentSchema,
  draftSettings: DraftSettingsSchema,
}).passthrough();

// Project settings schemas
const DisplaySettingsSchema = z.object({
  defaultShowChords: z.boolean(),
  defaultShowSectionLabels: z.boolean(),
  defaultShowSpeakerLabels: z.boolean(),
  defaultShowStageDirections: z.boolean(),
  defaultShowSummaries: z.boolean(),
  defaultShowSyllableCounts: z.boolean(),
  rhymeColorMode: z.enum(['off', 'manual']),
}).passthrough();

const ExportSettingsSchema = z.object({
  includeSectionLabels: z.boolean(),
  includeSpeakerLabels: z.boolean(),
  includeStageDirections: z.boolean(),
  includeChords: z.boolean(),
  fontPreset: z.enum(['default']),
  pageDensity: z.enum(['normal', 'compact']),
}).passthrough();

const ProjectSettingsSchema = z.object({
  autosave: z.boolean(),
  preferredExportMode: z.enum(['lyricsOnly', 'lyricsWithChords']),
}).passthrough();

// Top level project schemas
export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  writers: z.array(WriterSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  workspaces: WorkspacesSchema,
  drafts: z.array(DraftSchema),
  activeDraftId: z.string().nullable(),
  displaySettings: DisplaySettingsSchema,
  exportSettings: ExportSettingsSchema,
  projectSettings: ProjectSettingsSchema,
  characters: z.array(CharacterSchema).optional(),
}).passthrough();

export const CyrilFileSchema = z.object({
  schemaVersion: z.string(),
  project: ProjectSchema,
}).passthrough();

export function validateCyrilFile(data: unknown) {
  return CyrilFileSchema.parse(data);
}

// ─── Load-time guards (HARDENING_PERSISTENCE.md §H5 / C-02) ──────────────────

/**
 * Thrown when a `.cyril` file's `schemaVersion` is newer than this app supports.
 * `migrateProject` fills in missing fields with defaults by design (for legacy/partial
 * files) — but blindly running a newer, unrecognized schema through that same defaulting
 * logic risks silently dropping or corrupting data the file's own (newer) app understands.
 * Surface a clear, actionable error instead; the source file itself is never touched.
 */
export class UnsupportedSchemaVersionError extends Error {
  constructor(public readonly fileVersion: string, public readonly appVersion: string) {
    super(
      `This project was saved with a newer version of Cyril (schema ${fileVersion}) than ` +
      `this app supports (schema ${appVersion}). Update Cyril to open it safely — opening ` +
      `it here could lose data.`
    );
    this.name = 'UnsupportedSchemaVersionError';
  }
}

function compareSchemaVersions(a: string, b: string): number {
  const partsA = a.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const partsB = b.split('.').map((n) => Number.parseInt(n, 10) || 0);
  const len = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < len; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Guards against silently "migrating" a file declaring a newer, unsupported schema.
 * Only rejects when `schemaVersion` is present and explicitly newer than `SCHEMA_VERSION` —
 * files with no `schemaVersion` at all (legacy/raw exports) are left to the normal
 * migration path, which already fills in missing fields safely.
 */
export function assertSupportedSchemaVersion(data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const schemaVersion = (data as { schemaVersion?: unknown }).schemaVersion;
  if (typeof schemaVersion !== 'string') return;
  if (compareSchemaVersions(schemaVersion, SCHEMA_VERSION) > 0) {
    throw new UnsupportedSchemaVersionError(schemaVersion, SCHEMA_VERSION);
  }
}

/**
 * Guards against silently coercing an unrelated JSON document into a blank default
 * project. `migrateProject` fills in every missing field with sensible defaults (by design,
 * for legacy/partial `.cyril` files) — without this check, a JSON file with none of a
 * Cyril project's identifying fields (e.g. `{"hello":"world"}`) would "migrate"
 * successfully into an empty project instead of surfacing an error.
 */
export function assertLooksLikeCyrilData(data: unknown): void {
  if (!data || typeof data !== 'object') {
    throw new Error('This file is not a valid Cyril project.');
  }
  const obj = data as Record<string, unknown>;
  const candidate =
    obj.project && typeof obj.project === 'object' ? (obj.project as Record<string, unknown>) : obj;
  const hasIdentity = typeof candidate.id === 'string' && typeof candidate.title === 'string';
  if (!hasIdentity) {
    throw new Error('This file is not a valid Cyril project.');
  }
}
