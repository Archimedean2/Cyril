/**
 * Export service - orchestrates export operations
 */

import { CyrilFile, ExportSettings } from '../project/types';
import { selectActiveDraft, buildExportableDraft } from './exportSelectors';
import { draftToMarkdown, exportDraftToMarkdown } from './markdownTransformer';
import { renderPrintDocument, openPrintView } from './printRenderer';
import { ResolvedExportOptions, PrintProfileId, getStoredPrintProfile } from './exportTypes';
import { resolvePrintOptions } from './printProfiles';

/**
 * Resolve export settings to runtime options for Markdown export.
 * Markdown is not profile-driven (DESIGN_PROPOSAL §7 scopes print profiles
 * to the Print/PDF output) — it honours the raw include* toggles as before.
 */
function resolveExportOptions(exportSettings: ExportSettings): ResolvedExportOptions {
  return {
    includeSectionLabels: exportSettings.includeSectionLabels,
    includeSpeakerLabels: exportSettings.includeSpeakerLabels,
    includeStageDirections: exportSettings.includeStageDirections,
    includeChords: exportSettings.includeChords,
    includeAlternates: false,
    pageDensity: exportSettings.pageDensity,
    concurrentLayout: exportSettings.concurrentLayout ?? 'squash',
    printProfile: getStoredPrintProfile(exportSettings),
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
 * Export current active draft to Print/PDF, using the given print profile
 * (falls back to the project's persisted profile, then the default).
 */
export function exportToPrint(
  projectFile: CyrilFile,
  activeDraftId: string | null,
  profile?: PrintProfileId
): boolean {
  const draft = selectActiveDraft(projectFile, activeDraftId);
  if (!draft) {
    console.error('No active draft to export');
    return false;
  }

  const options = resolvePrintOptions(projectFile.project.exportSettings, profile);
  const exportable = buildExportableDraft(projectFile, draft, options);
  const html = renderPrintDocument(exportable, options);

  openPrintView(html);
  return true;
}

/**
 * Build the print-ready HTML for a given profile without opening the print
 * window — used by the Export dialog's live preview so each profile can be
 * previewed before print/PDF.
 */
export function getPrintPreviewHtml(
  projectFile: CyrilFile,
  activeDraftId: string | null,
  profile?: PrintProfileId
): string | null {
  const draft = selectActiveDraft(projectFile, activeDraftId);
  if (!draft) return null;

  const options = resolvePrintOptions(projectFile.project.exportSettings, profile);
  const exportable = buildExportableDraft(projectFile, draft, options);
  return renderPrintDocument(exportable, options);
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
 * Get the exportable draft as it would be built for a given print profile
 * (for testing/preview — does not open a print window).
 */
export function getExportableDraftForProfile(
  projectFile: CyrilFile,
  activeDraftId: string | null,
  profile?: PrintProfileId
) {
  const draft = selectActiveDraft(projectFile, activeDraftId);
  if (!draft) return null;

  const options = resolvePrintOptions(projectFile.project.exportSettings, profile);
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
