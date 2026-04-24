import { Node, mergeAttributes, InputRule } from '@tiptap/core';

export interface LyricLineOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lyricLine: {
      /**
       * Toggle sung/spoken delivery for the current lyric line
       */
      toggleDelivery: () => ReturnType;
      /**
       * Set the lineType of the current lyric line
       */
      setLineType: (lineType: string) => ReturnType;
      /**
       * Toggle the lineType between the given value and 'lyric'
       */
      toggleLineType: (lineType: string) => ReturnType;
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
      delivery: {
        default: 'sung', // 'sung' or 'spoken'
        parseHTML: element => element.getAttribute('data-delivery'),
        renderHTML: attributes => {
          return {
            'data-delivery': attributes.delivery,
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
        'data-delivery': node.attrs.delivery,
        'data-id': node.attrs.id,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleDelivery: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        const { $from, $to } = selection;

        let toggled = false;
        
        state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
          if (node.type.name === this.name) {
            if (dispatch) {
              const currentDelivery = node.attrs.delivery;
              const newDelivery = currentDelivery === 'sung' ? 'spoken' : 'sung';
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, delivery: newDelivery });
            }
            toggled = true;
          }
        });

        return toggled;
      },

      setLineType: (lineType: string) => ({ tr, state, dispatch }) => {
        const { $from } = state.selection;
        const pos = $from.before($from.depth);
        const node = state.doc.nodeAt(pos);

        if (!node || node.type.name !== 'lyricLine') return false;

        if (dispatch) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            lineType,
          });
        }
        return true;
      },

      toggleLineType: (lineType: string) => ({ tr, state, dispatch }) => {
        const { $from } = state.selection;
        const pos = $from.before($from.depth);
        const node = state.doc.nodeAt(pos);

        if (!node || node.type.name !== 'lyricLine') return false;

        const newType = node.attrs.lineType === lineType ? 'lyric' : lineType;

        if (dispatch) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            lineType: newType,
          });
        }
        return true;
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

          return tr as any;
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

          return tr as any;
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
