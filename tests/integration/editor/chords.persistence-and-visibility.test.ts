import { describe, it, expect, beforeEach } from 'vitest';
import { serializeProject, deserializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { CyrilFile, CyrilProject, Draft, ChordMarker } from '../../../src/domain/project/types';

describe('I-9: Chord Persistence and Visibility', () => {
  let projectWithChords: CyrilProject;
  let chordDraft: Draft;

  beforeEach(() => {
    // Create a draft with chord metadata
    chordDraft = {
      id: 'draft_chords_001',
      name: 'Chord Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: 'lyricsWithChords',
      doc: {
        type: 'doc',
        content: [
          {
            type: 'sectionBlock',
            attrs: {
              id: 'section_001',
              sectionType: 'verse',
              label: 'Verse 1',
            },
            content: [
              {
                type: 'lyricLine',
                attrs: {
                  id: 'line_001',
                  delivery: 'sung',
                  rhymeGroup: null,
                  meta: {
                    alternates: [],
                    prosody: null,
                    chords: [
                      {
                        id: 'chord_001',
                        symbol: 'Am',
                        position: { anchorType: 'char', charOffset: 0, bias: 'on' },
                      },
                      {
                        id: 'chord_002',
                        symbol: 'G',
                        position: { anchorType: 'char', charOffset: 10, bias: 'on' },
                      },
                    ] as ChordMarker[],
                  },
                },
                content: [{ type: 'text', text: 'Amazing grace how sweet the sound' }],
              },
            ],
          },
        ],
      } as any,
      inventory: { type: 'inventory', doc: { type: 'doc', content: [] } } as any,
      draftSettings: {
        showChords: true,
        showSectionLabels: true,
        showSpeakerLabels: true,
        showStageDirections: true,
        showSummaries: true,
        showSyllableCounts: false,
      },
    };

    projectWithChords = {
      id: 'proj_001',
      title: 'Test Chord Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      drafts: [chordDraft],
      activeDraftId: 'draft_chords_001',
      workspaces: {
        brief: { doc: { type: 'doc', content: [] } },
        structure: { doc: { type: 'doc', content: [] } },
        hookLab: { doc: { type: 'doc', content: [] } },
        vocabularyWorld: { doc: { type: 'doc', content: [] } },
      },
      displaySettings: {
        defaultShowChords: true,
        defaultShowSectionLabels: true,
        defaultShowSpeakerLabels: true,
        defaultShowStageDirections: true,
        defaultShowSummaries: true,
        defaultShowSyllableCounts: false,
        rhymeColorMode: 'off',
      },
      exportSettings: {
        includeChords: true,
        includeSectionLabels: true,
        includeSpeakerLabels: true,
        includeStageDirections: true,
        fontPreset: 'default',
        pageDensity: 'normal',
      },
      projectSettings: {
        autosave: true,
        preferredExportMode: 'lyricsWithChords',
      },
    };
  });

  describe('I-9.01: Chords persist through save/load', () => {
    it('preserves draft mode through serialization cycle', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      expect(deserialized.project.drafts[0].mode).toBe('lyricsWithChords');
    });

    it('preserves showChords setting through serialization cycle', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      expect(deserialized.project.drafts[0].draftSettings.showChords).toBe(true);
    });

    it('preserves chord metadata through serialization cycle', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      const restoredDraft = deserialized.project.drafts[0];
      const sectionBlock = restoredDraft.doc.content[0] as any;
      const lyricLine = sectionBlock.content[0] as any;
      const chords = lyricLine.attrs.meta.chords;

      expect(chords).toHaveLength(2);
      expect(chords[0].id).toBe('chord_001');
      expect(chords[0].symbol).toBe('Am');
      expect(chords[0].position.charOffset).toBe(0);
      expect(chords[0].position.anchorType).toBe('char');

      expect(chords[1].id).toBe('chord_002');
      expect(chords[1].symbol).toBe('G');
      expect(chords[1].position.charOffset).toBe(10);
    });

    it('preserves all chord properties including bias', () => {
      // Modify one chord to have 'before' bias
      const sectionBlock = chordDraft.doc.content[0] as any;
      const lyricLine = sectionBlock.content[0] as any;
      lyricLine.attrs.meta.chords[0].position.bias = 'before';

      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      const restoredDraft = deserialized.project.drafts[0];
      const restoredSection = restoredDraft.doc.content[0] as any;
      const restoredLine = restoredSection.content[0] as any;
      const chords = restoredLine.attrs.meta.chords;

      expect(chords[0].position.bias).toBe('before');
    });

    it('round-trips correctly through multiple save/load cycles', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      // Multiple cycles
      let current = cyrilFile;
      for (let i = 0; i < 3; i++) {
        const serialized = serializeProject(current);
        current = deserializeProject(serialized);
      }

      const chords = (current.project.drafts[0].doc.content[0] as any).content[0].attrs.meta.chords;
      expect(chords).toHaveLength(2);
      expect(chords[0].symbol).toBe('Am');
      expect(chords[1].symbol).toBe('G');
    });
  });

  describe('I-9.02: Visibility toggle hides without deleting data', () => {
    it('showChords toggle does not affect persisted chord data', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      // Toggle showChords off
      cyrilFile.project.drafts[0].draftSettings.showChords = false;

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      // Chord data still present
      const restoredDraft = deserialized.project.drafts[0];
      const sectionBlock = restoredDraft.doc.content[0] as any;
      const lyricLine = sectionBlock.content[0] as any;
      const chords = lyricLine.attrs.meta.chords;
      expect(chords).toHaveLength(2);

      // But visibility is off
      expect(deserialized.project.drafts[0].draftSettings.showChords).toBe(false);
    });

    it('toggling showChords back on restores chord visibility', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      // Toggle off then on
      cyrilFile.project.drafts[0].draftSettings.showChords = false;
      cyrilFile.project.drafts[0].draftSettings.showChords = true;

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      // Chords still present and visibility on
      const restoredDraft = deserialized.project.drafts[0];
      const sectionBlock = restoredDraft.doc.content[0] as any;
      const lyricLine = sectionBlock.content[0] as any;
      const chords = lyricLine.attrs.meta.chords;
      expect(chords).toHaveLength(2);
      expect(deserialized.project.drafts[0].draftSettings.showChords).toBe(true);
    });
  });

  describe('I-9.03: Draft mode switching preserves chord data', () => {
    it('switching from lyricsWithChords to lyrics hides rendering context but preserves data', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      // Switch to lyrics mode
      cyrilFile.project.drafts[0].mode = 'lyrics';

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      const restoredDraft = deserialized.project.drafts[0];

      // Mode changed
      expect(restoredDraft.mode).toBe('lyrics');

      // But chord data still present
      const sectionBlock = restoredDraft.doc.content[0] as any;
      const lyricLine = sectionBlock.content[0] as any;
      const chords = lyricLine.attrs.meta.chords;
      expect(chords).toHaveLength(2);
      expect(chords[0].symbol).toBe('Am');
    });

    it('switching back to lyricsWithChords restores chord rendering capability', () => {
      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      // Switch to lyrics then back to lyricsWithChords
      cyrilFile.project.drafts[0].mode = 'lyrics';
      cyrilFile.project.drafts[0].mode = 'lyricsWithChords';

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      const restoredDraft = deserialized.project.drafts[0];

      // Mode and chords restored
      expect(restoredDraft.mode).toBe('lyricsWithChords');
      const sectionBlock = restoredDraft.doc.content[0] as any;
      const lyricLine = sectionBlock.content[0] as any;
      const chords = lyricLine.attrs.meta.chords;
      expect(chords).toHaveLength(2);
      expect(chords[0].symbol).toBe('Am');
    });

    it('chords survive save/load after mode switch', () => {
      // Start in lyricsWithChords
      expect(chordDraft.mode).toBe('lyricsWithChords');

      // Switch to lyrics
      chordDraft.mode = 'lyrics';

      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      // Save while in lyrics mode
      const serialized = serializeProject(cyrilFile);

      // Load back
      const deserialized = deserializeProject(serialized);

      // Verify chords and mode are preserved exactly as saved
      const restoredDraft = deserialized.project.drafts[0];
      expect(restoredDraft.mode).toBe('lyrics');
      const sectionBlock = restoredDraft.doc.content[0] as any;
      const lyricLine = sectionBlock.content[0] as any;
      const chords = lyricLine.attrs.meta.chords;
      expect(chords).toHaveLength(2);
    });
  });

  describe('I-9.04: Project-level defaults work with chord drafts', () => {
    it('preserves displaySettings.defaultShowChords through serialization', () => {
      projectWithChords.displaySettings.defaultShowChords = false;

      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      expect(deserialized.project.displaySettings.defaultShowChords).toBe(false);
    });

    it('preserves exportSettings.includeChords through serialization', () => {
      projectWithChords.exportSettings.includeChords = false;

      const cyrilFile: CyrilFile = {
        schemaVersion: 'cyril-1.0',
        project: projectWithChords,
      };

      const serialized = serializeProject(cyrilFile);
      const deserialized = deserializeProject(serialized);

      expect(deserialized.project.exportSettings.includeChords).toBe(false);
    });
  });
});
