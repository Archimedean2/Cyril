import { describe, it, expect } from 'vitest';
import { migrateProject } from '../../../src/domain/project/migration';
import { SCHEMA_VERSION } from '../../../src/domain/project/defaults';

describe('migrateProject', () => {
  it('migrates legacy speakerLine nodes to unified lyricLine with lineType: speaker', () => {
    const legacy = {
      project: {
        id: 'proj_legacy',
        title: 'Legacy Song',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        drafts: [{
          id: 'draft_1',
          name: 'D1',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          mode: 'lyrics',
          doc: {
            type: 'doc',
            content: [{
              type: 'speakerLine',
              attrs: { id: 'sl_1', speaker: 'NARRATOR' },
              content: [{ type: 'text', text: 'Hello' }],
            }],
          },
          inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
          draftSettings: {},
        }],
      },
    };

    const result = migrateProject(legacy);
    const migratedNode = result.project.drafts[0].doc.content[0] as any;

    expect(migratedNode.type).toBe('lyricLine');
    expect(migratedNode.attrs.lineType).toBe('speaker');
    expect(migratedNode.attrs.id).toBe('sl_1');
    expect(migratedNode.attrs.delivery).toBe('sung');
    expect(migratedNode.attrs.meta).toEqual({ alternates: [], prosody: null, chords: [] });
    expect(migratedNode.content).toEqual([{ type: 'text', text: 'Hello' }]);
  });

  it('migrates legacy speakerLine without content but with speaker attr to lyricLine carrying speaker text', () => {
    const legacy = {
      project: {
        id: 'p',
        title: 'T',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        drafts: [{
          id: 'd', name: 'D',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          mode: 'lyrics',
          doc: {
            type: 'doc',
            content: [{
              type: 'speakerLine',
              attrs: { id: 'sl_2', speaker: 'ALICE' },
            }],
          },
          inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
          draftSettings: {},
        }],
      },
    };

    const result = migrateProject(legacy);
    const node = result.project.drafts[0].doc.content[0] as any;

    expect(node.type).toBe('lyricLine');
    expect(node.attrs.lineType).toBe('speaker');
    expect(node.content).toEqual([{ type: 'text', text: 'ALICE' }]);
  });

  it('migrates legacy stageDirection nodes to unified lyricLine with lineType: stageDirection', () => {
    const legacy = {
      project: {
        id: 'p',
        title: 'T',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        drafts: [{
          id: 'd', name: 'D',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          mode: 'lyrics',
          doc: {
            type: 'doc',
            content: [{
              type: 'stageDirection',
              attrs: { id: 'sd_1', text: '(lights dim)' },
            }],
          },
          inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
          draftSettings: {},
        }],
      },
    };

    const result = migrateProject(legacy);
    const node = result.project.drafts[0].doc.content[0] as any;

    expect(node.type).toBe('lyricLine');
    expect(node.attrs.lineType).toBe('stageDirection');
    expect(node.attrs.id).toBe('sd_1');
    expect(node.content).toEqual([{ type: 'text', text: '(lights dim)' }]);
  });

  it('migrates legacy nodes nested inside section blocks (recursive)', () => {
    const legacy = {
      project: {
        id: 'p',
        title: 'T',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        drafts: [{
          id: 'd', name: 'D',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          mode: 'lyrics',
          doc: {
            type: 'doc',
            content: [{
              type: 'sectionBlock',
              attrs: { id: 'sec_1', sectionType: 'verse' },
              content: [
                { type: 'speakerLine', attrs: { id: 'sl_x', speaker: 'BOB' }, content: [{ type: 'text', text: 'Yo' }] },
                { type: 'stageDirection', attrs: { id: 'sd_x' }, content: [{ type: 'text', text: 'walks in' }] },
              ],
            }],
          },
          inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
          draftSettings: {},
        }],
      },
    };

    const result = migrateProject(legacy);
    const section = result.project.drafts[0].doc.content[0] as any;

    expect(section.type).toBe('sectionBlock');
    expect(section.content).toHaveLength(2);
    expect(section.content[0].type).toBe('lyricLine');
    expect(section.content[0].attrs.lineType).toBe('speaker');
    expect(section.content[1].type).toBe('lyricLine');
    expect(section.content[1].attrs.lineType).toBe('stageDirection');
    expect(section.content[1].content).toEqual([{ type: 'text', text: 'walks in' }]);
  });

  it('fills missing draftSettings fields with defaults', () => {
    const legacy = {
      project: {
        id: 'p',
        title: 'T',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        drafts: [{
          id: 'd', name: 'D',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          mode: 'lyrics',
          doc: { type: 'doc', content: [] },
          inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
          // Only one of the seven settings provided
          draftSettings: { showChords: false },
        }],
      },
    };

    const result = migrateProject(legacy);
    const settings = result.project.drafts[0].draftSettings;

    // Provided value preserved
    expect(settings.showChords).toBe(false);
    // Missing fields filled with defaults
    expect(settings.showSectionLabels).toBe(true);
    expect(settings.showSpeakerLabels).toBe(true);
    expect(settings.showStageDirections).toBe(true);
    expect(settings.showSummaries).toBe(true);
    expect(settings.showSyllableCounts).toBe(false);
    expect(settings.showStressMarks).toBe(false);
  });

  it('fills missing exportSettings.concurrentLayout with default "squash"', () => {
    const legacy = {
      project: {
        id: 'p',
        title: 'T',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        drafts: [],
        exportSettings: {
          includeSectionLabels: false,
          includeSpeakerLabels: true,
          includeStageDirections: true,
          includeChords: false,
          fontPreset: 'default',
          pageDensity: 'normal',
          // concurrentLayout intentionally missing
        },
      },
    };

    const result = migrateProject(legacy);

    expect(result.project.exportSettings.concurrentLayout).toBe('squash');
    // Other provided values preserved
    expect(result.project.exportSettings.includeSectionLabels).toBe(false);
    expect(result.project.exportSettings.pageDensity).toBe('normal');
  });

  it('handles project with no schemaVersion (raw project data) and stamps current SCHEMA_VERSION', () => {
    // Top-level data is the project itself (no { schemaVersion, project } wrapper)
    const rawProject = {
      id: 'proj_raw',
      title: 'Raw Project',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      drafts: [],
    };

    const result = migrateProject(rawProject);

    expect(result.schemaVersion).toBe(SCHEMA_VERSION);
    expect(result.project.id).toBe('proj_raw');
    expect(result.project.title).toBe('Raw Project');
    // Defaults filled in
    expect(result.project.workspaces).toBeDefined();
    expect(result.project.exportSettings).toBeDefined();
    expect(result.project.displaySettings).toBeDefined();
    expect(result.project.projectSettings).toBeDefined();
  });

  it('preserves unknown top-level project fields', () => {
    const legacy = {
      project: {
        id: 'p',
        title: 'T',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        drafts: [],
        // Unknown future fields the user may have added
        customField: 'preserve me',
        experimentalFlags: { foo: 'bar' },
      },
    };

    const result = migrateProject(legacy);

    expect((result.project as any).customField).toBe('preserve me');
    expect((result.project as any).experimentalFlags).toEqual({ foo: 'bar' });
  });

  it('handles drafts array missing or undefined gracefully', () => {
    const legacy = {
      project: {
        id: 'p',
        title: 'No Drafts',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        // drafts intentionally missing
      },
    };

    const result = migrateProject(legacy);

    expect(Array.isArray(result.project.drafts)).toBe(true);
    expect(result.project.drafts).toHaveLength(0);
  });
});
