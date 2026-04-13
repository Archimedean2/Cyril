import { useEditor, EditorContent } from '@tiptap/react';
import { getBaseEditorConfig } from '../../editor/core/baseConfig';
import { RichTextDocument } from '../../domain/project/types';
import { EditorToolbar } from './EditorToolbar.tsx';
import './editor.css';

interface RichTextEditorProps {
  initialContent: RichTextDocument;
  onChange?: (content: RichTextDocument) => void;
  readOnly?: boolean;
}

export function RichTextEditor({ initialContent, onChange, readOnly = false }: RichTextEditorProps) {
  const editor = useEditor({
    ...getBaseEditorConfig(initialContent),
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as RichTextDocument;
      onChange?.(json);
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="cyril-editor-container">
      <EditorToolbar editor={editor} />
      <div className="cyril-editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
