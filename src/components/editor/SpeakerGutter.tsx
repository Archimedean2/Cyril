import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/core';
import { Character } from '../../domain/project/types';
import { resolveCharacterColor, characterColorVar } from '../../domain/project/characters';
import { findRowIndexAtY, toContentY } from '../../editor/core/gutterGeometry';
import { collectPaintablePositions } from '../../editor/core/gutterPaint';
import { GutterCharacterPicker, GutterCharacterPickerTarget } from './GutterCharacterPicker';

const GUTTER_WIDTH = 10;
const GUTTER_GAP = 6;

interface GutterRow {
  pos: number;
  lineType: string;
  top: number;
  height: number;
  colorVar?: string;
}

interface SpeakerGutterProps {
  editor: Editor;
  characters: Character[];
  /** The scrollable element the gutter measures/positions itself against — `DraftEditor`'s `.editor-surface` ref. */
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * C-36 (§12.2) — a permanent thin column left of the lyrics, one cell per
 * line, carrying the character's colour. Click a cell for a picker; click
 * and drag down the gutter to paint a character across a range, applied as
 * **one** transaction (`paintCharacterRange`) so it's one undo step no
 * matter how many lines are spanned.
 *
 * Purely a decoration: it reads `editor.state`/measures the live DOM to lay
 * itself out, but never touches the document except through
 * `paintCharacterRange` — it adds no node, mark, or attribute the document
 * schema doesn't already have, and export never sees it (it isn't part of
 * the ProseMirror-rendered tree at all — a sibling overlay instead).
 */
