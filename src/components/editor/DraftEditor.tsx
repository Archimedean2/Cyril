import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getDraftEditorConfig } from '../../editor/core/draftConfig';
import { RichTextDocument, DraftSettings, DraftMode } from '../../domain/project/types';
import { DraftToolbar } from './DraftToolbar';
import { SectionContextMenu } from './SectionContextMenu';
import { LineContextMenu } from './LineContextMenu';
import { ChordPopover, ChordPopoverTarget } from './ChordPopover';
import { useLineMenuStore } from '../../app/state/lineMenuStore';
import { chordPluginKey } from '../../editor/extensions/chords';
import { syllablePluginKey } from '../../editor/extensions/syllables';
import './editor.css';

const LINE_TYPES = new Set(['lyricLine']);

interface DraftEditorProps {
  initialContent: RichTextDocument;
  settings?: DraftSettings;
  draftMode?: DraftMode;
  onChange: (content: RichTextDocument) => void;
}

export function DraftEditor({ initialContent, settings, draftMode = 'lyrics', onChange }: DraftEditorProps) {
  // Track whether the last content change came from the editor itself.
  // If true, we skip setContent when initialContent prop bounces back through the store.
  const lastEmittedContent = useRef<string | null>(null);

  const editor = useEditor({
    ...getDraftEditorConfig({
      content: initialContent,
      showChords: settings?.showChords ?? true,
      draftMode,
      showSyllableCounts: settings?.showSyllableCounts ?? false,
      showStressMarks: settings?.showStressMarks ?? false,
    }),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as any as RichTextDocument;
      lastEmittedContent.current = JSON.stringify(json);
      onChange(json);
    },
  });

  useEffect(() => {
    if (!editor || !initialContent || editor.isDestroyed) return;
    const incomingStr = JSON.stringify(initialContent);
    // Skip if this content is what we just emitted — it's our own onChange bouncing back
    if (incomingStr === lastEmittedContent.current) return;
    const currentStr = JSON.stringify(editor.getJSON());
    if (currentStr !== incomingStr) {
      lastEmittedContent.current = incomingStr;
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [editor, initialContent]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const { tr } = editor.state;
    tr.setMeta(chordPluginKey, {
      showChords: settings?.showChords ?? true,
      draftMode: draftMode ?? 'lyrics',
    });
    tr.setMeta(syllablePluginKey, {
      showSyllableCounts: settings?.showSyllableCounts ?? false,
      showStressMarks: settings?.showStressMarks ?? false,
    });
    editor.view.dispatch(tr);
  }, [settings?.showChords, settings?.showSyllableCounts, settings?.showStressMarks, draftMode, editor]);

  const [chordPopover, setChordPopover] = useState<ChordPopoverTarget | null>(null);
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

  useEffect(() => {
    if (!editor) return;
    function handleChordClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const pill = target.closest('.cyril-chord-marker') as HTMLElement | null;
      if (!pill) return;
      e.preventDefault();
      e.stopPropagation();
      const chordId = pill.getAttribute('data-chord-id');
      const symbol = pill.getAttribute('data-symbol') ?? pill.textContent ?? '';
      if (!chordId) return;
      setChordPopover({ chordId, symbol, anchorEl: pill });
    }
    const dom = editor.view.dom;
    dom.addEventListener('click', handleChordClick);
    return () => dom.removeEventListener('click', handleChordClick);
  }, [editor]);

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
      <DraftToolbar editor={editor} draftMode={draftMode} settings={settings} />
      <EditorContent editor={editor} className={editorClasses} data-testid="editor-surface" />
      <SectionContextMenu editor={editor} />
      <LineContextMenu editor={editor} />
      {chordPopover && createPortal(
        <ChordPopover
          target={chordPopover}
          editor={editor}
          onClose={() => setChordPopover(null)}
        />,
        document.body
      )}
    </div>
  );
}
