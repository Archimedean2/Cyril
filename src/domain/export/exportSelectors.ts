/**
 * Export selectors - transforms canonical draft data into export-ready representation
 */

import { CyrilFile, Draft, RichTextNode, SectionType } from '../project/types';
import { ExportableDraft, ExportableSection, ExportableLine, ExportableChord, ResolvedExportOptions } from './exportTypes';

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
    }
  }

  return {
    draftName: draft.name,
    projectTitle: projectFile.project.title,
    sections,
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
    const line = processNode(child, options);
    if (line) {
      lines.push(line);
    }
  }

  // Skip empty sections
  if (lines.length === 0) return null;

  return {
    id: attrs.id as string,
    sectionType,
    label: options.includeSectionLabels ? label : undefined,
    summary: options.includeSectionLabels ? summary : undefined,
    lines,
  };
}

/**
 * Process a single node into an exportable line
 */
function processNode(node: RichTextNode, options: ResolvedExportOptions): ExportableLine | null {
  switch (node.type) {
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
    const meta = node.attrs?.meta;
    if (meta?.chords && Array.isArray(meta.chords)) {
      chords = meta.chords.map((chord: any) => ({
        symbol: chord.symbol,
        offset: chord.position?.charOffset || 0,
      }));
    }
  }

  return {
    type: 'lyric',
    content: text,
    chords: chords?.length ? chords : undefined,
  };
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
