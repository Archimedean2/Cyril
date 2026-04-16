import { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useLineMenuStore, LineMenuLineType } from '../../app/state/lineMenuStore';

interface LineContextMenuProps {
  editor: Editor;
}

interface MenuItem {
  label: string;
  testId: string;
  action: () => void;
  danger?: boolean;
}

export function LineContextMenu({ editor }: LineContextMenuProps) {
  const { isOpen, x, y, linePos, lineType, close } = useLineMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as globalThis.Node)) {
        close();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  function setType(targetType: LineMenuLineType) {
    close();
    editor.chain().focus().command(({ tr, state }) => {
      const node = state.doc.nodeAt(linePos);
      if (!node || node.type.name !== 'lyricLine') return false;
      tr.setNodeMarkup(linePos, undefined, { ...node.attrs, lineType: targetType });
      return true;
    }).run();
  }

  function deleteLine() {
    close();
    editor.chain().focus().command(({ tr, state }) => {
      const node = state.doc.nodeAt(linePos);
      if (!node) return false;
      tr.delete(linePos, linePos + node.nodeSize);
      return true;
    }).run();
  }

  const menuItems: (MenuItem | 'separator')[] = [];

  if (lineType === 'speaker') {
    menuItems.push(
      { label: 'Convert to lyric line', testId: 'line-context-to-lyric', action: () => setType('lyric') },
      { label: 'Convert to stage direction', testId: 'line-context-to-stage-direction', action: () => setType('stageDirection') },
      'separator',
      { label: 'Delete line', testId: 'line-context-delete', action: deleteLine, danger: true },
    );
  } else if (lineType === 'stageDirection') {
    menuItems.push(
      { label: 'Convert to lyric line', testId: 'line-context-to-lyric', action: () => setType('lyric') },
      { label: 'Convert to speaker', testId: 'line-context-to-speaker', action: () => setType('speaker') },
      'separator',
      { label: 'Delete line', testId: 'line-context-delete', action: deleteLine, danger: true },
    );
  } else {
    menuItems.push(
      { label: 'Convert to speaker', testId: 'line-context-to-speaker', action: () => setType('speaker') },
      { label: 'Convert to stage direction', testId: 'line-context-to-stage-direction', action: () => setType('stageDirection') },
      'separator',
      { label: 'Delete line', testId: 'line-context-delete', action: deleteLine, danger: true },
    );
  }

  return (
    <div
      ref={menuRef}
      className="section-context-menu"
      data-testid="line-context-menu"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, i) => {
        if (item === 'separator') {
          return <div key={`sep-${i}`} className="section-context-menu-separator" />;
        }
        return (
          <div
            key={item.testId}
            className={`section-context-menu-item${item.danger ? ' section-context-menu-item--danger' : ''}`}
            data-testid={item.testId}
            onMouseDown={(e) => { e.preventDefault(); item.action(); }}
          >
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
