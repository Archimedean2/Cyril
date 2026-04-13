import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { getDraftEditorConfig } from '../../editor/core/draftConfig';
import { RichTextDocument, DraftSettings } from '../../domain/project/types';
import { DraftToolbar } from './DraftToolbar';
import './editor.css';

interface DraftEditorProps {
  initialContent: RichTextDocument;
  settings?: DraftSettings;
  onChange: (content: RichTextDocument) => void;
}

export function DraftEditor({ initialContent, settings, onChange }: DraftEditorProps) {
  const editor = useEditor({
    ...getDraftEditorConfig(initialContent),
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as any as RichTextDocument);
    },
  });

  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(initialContent)) {
        setTimeout(() => {
          editor.commands.setContent(initialContent, { emitUpdate: false });
        }, 0);
      }
    }
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  const editorClasses = [
    'editor-surface',
    settings?.showSectionLabels !== false ? 'show-sections' : 'hide-sections',
    settings?.showSpeakerLabels !== false ? 'show-speakers' : 'hide-speakers',
    settings?.showStageDirections !== false ? 'show-stage-directions' : 'hide-stage-directions',
    settings?.showChords !== false ? 'show-chords' : 'hide-chords',
    settings?.showSyllableCounts !== false ? 'show-syllables' : 'hide-syllables',
  ].join(' ');

  return (
    <div className="editor-container" data-testid="draft-editor">
      <DraftToolbar editor={editor} />
      <EditorContent editor={editor} className={editorClasses} data-testid="editor-surface" />
    </div>
  );
}
