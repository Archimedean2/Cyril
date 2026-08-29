import { EditorOptions, Content } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Indent } from '../extensions/indent';
import { SectionBlock } from '../nodes/sectionBlock/sectionBlock';
import { LyricLine } from '../nodes/lyricLine/lyricLine';
import { SpeakerColumn } from '../nodes/speakerColumn/speakerColumn';
import { ConcurrentBlock } from '../nodes/concurrentBlock/concurrentBlock';
import { ChordExtension } from '../extensions/chords';
import { SyllableExtension } from '../extensions/syllables';
import { CharacterColorExtension } from '../extensions/characters';
import { DraftPlaceholder } from '../extensions/placeholder';
import { Character } from '../../domain/project/types';

const STARTER_KIT = StarterKit.configure({
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
});

export interface DraftEditorConfigOptions {
  content?: Content;
  showChords?: boolean;
  draftMode?: 'lyrics' | 'lyricsWithChords';
  showSyllableCounts?: boolean;
  showStressMarks?: boolean;
  /** C-20: the project's character registry, for colour decoration. */
  characters?: Character[];
  /** C-20: see `LyricLineOptions.onFinalizeSpeakerName`. */
  onFinalizeSpeakerName?: (name: string) => string | null;
}

export const getDraftEditorConfig = (options: DraftEditorConfigOptions = {}): Partial<EditorOptions> => {
  const {
    content,
    showChords = true,
    draftMode = 'lyrics',
    showSyllableCounts = false,
    showStressMarks = false,
    characters = [],
    onFinalizeSpeakerName,
  } = options;

  return {
    extensions: [
      STARTER_KIT,
      Indent,
      LyricLine.configure({ onFinalizeSpeakerName }),
      SectionBlock,
      SpeakerColumn,
      ConcurrentBlock,
      ChordExtension.configure({
        showChords,
        draftMode,
      }),
      SyllableExtension.configure({
        showSyllableCounts,
        showStressMarks,
      }),
      CharacterColorExtension.configure({ characters }),
      DraftPlaceholder,
    ],
    content,
    editable: true,
    autofocus: false,
  };
};
