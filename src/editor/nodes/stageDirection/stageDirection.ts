import { Node, mergeAttributes } from '@tiptap/core';

export interface StageDirectionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    stageDirection: {
      /**
       * Insert a stage direction
       */
      insertStageDirection: (text: string) => ReturnType;
    }
  }
}

export const StageDirection = Node.create<StageDirectionOptions>({
  name: 'stageDirection',

  group: 'block',

  // Similar to speaker line, this is stored as attrs, not editable text content in the node tree.
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'stage-direction',
      },
    };
  },

  addAttributes() {
    return {
      text: {
        default: '',
        parseHTML: element => element.getAttribute('data-text'),
        renderHTML: attributes => {
          return {
            'data-text': attributes.text,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="stageDirection"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'stageDirection' }), `(${HTMLAttributes.text})`];
  },

  addCommands() {
    return {
      insertStageDirection: (text: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { text },
        });
      },
    };
  },
});
