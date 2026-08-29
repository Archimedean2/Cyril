import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { CenterPane } from '../../../src/components/layout/CenterPane';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { Character } from '../../../src/domain/project/types';

// C-20: characters as first-class coloured identities.
describe('Character registry integration (C-20)', () => {
  const CHARACTERS: Character[] = [
    { id: 'char_jack', name: 'JACK', color: 'blue' },
    { id: 'char_jill', name: 'JILL', color: 'rose' },
  ];

  function setUpDraftWithCharacters() {
    const project = createDefaultProject('Characters Test');
    project.characters = CHARACTERS;
    project.drafts = [{
      id: 'draft_characters',
      name: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mode: 'lyrics',
      doc: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'JACK' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'Howdy!' }] },
          { type: 'lyricLine', attrs: { id: 'l3', lineType: 'speaker', characterId: 'char_jill', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'JILL' }] },
          { type: 'lyricLine', attrs: { id: 'l4', lineType: 'lyric', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'Hey Jack.' }] },
          { type: 'lyricLine', attrs: { id: 'l5', lineType: 'speaker', characterId: 'char_jack', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'JACK' }] },
        ] as any,
      },
      inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
      draftSettings: {
        showChords: true, showSectionLabels: true, showSpeakerLabels: true,
        showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false,
      },
    }];

    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: 'draft_characters' },
      error: null,
      saveProject: vi.fn(),
    });
  }

  beforeEach(() => {
    setUpDraftWithCharacters();
  });

  it('T-4.30: each character\'s speaker lines carry that character\'s colour in the rendered editor', async () => {
    render(<CenterPane />);
    const surface = await screen.findByTestId('editor-surface');

    const speakerLines = surface.querySelectorAll('.line-type-speaker');
    expect(speakerLines).toHaveLength(3);

    const jackLine1 = speakerLines[0] as HTMLElement;
    const jillLine = speakerLines[1] as HTMLElement;
    const jackLine2 = speakerLines[2] as HTMLElement;

    expect(jackLine1.classList.contains('has-character-color')).toBe(true);
    expect(jackLine1.style.getPropertyValue('--speaker-color')).toContain('var(--section-blue)');

    expect(jillLine.classList.contains('has-character-color')).toBe(true);
    expect(jillLine.style.getPropertyValue('--speaker-color')).toContain('var(--section-rose)');

    // Third speaker line is JACK again — same colour.
    expect(jackLine2.style.getPropertyValue('--speaker-color')).toContain('var(--section-blue)');
  });

  it('T-4.33: a speaker line for the same character as the one before it (JILL in between, but JACK repeats non-consecutively) is not falsely marked continuation; only a true back-to-back repeat is', async () => {
    render(<CenterPane />);
    const surface = await screen.findByTestId('editor-surface');
    const speakerLines = surface.querySelectorAll('.line-type-speaker');

    // JACK → JILL → JACK: JILL interrupts, so the final JACK line is a fresh
    // appearance relative to the *immediately preceding speaker line* (JILL),
    // not a continuation.
    expect(speakerLines[0].classList.contains('speaker-continuation')).toBe(false);
    expect(speakerLines[1].classList.contains('speaker-continuation')).toBe(false);
    expect(speakerLines[2].classList.contains('speaker-continuation')).toBe(false);
  });

  it('T-4.33: two back-to-back speaker lines for the same character — the second is a continuation (label hidden, gutter tick class present)', async () => {
    const project = createDefaultProject('Continuation Test');
    project.characters = CHARACTERS;
    project.drafts = [{
      id: 'draft_cont', name: 'Draft', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      mode: 'lyrics',
      doc: {
        type: 'doc',
        content: [
          { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'JACK' }] },
          { type: 'lyricLine', attrs: { id: 'l2', lineType: 'stageDirection', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: '(beat)' }] },
          { type: 'lyricLine', attrs: { id: 'l3', lineType: 'speaker', characterId: 'char_jack', rhymeGroup: null, meta: { alternates: [], prosody: null, chords: [] } }, content: [{ type: 'text', text: 'JACK' }] },
        ] as any,
      },
      inventory: { type: 'inventory', doc: { type: 'doc', content: [] } },
      draftSettings: {
        showChords: true, showSectionLabels: true, showSpeakerLabels: true,
        showStageDirections: true, showSummaries: true, showSyllableCounts: false, showStressMarks: false,
      },
    }];
    useProjectStore.setState({
      isProjectLoaded: true,
      currentProject: createCyrilFile(project),
      activeView: { type: 'draft', draftId: 'draft_cont' },
      error: null,
      saveProject: vi.fn(),
    });

    render(<CenterPane />);
    const surface = await screen.findByTestId('editor-surface');
    const speakerLines = surface.querySelectorAll('.line-type-speaker');
    expect(speakerLines).toHaveLength(2);
    expect(speakerLines[0].classList.contains('speaker-continuation')).toBe(false);
    expect(speakerLines[1].classList.contains('speaker-continuation')).toBe(true);
    // The continuation still carries the colour, for the gutter tick.
    expect((speakerLines[1] as HTMLElement).style.getPropertyValue('--speaker-color')).toContain('var(--section-blue)');
  });

  it('T-4.34: the character registry (Structure workspace) lists every character with its colour and name', async () => {
    useProjectStore.setState({ activeView: { type: 'workspace', workspace: 'structure' } });
    render(<CenterPane />);

    const rows = await screen.findAllByTestId('character-registry-row');
    expect(rows).toHaveLength(2);

    const nameInputs = screen.getAllByTestId('character-registry-name-input') as HTMLInputElement[];
    expect(nameInputs.map(i => i.value)).toEqual(['JACK', 'JILL']);
  });

  it('recolouring a character from the registry updates the store (and therefore every line that resolves to it)', async () => {
    const user = userEvent.setup();
    useProjectStore.setState({ activeView: { type: 'workspace', workspace: 'structure' } });
    render(<CenterPane />);

    const swatches = await screen.findAllByTestId('character-registry-swatch');
    await user.click(swatches[0]); // open JACK's colour picker

    const goldOption = await screen.findByTestId('character-registry-swatch-option-gold');
    await user.click(goldOption);

    await waitFor(() => {
      const updated = useProjectStore.getState().currentProject?.project.characters?.find(c => c.id === 'char_jack');
      expect(updated?.color).toBe('gold');
    });
  });

  it('renaming a character from the registry updates the store', async () => {
    const user = userEvent.setup();
    useProjectStore.setState({ activeView: { type: 'workspace', workspace: 'structure' } });
    render(<CenterPane />);

    const nameInputs = await screen.findAllByTestId('character-registry-name-input');
    await user.clear(nameInputs[0]);
    await user.type(nameInputs[0], 'JACOB');

    await waitFor(() => {
      const updated = useProjectStore.getState().currentProject?.project.characters?.find(c => c.id === 'char_jack');
      expect(updated?.name).toBe('JACOB');
    });
  });

  it('adding a character from the registry appends a new entry with an auto-assigned colour', async () => {
    const user = userEvent.setup();
    useProjectStore.setState({ activeView: { type: 'workspace', workspace: 'structure' } });
    render(<CenterPane />);

    const addBtn = await screen.findByTestId('character-registry-add-btn');
    await user.click(addBtn);

    await waitFor(() => {
      const characters = useProjectStore.getState().currentProject?.project.characters ?? [];
      expect(characters).toHaveLength(3);
      // Two existing characters used blue/rose; the third gets the next colour in order.
      expect(characters[2].color).toBe('gold');
    });
  });
});
