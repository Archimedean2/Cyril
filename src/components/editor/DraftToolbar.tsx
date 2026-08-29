import { useRef, useState } from 'react';
import { Editor, useEditorState } from '@tiptap/react';
import { isInsideSection } from '../../editor/nodes/sectionBlock/sectionBlock';
import { SectionTypePicker, SectionPickerMode } from './SectionTypePicker';
import { InsertConcurrentBlockDialog } from './InsertConcurrentBlockDialog';
import { addChordToCurrentLine, isInLyricLine } from '../../domain/editor/chord-commands';
import { DraftMode, DraftSettings } from '../../domain/project/types';

interface DraftToolbarProps {
  editor: Editor;
  draftMode?: DraftMode;
  settings?: DraftSettings;
}

export function DraftToolbar({ editor, draftMode, settings }: DraftToolbarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<SectionPickerMode>('insert');
  const sectionButtonRef = useRef<HTMLButtonElement>(null);
  const [concurrentDialogOpen, setConcurrentDialogOpen] = useState(false);
  const concurrentButtonRef = useRef<HTMLButtonElement>(null);

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
  const isChordMode = draftMode === 'lyricsWithChords';
  const chordsVisible = settings?.showChords !== false;

  const inLyricLine = useEditorState({
    editor,
    selector: ({ editor: e }) => isInLyricLine(e),
  });
  const canAddChord = isChordMode && chordsVisible && inLyricLine;

  const handleAddChord = () => {
    const symbol = window.prompt('Chord symbol (e.g. Am, G, C/E):');
    if (!symbol || !symbol.trim()) return;
    addChordToCurrentLine(editor, symbol.trim());
    editor.commands.focus();
  };

  const handleInsertConcurrent = (speakers: string[]) => {
    setConcurrentDialogOpen(false);
    editor.commands.insertConcurrentBlock({ speakers });
  };

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      {/* Inline format */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          data-testid="editor-bold-button"
          title="Bold (Ctrl+B)"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          data-testid="editor-italic-button"
          title="Italic (Ctrl+I)"
        >
          I
        </button>
      </div>

      {/* Line type */}
      <div className="toolbar-group">
        <button
          onClick={() => editor.chain().focus().toggleLineType('speaker').run()}
          className={isSpeakerActive ? 'active' : ''}
          data-testid="toolbar-speaker"
          title="Speaker line (or type [[ at the start of a line)"
        >
          Speaker
        </button>
        <button
          onClick={() => editor.chain().focus().toggleLineType('stageDirection').run()}
          className={isStageDirActive ? 'active' : ''}
          data-testid="toolbar-stage-dir"
          title="Stage direction (or type (( at the start of a line)"
        >
          Stage Dir
        </button>
      </div>

      {/* Structure: section + concurrent block */}
      <div className="toolbar-group">
        <div className="toolbar-anchor">
          <button
            ref={sectionButtonRef}
            onClick={handleSectionButtonClick}
            className={isInSection || pickerOpen ? 'active' : ''}
            data-testid="editor-add-section-button"
            title={isInSection ? 'Section options' : 'Add section (or type << at the start of a line)'}
          >
            Section
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
        <div className="toolbar-anchor">
          <button
            ref={concurrentButtonRef}
            onClick={() => setConcurrentDialogOpen(v => !v)}
            className={concurrentDialogOpen ? 'active' : ''}
            data-testid="toolbar-insert-concurrent"
            title="Insert concurrent block"
          >
            Concurrent
          </button>
          {concurrentDialogOpen && (
            <InsertConcurrentBlockDialog
              anchorRef={concurrentButtonRef}
              onConfirm={handleInsertConcurrent}
              onClose={() => setConcurrentDialogOpen(false)}
            />
          )}
        </div>
      </div>

      {isChordMode && (
        <div className="toolbar-group">
          <button
            onClick={handleAddChord}
            disabled={!canAddChord}
            data-testid="chord-add-button"
            title={canAddChord ? 'Add chord at cursor position' : 'Place cursor in a lyric line to add a chord'}
          >
            Add Chord
          </button>
        </div>
      )}

      {/* History */}
      <div className="toolbar-group toolbar-group--end">
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
