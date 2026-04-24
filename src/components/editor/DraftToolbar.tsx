import { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { isInsideSection } from '../../editor/nodes/sectionBlock/sectionBlock';
import { SectionTypePicker, SectionPickerMode } from './SectionTypePicker';

interface DraftToolbarProps {
  editor: Editor;
}

export function DraftToolbar({ editor }: DraftToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<SectionPickerMode>('insert');
  const sectionButtonRef = useRef<HTMLButtonElement>(null);

  const handleSectionButtonClick = () => {
    const mode: SectionPickerMode = isInsideSection(editor.state) ? 'change-or-new' : 'insert';
    setPickerMode(mode);
    setPickerOpen(v => !v);
  };

  const handlePickerSelect = (
    action: 'insert' | 'change' | 'new',
    sectionType: string,
    customLabel?: string
  ) => {
    setPickerOpen(false);
    editor.chain().focus();
    if (action === 'insert' || action === 'new') {
      if (action === 'new') {
        editor.commands.insertSectionAfter({ sectionType, customLabel: customLabel || '' });
      } else {
        editor.commands.insertSection({ sectionType, customLabel: customLabel || '' });
      }
    } else if (action === 'change') {
      editor.commands.changeSectionType({ sectionType, customLabel: customLabel || '' });
    }
  };

  const handlePickerClose = () => setPickerOpen(false);

  const isInSection = isInsideSection(editor.state);
  const isSpeakerActive = editor.isActive('lyricLine', { lineType: 'speaker' });
  const isStageDirActive = editor.isActive('lyricLine', { lineType: 'stageDirection' });

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar" style={{ position: 'relative' }}>
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          data-testid="editor-bold-button"
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          data-testid="editor-italic-button"
          title="Italic"
        >
          I
        </button>
      </div>

      <div className="toolbar-group" style={{ position: 'relative' }}>
        <button
          ref={sectionButtonRef}
          onClick={handleSectionButtonClick}
          className={isInSection || pickerOpen ? 'active' : ''}
          data-testid="editor-add-section-button"
          title={isInSection ? 'Section options' : 'Add Section'}
        >
          § Section
        </button>
        {pickerOpen && (
          <SectionTypePicker
            mode={pickerMode}
            anchorRef={sectionButtonRef}
            onSelect={handlePickerSelect}
            onRemove={() => { setPickerOpen(false); editor.commands.unwrapSection(); }}
            onClose={handlePickerClose}
          />
        )}
      </div>

      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleLineType('speaker').run()}
          className={isSpeakerActive ? 'active' : ''}
          data-testid="toolbar-speaker"
          title="Toggle Speaker Line"
        >
          Speaker
        </button>
        <button
          onClick={() => editor.chain().focus().toggleLineType('stageDirection').run()}
          className={isStageDirActive ? 'active' : ''}
          data-testid="toolbar-stage-dir"
          title="Toggle Stage Direction"
        >
          Stage Dir
        </button>
        <button
          onClick={() => editor.chain().focus().toggleDelivery().run()}
          disabled={!editor.isActive('lyricLine')}
          data-testid="editor-toggle-delivery-button"
          title="Toggle Sung/Spoken"
        >
          Delivery
        </button>
      </div>

      <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          data-testid="editor-undo-button"
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          data-testid="editor-redo-button"
          title="Redo (Ctrl+Y)"
        >
          ↷
        </button>
      </div>
    </div>
  );
}
