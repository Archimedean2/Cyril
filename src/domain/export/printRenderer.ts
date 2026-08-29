/**
 * Print HTML renderer
 * Renders exportable draft to print-ready HTML
 *
 * Rendering here is profile-aware (C-22 / DESIGN_PROPOSAL §7): the same
 * ExportableDraft is rendered differently depending on `options.printProfile`
 * — most visibly for `libretto`, which lays speakers and stage directions
 * out in theatre format instead of the flat lyric-sheet stack.
 */

import { ExportableDraft, ExportableSection, ExportableLine, ExportableChord, ExportableAlternate, ConcurrentSectionExport, ResolvedExportOptions, PrintProfileId, PRINT_PROFILES, DEFAULT_PRINT_PROFILE } from './exportTypes';

/**
 * Fully-resolved options this module renders from — `printProfile` and
 * `includeAlternates` are optional on `ResolvedExportOptions` for callers
 * built before the print-profile work; this module fills in their defaults
 * once, up front, so the render helpers below never have to.
 */
type ResolvedPrintOptions = ResolvedExportOptions & {
  printProfile: PrintProfileId;
  includeAlternates: boolean;
};

/**
 * Render exportable draft to print HTML document.
 *
 * `options` may be a full `ResolvedExportOptions`, or — for pre-profile call
 * sites — just a page density string; the latter renders with the default
 * profile's plain (non-libretto, non-mono-chord) layout, matching the
 * renderer's original behaviour.
 */
export function renderPrintDocument(
  draft: ExportableDraft,
  options: ResolvedExportOptions | 'normal' | 'compact'
): string {
  const resolved: ResolvedPrintOptions =
    typeof options === 'string'
      ? {
          includeSectionLabels: true,
          includeSpeakerLabels: true,
          includeStageDirections: true,
          includeChords: true,
          includeAlternates: false,
          pageDensity: options,
          concurrentLayout: 'squash',
          printProfile: DEFAULT_PRINT_PROFILE,
        }
      : {
          ...options,
          includeAlternates: options.includeAlternates ?? false,
          printProfile: options.printProfile ?? DEFAULT_PRINT_PROFILE,
        };

  const profileLabel = PRINT_PROFILES.find(p => p.id === resolved.printProfile)?.label ?? resolved.printProfile;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(draft.projectTitle)} - ${escapeHtml(draft.draftName)}</title>
  <style>
    ${getPrintStyles(resolved)}
  </style>
</head>
<body class="profile-${resolved.printProfile}" data-print-profile="${resolved.printProfile}">
  <div class="print-container">
    ${renderHeader(draft, profileLabel)}
    ${draft.sections.length === 0 ? renderEmptyState() : draft.sections.map(section => renderSection(section, resolved)).join('')}
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Render document header
 */
function renderHeader(draft: ExportableDraft, profileLabel: string): string {
  return `
    <div class="print-header">
      <h1 class="print-title">${escapeHtml(draft.projectTitle)}</h1>
      <div class="print-draft-name">${escapeHtml(draft.draftName)}</div>
      <div class="print-profile-tag">${escapeHtml(profileLabel)}</div>
    </div>
  `;
}

/**
 * Rendered when a draft has no sections at all (T-11 empty-draft hazard,
 * EDGE_CASES §11) — printing an empty draft must produce a valid document,
 * not a blank body or a thrown error.
 */
function renderEmptyState(): string {
  return `<div class="print-empty">This draft has no content yet.</div>`;
}

/**
 * Render a section
 */
