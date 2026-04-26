import { EditorOptions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Indent } from '../extensions/indent';
import { SectionBlock } from '../nodes/sectionBlock/sectionBlock';
import { LyricLine } from '../nodes/lyricLine/lyricLine';
import { SpeakerColumn } from '../nodes/speakerColumn/speakerColumn';
import { ConcurrentBlock } from '../nodes/concurrentBlock/concurrentBlock';
import { ChordExtension } from '../extensions/chords';
import { SyllableExtension } from '../extensions/syllables';

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
    paragraph: false,
  }),
  Indent,
  LyricLine,
  SectionBlock,
  SpeakerColumn,
  ConcurrentBlock,
];

export interface DraftEditorConfigOptions {
  content?: any;
  showChords?: boolean;
  draftMode?: 'lyrics' | 'lyricsWithChords';
  showSyllableCounts?: boolean;
  showStressMarks?: boolean;
}

export const getDraftEditorConfig = (options: DraftEditorConfigOptions = {}): Partial<EditorOptions> => {
  const { content, showChords = true, draftMode = 'lyrics', showSyllableCounts = false, showStressMarks = false } = options;

  return {
    extensions: [
      ...draftExtensions,
      ChordExtension.configure({
        showChords,
        draftMode,
      }),
      SyllableExtension.configure({
        showSyllableCounts,
        showStressMarks,
      }),
    ],
    content,
    editable: true,
    autofocus: false,
  };
};
