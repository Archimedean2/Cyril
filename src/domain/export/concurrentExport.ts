/**
 * Concurrent block export logic
 *
 * Squash: interleave columns left-to-right per row, emitting speaker label
 * before each speaker's content in a given row (when includeSpeakerLabels).
 *
 * Side-by-side: return a structured representation for the print renderer to
 * layout as CSS flex columns. Markdown always uses squash.
 */

import { RichTextNode } from '../project/types';
import { ExportableLine, ExportableChord, ResolvedExportOptions, ConcurrentSectionExport } from './exportTypes';

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractText(content: RichTextNode[] | undefined): string {
  if (!content) return '';
  return content
    .map(n => (n.type === 'text' && n.text ? n.text : ''))
    .join('');
}

function extractChords(node: RichTextNode): ExportableChord[] | undefined {
  const meta = node.attrs?.meta;
  if (!meta?.chords || !Array.isArray(meta.chords) || meta.chords.length === 0) return undefined;
  return meta.chords.map((c: any) => ({
    symbol: c.symbol,
    offset: c.position?.charOffset ?? 0,
  }));
}

function lyricLineToExportable(
  lineNode: RichTextNode,
  options: ResolvedExportOptions
): ExportableLine | null {
  const text = extractText(lineNode.content);
  const chords = options.includeChords ? extractChords(lineNode) : undefined;
  if (!text && !chords?.length) return null;
  return {
    type: 'lyric',
    content: text,
    chords: chords?.length ? chords : undefined,
  };
}

// ─── squash ───────────────────────────────────────────────────────────────────

/**
 * Convert a concurrentBlock node to a flat sequence of ExportableLine entries
 * using the squash (interleaved) strategy.
 *
 * Row i is processed left-to-right across all columns.
 * Empty cells (column has no line at row i) are skipped.
 * Speaker label is prepended before the first line of each speaker's content
 * in each row when includeSpeakerLabels is true.
 */
export function squashConcurrentBlock(
  blockNode: RichTextNode,
  options: ResolvedExportOptions
): ExportableLine[] {
  const columns = blockNode.content || [];
  if (columns.length === 0) return [];

  // Determine row count (max lines across all columns)
  const maxRows = columns.reduce((max, col) => Math.max(max, (col.content || []).length), 0);

  const result: ExportableLine[] = [];

  for (let row = 0; row < maxRows; row++) {
    for (const col of columns) {
      const lines = col.content || [];
      const lineNode = lines[row];
      if (!lineNode) continue; // empty cell — skip

      const speakerName = col.attrs?.speakerName || 'Speaker';

      // Emit speaker label before this speaker's lines in this row
      if (options.includeSpeakerLabels) {
        result.push({
          type: 'speaker',
          content: speakerName,
          speaker: speakerName,
        });
      }

      const exportLine = lyricLineToExportable(lineNode, options);
      if (exportLine) {
        result.push(exportLine);
      }
    }
  }

  return result;
}

// ─── side-by-side ─────────────────────────────────────────────────────────────

/**
 * Convert a concurrentBlock node to a structured side-by-side representation.
 * Used only by the print renderer when concurrentLayout === 'sideBySide'.
 */
export function buildSideBySideConcurrentBlock(
  blockNode: RichTextNode,
  options: ResolvedExportOptions
): ConcurrentSectionExport {
  const columns = blockNode.content || [];

  return {
    type: 'concurrent',
    columns: columns.map(col => {
      const speakerName = col.attrs?.speakerName || 'Speaker';
      const lines: ExportableLine[] = [];

      for (const lineNode of col.content || []) {
        const exportLine = lyricLineToExportable(lineNode, options);
        if (exportLine) {
          lines.push(exportLine);
        }
      }

      return { speakerName, lines };
    }),
  };
}
