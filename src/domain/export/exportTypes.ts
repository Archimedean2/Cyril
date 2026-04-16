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
}

export interface ExportableLine {
  type: 'lyric' | 'speaker' | 'stageDirection' | 'paragraph';
  content: string;
  speaker?: string;
  stageDirection?: string;
  chords?: ExportableChord[];
}

export interface ExportableChord {
  symbol: string;
  offset: number;
}

export interface ExportableSection {
  id: string;
  sectionType: string;
  label?: string;
  summary?: string;
  lines: ExportableLine[];
}

export interface ExportableDraft {
  draftName: string;
  projectTitle: string;
  sections: ExportableSection[];
}
