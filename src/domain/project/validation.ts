import { z } from 'zod';

// Core structural types
const RichTextNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  type: z.string(),
  text: z.string().optional(),
  attrs: z.record(z.string(), z.any()).optional(),
  content: z.array(RichTextNodeSchema).optional(),
  marks: z.array(z.object({
    type: z.string(),
    attrs: z.record(z.string(), z.any()).optional(),
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
}).passthrough();

export const CyrilFileSchema = z.object({
  schemaVersion: z.string(),
  project: ProjectSchema,
}).passthrough();

export function validateCyrilFile(data: unknown) {
  return CyrilFileSchema.parse(data);
}
