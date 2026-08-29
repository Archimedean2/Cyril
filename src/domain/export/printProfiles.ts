/**
 * Print profile resolution (C-22 / DESIGN_PROPOSAL §7).
 *
 * A print *profile* is a named, fixed recipe of which line kinds appear in
 * the printed output — it is what makes "Lyric sheet" and "Chord sheet"
 * visibly different outputs from the same draft, rather than four names for
 * the same rendering. Only `includeSectionLabels` remains a genuine user
 * knob across every profile; everything else the profile decides outright,
 * so switching profiles always changes the printed page.
 */

import type { ExportSettings } from '../project/types';
import { PrintProfileId, ResolvedExportOptions, DEFAULT_PRINT_PROFILE, getStoredPrintProfile } from './exportTypes';

/**
 * Resolve a print profile + the project's export settings into the
 * concrete flags the export selectors and print renderer consume.
 *
 * `profileOverride` lets the Export dialog preview a profile the user is
 * hovering/selecting before it is persisted.
 */
export function resolvePrintOptions(
  exportSettings: ExportSettings,
  profileOverride?: PrintProfileId
): ResolvedExportOptions {
  const profile = profileOverride ?? getStoredPrintProfile(exportSettings);
  const includeSectionLabels = exportSettings.includeSectionLabels;
  const pageDensity = exportSettings.pageDensity;
  const concurrentLayout = exportSettings.concurrentLayout ?? 'squash';

  const shared = { includeSectionLabels, pageDensity, concurrentLayout, printProfile: profile };

  switch (profile) {
    case 'lyricSheet':
      return {
        ...shared,
        includeSpeakerLabels: false,
        includeStageDirections: false,
        includeChords: false,
        includeAlternates: false,
      };
    case 'chordSheet':
      return {
        ...shared,
        includeSectionLabels: true,
        includeSpeakerLabels: false,
        includeStageDirections: false,
        includeChords: true,
        includeAlternates: false,
      };
    case 'libretto':
      return {
        ...shared,
        includeSpeakerLabels: true,
        includeStageDirections: true,
        includeChords: false,
        includeAlternates: false,
      };
    case 'annotated':
      return {
        ...shared,
        includeSpeakerLabels: false,
        includeStageDirections: false,
        includeChords: false,
        includeAlternates: true,
      };
    default: {
      // Exhaustiveness guard — fall back to the default profile's rules.
      const _exhaustive: never = profile;
      void _exhaustive;
      return resolvePrintOptions(exportSettings, DEFAULT_PRINT_PROFILE);
    }
  }
}
