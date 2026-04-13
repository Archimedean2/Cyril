import { EditorOptions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Indent } from '../extensions/indent';
import { SectionBlock } from '../nodes/sectionBlock/sectionBlock';
import { SpeakerLine } from '../nodes/speakerLine/speakerLine';
import { StageDirection } from '../nodes/stageDirection/stageDirection';
import { LyricLine } from '../nodes/lyricLine/lyricLine';

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
  SpeakerLine,
  StageDirection,
  LyricLine,
];

export const getDraftEditorConfig = (content: any = ''): Partial<EditorOptions> => ({
  extensions: draftExtensions,
  content,
  editable: true,
  autofocus: false,
});
