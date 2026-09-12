import { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/core';
import { Character } from '../../domain/project/types';

export interface CharacterDotPickerTarget {
  /** ProseMirror position of the speaker `lyricLine` node the dot belongs to. */
  linePos: number;
  anchorEl: HTMLElement;
}

interface CharacterDotPickerProps {
  target: CharacterDotPickerTarget;
  characters: Character[];
  editor: Editor;
  onClose: () => void;
}

/**
 * C-35 (§12.1) — the picker that opens when a speaker line's colour dot is
 * clicked. Picking a character reassigns **this line only** — never creates
 * a new character (that's the registry's job, out of scope here) — via the
 * existing `setSpeakerLineNameAndCharacter` command, which replaces the
 * line's text and links `characterId` in a single transaction (one undo
 * step).
 */
export function CharacterDotPicker({ target, characters, editor, onClose }: CharacterDotPickerProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const rect = target.anchorEl.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 6,
    left: rect.left,
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
    editor.commands.setSpeakerLineNameAndCharacter(target.linePos, character.name, character.id);
    onClose();
    editor.commands.focus();
  };

  return (
    <div
      ref={popoverRef}
      className="character-dot-picker"
      style={style}
      data-testid="character-dot-picker"
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
          data-testid="character-dot-picker-option"
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
