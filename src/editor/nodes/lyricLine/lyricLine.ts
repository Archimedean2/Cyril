import { Node, mergeAttributes } from '@tiptap/core';

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
      HTMLAttributes: {
        class: 'lyric-line',
      },
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
      {
        tag: 'div[data-type="lyricLine"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'lyricLine' }), 0];
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
    };
  },
  
  addKeyboardShortcuts() {
    return {
      'Enter': () => this.editor.commands.splitBlock(),
    };
  },
});
