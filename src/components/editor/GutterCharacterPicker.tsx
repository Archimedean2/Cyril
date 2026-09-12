import { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/core';
import { Character } from '../../domain/project/types';

export interface GutterCharacterPickerTarget {
  /** ProseMirror positions of every `lyricLine` this pick will apply to (one for a plain click, several for a drag). */
  positions: number[];
  /**
   * Where to render the popover, as a plain rect rather than a live
   * `HTMLElement` — the keyboard-equivalent path (§12.5) anchors this to
   * the caret's screen coordinates (`editor.view.coordsAtPos`), which isn't
   * an element at all.
   */
  anchorRect: { left: number; right: number; bottom: number };
}

interface GutterCharacterPickerProps {
  target: GutterCharacterPickerTarget;
  characters: Character[];
  editor: Editor;
  onClose: () => void;
}

/**
 * C-36 (§12.2) — the picker opened by a gutter click or drag-release. Unlike
 * `CharacterDotPicker` (C-35, which also renames the speaker header's
 * text), this only ever sets `characterId` via `paintCharacterRange` — the
 * gutter assigns "who owns this line", it never rewrites what's typed.
 * Applying to every collected position happens in a single transaction (see
 * `paintCharacterRange`), so a multi-line drag is one undo step.
 */
export function GutterCharacterPicker({ target, characters, editor, onClose }: GutterCharacterPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: target.anchorRect.bottom + 6,
    left: target.anchorRect.right + 6,
    zIndex: 9999,
  };

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSelect = (character: Character) => {
    editor.commands.paintCharacterRange(target.positions, character.id);
    onClose();
    editor.commands.focus();
  };

  return (
    <div
      ref={popoverRef}
      className="character-dot-picker"
      style={style}
      data-testid="gutter-character-picker"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.preventDefault()}
    >
      {characters.length === 0 && (
        <div className="character-dot-picker-empty">No characters yet</div>
      )}
      {characters.map((character) => (
        <div
          key={character.id}
          className="character-dot-picker-option"
          data-testid="gutter-character-picker-option"
          onClick={() => handleSelect(character)}
        >
          <span
            className="character-dot-picker-swatch"
            style={{ background: `var(--section-${character.color})` }}
            aria-hidden="true"
          />
          {character.name}
        </div>
      ))}
    </div>
  );
}
