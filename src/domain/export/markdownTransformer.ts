/**
 * Markdown export transformer
 * Converts exportable draft to Markdown format
 */

import { ExportableDraft, ExportableSection, ExportableLine } from './exportTypes';

/**
 * Transform exportable draft to Markdown string
 */
export function draftToMarkdown(draft: ExportableDraft): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${draft.projectTitle}`);
  lines.push('');

  // Draft name subtitle
  lines.push(`**${draft.draftName}**`);
  lines.push('');

  // Sections
  for (const section of draft.sections) {
    lines.push(...sectionToMarkdown(section));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Transform section to Markdown lines
 */
function sectionToMarkdown(section: ExportableSection): string[] {
  const lines: string[] = [];

  // Section header
  if (section.label) {
    lines.push(`## ${section.label}`);
  } else {
    // Use section type as fallback
    const typeLabel = capitalizeFirst(section.sectionType);
    lines.push(`## ${typeLabel}`);
  }

  // Summary (if present)
  if (section.summary) {
    lines.push(`*${section.summary}*`);
    lines.push('');
  }

  // Lines
  for (const line of section.lines) {
    const lineText = lineToMarkdown(line);
    if (lineText) {
      lines.push(lineText);
    }
  }

  return lines;
}

/**
 * Transform a single line to Markdown
 */
function lineToMarkdown(line: ExportableLine): string | null {
  switch (line.type) {
    case 'lyric':
      return lyricLineToMarkdown(line);
    case 'speaker':
      return `**${line.speaker}**`;
    case 'stageDirection':
      return `*(${line.stageDirection})*`;
    case 'paragraph':
      return line.content;
    default:
      return null;
  }
}

/**
 * Transform lyric line with optional chords to Markdown
 */
function lyricLineToMarkdown(line: ExportableLine): string {
  const text = line.content || '';

  if (!line.chords || line.chords.length === 0) {
    return text;
  }

  // For Markdown, include chords inline in brackets after the word they appear on
  // This is a pragmatic approach for v1
  const chords = line.chords;
  let result = text;

  // Sort chords by offset descending to insert from end to start
  const sortedChords = [...chords].sort((a, b) => b.offset - a.offset);

  for (const chord of sortedChords) {
    // Insert chord bracket at the offset position
    const insertPos = Math.min(chord.offset, result.length);
    const before = result.slice(0, insertPos);
    const after = result.slice(insertPos);
    result = `${before}[${chord.symbol}]${after}`;
  }

  return result;
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Export draft to Markdown and trigger download
 */
export function exportDraftToMarkdown(draft: ExportableDraft, filename?: string): void {
  const markdown = draftToMarkdown(draft);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${draft.projectTitle}-${draft.draftName}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
