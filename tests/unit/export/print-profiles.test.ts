import { describe, it, expect } from 'vitest';
import { resolvePrintOptions } from '../../../src/domain/export/printProfiles';
import { ExportSettings } from '../../../src/domain/project/types';

function makeExportSettings(overrides: Partial<ExportSettings> = {}): ExportSettings {
  return {
    includeSectionLabels: true,
    includeSpeakerLabels: true,
    includeStageDirections: true,
    includeChords: true,
    fontPreset: 'default',
    pageDensity: 'normal',
    concurrentLayout: 'squash',
    ...overrides,
  };
}

describe('Print Profiles (C-22)', () => {
  it('T-11.08: Lyric sheet profile omits chords, speaker labels, and stage directions', () => {
    const options = resolvePrintOptions(makeExportSettings(), 'lyricSheet');
    expect(options.printProfile).toBe('lyricSheet');
    expect(options.includeChords).toBe(false);
    expect(options.includeSpeakerLabels).toBe(false);
    expect(options.includeStageDirections).toBe(false);
    expect(options.includeAlternates).toBe(false);
    // Section labels remain the one user-adjustable knob for this profile.
    expect(options.includeSectionLabels).toBe(true);
    expect(resolvePrintOptions(makeExportSettings({ includeSectionLabels: false }), 'lyricSheet').includeSectionLabels).toBe(false);
  });

  it('T-11.09: Chord sheet profile always shows chords and section labels', () => {
    // Even when the project's raw toggles say otherwise, the chord-sheet
    // profile forces chords + section labels on and speakers/stage
    // directions off — that's what makes it a distinct, reliable profile.
    const options = resolvePrintOptions(
      makeExportSettings({ includeChords: false, includeSectionLabels: false, includeSpeakerLabels: true, includeStageDirections: true }),
      'chordSheet'
    );
    expect(options.printProfile).toBe('chordSheet');
    expect(options.includeChords).toBe(true);
    expect(options.includeSectionLabels).toBe(true);
    expect(options.includeSpeakerLabels).toBe(false);
    expect(options.includeStageDirections).toBe(false);
  });

  it('T-11.10: Libretto profile always shows speakers and stage directions, never chords', () => {
    const options = resolvePrintOptions(
      makeExportSettings({ includeChords: true, includeSpeakerLabels: false, includeStageDirections: false }),
      'libretto'
    );
    expect(options.printProfile).toBe('libretto');
    expect(options.includeSpeakerLabels).toBe(true);
    expect(options.includeStageDirections).toBe(true);
    expect(options.includeChords).toBe(false);
  });

  it('T-11.11: Annotated profile always shows alternates and hides chords/speakers/stage directions', () => {
    const options = resolvePrintOptions(
      makeExportSettings({ includeChords: true, includeSpeakerLabels: true, includeStageDirections: true }),
      'annotated'
    );
    expect(options.printProfile).toBe('annotated');
    expect(options.includeAlternates).toBe(true);
    expect(options.includeChords).toBe(false);
    expect(options.includeSpeakerLabels).toBe(false);
    expect(options.includeStageDirections).toBe(false);
  });

  it('falls back to the stored/default profile when no override is given', () => {
    expect(resolvePrintOptions(makeExportSettings()).printProfile).toBe('lyricSheet');
    expect(resolvePrintOptions(makeExportSettings({ printProfile: 'chordSheet' })).printProfile).toBe('chordSheet');
  });
});
