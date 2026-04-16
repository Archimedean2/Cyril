import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { getDraftEditorConfig } from '../../editor/core/draftConfig';
import { RichTextDocument, DraftSettings, DraftMode } from '../../domain/project/types';
import { DraftToolbar } from './DraftToolbar';
import { SectionContextMenu } from './SectionContextMenu';
import { LineContextMenu } from './LineContextMenu';
import { useLineMenuStore } from '../../app/state/lineMenuStore';
import './editor.css';

const LINE_TYPES = new Set(['lyricLine']);

interface DraftEditorProps {
  initialContent: RichTextDocument;
  settings?: DraftSettings;
  draftMode?: DraftMode;
  onChange: (content: RichTextDocument) => void;
}

export function DraftEditor({ initialContent, settings, draftMode = 'lyrics', onChange }: DraftEditorProps) {
  const editor = useEditor({
    ...getDraftEditorConfig({
      content: initialContent,
      showChords: settings?.showChords ?? true,
      draftMode,
    }),
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

  useEffect(() => {
    if (editor) {
      editor.view.updateState(editor.state);
    }
  }, [settings?.showChords, draftMode, editor]);

  const openLineMenu = useLineMenuStore(s => s.open);

  useEffect(() => {
    if (!editor) return;

    function handleContextMenu(e: MouseEvent) {
      const view = editor!.view;
      const pos = view.posAtCoords({ left: e.clientX, top: e.clientY });
      if (!pos) return;

      const $pos = view.state.doc.resolve(pos.pos);
      // Walk up to find the block node
      for (let depth = $pos.depth; depth >= 0; depth--) {
        const node = $pos.node(depth);
        if (LINE_TYPES.has(node.type.name)) {
          const nodePos = depth === 0 ? 0 : $pos.before(depth);
          e.preventDefault();
          openLineMenu({
            x: e.clientX,
            y: e.clientY,
            linePos: nodePos,
            lineType: (node.attrs.lineType as string) || 'lyric',
          } as Parameters<typeof openLineMenu>[0]);
          return;
        }
      }
    }

    const dom = editor.view.dom;
    dom.addEventListener('contextmenu', handleContextMenu);
    return () => dom.removeEventListener('contextmenu', handleContextMenu);
  }, [editor, openLineMenu]);

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

  const handleContainerClick = () => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  };

  return (
    <div
      className="editor-container"
      data-testid="draft-editor"
      onClick={handleContainerClick}
    >
      <DraftToolbar editor={editor} />
      <EditorContent editor={editor} className={editorClasses} data-testid="editor-surface" />
      <SectionContextMenu editor={editor} />
      <LineContextMenu editor={editor} />
    </div>
  );
}