function renderSection(section: ExportableSection, options: ResolvedPrintOptions): string {
  // Top-level concurrent block (side-by-side mode)
  if (section.sectionType === 'concurrent' && section.concurrent) {
    return renderConcurrentBlock(section.concurrent, options);
  }

  // A synthetic section holding lines written outside any section block has no
  // header of its own — printing a label for it (previously "None") would
  // invent a heading the writer never typed.
  const isUnheaded = section.sectionType === 'none' && !section.label;
  const label = section.label || capitalizeFirst(section.sectionType);
  const labelHtml = isUnheaded ? '' : `<div class="section-label">${escapeHtml(label)}</div>`;
  const summary = section.summary ? `<div class="section-summary">${escapeHtml(section.summary)}</div>` : '';

  return `
    <div class="section" data-section-type="${section.sectionType}">
      ${labelHtml}
      ${summary}
      <div class="section-content">
        ${section.lines.map(line => renderLine(line, options)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a concurrent block side-by-side
 */
function renderConcurrentBlock(concurrent: ConcurrentSectionExport, options: ResolvedPrintOptions): string {
  const cols = concurrent.columns
    .map(col => {
      const header = `<div class="concurrent-col-header">${escapeHtml(col.speakerName)}</div>`;
      const lines = col.lines.map(l => renderLine(l, options)).join('');
      return `<div class="concurrent-col">${header}<div class="concurrent-col-lines">${lines}</div></div>`;
    })
    .join('');

  return `<div class="concurrent-block-print">${cols}</div>`;
}

/**
 * Render a single line
 */
function renderLine(line: ExportableLine, options: ResolvedPrintOptions): string {
  // Inline concurrent block (embedded in a section, side-by-side mode)
  if (line._concurrent) {
    return renderConcurrentBlock(line._concurrent, options);
  }

  const isLibretto = options.printProfile === 'libretto';

  switch (line.type) {
    case 'lyric':
      return renderLyricLine(line, options);
    case 'speaker':
      return isLibretto
        ? `<div class="libretto-character">${escapeHtml(line.speaker || '')}</div>`
        : `<div class="speaker-line">${escapeHtml(line.speaker || '')}</div>`;
    case 'stageDirection':
      return isLibretto
        ? `<div class="libretto-stage-direction">(${escapeHtml(line.stageDirection || '')})</div>`
        : `<div class="stage-direction">(${escapeHtml(line.stageDirection || '')})</div>`;
    case 'paragraph':
      return `<div class="paragraph">${escapeHtml(line.content)}</div>`;
    default:
      return '';
  }
}

/**
 * Render a lyric line with optional chords, alternates, and libretto
 * dialogue formatting.
 */
function renderLyricLine(line: ExportableLine, options: ResolvedPrintOptions): string {
  const isLibretto = options.printProfile === 'libretto';
  const lyricClass = isLibretto ? 'lyric-line libretto-dialogue' : 'lyric-line';

  const margin = renderAlternatesMargin(line.alternates);

  if (!line.chords || line.chords.length === 0) {
    if (!margin) {
      return `<div class="${lyricClass}">${escapeHtml(line.content)}</div>`;
    }
    return `
      <div class="lyric-line-annotated">
        <div class="${lyricClass}">${escapeHtml(line.content)}</div>
        ${margin}
      </div>
    `;
  }

  // Render as two-row block: chord row + lyric row
  const chordRow = renderChordRow(line.chords, line.content);

  return `
    <div class="lyric-line-block">
      <div class="chord-row">${chordRow}</div>
      <div class="${lyricClass}">${escapeHtml(line.content)}</div>
      ${margin}
    </div>
  `;
}

/**
 * Render the Annotated profile's margin note for a line's other alternates.
 */
function renderAlternatesMargin(alternates: ExportableAlternate[] | undefined): string {
  if (!alternates || alternates.length === 0) return '';

  const items = alternates
    .map(alt => {
      const label = alt.label ? `<span class="alt-label">${escapeHtml(alt.label)}:</span> ` : '';
      return `<div class="alt-item">${label}${escapeHtml(alt.text)}</div>`;
    })
    .join('');

  return `<div class="margin-alternates">${items}</div>`;
}

/**
 * Render chord row with approximate positioning
 */
function renderChordRow(chords: ExportableChord[], lyricText: string): string {
  // Sort chords by offset
  const sortedChords = [...chords].sort((a, b) => a.offset - b.offset);

  // Build chord row with positioning
  const parts: string[] = [];
  let currentPos = 0;

  for (const chord of sortedChords) {
    const offset = Math.min(chord.offset, lyricText.length);
    const spacing = Math.max(0, offset - currentPos);

    // Add spacing (using non-breaking spaces for positioning)
    if (spacing > 0) {
      parts.push(`<span class="chord-spacing" style="width: ${spacing * 0.6}em;"></span>`);
    }

    // Add chord
    parts.push(`<span class="chord">${escapeHtml(chord.symbol)}</span>`);

    currentPos = offset;
  }

  return parts.join('');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Capitalize first letter
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get print CSS styles. Print is deliberately more spacious and literary
 * than the app (DESIGN_SYSTEM.md § Print / Export Styling Philosophy):
 * a serif body face, a narrower text column, and generous margins.
 */
function getPrintStyles(options: ResolvedPrintOptions): string {
  const density = options.pageDensity;
  const isLibretto = options.printProfile === 'libretto';
  const isChordSheet = options.printProfile === 'chordSheet';

  const baseSize = density === 'compact' ? '11px' : '14px';
  const lineHeight = density === 'compact' ? '1.3' : '1.6';
  const sectionGap = density === 'compact' ? '12px' : '24px';
  const lineGap = density === 'compact' ? '4px' : '8px';
  const pageMargin = density === 'compact' ? '1in' : '1.25in';

  // Chord sheet: a monospace chord font for accurate alignment at a glance.
  // Every other profile keeps the sans "annotation" feel of the original.
  const chordFontFamily = isChordSheet
    ? "'Courier New', 'Menlo', monospace"
    : "'Helvetica', 'Arial', sans-serif";

  return `
    @page {
      margin: ${pageMargin};
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: ${baseSize};
      line-height: ${lineHeight};
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }

    .print-container {
      max-width: 6.5in;
      margin: 0 auto;
    }

    .print-header {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 16px;
    }

    .print-title {
      font-size: ${density === 'compact' ? '18px' : '24px'};
      font-weight: bold;
      margin: 0 0 8px 0;
    }

    .print-draft-name {
      font-size: ${baseSize};
      color: #666;
      font-style: italic;
    }

    .print-profile-tag {
      font-size: ${density === 'compact' ? '9px' : '10px'};
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 6px;
    }

    .print-empty {
      text-align: center;
      color: #999;
      font-style: italic;
      padding: 48px 0;
    }

    .section {
      margin-bottom: ${sectionGap};
    }

    .section-label {
      font-weight: bold;
      font-size: ${density === 'compact' ? '12px' : '14px'};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #444;
      margin-bottom: 8px;
      border-left: 3px solid #999;
      padding-left: 8px;
    }

    .section-summary {
      font-style: italic;
      color: #666;
      margin-bottom: 12px;
      font-size: ${density === 'compact' ? '10px' : '12px'};
    }

    .section-content {
      padding-left: 11px;
    }

    .lyric-line-block {
      margin-bottom: ${lineGap};
    }

    .chord-row {
      font-family: ${chordFontFamily};
      font-size: ${density === 'compact' ? '9px' : '11px'};
      font-weight: 600;
      color: #333;
      min-height: 1.2em;
      white-space: pre;
    }

    .chord {
      display: inline-block;
    }

    .chord-spacing {
      display: inline-block;
    }

    .lyric-line {
      margin-bottom: ${lineGap};
    }

    .speaker-line {
      font-weight: bold;
      font-size: ${density === 'compact' ? '10px' : '12px'};
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #555;
      margin-top: 12px;
      margin-bottom: ${lineGap};
    }

    .stage-direction {
      font-style: italic;
      color: #666;
      margin-bottom: ${lineGap};
    }

    .paragraph {
      margin-bottom: ${lineGap};
    }

    /* Script / libretto theatre formatting */
    .libretto-character {
      text-align: center;
      font-weight: bold;
      font-size: ${density === 'compact' ? '11px' : '13px'};
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #222;
      margin-top: 20px;
      margin-bottom: 2px;
    }

    .libretto-stage-direction {
      text-align: center;
      font-style: italic;
      color: #555;
      font-size: ${density === 'compact' ? '10px' : '12px'};
      margin-bottom: ${lineGap};
    }

    .libretto-dialogue {
      max-width: 4in;
      margin-left: auto;
      margin-right: auto;
      text-align: center;
    }

    /* Annotated profile margin notes */
    .lyric-line-annotated {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: ${lineGap};
    }

    .lyric-line-annotated .lyric-line {
      margin-bottom: 0;
      flex: 1;
    }

    .margin-alternates {
      flex: 0 0 auto;
      max-width: 2.25in;
      border-left: 1px dashed #ccc;
      padding-left: 10px;
      font-style: italic;
      font-size: ${density === 'compact' ? '9px' : '11px'};
      color: #888;
    }

    .alt-label {
      font-weight: 600;
      font-style: normal;
      color: #999;
    }

    .alt-item {
      margin-bottom: 2px;
    }

    .concurrent-block-print {
      display: flex;
      gap: 12px;
      margin-bottom: ${sectionGap};
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
    }

    .concurrent-col {
      flex: 1;
      min-width: 0;
      border-right: 1px solid #eee;
      padding-right: 8px;
    }

    .concurrent-col:last-child {
      border-right: none;
      padding-right: 0;
    }

    .concurrent-col-header {
      font-weight: bold;
      font-size: ${density === 'compact' ? '9px' : '11px'};
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #555;
      margin-bottom: 6px;
    }

    .concurrent-col-lines .lyric-line {
      margin-bottom: ${lineGap};
    }

    ${isLibretto ? '.section-label { text-align: center; border-left: none; }' : ''}
  `;
}

/**
 * Open print view in new window and trigger print
 */
export function openPrintView(htmlContent: string): void {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    console.error('Failed to open print window');
    return;
  }

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load then print
  printWindow.onload = () => {
    printWindow.print();
  };

  // Fallback if onload doesn't fire
  setTimeout(() => {
    if (printWindow.document.readyState === 'complete') {
      printWindow.print();
    }
  }, 500);
}
