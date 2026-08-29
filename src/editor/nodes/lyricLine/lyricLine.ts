import { Node, mergeAttributes, InputRule } from '@tiptap/core';

export interface LyricLineOptions {
  HTMLAttributes: Record<string, unknown>;
  /**
   * C-20: called when a speaker line's name is "finalized" (the writer
   * leaves it via Enter, or `reconcileSpeakerCharacters` runs on blur) so
   * the surrounding app can look up or create the matching `Character` in
   * the project's registry. Returns the resolved character's id, or `null`
   * to leave the line unlinked (e.g. no registry is available).
   *
   * Kept as an injected callback rather than importing the project store
   * directly — this extension stays store-agnostic and unit-testable with a
   * bare `Editor` instance (see `tests/unit/editor/character-link.test.ts`).
   */
  onFinalizeSpeakerName?: (name: string) => string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lyricLine: {
      /**
       * Set the lineType of the current lyric line
       */
      setLineType: (lineType: string) => ReturnType;
      /**
       * Toggle the lineType between the given value and 'lyric'
       */
      toggleLineType: (lineType: string) => ReturnType;
      /**
       * C-20: set (or clear) the `characterId` link on the speaker line at `pos`.
       */
      setSpeakerCharacterId: (pos: number, characterId: string | null) => ReturnType;
      /**
       * C-20: replace the text of the speaker line at `pos` with `name` and
       * link it to `characterId` in one step — used by the `[[` autocomplete
       * when the writer picks an existing character from the registry.
       */
      setSpeakerLineNameAndCharacter: (pos: number, name: string, characterId: string) => ReturnType;
      /**
       * C-20: scan the whole document for speaker lines with non-empty text
       * and no `characterId` yet, resolving each via `options.onFinalizeSpeakerName`
       * and linking it in a single transaction. No-op (returns false) if that
       * option isn't provided, or nothing needed linking.
       */
      reconcileSpeakerCharacters: () => ReturnType;
    }
  }
}

