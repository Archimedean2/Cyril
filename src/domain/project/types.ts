export type DeliveryMode = 'sung' | 'spoken';
export type ConcurrentLayout = 'squash' | 'sideBySide';
export type SectionType = 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'spoken' | 'reprise' | 'custom';
export type DraftMode = 'lyrics' | 'lyricsWithChords';
export type RhymeColorMode = 'off' | 'manual';
export type ExportFontPreset = 'default';
export type PageDensity = 'normal' | 'compact';
export type PreferredExportMode = 'lyricsOnly' | 'lyricsWithChords';
export type ChordAnchorType = 'char';
export type ChordBias = 'before' | 'on' | 'after';

export interface Writer {
  id: string;
  name: string;
  role?: string;
  email?: string;
}

export interface RichTextNode {
  type: string;
  text?: string;
  attrs?: Record<string, any>;
  content?: RichTextNode[];
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
  delivery: DeliveryMode;
  rhymeGroup: string | null;
  lineType: 'lyric' | 'speaker' | 'stageDirection';
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
  [key: string]: any; // Allow unknown fields
}

export interface CyrilFile {
  schemaVersion: string;
  project: CyrilProject;
}
