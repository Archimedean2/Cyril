import { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/core';
import { editChordOnCurrentLine, removeChordFromCurrentLine } from '../../domain/editor/chord-commands';

export interface ChordPopoverTarget {
  chordId: string;
  symbol: string;
  anchorEl: HTMLElement;
}

interface ChordPopoverProps {
  target: ChordPopoverTarget;
  editor: Editor;
  onClose: () => void;
}

export function ChordPopover({ target, editor, onClose }: ChordPopoverProps) {
  const [value, setValue] = useState(target.symbol);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position popover below the pill
  const rect = target.anchorEl.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 6,
    left: rect.left + rect.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 9999,
  };

  useEffect(() => {
    inputRef.current?.select();

    const handlePointerDown = (e: PointerEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) {
        onClose();
      }
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

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== target.symbol) {
      editChordOnCurrentLine(editor, target.chordId, trimmed);
    }
    onClose();
    editor.commands.focus();
  };

  const handleDelete = () => {
    removeChordFromCurrentLine(editor, target.chordId);
    onClose();
    editor.commands.focus();
  };

  return (
    <div ref={popoverRef} className="chord-popover" style={style} data-testid="chord-popover">
      <input
        ref={inputRef}
        className="chord-popover-input"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
          if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        }}
        data-testid="chord-popover-input"
        placeholder="Chord…"
      />
      <button className="chord-popover-save" onClick={handleSave} data-testid="chord-popover-save">✓</button>
      <button className="chord-popover-delete" onClick={handleDelete} data-testid="chord-popover-delete">✕</button>
    </div>
  );
}
