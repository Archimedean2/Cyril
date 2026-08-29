import { describe, test, expect, afterEach } from 'vitest';
import { render, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { DraftEditor } from '../../../src/components/editor/DraftEditor';
import { Character, RichTextDocument } from '../../../src/domain/project/types';

/**
 * C-36 (§12.2) — the speaker gutter you can paint. jsdom does no real
 * layout, so `getBoundingClientRect` is stubbed per-element with a known
 * synthetic layout (one row per 24px) to drive genuine pointer-drag
 * geometry through `SpeakerGutter`'s real code path — the alternative
 * (asserting only against `paintCharacterRange`/`collectPaintablePositions`
 * directly) would never exercise the pointer-event wiring itself.
 */
describe('C-36: SpeakerGutter', () => {
  afterEach(() => cleanup());

  const CHARACTERS: Character[] = [
    { id: 'char_jack', name: 'JACK', color: 'blue' },
    { id: 'char_jill', name: 'JILL', color: 'rose' },
  ];

  const LINE_HEIGHT = 24;

  /** Give every `.lyric-line` element (in document order) a stacked, known rect, and the scrolling container/page a stable one — enough for `SpeakerGutter`'s own geometry math to behave exactly like a real layout would. */
  function mockLayout() {
    const lines = Array.from(document.querySelectorAll('.lyric-line')) as HTMLElement[];
    lines.forEach((el, i) => {
      el.getBoundingClientRect = () => ({
        top: i * LINE_HEIGHT, bottom: i * LINE_HEIGHT + LINE_HEIGHT, height: LINE_HEIGHT,
        left: 40, right: 300, width: 260, x: 40, y: i * LINE_HEIGHT,
        toJSON() { return {}; },
      });
    });
    const surface = document.querySelector('[data-testid="editor-surface"]') as HTMLElement;
    surface.getBoundingClientRect = () => ({
      top: 0, bottom: 1000, height: 1000, left: 0, right: 400, width: 400, x: 0, y: 0,
      toJSON() { return {}; },
    });
    const pm = document.querySelector('.ProseMirror') as HTMLElement;
    pm.getBoundingClientRect = () => ({
      top: 0, bottom: 1000, height: 1000, left: 40, right: 340, width: 300, x: 40, y: 0,
      toJSON() { return {}; },
    });
    // Force SpeakerGutter's recompute() to pick up the mocked rects.
    fireEvent(window, new Event('resize'));
    return lines;
  }

  function cellForRow(index: number): HTMLElement {
    const el = document.querySelector(`[data-row-index="${index}"]`);
    if (!el) throw new Error(`no gutter cell for row ${index}`);
    return el as HTMLElement;
  }

  function gutterEl(): HTMLElement {
    return document.querySelector('[data-testid="speaker-gutter"]') as HTMLElement;
  }

  /**
   * jsdom has no global `PointerEvent` constructor, so
   * `@testing-library`'s `fireEvent.pointerDown/Move/Up` silently drop
   * `clientY` (they fall back to the bare `Event` constructor, which
   * doesn't accept it). A `MouseEvent` with the pointer event's type string
   * does accept `clientY` in jsdom and dispatches identically as far as
   * React's event delegation (and this component's handlers) are
   * concerned — only the `.type` string matters for routing.
   */
  function firePointer(type: 'pointerdown' | 'pointermove' | 'pointerup', el: Element, clientY: number) {
    fireEvent(el, new MouseEvent(type, { clientY, bubbles: true, cancelable: true }));
  }

  const doc: RichTextDocument = {
    type: 'doc',
    content: [
      { type: 'lyricLine', attrs: { id: 'l0', lineType: 'lyric' }, content: [{ type: 'text', text: 'one' }] },
      { type: 'lyricLine', attrs: { id: 'l1', lineType: 'lyric' }, content: [{ type: 'text', text: 'two' }] },
      { type: 'lyricLine', attrs: { id: 'l2', lineType: 'stageDirection' }, content: [{ type: 'text', text: '(pause)' }] },
      { type: 'lyricLine', attrs: { id: 'l3', lineType: 'lyric' }, content: [{ type: 'text', text: 'four' }] },
      { type: 'lyricLine', attrs: { id: 'l4', lineType: 'speaker', characterId: 'char_jack' }, content: [{ type: 'text', text: 'JACK' }] },
    ] as any,
  };

  test('T-4.55: every line gets a gutter cell; a linked line shows its character\'s colour; a stage direction gets an inert one', async () => {
    render(<DraftEditor initialContent={doc} onChange={() => {}} characters={CHARACTERS} />);
    await waitFor(() => expect(gutterEl()).toBeTruthy());

    const cells = gutterEl().querySelectorAll('[data-row-index]');
    expect(cells.length).toBe(5); // one per lyricLine, including the stage direction

    const speakerCell = cellForRow(4);
    expect(speakerCell.style.getPropertyValue('--dot-color')).toContain('var(--section-blue)');
    expect(speakerCell.className).not.toContain('inert');

    const stageDirCell = cellForRow(2);
    expect(stageDirCell.className).toContain('speaker-gutter-cell--inert');
    expect(stageDirCell.getAttribute('data-testid')).toBeNull(); // not an interactive cell
  });

  test('T-4.59: the gutter is a decoration, not document content — it lives outside the ProseMirror tree entirely', async () => {
    render(<DraftEditor initialContent={doc} onChange={() => {}} characters={CHARACTERS} />);
    await waitFor(() => expect(gutterEl()).toBeTruthy());

    const pm = document.querySelector('.ProseMirror') as HTMLElement;
    expect(pm.contains(gutterEl())).toBe(false);
    // It's a sibling within the same scrolling surface, not inside the document.
    const surface = document.querySelector('[data-testid="editor-surface"]') as HTMLElement;
    expect(surface.contains(gutterEl())).toBe(true);
  });

  test('T-4.56/T-4.58: dragging across a range (skipping a stage direction) paints every qualifying line in the range as one undo step', async () => {
    let latestDoc: RichTextDocument | null = null;
    render(<DraftEditor initialContent={doc} onChange={(d) => { latestDoc = d; }} characters={CHARACTERS} />);
    await waitFor(() => expect(gutterEl()).toBeTruthy());
    mockLayout();

    // Drag from row 0 down to row 3 — spans rows 0,1,2(stage dir),3.
    firePointer('pointerdown', cellForRow(0), 5);
    firePointer('pointermove', gutterEl(), 80); // inside row 3's [72,96) span
    firePointer('pointerup', gutterEl(), 80);

    const picker = await waitFor(() => {
      const el = document.querySelector('[data-testid="gutter-character-picker"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });
    const jillOption = Array.from(picker.querySelectorAll('[data-testid="gutter-character-picker-option"]'))
      .find((o) => o.textContent === 'JILL')!;
    fireEvent.click(jillOption);

    await waitFor(() => {
      const lines = (latestDoc as any).content;
      expect(lines[0].attrs.characterId).toBe('char_jill');
    });
    const lines = (latestDoc as any).content;
    expect(lines[1].attrs.characterId).toBe('char_jill');
    expect(lines[2].attrs.characterId).toBeFalsy(); // the stage direction was skipped
    expect(lines[2].content).toEqual([{ type: 'text', text: '(pause)' }]);
    expect(lines[3].attrs.characterId).toBe('char_jill');
    expect(lines[4].attrs.characterId).toBe('char_jack'); // outside the dragged range — untouched

    // One undo step reverts all three painted lines together.
    const editorEl = document.querySelector('.ProseMirror') as HTMLElement;
    fireEvent.keyDown(editorEl, { key: 'z', code: 'KeyZ', ctrlKey: true });
    await waitFor(() => {
      const after = (latestDoc as any).content;
      expect(after[0].attrs.characterId).toBeFalsy();
    });
    const afterUndo = (latestDoc as any).content;
    expect(afterUndo[1].attrs.characterId).toBeFalsy();
    expect(afterUndo[3].attrs.characterId).toBeFalsy();
  });

  test('T-4.56: a plain click (no drag) on a single cell opens the picker for that line only', async () => {
    let latestDoc: RichTextDocument | null = null;
    render(<DraftEditor initialContent={doc} onChange={(d) => { latestDoc = d; }} characters={CHARACTERS} />);
    await waitFor(() => expect(gutterEl()).toBeTruthy());
    mockLayout();

    firePointer('pointerdown', cellForRow(1), 30);
    firePointer('pointerup', cellForRow(1), 30); // no movement in between — a click

    const picker = await waitFor(() => document.querySelector('[data-testid="gutter-character-picker"]') as HTMLElement);
    const jackOption = Array.from(picker.querySelectorAll('[data-testid="gutter-character-picker-option"]'))
      .find((o) => o.textContent === 'JACK')!;
    fireEvent.click(jackOption);

    await waitFor(() => {
      const lines = (latestDoc as any).content;
      expect(lines[1].attrs.characterId).toBe('char_jack');
    });
    const lines = (latestDoc as any).content;
    expect(lines[0].attrs.characterId).toBeFalsy(); // untouched — only the clicked line changed
  });

  test('T-4.57: the keyboard equivalent (Mod-Shift-A) opens the same picker without touching the mouse — the gutter is never the only path', async () => {
    let latestDoc: RichTextDocument | null = null;
    const singleLineDoc: RichTextDocument = {
      type: 'doc',
      content: [{ type: 'lyricLine', attrs: { id: 'l0', lineType: 'lyric' }, content: [{ type: 'text', text: 'solo' }] } as any],
    };
    render(<DraftEditor initialContent={singleLineDoc} onChange={(d) => { latestDoc = d; }} characters={CHARACTERS} />);
    await waitFor(() => expect(gutterEl()).toBeTruthy());

    const editorEl = document.querySelector('.ProseMirror') as HTMLElement;
    fireEvent.keyDown(editorEl, { key: 'a', code: 'KeyA', ctrlKey: true, shiftKey: true });

    const picker = await waitFor(() => document.querySelector('[data-testid="gutter-character-picker"]') as HTMLElement);
    const jillOption = Array.from(picker.querySelectorAll('[data-testid="gutter-character-picker-option"]'))
      .find((o) => o.textContent === 'JILL')!;
    fireEvent.click(jillOption);

    await waitFor(() => {
      const lines = (latestDoc as any).content;
      expect(lines[0].attrs.characterId).toBe('char_jill');
    });
  });
});
