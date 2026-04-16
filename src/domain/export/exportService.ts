/**
 * Export service - orchestrates export operations
 */

import { CyrilFile, ExportSettings } from '../project/types';
import { selectActiveDraft, buildExportableDraft } from './exportSelectors';
import { draftToMarkdown, exportDraftToMarkdown } from './markdownTransformer';
import { renderPrintDocument, openPrintView } from './printRenderer';
import { ResolvedExportOptions } from './exportTypes';

/**
 * Resolve export settings to runtime options
 */
function resolveExportOptions(exportSettings: ExportSettings): ResolvedExportOptions {
  return {
    includeSectionLabels: exportSettings.includeSectionLabels,
    includeSpeakerLabels: exportSettings.includeSpeakerLabels,
    includeStageDirections: exportSettings.includeStageDirections,
    includeChords: exportSettings.includeChords,
    pageDensity: exportSettings.pageDensity,
  };
}

/**
 * Export current active draft to Markdown
 */
export function exportToMarkdown(
  projectFile: CyrilFile,
  activeDraftId: string | null
): boolean {
  const draft = selectActiveDraft(projectFile, activeDraftId);
  if (!draft) {
    console.error('No active draft to export');
    return false;
  }

  const options = resolveExportOptions(projectFile.project.exportSettings);
  const exportable = buildExportableDraft(projectFile, draft, options);
  const filename = `${projectFile.project.title}-${draft.name}.md`.replace(/[^a-zA-Z0-9.-]/g, '-');

  exportDraftToMarkdown(exportable, filename);
  return true;
}

/**
 * Export current active draft to Print/PDF
 */
export function exportToPrint(
  projectFile: CyrilFile,
  activeDraftId: string | null
): boolean {
  const draft = selectActiveDraft(projectFile, activeDraftId);
  if (!draft) {
    console.error('No active draft to export');
    return false;
  }

  const options = resolveExportOptions(projectFile.project.exportSettings);
  const exportable = buildExportableDraft(projectFile, draft, options);
  const html = renderPrintDocument(exportable, options.pageDensity);

  openPrintView(html);
  return true;
}

/**
 * Get exportable preview (for testing/debugging)
 */
export function getExportableDraft(
  projectFile: CyrilFile,
  activeDraftId: string | null
) {
  const draft = selectActiveDraft(projectFile, activeDraftId);
  if (!draft) return null;

  const options = resolveExportOptions(projectFile.project.exportSettings);
  return buildExportableDraft(projectFile, draft, options);
}

/**
 * Get Markdown preview string (for testing)
 */
export function getMarkdownPreview(
  projectFile: CyrilFile,
  activeDraftId: string | null
): string | null {
  const exportable = getExportableDraft(projectFile, activeDraftId);
  if (!exportable) return null;

  return draftToMarkdown(exportable);
}
