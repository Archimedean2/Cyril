import { useEditor, EditorContent } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getDraftEditorConfig } from '../../editor/core/draftConfig';
import { RichTextDocument, DraftSettings, DraftMode, Character } from '../../domain/project/types';
import { DraftToolbar } from './DraftToolbar';
import { SectionContextMenu } from './SectionContextMenu';
import { LineContextMenu } from './LineContextMenu';
import { ChordPopover, ChordPopoverTarget } from './ChordPopover';
import { SpeakerAutocomplete, SpeakerSuggestState } from './SpeakerAutocomplete';
import { useLineMenuStore } from '../../app/state/lineMenuStore';
import { chordPluginKey } from '../../editor/extensions/chords';
import { syllablePluginKey } from '../../editor/extensions/syllables';
import { characterColorPluginKey } from '../../editor/extensions/characters';
import './editor.css';

const LINE_TYPES = new Set(['lyricLine']);

interface DraftEditorProps {
  initialContent: RichTextDocument;
  settings?: DraftSettings;
  draftMode?: DraftMode;
  onChange: (content: RichTextDocument) => void;
  /** C-20: the project's character registry, for colour + autocomplete. */
  characters?: Character[];
  /** C-20: see `LyricLineOptions.onFinalizeSpeakerName`. */
  onFinalizeSpeakerName?: (name: string) => string | null;
}

