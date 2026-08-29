import { describe, it, expect } from 'vitest';
import {
  CHARACTER_COLOR_ORDER,
  characterColorVar,
  createCharacter,
  findCharacterByName,
  findCharacterById,
  nextCharacterColor,
  resolveCharacterColor,
} from '../../../src/domain/project/characters';
import { Character, CyrilFile } from '../../../src/domain/project/types';
import { buildExportableDraft } from '../../../src/domain/export/exportSelectors';
import { squashConcurrentBlock, buildSideBySideConcurrentBlock } from '../../../src/domain/export/concurrentExport';
import { ResolvedExportOptions } from '../../../src/domain/export/exportTypes';

const defaultOptions: ResolvedExportOptions = {
  includeSectionLabels: true,
  includeSpeakerLabels: true,
  includeStageDirections: true,
  includeChords: false,
  pageDensity: 'normal',
  concurrentLayout: 'squash',
};

describe('character registry domain helpers (C-20)', () => {
  it('nextCharacterColor auto-assigns in the fixed blue/green/gold/rose/violet order and cycles past five', () => {
    let characters: Character[] = [];
    const assigned: string[] = [];
    for (let i = 0; i < 7; i++) {
      const color = nextCharacterColor(characters);
      assigned.push(color);
      characters = [...characters, { id: `c${i}`, name: `Char ${i}`, color }];
    }
    expect(assigned).toEqual([...CHARACTER_COLOR_ORDER, CHARACTER_COLOR_ORDER[0], CHARACTER_COLOR_ORDER[1]]);
  });

  it('findCharacterByName matches case- and whitespace-insensitively', () => {
    const characters: Character[] = [{ id: 'c1', name: 'Jack', color: 'blue' }];
    expect(findCharacterByName(characters, 'JACK')?.id).toBe('c1');
    expect(findCharacterByName(characters, '  jack  ')?.id).toBe('c1');
    expect(findCharacterByName(characters, 'Jill')).toBeUndefined();
  });

  it('createCharacter assigns the next colour and a stable id', () => {
    const existing: Character[] = [{ id: 'c1', name: 'A', color: 'blue' }];
    const created = createCharacter('  Woody  ', existing);
    expect(created.name).toBe('Woody');
    expect(created.color).toBe('green');
    expect(created.id).toBeTruthy();
    // Does not mutate the input
    expect(existing).toHaveLength(1);
  });

  it('resolveCharacterColor prefers characterId over a name match', () => {
    const characters: Character[] = [
      { id: 'c1', name: 'JACK', color: 'blue' },
      { id: 'c2', name: 'JILL', color: 'rose' },
    ];
    // characterId points at c2, even though the literal text says "JACK" —
    // characterId wins (covers a renamed character whose line text hasn't
    // been retyped).
    expect(resolveCharacterColor(characters, 'c2', 'JACK')).toBe('rose');
    // No characterId — falls back to name match.
    expect(resolveCharacterColor(characters, null, 'jack')).toBe('blue');
    // Neither resolves.
    expect(resolveCharacterColor(characters, null, 'NOBODY')).toBeUndefined();
  });

  it('characterColorVar resolves to the section-accent custom property', () => {
    expect(characterColorVar('gold')).toBe('var(--section-gold)');
  });

  it('findCharacterById returns undefined for a null/missing id', () => {
    const characters: Character[] = [{ id: 'c1', name: 'A', color: 'blue' }];
    expect(findCharacterById(characters, null)).toBeUndefined();
    expect(findCharacterById(characters, 'missing')).toBeUndefined();
    expect(findCharacterById(characters, 'c1')?.name).toBe('A');
  });
});

