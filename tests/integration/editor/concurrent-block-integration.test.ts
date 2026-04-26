/**
 * Stage 13 — Concurrent Block integration tests
 * Covers: migration, save/load round-trip, chord preservation through columns.
 */

import { describe, it, expect } from 'vitest';
import { migrateProject } from '../../../src/domain/project/migration';
import { buildExportableDraft } from '../../../src/domain/export/exportSelectors';
import { ResolvedExportOptions } from '../../../src/domain/export/exportTypes';

const defaultOptions: ResolvedExportOptions = {
  includeSectionLabels: true,
  includeSpeakerLabels: true,
  includeStageDirections: true,
  includeChords: false,
  pageDensity: 'normal',
  concurrentLayout: 'squash',
};

// ─── T-13.12: migration ───────────────────────────────────────────────────────

describe('T-13.12: migration adds concurrentLayout default', () => {
  it('adds concurrentLayout: squash to projects that lack the field', () => {
    const legacyProject = {
      schemaVersion: '1.0.0',
      project: {
        id: 'proj_legacy',
        title: 'Legacy Song',
        drafts: [],
        exportSettings: {
          includeSectionLabels: true,
          includeSpeakerLabels: true,
          includeStageDirections: true,
          includeChords: false,
          fontPreset: 'default',
          pageDensity: 'normal',
          // concurrentLayout intentionally absent
        },
      },
    };

    const migrated = migrateProject(legacyProject);
    expect(migrated.project.exportSettings.concurrentLayout).toBe('squash');
  });

  it('preserves explicit concurrentLayout value if already present', () => {
    const project = {
      schemaVersion: '1.0.0',
      project: {
        id: 'proj_new',
        title: 'New Song',
        drafts: [],
        exportSettings: {
          includeSectionLabels: true,
          includeSpeakerLabels: true,
          includeStageDirections: true,
          includeChords: false,
          fontPreset: 'default',
          pageDensity: 'normal',
          concurrentLayout: 'sideBySide',
        },
      },
    };

    const migrated = migrateProject(project);
    expect(migrated.project.exportSettings.concurrentLayout).toBe('sideBySide');
  });
});

// ─── T-13.13: save/load round-trip ───────────────────────────────────────────

