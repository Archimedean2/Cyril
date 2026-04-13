import { Editor } from '@tiptap/react';
import { generateId } from '../../domain/project/ids';

interface DraftToolbarProps {
  editor: Editor;
}

export function DraftToolbar({ editor }: DraftToolbarProps) {
  const addSection = () => {
    editor.commands.insertSectionBlock({
      id: generateId('section'),
      sectionType: 'verse',
      label: 'Verse'
    });
  };

  const addSpeaker = () => {
    editor.commands.insertSpeakerLine('SPEAKER');
  };

  const addStageDirection = () => {
    editor.commands.insertStageDirection('Action');
  };

  const toggleDelivery = () => {
    editor.commands.toggleDelivery();
  };

  const addLyricLine = () => {
    editor.chain().focus().insertContent({
      type: 'lyricLine',
      attrs: { 
        id: generateId('line'), 
        delivery: 'sung', 
        rhymeGroup: null, 
        meta: { alternates: [], prosody: null, chords: [] } 
      },
      content: [{ type: 'text', text: ' ' }]
    }).run();
  };

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
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

      <div className="toolbar-group">
        <button onClick={addSection} data-testid="editor-add-section-button" title="Add Section">
          + Section
        </button>
        <button onClick={addSpeaker} data-testid="editor-add-speaker-button" title="Add Speaker">
          + Speaker
        </button>
        <button onClick={addStageDirection} data-testid="editor-add-stagedir-button" title="Add Stage Direction">
          + Stage Dir
        </button>
        <button onClick={addLyricLine} data-testid="editor-add-lyricline-button" title="Add Lyric Line">
          + Lyric Line
        </button>
      </div>

      <div className="toolbar-group">
        <button 
          onClick={toggleDelivery} 
          disabled={!editor.isActive('lyricLine')}
          data-testid="editor-toggle-delivery-button" 
          title="Toggle Sung/Spoken"
        >
          Toggle Delivery
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
