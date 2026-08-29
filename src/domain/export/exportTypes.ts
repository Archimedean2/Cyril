/**
 * Export domain types and constants
 */

import type { ExportSettings, PrintProfileId } from '../project/types';

export type ExportTarget = 'markdown' | 'print';
// Re-export PrintProfileId so callers don't need to know it lives in types.ts
export type { PrintProfileId };

export interface PrintProfileDefinition {
  id: PrintProfileId;
  label: string;
  description: string;
}

export const PRINT_PROFILES: PrintProfileDefinition[] = [
  {
    id: 'lyricSheet',
    label: 'Lyric sheet',
    description: 'Lyrics only. Clean and literary — no chords, no stage directions.',
  },
  {
    id: 'chordSheet',
    label: 'Chord sheet',
    description: 'Chords above lyrics in a mono font, with section labels — for rehearsal and accompaniment.',
  },
  {
    id: 'libretto',
    label: 'Script / libretto',
    description: 'Characters and stage directions in theatre format.',
  },
  {
    id: 'annotated',
    label: 'Annotated',
    description: 'Lyric sheet with alternates and notes in the margin, for collaboration.',
  },
];

export const DEFAULT_PRINT_PROFILE: PrintProfileId = 'lyricSheet';

/**
 * Resolve the project's stored print profile, falling back to the default
 * when the field is absent (older files, or a file never touched by the
 * print dialog).
 */
export function getStoredPrintProfile(exportSettings: ExportSettings | undefined): PrintProfileId {
  return exportSettings?.printProfile ?? DEFAULT_PRINT_PROFILE;
}

export interface ResolvedExportOptions {
  includeSectionLabels: boolean;
  includeSpeakerLabels: boolean;
  includeStageDirections: boolean;
  includeChords: boolean;
  // Optional so existing call sites/fixtures built before the print-profile
  // work (C-22) keep compiling; both default to the plain, pre-profile
  // rendering (`DEFAULT_PRINT_PROFILE`, no alternates margin) when absent.
  includeAlternates?: boolean;
  pageDensity: 'normal' | 'compact';
  concurrentLayout: 'squash' | 'sideBySide';
  printProfile?: PrintProfileId;
}

export interface ExportableAlternate {
  id: string;
  label?: string;
  text: string;
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
  // Annotated profile only: other (non-active) alternates for this line
  alternates?: ExportableAlternate[];
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