export function SpeakerGutter({ editor, characters, containerRef }: SpeakerGutterProps) {
  const [rows, setRows] = useState<GutterRow[]>([]);
  const [gutterLeft, setGutterLeft] = useState(0);
  const [dragRange, setDragRange] = useState<[number, number] | null>(null);
  const [picker, setPicker] = useState<GutterCharacterPickerTarget | null>(null);

  const gutterRef = useRef<HTMLDivElement>(null);
  const dragAnchorRef = useRef<number | null>(null);
  const dragCurrentRef = useRef<number | null>(null);

  const recompute = useCallback(() => {
    if (editor.isDestroyed) return;
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const pmRect = editor.view.dom.getBoundingClientRect();

    const next: GutterRow[] = [];
    editor.state.doc.descendants((node, pos) => {
      // Concurrent blocks are multi-column and out of scope for the gutter
      // (see the C-36 hazard note in the DraftEditor wiring) — don't
      // descend into them, so their lines get no gutter cell at all.
      if (node.type.name === 'concurrentBlock') return false;
      if (node.type.name !== 'lyricLine') return true;

      const dom = editor.view.nodeDOM(pos) as HTMLElement | null;
      if (!dom) return false;
      const rect = dom.getBoundingClientRect();

      let colorVar: string | undefined;
      if (node.attrs.lineType !== 'stageDirection') {
        const characterId = (node.attrs.characterId as string | null) ?? null;
        // Only a speaker line's *text* is a name — a plain lyric line's
        // text is the lyric itself, never a fallback identity match.
        const name = node.attrs.lineType === 'speaker' ? node.textContent : null;
        const color = resolveCharacterColor(characters, characterId, name);
        if (color) colorVar = characterColorVar(color);
      }

      next.push({
        pos,
        lineType: node.attrs.lineType as string,
        top: rect.top - containerRect.top + container.scrollTop,
        height: rect.height,
        colorVar,
      });
      return false; // lyricLine has no block-level children
    });

    setRows(next);
    setGutterLeft(pmRect.left - containerRect.left - GUTTER_WIDTH - GUTTER_GAP);
  }, [editor, characters, containerRef]);

  useEffect(() => {
    recompute();
    editor.on('update', recompute);
    editor.on('selectionUpdate', recompute);
    window.addEventListener('resize', recompute);
    return () => {
      editor.off('update', recompute);
      editor.off('selectionUpdate', recompute);
      window.removeEventListener('resize', recompute);
    };
  }, [editor, recompute]);

  const endDrag = useCallback(() => {
    const anchor = dragAnchorRef.current;
    const current = dragCurrentRef.current;
    dragAnchorRef.current = null;
    dragCurrentRef.current = null;
    setDragRange(null);
    if (anchor === null) return;

    const start = Math.min(anchor, current ?? anchor);
    const end = Math.max(anchor, current ?? anchor);
    const positions = rows
      .slice(start, end + 1)
      .filter((r) => r.lineType !== 'stageDirection')
      .map((r) => r.pos);
    if (positions.length === 0) return;

    const cellEl = gutterRef.current?.querySelector<HTMLElement>(`[data-row-index="${end}"]`);
    const rect = (cellEl ?? gutterRef.current)?.getBoundingClientRect();
    if (!rect) return;
    setPicker({ positions, anchorRect: { left: rect.left, right: rect.right, bottom: rect.bottom } });
  }, [rows]);

  // Belt-and-suspenders end-of-drag: pointer capture keeps delivering
  // pointerup/pointercancel to the gutter even once the cursor has left it,
  // but if the mouse button is released while the OS focus has left the
  // browser entirely (alt-tab, another app) no pointer event may arrive at
  // all — a window blur ends the drag defensively so it never gets stuck.
  useEffect(() => {
    window.addEventListener('blur', endDrag);
    return () => window.removeEventListener('blur', endDrag);
  }, [endDrag]);

  const rowIndexFromTarget = (target: EventTarget | null): number | null => {
    const el = target instanceof Element ? target.closest<HTMLElement>('[data-row-index]') : null;
    if (!el) return null;
    const idx = Number(el.getAttribute('data-row-index'));
    return Number.isNaN(idx) ? null : idx;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const idx = rowIndexFromTarget(e.target);
    if (idx === null || rows[idx]?.lineType === 'stageDirection') return;
    dragAnchorRef.current = idx;
    dragCurrentRef.current = idx;
    setDragRange([idx, idx]);
    // Pointer capture keeps the drag alive even once the cursor leaves the
    // gutter (or the window) — not universally implemented (older engines,
    // and jsdom in tests), so guard the call rather than assume it exists.
    if (typeof gutterRef.current?.setPointerCapture === 'function') {
      gutterRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragAnchorRef.current === null) return;
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const contentY = toContentY(e.clientY, containerRect.top, container.scrollTop);
    const idx = findRowIndexAtY(rows, contentY);
    if (idx === -1 || idx === dragCurrentRef.current) return;
    dragCurrentRef.current = idx;
    const anchor = dragAnchorRef.current;
    setDragRange([Math.min(anchor, idx), Math.max(anchor, idx)]);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (typeof gutterRef.current?.hasPointerCapture === 'function' && gutterRef.current.hasPointerCapture(e.pointerId)) {
      gutterRef.current.releasePointerCapture(e.pointerId);
    }
    endDrag();
  };

  // §12.5 keyboard equivalent — the gutter is never the only path to assign
  // a speaker. `Mod-Shift-A` with the caret/selection anywhere in the
  // editor opens the same picker for every qualifying line the current
  // selection spans (a collapsed caret spans just its own line).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isAssignShortcut = (e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a';
      if (!isAssignShortcut) return;
      e.preventDefault();

      const { from, to } = editor.state.selection;
      const positions = collectPaintablePositions(editor.state.doc, from, to);
      if (positions.length === 0) return;

      const coords = editor.view.coordsAtPos(from);
      setPicker({ positions, anchorRect: { left: coords.left, right: coords.left, bottom: coords.bottom } });
    }
    const dom = editor.view.dom;
    dom.addEventListener('keydown', handleKeyDown);
    return () => dom.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const closePicker = useCallback(() => setPicker(null), []);

  return (
    <>
      <div
        ref={gutterRef}
        className="speaker-gutter"
        data-testid="speaker-gutter"
        style={{ left: gutterLeft, width: GUTTER_WIDTH }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {rows.map((row, index) => {
          const inert = row.lineType === 'stageDirection';
          const dragging = dragRange !== null && index >= dragRange[0] && index <= dragRange[1];
          return (
            <div
              key={row.pos}
              className={[
                'speaker-gutter-cell',
                inert ? 'speaker-gutter-cell--inert' : '',
                dragging ? 'speaker-gutter-cell--dragging' : '',
              ].filter(Boolean).join(' ')}
              style={{ top: row.top, height: row.height, '--dot-color': row.colorVar } as React.CSSProperties}
              data-testid={inert ? undefined : 'speaker-gutter-cell'}
              data-row-index={index}
              data-line-pos={row.pos}
              aria-hidden={inert}
            />
          );
        })}
      </div>
      {picker && createPortal(
        <GutterCharacterPicker
          target={picker}
          characters={characters}
          editor={editor}
          onClose={closePicker}
        />,
        document.body
      )}
    </>
  );
}
