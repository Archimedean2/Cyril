import { EditorOptions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Indent } from '../extensions/indent';

// We define our base extensions that apply to all text areas
// StarterKit includes Document, Paragraph, Text, Bold, Italic, History (undo/redo), Dropcursor, Gapcursor
export const baseExtensions = [
  StarterKit.configure({
    heading: false, // Disable headings for now, we'll use custom block nodes later
    bulletList: false,
    orderedList: false,
    listItem: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    horizontalRule: false,
    strike: false,
  }),
  Indent,
];

export const getBaseEditorConfig = (content: any = ''): Partial<EditorOptions> => ({
  extensions: baseExtensions,
  content,
  editable: true,
  autofocus: false,
});
