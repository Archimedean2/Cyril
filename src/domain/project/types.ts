export type ConcurrentLayout = 'squash' | 'sideBySide';
export type SectionType = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'spoken' | 'reprise' | 'custom';
export type DraftMode = 'lyrics' | 'lyricsWithChords';
export type RhymeColorMode = 'off' | 'manual';
export type ExportFontPreset = 'default';
export type PageDensity = 'normal' | 'compact';
export type PreferredExportMode = 'lyricsOnly' | 'lyricsWithChords';
export type ChordAnchorType = 'char';
export type ChordBias = 'before' | 'on' | 'after';

/**
 * The section-accent family a character's identity colour is drawn from
 * (`--section-blue`, `-green`, `-gold`, `-rose`, `-violet` — see
 * `docs/design/UI_TOKENS.md`). Colours are auto-assigned in this order and
 * cycle if there are more than five characters (C-20).
 */
export type CharacterColor = 'blue' | 'green' | 'gold' | 'rose' | 'violet';

export interface Writer {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

/**
 * A first-class character/speaker identity (C-20). Lives at project level in
 * `CyrilProject.characters` — see `docs/engineering/DATA_MODEL.md`.
 */
export interface Character {
  id: string;
  name: string;
  color: CharacterColor;
}

export interface RichTextNode {
  type: string;
  text?: string;
  // Open ProseMirror attribute bag: node-specific attrs (id, meta, chords, …)
  // are read structurally across the editor and export layers, so a
  // narrower type here would not be assignable at every call site.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attrs?: Record<string, any>;
  content?: RichTextNode[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  marks?: Array<{ type: string; attrs?: Record<string, any> }>;
}

export interface RichTextDocument {
  type: 'doc';
  content: RichTextNode[];
}

export interface WorkspaceDocument {
  doc: RichTextDocument;
}

export interface Workspaces {
  brief: WorkspaceDocument;
  structure: WorkspaceDocument;
  hookLab: WorkspaceDocument;
  vocabularyWorld: WorkspaceDocument;
}

export interface ChordPosition {
  anchorType: ChordAnchorType;
  charOffset: number;
  bias: ChordBias;
}

export interface ChordMarker {
  id: string;
  symbol: string;
  position: ChordPosition;
}

export interface ProsodyData {
  syllableCount: number;
  stressPattern?: string[];
  lastComputedAt?: string;
}

export interface AlternateLine {
  id: string;
  label?: string;
  doc: RichTextDocument;
  isActive: boolean;
}

export interface LyricLineMeta {
  alternates: AlternateLine[];
  prosody: ProsodyData | null;
  chords: ChordMarker[];
}

export interface LyricLineAttrs {
  id: string;
  rhymeGroup: string | null;
  lineType: 'lyric' | 'speaker' | 'stageDirection';
  /**
   * C-20: links a `lineType: 'speaker'` line to a `Character` in
   * `CyrilProject.characters`. Null/absent means the line isn't linked to a
   * registered character yet (e.g. not yet finalized, or a legacy project
   * that hasn't been reconciled). Meaningless on non-speaker lines.
   */
  characterId?: string | null;
}

export interface LyricLineNode extends RichTextNode {
  type: 'lyricLine';
  attrs: LyricLineAttrs;
  meta: LyricLineMeta;
}

export interface StageDirectionNode extends RichTextNode {
  type: 'stageDirection';
  content?: RichTextNode[];
}

export interface SpeakerLineNode extends RichTextNode {
  type: 'speakerLine';
  content?: RichTextNode[];
}

export interface SectionBlockAttrs {
  id: string;
  sectionType: SectionType;
  label?: string;
  summary?: string;
  color?: string | null;
}

export interface SectionBlockNode extends RichTextNode {
  type: 'sectionBlock';
  attrs: SectionBlockAttrs;
}

export interface SpeakerColumnAttrs {
  id: string;
  speakerName: string;
  /** C-20: links this column to a `Character`, same semantics as `LyricLineAttrs.characterId`. */
  characterId?: string | null;
}

export interface SpeakerColumnNode extends RichTextNode {
  type: 'speakerColumn';
  attrs: SpeakerColumnAttrs;
  content?: LyricLineNode[];
}

export interface ConcurrentBlockAttrs {
  id: string;
}

export interface ConcurrentBlockNode extends RichTextNode {
  type: 'concurrentBlock';
  attrs: ConcurrentBlockAttrs;
  content?: SpeakerColumnNode[];
}

export interface DraftDocument {
  type: 'doc';
  content: (SectionBlockNode | ConcurrentBlockNode | RichTextNode)[];
}

export interface InventoryDocument {
  type: 'inventory';
  doc: RichTextDocument;
}

export interface DraftSettings {
  showChords: boolean;
  showSectionLabels: boolean;
  showSpeakerLabels: boolean;
  showStageDirections: boolean;
  showSummaries: boolean;
  showSyllableCounts: boolean;
  showStressMarks: boolean;
}

export interface Draft {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  mode: DraftMode;
  doc: DraftDocument;
  inventory: InventoryDocument;
  draftSettings: DraftSettings;
}

export interface DisplaySettings {
  defaultShowChords: boolean;
  defaultShowSectionLabels: boolean;
  defaultShowSpeakerLabels: boolean;
  defaultShowStageDirections: boolean;
  defaultShowSummaries: boolean;
  defaultShowSyllableCounts: boolean;
  rhymeColorMode: RhymeColorMode;
}

export interface ExportSettings {
  includeSectionLabels: boolean;
  includeSpeakerLabels: boolean;
  includeStageDirections: boolean;
  includeChords: boolean;
  fontPreset: ExportFontPreset;
  pageDensity: PageDensity;
  concurrentLayout: ConcurrentLayout;
}

export interface ProjectSettings {
  autosave: boolean;
  preferredExportMode: PreferredExportMode;
}

export interface CyrilProject {
  id: string;
  title: string;
  subtitle?: string;
  writers?: Writer[];
  createdAt: string;
  updatedAt: string;
  workspaces: Workspaces;
  drafts: Draft[];
  activeDraftId: string | null;
  displaySettings: DisplaySettings;
  exportSettings: ExportSettings;
  projectSettings: ProjectSettings;
  /**
   * C-20: the project's character/speaker registry. Project-level (not
   * per-draft) — see `docs/engineering/DATA_MODEL.md`. Optional in the type
   * (like `writers`) so existing hand-built `CyrilProject` fixtures outside
   * this feature's scope don't need updating; `createDefaultProject` and
   * `migrateProject` always populate it in practice, and every reader in
   * this codebase treats it as `characters ?? []`.
   */
  characters?: Character[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow unknown fields (read directly by consumers/tests)
}

export interface CyrilFile {
  schemaVersion: string;
  project: CyrilProject;
}
