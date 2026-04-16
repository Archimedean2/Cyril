import { EditorOptions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Indent } from '../extensions/indent';
import { SectionBlock } from '../nodes/sectionBlock/sectionBlock';
import { LyricLine } from '../nodes/lyricLine/lyricLine';
import { ChordExtension } from '../extensions/chords';

export const draftExtensions = [
  StarterKit.configure({
    heading: false,
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
  SectionBlock,
  LyricLine,
];

export interface DraftEditorConfigOptions {
  content?: any;
  showChords?: boolean;
  draftMode?: 'lyrics' | 'lyricsWithChords';
}

export const getDraftEditorConfig = (options: DraftEditorConfigOptions = {}): Partial<EditorOptions> => {
  const { content, showChords = true, draftMode = 'lyrics' } = options;

  return {
    extensions: [
      ...draftExtensions,
      ChordExtension.configure({
        showChords,
        draftMode,
      }),
    ],
    content,
    editable: true,
    autofocus: false,
  };
};
