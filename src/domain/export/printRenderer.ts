/**
 * Print HTML renderer
 * Renders exportable draft to print-ready HTML
 */

import { ExportableDraft, ExportableSection, ExportableLine, ExportableChord, ConcurrentSectionExport } from './exportTypes';

/**
 * Render exportable draft to print HTML document
 */
export function renderPrintDocument(draft: ExportableDraft, density: 'normal' | 'compact'): string {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(draft.projectTitle)} - ${escapeHtml(draft.draftName)}</title>
  <style>
    ${getPrintStyles(density)}
  </style>
</head>
<body>
  <div class="print-container">
    ${renderHeader(draft)}
    ${draft.sections.map(section => renderSection(section)).join('')}
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Render document header
 */
function renderHeader(draft: ExportableDraft): string {
  return `
    <div class="print-header">
      <h1 class="print-title">${escapeHtml(draft.projectTitle)}</h1>
      <div class="print-draft-name">${escapeHtml(draft.draftName)}</div>
    </div>
  `;
}

/**
 * Render a section
 */
function renderSection(section: ExportableSection): string {
  // Top-level concurrent block (side-by-side mode)
  if (section.sectionType === 'concurrent' && section.concurrent) {
    return renderConcurrentBlock(section.concurrent);
  }

  const label = section.label || capitalizeFirst(section.sectionType);
  const summary = section.summary ? `<div class="section-summary">${escapeHtml(section.summary)}</div>` : '';

  return `
    <div class="section" data-section-type="${section.sectionType}">
      <div class="section-label">${escapeHtml(label)}</div>
      ${summary}
      <div class="section-content">
        ${section.lines.map(line => renderLine(line)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render a concurrent block side-by-side
 */
function renderConcurrentBlock(concurrent: ConcurrentSectionExport): string {
  const cols = concurrent.columns
    .map(col => {
      const header = `<div class="concurrent-col-header">${escapeHtml(col.speakerName)}</div>`;
      const lines = col.lines.map(l => renderLine(l)).join('');
      return `<div class="concurrent-col">${header}<div class="concurrent-col-lines">${lines}</div></div>`;
    })
    .join('');

  return `<div class="concurrent-block-print">${cols}</div>`;
}

/**
 * Render a single line
 */
function renderLine(line: ExportableLine | any): string {
  // Inline concurrent block (embedded in a section, side-by-side mode)
  if ((line as any)._concurrent) {
    return renderConcurrentBlock((line as any)._concurrent);
  }
  switch (line.type) {
    case 'lyric':
      return renderLyricLine(line);
    case 'speaker':
      return `<div class="speaker-line">${escapeHtml(line.speaker || '')}</div>`;
    case 'stageDirection':
      return `<div class="stage-direction">(${escapeHtml(line.stageDirection || '')})</div>`;
    case 'paragraph':
      return `<div class="paragraph">${escapeHtml(line.content)}</div>`;
    default:
      return '';
  }
}

/**
 * Render a lyric line with optional chords
 */
function renderLyricLine(line: ExportableLine): string {
  if (!line.chords || line.chords.length === 0) {
    return `<div class="lyric-line">${escapeHtml(line.content)}</div>`;
  }

  // Render as two-row block: chord row + lyric row
  const chordRow = renderChordRow(line.chords, line.content);

  return `
    <div class="lyric-line-block">
      <div class="chord-row">${chordRow}</div>
      <div class="lyric-line">${escapeHtml(line.content)}</div>
    </div>
  `;
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
 * Get print CSS styles
 */
function getPrintStyles(density: 'normal' | 'compact'): string {
  const baseSize = density === 'compact' ? '11px' : '14px';
  const lineHeight = density === 'compact' ? '1.3' : '1.6';
  const sectionGap = density === 'compact' ? '12px' : '24px';
  const lineGap = density === 'compact' ? '4px' : '8px';

  return `
    @page {
      margin: 1in;
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
      max-width: 100%;
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
      font-family: 'Helvetica', 'Arial', sans-serif;
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
