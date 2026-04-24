/**
 * Share service - orchestrates clipboard share operations
 */

import { CyrilFile } from '../project/types';
import { encodeShareDraft, decodeShareBlob, buildProjectFromShare, isShareBlob } from './shareEncoder';

/**
 * Copy a shareable link for the active draft to the clipboard.
 */
export async function copyShareLink(
  projectFile: CyrilFile,
  activeDraftId: string | null
): Promise<{ success: boolean; error?: string }> {
  const draft = projectFile.project.drafts.find(d => d.id === activeDraftId);
  if (!draft) {
    return { success: false, error: 'No active draft to share' };
  }

  const blob = encodeShareDraft(projectFile.project.title, draft);

  try {
    await navigator.clipboard.writeText(blob);
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Clipboard access denied or unavailable' };
  }
}

/**
 * Import a share blob string into a new CyrilFile.
 */
export function importFromShareBlob(blob: string): { success: boolean; file?: CyrilFile; error?: string } {
  if (!isShareBlob(blob)) {
    return { success: false, error: 'Invalid share format' };
  }

  const payload = decodeShareBlob(blob);
  if (!payload) {
    return { success: false, error: 'Failed to decode share data' };
  }

  try {
    const file = buildProjectFromShare(payload);
    return { success: true, file };
  } catch (err: any) {
    return { success: false, error: `Failed to build project: ${err.message}` };
  }
}

/**
 * Read the clipboard and attempt to import a share blob.
 */
export async function importFromClipboard(): Promise<{ success: boolean; file?: CyrilFile; error?: string }> {
  try {
    const text = await navigator.clipboard.readText();
    return importFromShareBlob(text);
  } catch (err: any) {
    return { success: false, error: 'Clipboard access denied or unavailable' };
  }
}