describe('T-4.30/T-4.31: character colour reaches export (print/export consumes `speakerColor`)', () => {
  function buildProject(characters: Character[]): CyrilFile {
    return {
      schemaVersion: '1.0.0',
      project: {
        id: 'proj_1',
        title: 'Test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        workspaces: {
          brief: { doc: { type: 'doc', content: [] } },
          structure: { doc: { type: 'doc', content: [] } },
          hookLab: { doc: { type: 'doc', content: [] } },
          vocabularyWorld: { doc: { type: 'doc', content: [] } },
        },
        drafts: [],
        activeDraftId: null,
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
          includeSectionLabels: true,
          includeSpeakerLabels: true,
          includeStageDirections: true,
          includeChords: false,
          fontPreset: 'default',
          pageDensity: 'normal',
          concurrentLayout: 'squash',
        },
        projectSettings: { autosave: true, preferredExportMode: 'lyricsOnly' },
        characters,
      },
    };
  }

  it('T-4.30: a speaker line linked by characterId exports with its character\'s colour', () => {
    const characters: Character[] = [{ id: 'char_jack', name: 'JACK', color: 'rose' }];
    const projectFile = buildProject(characters);
    const draft = {
      id: 'draft_1',
      name: 'D1',
      createdAt: '', updatedAt: '', mode: 'lyrics' as const,
      doc: {
        type: 'doc' as const,
        content: [{
          type: 'sectionBlock',
          attrs: { id: 'sec_1', sectionType: 'verse' as const },
          content: [
            { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
            { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'Howdy!' }] },
          ],
        }],
      },
      inventory: { type: 'inventory' as const, doc: { type: 'doc' as const, content: [] } },
      draftSettings: {} as any,
    };

    const exportable = buildExportableDraft(projectFile, draft, defaultOptions);
    const speakerLine = exportable.sections[0].lines.find(l => l.type === 'speaker');
    expect(speakerLine?.speakerColor).toBe('rose');
  });

  it('T-4.31: recolouring a character (same id, new colour) changes what the next export produces', () => {
    const draft = {
      id: 'draft_1', name: 'D1', createdAt: '', updatedAt: '', mode: 'lyrics' as const,
      doc: {
        type: 'doc' as const,
        content: [{
          type: 'sectionBlock',
          attrs: { id: 'sec_1', sectionType: 'verse' as const },
          content: [
            { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
          ],
        }],
      },
      inventory: { type: 'inventory' as const, doc: { type: 'doc' as const, content: [] } },
      draftSettings: {} as any,
    };

    const before = buildExportableDraft(buildProject([{ id: 'char_jack', name: 'JACK', color: 'blue' }]), draft, defaultOptions);
    expect(before.sections[0].lines[0].speakerColor).toBe('blue');

    const after = buildExportableDraft(buildProject([{ id: 'char_jack', name: 'JACK', color: 'violet' }]), draft, defaultOptions);
    expect(after.sections[0].lines[0].speakerColor).toBe('violet');
  });

  it('T-4.36: a concurrent-block column inherits its linked character\'s colour in squash and side-by-side export', () => {
    const characters: Character[] = [{ id: 'char_jack', name: 'JACK', color: 'gold' }];
    const block = {
      type: 'concurrentBlock',
      attrs: { id: 'cb_1' },
      content: [
        {
          type: 'speakerColumn',
          attrs: { id: 'col_1', speakerName: 'JACK', characterId: 'char_jack' },
          content: [{ type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'Hi' }] }],
        },
        {
          type: 'speakerColumn',
          attrs: { id: 'col_2', speakerName: 'JILL' },
          content: [{ type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'Hey' }] }],
        },
      ],
    };

    const squashed = squashConcurrentBlock(block as any, defaultOptions, characters);
    const jackLabel = squashed.find(l => l.type === 'speaker' && l.speaker === 'JACK');
    expect(jackLabel?.speakerColor).toBe('gold');
    const jillLabel = squashed.find(l => l.type === 'speaker' && l.speaker === 'JILL');
    expect(jillLabel?.speakerColor).toBeUndefined();

    const sideBySide = buildSideBySideConcurrentBlock(block as any, defaultOptions, characters);
    expect(sideBySide.columns[0].speakerColor).toBe('gold');
    expect(sideBySide.columns[1].speakerColor).toBeUndefined();
  });
});
