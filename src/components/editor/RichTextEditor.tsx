import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
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

  // Update content when initialContent prop changes (e.g. when switching drafts/workspaces)
  useEffect(() => {
    if (editor && initialContent && !editor.isDestroyed) {
      // Check if content is actually different to avoid infinite loops and cursor jumping
      const currentContent = editor.getJSON();
      if (JSON.stringify(currentContent) !== JSON.stringify(initialContent)) {
        // We use setTimeout to avoid React rendering cycle warnings
        setTimeout(() => {
          editor.commands.setContent(initialContent, { emitUpdate: false });
        }, 0);
      }
    }
  }, [editor, initialContent]);

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
