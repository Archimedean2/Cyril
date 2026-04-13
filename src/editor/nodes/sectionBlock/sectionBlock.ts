import { Node, mergeAttributes } from '@tiptap/core';

export interface SectionBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionBlock: {
      /**
       * Insert a new section block
       */
      insertSectionBlock: (options?: { id?: string; sectionType?: string; label?: string; summary?: string; color?: string }) => ReturnType;
    }
  }
}

export const SectionBlock = Node.create<SectionBlockOptions>({
  name: 'sectionBlock',

  group: 'block',

  content: 'block+',

  defining: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'section-block',
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
      sectionType: {
        default: 'verse',
        parseHTML: element => element.getAttribute('data-section-type'),
        renderHTML: attributes => {
          return {
            'data-section-type': attributes.sectionType,
          };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {};
          }
          return {
            'data-label': attributes.label,
          };
        },
      },
      summary: {
        default: null,
        parseHTML: element => element.getAttribute('data-summary'),
        renderHTML: attributes => {
          if (!attributes.summary) {
            return {};
          }
          return {
            'data-summary': attributes.summary,
          };
        },
      },
      color: {
        default: null,
        parseHTML: element => element.getAttribute('data-color'),
        renderHTML: attributes => {
          if (!attributes.color) {
            return {};
          }
          return {
            'data-color': attributes.color,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sectionBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'sectionBlock' }), 0];
  },

  addCommands() {
    return {
      insertSectionBlock: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options || {},
          content: [
            {
              type: 'paragraph',
            },
          ],
        });
      },
    };
  },
});