describe('T-13.13: concurrentBlock save/load round-trip', () => {
  const projectWithConcurrent = {
    schemaVersion: '1.0.0',
    project: {
      id: 'proj_concurrent',
      title: 'Concurrent Song',
      subtitle: '',
      writers: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      workspaces: {
        brief: { doc: { type: 'doc', content: [] } },
        structure: { doc: { type: 'doc', content: [] } },
        hookLab: { doc: { type: 'doc', content: [] } },
        vocabularyWorld: { doc: { type: 'doc', content: [] } },
      },
      drafts: [
        {
          id: 'draft_001',
          name: 'Draft 1',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          mode: 'lyrics',
          doc: {
            type: 'doc',
            content: [
              {
                type: 'concurrentBlock',
                attrs: { id: 'concurrent_001' },
                content: [
                  {
                    type: 'speakerColumn',
                    attrs: { id: 'col_woody', speakerName: 'WOODY' },
                    content: [
                      {
                        type: 'lyricLine',
                        attrs: { id: 'line_001', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                          meta: { alternates: [], prosody: null, chords: [] } },
                        content: [{ type: 'text', text: 'You got a friend in me' }],
                      },
                    ],
                  },
                  {
                    type: 'speakerColumn',
                    attrs: { id: 'col_buzz', speakerName: 'BUZZ' },
                    content: [
                      {
                        type: 'lyricLine',
                        attrs: { id: 'line_002', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                          meta: { alternates: [], prosody: null, chords: [] } },
                        content: [{ type: 'text', text: 'To infinity and beyond' }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
          draftSettings: {
            showChords: false, showSectionLabels: true, showSpeakerLabels: true,
            showStageDirections: true, showSummaries: true, showSyllableCounts: false,
          },
        },
      ],
      activeDraftId: 'draft_001',
      displaySettings: {
        defaultShowChords: false, defaultShowSectionLabels: true, defaultShowSpeakerLabels: true,
        defaultShowStageDirections: true, defaultShowSummaries: true, defaultShowSyllableCounts: false,
        rhymeColorMode: 'off',
      },
      exportSettings: {
        includeSectionLabels: true, includeSpeakerLabels: true, includeStageDirections: true,
        includeChords: false, fontPreset: 'default', pageDensity: 'normal', concurrentLayout: 'squash',
      },
      projectSettings: { autosave: true, preferredExportMode: 'lyricsOnly' },
    },
  };

  it('preserves speakerName and lyricLine content after migration round-trip', () => {
    const migrated = migrateProject(projectWithConcurrent);
    const draft = migrated.project.drafts[0];

    expect(draft.doc.content[0].type).toBe('concurrentBlock');
    const block = draft.doc.content[0];
    expect(block.content![0].attrs?.speakerName).toBe('WOODY');
    expect(block.content![1].attrs?.speakerName).toBe('BUZZ');

    const woodyLine = block.content![0].content![0];
    expect(woodyLine.content![0].text).toBe('You got a friend in me');

    const buzzLine = block.content![1].content![0];
    expect(buzzLine.content![0].text).toBe('To infinity and beyond');
  });

  it('round-trips through exportSelectors preserving content', () => {
    const migrated = migrateProject(projectWithConcurrent);
    const draft = migrated.project.drafts[0];

    const exportable = buildExportableDraft(migrated as any, draft, defaultOptions);

    expect(exportable.sections).toHaveLength(1);
    const lyricLines = exportable.sections[0].lines.filter(l => l.type === 'lyric');
    expect(lyricLines.map(l => l.content)).toContain('You got a friend in me');
    expect(lyricLines.map(l => l.content)).toContain('To infinity and beyond');
  });
});

// ─── T-13.14: chords inside speakerColumn ─────────────────────────────────────

describe('T-13.14: chords on lyricLines inside speakerColumn are preserved', () => {
  it('chord data survives migration and export', () => {
    const projectWithChords = {
      schemaVersion: '1.0.0',
      project: {
        id: 'proj_chords',
        title: 'Chord Song',
        subtitle: '',
        writers: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        workspaces: {
          brief: { doc: { type: 'doc', content: [] } },
          structure: { doc: { type: 'doc', content: [] } },
          hookLab: { doc: { type: 'doc', content: [] } },
          vocabularyWorld: { doc: { type: 'doc', content: [] } },
        },
        drafts: [
          {
            id: 'draft_001',
            name: 'Draft 1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            mode: 'lyricsWithChords',
            doc: {
              type: 'doc',
              content: [
                {
                  type: 'concurrentBlock',
                  attrs: { id: 'cb_001' },
                  content: [
                    {
                      type: 'speakerColumn',
                      attrs: { id: 'col_a', speakerName: 'A' },
                      content: [
                        {
                          type: 'lyricLine',
                          attrs: {
                            id: 'line_001', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                            meta: {
                              alternates: [],
                              prosody: null,
                              chords: [
                                { id: 'chord_001', symbol: 'G', position: { anchorType: 'char', charOffset: 0, bias: 'before' } },
                              ],
                            },
                          },
                          content: [{ type: 'text', text: 'Gone' }],
                        },
                      ],
                    },
                    {
                      type: 'speakerColumn',
                      attrs: { id: 'col_b', speakerName: 'B' },
                      content: [
                        {
                          type: 'lyricLine',
                          attrs: { id: 'line_002', delivery: 'sung', rhymeGroup: null, lineType: 'lyric',
                            meta: { alternates: [], prosody: null, chords: [] } },
                          content: [{ type: 'text', text: 'Away' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
            draftSettings: {
              showChords: true, showSectionLabels: true, showSpeakerLabels: true,
              showStageDirections: true, showSummaries: true, showSyllableCounts: false,
            },
          },
        ],
        activeDraftId: 'draft_001',
        displaySettings: {
          defaultShowChords: true, defaultShowSectionLabels: true, defaultShowSpeakerLabels: true,
          defaultShowStageDirections: true, defaultShowSummaries: true, defaultShowSyllableCounts: false,
          rhymeColorMode: 'off',
        },
        exportSettings: {
          includeSectionLabels: true, includeSpeakerLabels: false, includeStageDirections: true,
          includeChords: true, fontPreset: 'default', pageDensity: 'normal', concurrentLayout: 'squash',
        },
        projectSettings: { autosave: true, preferredExportMode: 'lyricsWithChords' },
      },
    };

    const migrated = migrateProject(projectWithChords);
    const draft = migrated.project.drafts[0];
    const chordsOptions: ResolvedExportOptions = {
      ...defaultOptions,
      includeChords: true,
      includeSpeakerLabels: false,
    };

    const exportable = buildExportableDraft(migrated as any, draft, chordsOptions);

    const goneLine = exportable.sections[0].lines.find(l => l.content === 'Gone');
    expect(goneLine).toBeDefined();
    expect(goneLine?.chords).toHaveLength(1);
    expect(goneLine?.chords![0].symbol).toBe('G');
  });
});