export function DraftEditor({
  initialContent,
  settings,
  draftMode = 'lyrics',
  onChange,
  characters = [],
  onFinalizeSpeakerName,
}: DraftEditorProps) {
  // Track whether the last content change came from the editor itself.
  // If true, we skip setContent when initialContent prop bounces back through the store.
  const lastEmittedContent = useRef<string | null>(null);

  // C-20: `useEditor` below builds the extension list once (no deps array),
  // so a callback captured directly at that call site would close over
  // whichever `onFinalizeSpeakerName` was passed on the FIRST render. Route
  // through a stable wrapper backed by a ref that's kept current instead.
  const onFinalizeSpeakerNameRef = useRef(onFinalizeSpeakerName);
  useEffect(() => {
    onFinalizeSpeakerNameRef.current = onFinalizeSpeakerName;
  }, [onFinalizeSpeakerName]);
  const stableOnFinalizeSpeakerName = useCallback(
    (name: string) => onFinalizeSpeakerNameRef.current?.(name) ?? null,
    []
  );

  const editor = useEditor({
    ...getDraftEditorConfig({
      content: initialContent,
      showChords: settings?.showChords ?? true,
      draftMode,
      showSyllableCounts: settings?.showSyllableCounts ?? false,
      showStressMarks: settings?.showStressMarks ?? false,
      characters,
      onFinalizeSpeakerName: stableOnFinalizeSpeakerName,
    }),
    onUpdate: ({ editor }) => {
      const json = editor.getJSON() as unknown as RichTextDocument;
      lastEmittedContent.current = JSON.stringify(json);
      onChange(json);
    },
    onBlur: ({ editor }) => {
      // C-20: clicking away from a speaker line without pressing Enter would
      // otherwise leave it unlinked to the registry — reconcile on blur too.
      editor.commands.reconcileSpeakerCharacters();
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
    tr.setMeta(characterColorPluginKey, { characters });
    editor.view.dispatch(tr);
  }, [settings?.showChords, settings?.showSyllableCounts, settings?.showStressMarks, draftMode, characters, editor]);

  const [chordPopover, setChordPopover] = useState<ChordPopoverTarget | null>(null);
  const closeChordPopover = useCallback(() => setChordPopover(null), []);
  const openLineMenu = useLineMenuStore(s => s.open);
  const editorSurfaceRef = useRef<HTMLDivElement>(null);

  // ─── C-20: speaker-name autocomplete ────────────────────────────────────────
  // While the cursor sits inside an in-progress speaker line, offer registry
  // matches so a typo doesn't silently create a duplicate character.
  const [speakerSuggest, setSpeakerSuggest] = useState<SpeakerSuggestState | null>(null);
  const matches = useMemo(() => {
    if (!speakerSuggest) return [];
    const query = speakerSuggest.query.trim().toLowerCase();
    if (!query) return [];
    return characters.filter(c => c.name.toLowerCase().startsWith(query));
  }, [speakerSuggest, characters]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  useEffect(() => setHighlightedIndex(0), [matches.length, speakerSuggest?.pos]);

  const closeSpeakerSuggest = useCallback(() => setSpeakerSuggest(null), []);

  const selectSpeakerSuggestion = useCallback((character: Character) => {
    if (!editor || !speakerSuggest) return;
    editor.commands.setSpeakerLineNameAndCharacter(speakerSuggest.pos, character.name, character.id);
    setSpeakerSuggest(null);
    editor.commands.focus();
  }, [editor, speakerSuggest]);

  const updateSpeakerSuggest = useCallback((ed: typeof editor) => {
    if (!ed) return;
    const { state } = ed;
    const { $from, empty } = state.selection;
    if (!empty || $from.parent.type.name !== 'lyricLine' || $from.parent.attrs.lineType !== 'speaker') {
      setSpeakerSuggest(null);
      return;
    }
    const query = $from.parent.textContent;
    if (!query.trim()) {
      setSpeakerSuggest(null);
      return;
    }
    const pos = $from.before($from.depth);
    const coords = ed.view.coordsAtPos($from.pos);
    setSpeakerSuggest({ pos, query, left: coords.left, bottom: coords.bottom });
  }, []);

  useEffect(() => {
    if (!editor) return;
    const handle = () => updateSpeakerSuggest(editor);
    editor.on('selectionUpdate', handle);
    editor.on('update', handle);
    return () => {
      editor.off('selectionUpdate', handle);
      editor.off('update', handle);
    };
  }, [editor, updateSpeakerSuggest]);

  // Intercept navigation/selection keys in the editor's own DOM (capture
  // phase, so this runs before ProseMirror's keymap) while suggestions are
  // showing — refs avoid a stale closure since this effect only re-attaches
  // when `editor` changes.
  const matchesRef = useRef(matches);
  matchesRef.current = matches;
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;
  const speakerSuggestRef = useRef(speakerSuggest);
  speakerSuggestRef.current = speakerSuggest;

  useEffect(() => {
    if (!editor) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (!speakerSuggestRef.current || matchesRef.current.length === 0) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeSpeakerSuggest();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex(i => Math.min(i + 1, matchesRef.current.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex(i => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        // Deliberately NOT preventDefault/stopPropagation here: snap the
        // line's text to the highlighted suggestion and link it, then let
        // this same Enter continue on to LyricLine's own handler (splits to
        // a new lyric line, reconciles). Swallowing the event here would
        // otherwise silently eat every Enter press whenever the typed name
        // already exactly matches an existing character — the common case
        // for a repeat speaker — leaving the writer stuck unable to leave
        // the line at all.
        selectSpeakerSuggestion(matchesRef.current[highlightedIndexRef.current]);
        return;
      }
    }
    const dom = editor.view.dom;
    dom.addEventListener('keydown', handleKeyDown, true);
    return () => dom.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, closeSpeakerSuggest, selectSpeakerSuggestion]);

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

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only refocus when the click landed on the editor surface or its bare
    // container background — not on any toolbar, dialog, popover, or overlay
    // that happens to render inside this container (including React portals,
    // which bubble through the React tree even when mounted in document.body).
    if (editor && !editor.isFocused && editorSurfaceRef.current?.contains(e.target as Node)) {
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
      <EditorContent ref={editorSurfaceRef} editor={editor} className={editorClasses} data-testid="editor-surface" />
      <SectionContextMenu editor={editor} />
      <LineContextMenu editor={editor} />
      {chordPopover && createPortal(
        <ChordPopover
          target={chordPopover}
          editor={editor}
          onClose={closeChordPopover}
        />,
        document.body
      )}
      {matches.length > 0 && speakerSuggest && createPortal(
        <SpeakerAutocomplete
          state={speakerSuggest}
          matches={matches}
          highlightedIndex={highlightedIndex}
          onHover={setHighlightedIndex}
          onSelect={selectSpeakerSuggestion}
        />,
        document.body
      )}
    </div>
  );
}
