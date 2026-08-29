/**
 * Export domain types and constants
 */

export type ExportTarget = 'markdown' | 'print';

export interface ResolvedExportOptions {
  includeSectionLabels: boolean;
  includeSpeakerLabels: boolean;
  includeStageDirections: boolean;
  includeChords: boolean;
  pageDensity: 'normal' | 'compact';
  concurrentLayout: 'squash' | 'sideBySide';
}

export interface ExportableLine {
  type: 'lyric' | 'speaker' | 'stageDirection' | 'paragraph';
  content: string;
  speaker?: string;
  /**
   * C-20: the speaker's resolved character colour, as a section-accent
   * token (`'blue' | 'green' | 'gold' | 'rose' | 'violet'`) — present only
   * on `type: 'speaker'` lines whose character resolves to one. Consumers
   * (print) render it via `var(--section-<token>)`, same as
   * `SectionBlockAttrs.color` / `Character.color` — see
   * `docs/engineering/DATA_MODEL.md`.
   */
  speakerColor?: string;
  stageDirection?: string;
  chords?: ExportableChord[];
  // Side-by-side concurrent block embedded inline within a section
  _concurrent?: ConcurrentSectionExport;
}

export interface ExportableChord {
  symbol: string;
  offset: number;
}

export interface ConcurrentColumnExport {
  speakerName: string;
  /** C-20: see `ExportableLine.speakerColor`. */
  speakerColor?: string;
  lines: ExportableLine[];
}

export interface ConcurrentSectionExport {
  type: 'concurrent';
  columns: ConcurrentColumnExport[];
}

export interface ExportableSection {
  id: string;
  sectionType: string;
  label?: string;
  summary?: string;
  lines: ExportableLine[];
  concurrent?: ConcurrentSectionExport;
}

export interface ExportableDraft {
  draftName: string;
  projectTitle: string;
  sections: ExportableSection[];
}
