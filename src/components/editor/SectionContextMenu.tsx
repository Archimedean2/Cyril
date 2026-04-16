import { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import { useSectionMenuStore } from '../../app/state/sectionMenuStore';

interface SectionContextMenuProps {
  editor: Editor;
}

const SECTION_TYPES = [
  { value: 'verse', label: 'Change to Verse' },
  { value: 'chorus', label: 'Change to Chorus' },
  { value: 'pre-chorus', label: 'Change to Pre-Chorus' },
  { value: 'bridge', label: 'Change to Bridge' },
  { value: 'intro', label: 'Change to Intro' },
  { value: 'outro', label: 'Change to Outro' },
  { value: 'spoken', label: 'Change to Spoken' },
  { value: 'reprise', label: 'Change to Reprise' },
];

export function SectionContextMenu({ editor }: SectionContextMenuProps) {
  const { isOpen, x, y, sectionPos, close } = useSectionMenuStore();
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

  function handleChangeType(sectionType: string, customLabel = '') {
    close();
    editor.chain().focus().command(({ tr, state }) => {
      const node = state.doc.nodeAt(sectionPos);
      if (!node || node.type.name !== 'sectionBlock') return false;
      tr.setNodeMarkup(sectionPos, undefined, {
        ...node.attrs,
        sectionType,
        customLabel,
      });
      return true;
    }).run();
  }

  function handleSelectSection() {
    close();
    editor.chain().focus().command(({ tr, state }) => {
      const node = state.doc.nodeAt(sectionPos);
      if (!node) return false;
      tr.setSelection(NodeSelection.create(state.doc, sectionPos));
      return true;
    }).run();
  }

  function handleRemoveSection() {
    close();
    editor.chain().focus().command(({ tr, state }) => {
      const node = state.doc.nodeAt(sectionPos);
      if (!node || node.type.name !== 'sectionBlock') return false;
      tr.replaceWith(sectionPos, sectionPos + node.nodeSize, node.content);
      return true;
    }).run();
  }

  function handleCustom() {
    close();
    // Trigger inline edit mode by simulating a click on the label element
    // The label is the first child of the section-block DOM node.
    // We find it via the editor view's node DOM.
    const nodeDOM = editor.view.nodeDOM(sectionPos);
    if (nodeDOM) {
      const labelEl = (nodeDOM as HTMLElement).querySelector('.section-label');
      if (labelEl) {
        (labelEl as HTMLElement).click();
      }
    }
  }

  return (
    <div
      ref={menuRef}
      className="section-context-menu"
      data-testid="section-context-menu"
      style={{ left: x, top: y }}
    >
      {SECTION_TYPES.map(({ value, label }) => (
        <div
          key={value}
          className="section-context-menu-item"
          data-testid={`section-context-change-${value}`}
          onMouseDown={(e) => { e.preventDefault(); handleChangeType(value); }}
        >
          {label}
        </div>
      ))}
      <div
        className="section-context-menu-item"
        data-testid="section-context-change-custom"
        onMouseDown={(e) => { e.preventDefault(); handleCustom(); }}
      >
        Custom…
      </div>
      <div className="section-context-menu-separator" />
      <div
        className="section-context-menu-item"
        data-testid="section-context-select"
        onMouseDown={(e) => { e.preventDefault(); handleSelectSection(); }}
      >
        Select section
      </div>
      <div
        className="section-context-menu-item section-context-menu-item--danger"
        data-testid="section-context-remove"
        onMouseDown={(e) => { e.preventDefault(); handleRemoveSection(); }}
      >
        Remove section
      </div>
    </div>
  );
}
