import { describe, test, expect, afterEach } from 'vitest';
import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { DraftEditor } from '../../../src/components/editor/DraftEditor';
import { Character, RichTextDocument } from '../../../src/domain/project/types';

/**
 * C-35 (§12.1) — speaker picker on the character colour dot. The three
 * intents the spec calls out are the point: reassignment is **local** (this
 * line only), never mints a new character, and is a single undo step.
 * Renaming (the registry-wide intent) is out of scope here.
 */
describe('C-35: character colour-dot picker', () => {
  afterEach(() => cleanup());

  const CHARACTERS: Character[] = [
    { id: 'char_jack', name: 'JACK', color: 'blue' },
    { id: 'char_jill', name: 'JILL', color: 'rose' },
  ];

  const doc: RichTextDocument = {
    type: 'doc',
    content: [
      { type: 'lyricLine', attrs: { id: 'l1', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
      { type: 'lyricLine', attrs: { id: 'l2', lineType: 'lyric' }, content: [{ type: 'text', text: 'Howdy!' }] },
      { type: 'lyricLine', attrs: { id: 'l3', lineType: 'speaker', characterId: 'char_jill' }, content: [{ type: 'text', text: 'JILL' }] },
      { type: 'lyricLine', attrs: { id: 'l4', lineType: 'lyric' }, content: [{ type: 'text', text: 'Hey Jack.' }] },
    ] as any,
  };

  test('T-4.50: clicking the colour dot then choosing a character reassigns that line only, in one undo step, and creates no new character', async () => {
    let latestDoc: RichTextDocument | null = null;
    render(
      <DraftEditor
        initialContent={doc}
        onChange={(d) => { latestDoc = d; }}
        characters={CHARACTERS}
      />
    );

    const dots = await waitFor(() => {
      const found = document.querySelectorAll('.cyril-character-dot');
      expect(found.length).toBe(2); // one per speaker line
      return found;
    });

    // The first dot belongs to the JACK line.
    fireEvent.click(dots[0]);

    const picker = await waitFor(() => {
      const el = document.querySelector('[data-testid="character-dot-picker"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });
    const options = picker.querySelectorAll('[data-testid="character-dot-picker-option"]');
    expect(options.length).toBe(2); // JACK and JILL both offered — never filtered to "other than current"

    const jillOption = Array.from(options).find((o) => o.textContent === 'JILL')!;
    fireEvent.click(jillOption);

    await waitFor(() => expect(latestDoc).not.toBeNull());
    const lines = (latestDoc as any).content;
    // Line 1 (was JACK) is now reassigned to JILL — text AND characterId.
    expect(lines[0].attrs.characterId).toBe('char_jill');
    expect(lines[0].content).toEqual([{ type: 'text', text: 'JILL' }]);
    // The line that was already JILL is untouched — reassignment is local,
    // not a registry-wide rename.
    expect(lines[2].attrs.characterId).toBe('char_jill');
    expect(lines[2].content).toEqual([{ type: 'text', text: 'JILL' }]);
    // The lyric lines in between are untouched.
    expect(lines[1].content).toEqual([{ type: 'text', text: 'Howdy!' }]);
    expect(lines[3].content).toEqual([{ type: 'text', text: 'Hey Jack.' }]);

    // The picker closes itself after a selection.
    expect(document.querySelector('[data-testid="character-dot-picker"]')).toBeNull();

    // One undo step reverts both the text and the characterId link together.
    const editorEl = document.querySelector('.ProseMirror') as HTMLElement;
    fireEvent.keyDown(editorEl, { key: 'z', code: 'KeyZ', ctrlKey: true });
    await waitFor(() => expect((latestDoc as any).content[0].content).toEqual([{ type: 'text', text: 'JACK' }]));
    expect((latestDoc as any).content[0].attrs.characterId).toBe('char_jack');
  });

  test('T-4.50: reassigning never creates a new character — the picker only ever lists the registry it was given', async () => {
    render(<DraftEditor initialContent={doc} onChange={() => {}} characters={CHARACTERS} />);
    const dots = await waitFor(() => {
      const found = document.querySelectorAll('.cyril-character-dot');
      expect(found.length).toBe(2);
      return found;
    });
    fireEvent.click(dots[1]);
    const picker = await waitFor(() => document.querySelector('[data-testid="character-dot-picker"]') as HTMLElement);
    const optionNames = Array.from(picker.querySelectorAll('[data-testid="character-dot-picker-option"]')).map((o) => o.textContent);
    // Exactly the two registered characters — no synthesized/duplicate entries.
    expect(optionNames.sort()).toEqual(['JACK', 'JILL']);
  });
});
