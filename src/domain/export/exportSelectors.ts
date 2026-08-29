/**
 * Export selectors - transforms canonical draft data into export-ready representation
 */

import { CyrilFile, Draft, RichTextNode, SectionType, ChordMarker, LyricLineMeta, AlternateLine, RichTextDocument } from '../project/types';
import { ExportableDraft, ExportableSection, ExportableLine, ExportableChord, ExportableAlternate, ResolvedExportOptions, ConcurrentSectionExport } from './exportTypes';
import { squashConcurrentBlock, buildSideBySideConcurrentBlock } from './concurrentExport';

/**
 * Select the current active draft from project state
 */
export function selectActiveDraft(projectFile: CyrilFile, activeDraftId: string | null): Draft | null {
  if (!activeDraftId) return null;
  return projectFile.project.drafts.find(d => d.id === activeDraftId) || null;
}

/**
 * Build exportable draft from canonical data
 */
export function buildExportableDraft(
  projectFile: CyrilFile,
  draft: Draft,
  options: ResolvedExportOptions
): ExportableDraft {
  const sections: ExportableSection[] = [];

  // Process draft document content (should be section blocks)
  const content = draft.doc.content || [];

  for (const node of content) {
    if (node.type === 'sectionBlock') {
      const section = processSectionBlock(node, options);
      if (section) {
        sections.push(section);
      }
    } else if (node.type === 'concurrentBlock') {
      // Top-level concurrent block — wrap as a synthetic section
      const concLines = processConcurrentBlockNode(node, options);
      if (concLines.lines.length > 0 || concLines.concurrent) {
        sections.push(concLines);
      }
    }
  }

  return {
    draftName: draft.name,
    projectTitle: projectFile.project.title,
    sections,
  };
}

/**
 * Build an ExportableSection from a top-level concurrentBlock node.
 * (Concurrent blocks at top-level get a synthetic wrapper section.)
 */
function processConcurrentBlockNode(
  node: RichTextNode,
  options: ResolvedExportOptions
): ExportableSection {
  const isSideBySide = options.concurrentLayout === 'sideBySide';

  if (isSideBySide) {
    const built = buildSideBySideConcurrentBlock(node, options);
    const concurrent: ConcurrentSectionExport = { type: 'concurrent', columns: built.columns };
    return {
      id: node.attrs?.id || '',
      sectionType: 'concurrent' as SectionType,
      lines: [],
      concurrent,
    };
  }

  // Squash
  const lines = squashConcurrentBlock(node, options);
  return {
    id: node.attrs?.id || '',
    sectionType: 'concurrent' as SectionType,
    lines,
  };
}

/**
 * Process a section block into exportable format
 */
function processSectionBlock(node: RichTextNode, options: ResolvedExportOptions): ExportableSection | null {
  const attrs = node.attrs || {};
  const sectionType = attrs.sectionType as SectionType;
  const label = attrs.label as string | undefined;
  const summary = attrs.summary as string | undefined;

  const lines: ExportableLine[] = [];

  // Process children of section block
  const children = node.content || [];
  for (const child of children) {
    if (child.type === 'concurrentBlock') {
      const concSection = processConcurrentBlockNode(child, options);
      lines.push(...concSection.lines);
      // For side-by-side, we embed the concurrent export as a special line
      if (concSection.concurrent) {
        // side-by-side concurrent blocks embedded in a section are
        // represented as a special line type for the print renderer
        lines.push({
          type: 'lyric',
          content: '',
          _concurrent: concSection.concurrent,
        });
      }
      continue;
    }
    const line = processNode(child, options);
    if (line) {
      lines.push(line);
    }
  }

  // Skip empty sections
  if (lines.length === 0) return null;

  // Annotated profile always surfaces the section summary as a margin note
  // (that's the "notes" half of "alternates and notes in the margin"),
  // independent of the includeSectionLabels toggle.
  const includeSummary = options.includeSectionLabels || options.includeAlternates;

  return {
    id: attrs.id as string,
    sectionType,
    label: options.includeSectionLabels ? label : undefined,
    summary: includeSummary ? summary : undefined,
    lines,
  };
}

/**
 * Process a single node into an exportable line
 */
