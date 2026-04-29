import { describe, it, expect } from 'vitest';
import { serializeProject, deserializeProject } from '../../../src/persistence/serializers/projectSerializer';
import { createDefaultProject, createCyrilFile, SCHEMA_VERSION } from '../../../src/domain/project/defaults';
import { CyrilFile } from '../../../src/domain/project/types';

/**
 * Helper: build a CyrilFile from a project, serialize, deserialize, and return the result.
 */
function roundTrip(file: CyrilFile): CyrilFile {
  const json = serializeProject(file);
  return deserializeProject(json);
}

describe('Round-trip serialization', () => {
  it('minimal project survives round-trip', () => {
    const project = createDefaultProject('Minimal Song');
    const file = createCyrilFile(project);

    const result = roundTrip(file);

    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.project.title).toBe('Minimal Song');
    expect(result.project.id).toBe(project.id);
    expect(result.project.drafts).toHaveLength(1);
    expect(result.project.workspaces.brief.doc.content).toEqual(project.workspaces.brief.doc.content);
    expect(result.project.workspaces.structure.doc.content).toEqual(project.workspaces.structure.doc.content);
    expect(result.project.drafts[0].draftSettings).toEqual(project.drafts[0].draftSettings);
    // Deep equality on the full project (migration may add defaults, so check key fields)
    expect(result.project.exportSettings).toEqual(project.exportSettings);
    expect(result.project.displaySettings).toEqual(project.displaySettings);
    expect(result.project.projectSettings).toEqual(project.projectSettings);
  });

  it('project with all node types survives round-trip', () => {
    const project = createDefaultProject('Full Song');
    const now = new Date().toISOString();

    project.drafts = [{
      id: 'draft_full',
      name: 'Full Draft',
      createdAt: now,
      updatedAt: now,
      mode: 'lyricsWithChords',
      doc: {
        type: 'doc',
        content: [
          // Section block containing lyric lines
          {
            type: 'sectionBlock',
            attrs: { id: 'sec_1', sectionType: 'verse', label: 'Verse 1', summary: 'Opening verse' },
            content: [
              {
                type: 'lyricLine',
                attrs: {
                  id: 'line_1', delivery: 'sung', lineType: 'lyric',
                  rhymeGroup: null,
                  meta: { alternates: [], prosody: null, chords: [] },
                },
                content: [{ type: 'text', text: 'Hello world' }],
              },
              // Speaker line
              {
                type: 'lyricLine',
                attrs: {
                  id: 'line_2', delivery: 'spoken', lineType: 'speaker',
                  rhymeGroup: null,
                  meta: { alternates: [], prosody: null, chords: [] },
                },
                content: [{ type: 'text', text: 'NARRATOR:' }],
              },
              // Stage direction
              {
                type: 'lyricLine',
                attrs: {
                  id: 'line_3', delivery: 'spoken', lineType: 'stageDirection',
                  rhymeGroup: null,
                  meta: { alternates: [], prosody: null, chords: [] },
                },
                content: [{ type: 'text', text: '(lights dim)' }],
              },
            ],
          },
          // Standalone lyric line with bold and italic marks
          {
            type: 'lyricLine',
            attrs: {
              id: 'line_4', delivery: 'sung', lineType: 'lyric',
              rhymeGroup: 'A',
              meta: { alternates: [], prosody: { syllableCount: 3, stressPattern: ['1', '0', '1'] }, chords: [] },
            },
            content: [
              { type: 'text', text: 'plain ' },
              { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
              { type: 'text', text: ' and ' },
              { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
            ],
          },
        ],
      } as any,
      inventory: {
        type: 'inventory',
        doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'scratch notes' }] }] },
      } as any,
      draftSettings: {
        showChords: true, showSectionLabels: true, showSpeakerLabels: true,
        showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false,
      },
    }];

    const file = createCyrilFile(project);
    const result = roundTrip(file);

    // Section block preserved
    const doc = result.project.drafts[0].doc;
    expect(doc.content).toHaveLength(2);
    expect(doc.content[0].type).toBe('sectionBlock');
    expect((doc.content[0] as any).attrs.sectionType).toBe('verse');
    expect((doc.content[0] as any).attrs.label).toBe('Verse 1');
    expect((doc.content[0] as any).content).toHaveLength(3);

    // Line types preserved
    const sectionContent = (doc.content[0] as any).content;
    expect(sectionContent[0].attrs.lineType).toBe('lyric');
    expect(sectionContent[0].attrs.delivery).toBe('sung');
    expect(sectionContent[1].attrs.lineType).toBe('speaker');
    expect(sectionContent[1].attrs.delivery).toBe('spoken');
    expect(sectionContent[2].attrs.lineType).toBe('stageDirection');

    // Marks preserved
    const markedLine = doc.content[1] as any;
    expect(markedLine.content).toHaveLength(4);
    expect(markedLine.content[1].marks).toEqual([{ type: 'bold' }]);
    expect(markedLine.content[3].marks).toEqual([{ type: 'italic' }]);

    // Prosody preserved
    expect(markedLine.attrs.meta.prosody).toEqual({ syllableCount: 3, stressPattern: ['1', '0', '1'] });

    // Inventory preserved
    expect(result.project.drafts[0].inventory.doc.content[0].content![0].text).toBe('scratch notes');
  });

  it('project with concurrent blocks survives round-trip', () => {
    const project = createDefaultProject('Duet Song');
    const now = new Date().toISOString();

    project.drafts = [{
      id: 'draft_conc',
      name: 'Concurrent Draft',
      createdAt: now,
      updatedAt: now,
      mode: 'lyrics',
      doc: {
        type: 'doc',
        content: [
          {
            type: 'concurrentBlock',
            attrs: { id: 'conc_1' },
            content: [
              {
                type: 'speakerColumn',
                attrs: { id: 'col_1', speakerName: 'Singer A' },
                content: [
                  {
                    type: 'lyricLine',
                    attrs: {
                      id: 'cl_1', delivery: 'sung', lineType: 'lyric',
                      rhymeGroup: null,
                      meta: { alternates: [], prosody: null, chords: [] },
                    },
                    content: [{ type: 'text', text: 'My line' }],
                  },
                ],
              },
              {
                type: 'speakerColumn',
                attrs: { id: 'col_2', speakerName: 'Singer B' },
                content: [
                  {
                    type: 'lyricLine',
                    attrs: {
                      id: 'cl_2', delivery: 'sung', lineType: 'lyric',
                      rhymeGroup: null,
                      meta: { alternates: [], prosody: null, chords: [] },
                    },
                    content: [{ type: 'text', text: 'Your line' }],
                  },
                ],
              },
            ],
          },
        ],
      } as any,
      inventory: { type: 'inventory', doc: { type: 'doc', content: [] } } as any,
      draftSettings: {
        showChords: false, showSectionLabels: true, showSpeakerLabels: true,
        showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false,
      },
    }];

    project.exportSettings.concurrentLayout = 'sideBySide';
    const file = createCyrilFile(project);
    const result = roundTrip(file);

    const doc = result.project.drafts[0].doc;
    expect(doc.content).toHaveLength(1);

    const block = doc.content[0] as any;
    expect(block.type).toBe('concurrentBlock');
    expect(block.attrs.id).toBe('conc_1');
    expect(block.content).toHaveLength(2);

    // Speaker columns preserved
    expect(block.content[0].type).toBe('speakerColumn');
    expect(block.content[0].attrs.speakerName).toBe('Singer A');
    expect(block.content[0].content[0].content[0].text).toBe('My line');

    expect(block.content[1].attrs.speakerName).toBe('Singer B');
    expect(block.content[1].content[0].content[0].text).toBe('Your line');

    // Export setting preserved
    expect(result.project.exportSettings.concurrentLayout).toBe('sideBySide');
  });

  it('project with alternates and chords survives round-trip', () => {
    const project = createDefaultProject('Chord Song');
    const now = new Date().toISOString();

    const chords = [
      {
        id: 'ch_1',
        symbol: 'Am',
        position: { anchorType: 'char' as const, charOffset: 0, bias: 'on' as const },
      },
      {
        id: 'ch_2',
        symbol: 'G',
        position: { anchorType: 'char' as const, charOffset: 5, bias: 'before' as const },
      },
    ];

    const alternates = [
      {
        id: 'alt_1',
        label: 'Version B',
        doc: { type: 'doc' as const, content: [{ type: 'text', text: 'Alternate text' }] },
        isActive: false,
      },
      {
        id: 'alt_2',
        label: undefined,
        doc: { type: 'doc' as const, content: [{ type: 'text', text: 'Third option' }] },
        isActive: false,
      },
    ];

    project.drafts = [{
      id: 'draft_chords',
      name: 'Chords Draft',
      createdAt: now,
      updatedAt: now,
      mode: 'lyricsWithChords',
      doc: {
        type: 'doc',
        content: [
          {
            type: 'lyricLine',
            attrs: {
              id: 'line_ch',
              delivery: 'sung',
              lineType: 'lyric',
              rhymeGroup: 'A',
              meta: { alternates, prosody: null, chords },
            },
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      } as any,
      inventory: { type: 'inventory', doc: { type: 'doc', content: [] } } as any,
      draftSettings: {
        showChords: true, showSectionLabels: true, showSpeakerLabels: true,
        showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false,
      },
    }];

    const file = createCyrilFile(project);
    const result = roundTrip(file);

    const line = result.project.drafts[0].doc.content[0] as any;

    // Chords preserved
    expect(line.attrs.meta.chords).toHaveLength(2);
    expect(line.attrs.meta.chords[0]).toEqual(chords[0]);
    expect(line.attrs.meta.chords[1]).toEqual(chords[1]);

    // Alternates preserved
    expect(line.attrs.meta.alternates).toHaveLength(2);
    expect(line.attrs.meta.alternates[0].id).toBe('alt_1');
    expect(line.attrs.meta.alternates[0].label).toBe('Version B');
    expect(line.attrs.meta.alternates[0].isActive).toBe(false);
    expect(line.attrs.meta.alternates[0].doc.content[0].text).toBe('Alternate text');
    expect(line.attrs.meta.alternates[1].id).toBe('alt_2');
    expect(line.attrs.meta.alternates[1].doc.content[0].text).toBe('Third option');

    // Rhyme group preserved
    expect(line.attrs.rhymeGroup).toBe('A');
  });

  it('project with populated workspaces survives round-trip', () => {
    const project = createDefaultProject('Workspace Song');

    project.workspaces = {
      brief: {
        doc: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Song concept and brief notes' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Target audience: teens' }] },
          ],
        },
      },
      structure: {
        doc: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Verse-Chorus-Verse-Bridge-Chorus' }] },
          ],
        },
      },
      hookLab: {
        doc: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [
              { type: 'text', text: 'Hook idea: ' },
              { type: 'text', text: 'catchy phrase', marks: [{ type: 'bold' }] },
            ] },
          ],
        },
      },
      vocabularyWorld: {
        doc: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Keywords: light, shadow, freedom' }] },
          ],
        },
      },
    };

    project.subtitle = 'A demo song';
    project.writers = [
      { id: 'w1', name: 'Alice', role: 'lyricist' },
      { id: 'w2', name: 'Bob', role: 'composer', email: 'bob@example.com' },
    ];

    const file = createCyrilFile(project);
    const result = roundTrip(file);

    // Workspace content preserved
    expect(result.project.workspaces.brief.doc.content).toHaveLength(2);
    expect(result.project.workspaces.brief.doc.content[0].content![0].text).toBe('Song concept and brief notes');
    expect(result.project.workspaces.brief.doc.content[1].content![0].text).toBe('Target audience: teens');

    expect(result.project.workspaces.structure.doc.content[0].content![0].text).toBe('Verse-Chorus-Verse-Bridge-Chorus');

    // Bold mark in hookLab preserved
    const hookContent = result.project.workspaces.hookLab.doc.content[0].content!;
    expect(hookContent[1].text).toBe('catchy phrase');
    expect(hookContent[1].marks).toEqual([{ type: 'bold' }]);

    expect(result.project.workspaces.vocabularyWorld.doc.content[0].content![0].text).toBe('Keywords: light, shadow, freedom');

    // Metadata preserved
    expect(result.project.subtitle).toBe('A demo song');
    expect(result.project.writers).toHaveLength(2);
    expect(result.project.writers![0].name).toBe('Alice');
    expect(result.project.writers![1].email).toBe('bob@example.com');
  });
});