export const LyricLine = Node.create<LyricLineOptions>({
  name: 'lyricLine',

  group: 'block',

  content: 'inline*',

  // It's a text block
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }
          return {
            'data-id': attributes.id,
          };
        },
      },
      rhymeGroup: {
        default: null,
        parseHTML: element => element.getAttribute('data-rhyme-group'),
        renderHTML: attributes => {
          if (!attributes.rhymeGroup) {
            return {};
          }
          return {
            'data-rhyme-group': attributes.rhymeGroup,
          };
        },
      },
      lineType: {
        default: 'lyric', // 'lyric' | 'speaker' | 'stageDirection'
        parseHTML: element => element.getAttribute('data-line-type') || 'lyric',
        renderHTML: attributes => {
          return {
            'data-line-type': attributes.lineType,
          };
        },
      },
      // C-20: links a `lineType: 'speaker'` line to a Character in the
      // project's registry (`CyrilProject.characters`). See
      // docs/engineering/DATA_MODEL.md.
      characterId: {
        default: null,
        parseHTML: element => element.getAttribute('data-character-id') || null,
        renderHTML: attributes => {
          if (!attributes.characterId) return {};
          return {
            'data-character-id': attributes.characterId,
          };
        },
      },
      // For v1, we serialize meta into a JSON string attribute for DOM parsing if needed,
      // but primarily we rely on Tiptap's JSON state.
      meta: {
        default: {
          alternates: [],
          prosody: null,
          chords: []
        },
        parseHTML: element => {
          const metaStr = element.getAttribute('data-meta');
          if (metaStr) {
            try {
              return JSON.parse(metaStr);
            } catch (e) {
              return { alternates: [], prosody: null, chords: [] };
            }
          }
          return { alternates: [], prosody: null, chords: [] };
        },
        renderHTML: attributes => {
          return {
            'data-meta': JSON.stringify(attributes.meta),
          };
        },
      }
    };
  },

  parseHTML() {
    return [
      // New unified format
      { tag: 'div[data-type="lyricLine"]' },
      // Old speakerLine format — migrate on parse
      {
        tag: 'div[data-type="speakerLine"]',
        getAttrs: (el) => ({
          lineType: 'speaker',
          id: (el as HTMLElement).getAttribute('data-id') || '',
        }),
      },
      {
        tag: 'div[data-type="speaker"]',
        getAttrs: (el) => ({
          lineType: 'speaker',
          id: (el as HTMLElement).getAttribute('data-id') || '',
        }),
      },
      // Old stageDirection format — migrate on parse
      {
        tag: 'div[data-type="stageDirection"]',
        getAttrs: (el) => ({
          lineType: 'stageDirection',
          id: (el as HTMLElement).getAttribute('data-id') || '',
        }),
      },
      {
        tag: 'div[data-type="stage-direction"]',
        getAttrs: (el) => ({
          lineType: 'stageDirection',
          id: (el as HTMLElement).getAttribute('data-id') || '',
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: `lyric-line line-type-${node.attrs.lineType}`,
        'data-type': 'lyricLine',
        'data-line-type': node.attrs.lineType,
        'data-id': node.attrs.id,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setLineType: (lineType: string) => ({ tr, state, dispatch }) => {
        const { $from } = state.selection;
        const pos = $from.before($from.depth);
        const node = state.doc.nodeAt(pos);

        if (!node || node.type.name !== 'lyricLine') return false;

        if (dispatch) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            lineType,
            // A line that stops being a speaker line is no longer linked to
            // a character — clear the stale id rather than carry it silently.
            characterId: lineType === 'speaker' ? node.attrs.characterId : null,
          });
        }
        return true;
      },

      toggleLineType: (lineType: string) => ({ tr, state, dispatch }) => {
        const { $from } = state.selection;

        // Check if we're inside a lyricLine
        if ($from.parent.type.name !== 'lyricLine') return false;

        // Get the position of the lyricLine node
        const pos = $from.before($from.depth);
        const node = state.doc.nodeAt(pos);

        if (!node || node.type.name !== 'lyricLine') return false;

        const newType = node.attrs.lineType === lineType ? 'lyric' : lineType;

        if (dispatch) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            lineType: newType,
            characterId: newType === 'speaker' ? node.attrs.characterId : null,
          });
        }
        return true;
      },

      setSpeakerCharacterId: (pos: number, characterId: string | null) => ({ tr, state, dispatch }) => {
        const node = state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'lyricLine') return false;

        if (dispatch) {
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, characterId });
        }
        return true;
      },

      setSpeakerLineNameAndCharacter: (pos: number, name: string, characterId: string) => ({ tr, state, dispatch }) => {
        const node = state.doc.nodeAt(pos);
        if (!node || node.type.name !== 'lyricLine') return false;

        if (dispatch) {
          const from = pos + 1;
          const to = pos + node.nodeSize - 1;
          // `pos` (the node's own start) sits before this range, so it's
          // unaffected by the text replacement and stays valid for the
          // setNodeMarkup call below within the same transaction.
          tr.insertText(name, from, to);
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, characterId });
        }
        return true;
      },

      reconcileSpeakerCharacters: () => ({ tr, state, dispatch }) => {
        const resolve = this.options.onFinalizeSpeakerName;
        if (!resolve) return false;

        let changed = false;

        state.doc.descendants((node, pos) => {
          if (node.type.name !== 'lyricLine') return;
          if (node.attrs.lineType !== 'speaker') return;
          if (node.attrs.characterId) return;

          const text = node.textContent.trim();
          if (!text) return;

          const characterId = resolve(text);
          if (characterId) {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, characterId });
            changed = true;
          }
        });

        if (changed && dispatch) dispatch(tr);
        return changed;
      },
    };
  },

  addInputRules() {
    return [
      // [[ → speaker-typed line (opening-only trigger)
      new InputRule({
        find: /^\[\[$/,
        handler: ({ state, range }) => {
          const { tr } = state;

          tr.delete(range.from, range.to);

          const posAfterDelete = Math.min(range.from, tr.doc.content.size);
          const $from = tr.doc.resolve(posAfterDelete);

          // Check if we're inside a lyricLine (works at any depth - inside or outside section)
          if ($from.parent.type.name === 'lyricLine') {
            const blockPos = $from.before($from.depth);
            const node = tr.doc.nodeAt(blockPos);
            if (node && node.type.name === 'lyricLine') {
              tr.setNodeMarkup(blockPos, undefined, {
                ...node.attrs,
                lineType: 'speaker',
              });
            }
          }

        },
      }),
      // (( → stageDirection-typed line (opening-only trigger)
      new InputRule({
        find: /^\(\($/,
        handler: ({ state, range }) => {
          const { tr } = state;

          tr.delete(range.from, range.to);

          const posAfterDelete = Math.min(range.from, tr.doc.content.size);
          const $from = tr.doc.resolve(posAfterDelete);

          // Check if we're inside a lyricLine (works at any depth - inside or outside section)
          if ($from.parent.type.name === 'lyricLine') {
            const blockPos = $from.before($from.depth);
            const node = tr.doc.nodeAt(blockPos);
            if (node && node.type.name === 'lyricLine') {
              tr.setNodeMarkup(blockPos, undefined, {
                ...node.attrs,
                lineType: 'stageDirection',
              });
            }
          }

        },
      }),
      // ]] → closes an in-progress [[NAME]] gesture: strip the trailing brackets
      // instead of leaving them in the text. Only fires on a line the opening
      // trigger already converted to 'speaker' — a plain lyric line typing a
      // literal "]]" is left alone.
      new InputRule({
        find: /\]\]$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          const $from = state.doc.resolve(range.from);

          if ($from.parent.type.name !== 'lyricLine' || $from.parent.attrs.lineType !== 'speaker') {
            return null;
          }

          tr.delete(range.from, range.to);
        },
      }),
      // )) → closes an in-progress ((text)) gesture: strip the trailing parens
      // instead of leaving them in the text. Only fires on a line the opening
      // trigger already converted to 'stageDirection'.
      new InputRule({
        find: /\)\)$/,
        handler: ({ state, range }) => {
          const { tr } = state;
          const $from = state.doc.resolve(range.from);

          if ($from.parent.type.name !== 'lyricLine' || $from.parent.attrs.lineType !== 'stageDirection') {
            return null;
          }

          tr.delete(range.from, range.to);
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: ({ editor }) => {
        const { state, view } = editor;
        const { $from } = state.selection;

        // Only handle when inside a lyricLine with a non-lyric lineType
        if ($from.parent.type.name !== 'lyricLine') return false;
        const currentLineType = $from.parent.attrs.lineType as string;
        if (currentLineType === 'lyric') return false;

        // Let the split happen first
        if (!editor.commands.splitBlock()) return false;

        // After split, find the new line and reset its lineType to lyric
        // splitBlock moves cursor to the new line, so we can use the current selection
        const newState = view.state;
        const $newFrom = newState.selection.$from;

        if ($newFrom.parent.type.name === 'lyricLine' && $newFrom.parent.attrs.lineType !== 'lyric') {
          editor.commands.setLineType('lyric');
        }

        // C-20: leaving a speaker line via Enter is the moment its name is
        // "finalized" — resolve it against the character registry so
        // colour/identity resolution has a stable link rather than relying
        // solely on text matching.
        if (currentLineType === 'speaker') {
          editor.commands.reconcileSpeakerCharacters();
        }

        return true;
      },
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { $from, empty } = state.selection;

        if (!empty) return false;
        if ($from.parent.type.name !== 'lyricLine') return false;
        if ($from.parentOffset !== 0) return false;
        if ($from.parent.attrs.lineType === 'lyric') return false;

        // At start of a non-lyric line — reset to lyric
        return editor.commands.setLineType('lyric');
      },
    };
  },
});