function processNode(node: RichTextNode, options: ResolvedExportOptions): ExportableLine | null {
  switch (node.type) {
    case 'concurrentBlock':
      return null; // handled separately above
    case 'lyricLine': {
      const lineType = (node.attrs?.lineType as string) || 'lyric';
      if (lineType === 'speaker') {
        return processSpeakerLine(node, options);
      }
      if (lineType === 'stageDirection') {
        return processStageDirection(node, options);
      }
      return processLyricLine(node, options);
    }
    case 'paragraph':
      return processParagraph(node);
    default:
      return null;
  }
}

/**
 * Process a lyric line with optional chords
 */
function processLyricLine(node: RichTextNode, options: ResolvedExportOptions): ExportableLine | null {
  // Get text content from inline nodes
  const text = extractTextContent(node.content);
  if (!text && !options.includeChords) return null;

  let chords: ExportableChord[] | undefined;

  if (options.includeChords) {
    const meta = node.attrs?.meta as LyricLineMeta | undefined;
    if (meta?.chords && Array.isArray(meta.chords)) {
      chords = meta.chords.map((chord: ChordMarker) => ({
        symbol: chord.symbol,
        offset: chord.position?.charOffset || 0,
      }));
    }
  }

  let alternates: ExportableAlternate[] | undefined;
  if (options.includeAlternates) {
    const meta = node.attrs?.meta as LyricLineMeta | undefined;
    alternates = extractAlternates(meta, text);
  }

  return {
    type: 'lyric',
    content: text,
    chords: chords?.length ? chords : undefined,
    alternates: alternates?.length ? alternates : undefined,
  };
}

/**
 * Extract the non-active alternates for a line (Annotated profile margin).
 * The active alternate is already the line's canonical content — only the
 * *other* variants are surfaced here, and only when their text differs from
 * what is already printed as the main line (avoids a redundant margin note).
 */
function extractAlternates(meta: LyricLineMeta | undefined, activeText: string): ExportableAlternate[] {
  if (!meta?.alternates || !Array.isArray(meta.alternates)) return [];
  return meta.alternates
    .filter((alt: AlternateLine) => !alt.isActive)
    .map((alt: AlternateLine) => ({
      id: alt.id,
      label: alt.label,
      text: extractTextFromRichDoc(alt.doc),
    }))
    .filter((alt: ExportableAlternate) => alt.text && alt.text !== activeText);
}

/**
 * Extract plain text from a RichTextDocument (alternate storage format).
 * Mirrors `extractTextFromDoc` in `domain/editor/alternates-commands.ts`,
 * duplicated here so the export domain has no dependency on the Tiptap
 * editor layer — it must stay renderable from canonical JSON alone.
 */
function extractTextFromRichDoc(doc: RichTextDocument): string {
  if (!doc?.content || doc.content.length === 0) return '';
  return doc.content
    .map(node => {
      if (node.type === 'paragraph' && node.content) {
        return node.content.map(child => child.text || '').join('');
      }
      return '';
    })
    .join('\n');
}

/**
 * Process a speaker line
 */
function processSpeakerLine(node: RichTextNode, options: ResolvedExportOptions): ExportableLine | null {
  if (!options.includeSpeakerLabels) return null;

  const speaker = extractTextContent(node.content);
  if (!speaker) return null;

  return {
    type: 'speaker',
    content: speaker,
    speaker,
  };
}

/**
 * Process a stage direction
 */
function processStageDirection(node: RichTextNode, options: ResolvedExportOptions): ExportableLine | null {
  if (!options.includeStageDirections) return null;

  const text = extractTextContent(node.content);
  if (!text) return null;

  return {
    type: 'stageDirection',
    content: text,
    stageDirection: text,
  };
}

/**
 * Process a paragraph (non-lyric text)
 */
function processParagraph(node: RichTextNode): ExportableLine | null {
  const text = extractTextContent(node.content);
  if (!text) return null;

  return {
    type: 'paragraph',
    content: text,
  };
}

/**
 * Extract plain text from rich text content nodes
 */
function extractTextContent(content: RichTextNode[] | undefined): string {
  if (!content) return '';

  return content
    .map(node => {
      if (node.type === 'text' && node.text) {
        return node.text;
      }
      return '';
    })
    .join('');
}
