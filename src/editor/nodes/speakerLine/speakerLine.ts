import { Node, mergeAttributes } from '@tiptap/core';

export interface SpeakerLineOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    speakerLine: {
      /**
       * Insert a speaker line
       */
      insertSpeakerLine: (speaker: string) => ReturnType;
    }
  }
}

export const SpeakerLine = Node.create<SpeakerLineOptions>({
  name: 'speakerLine',

  group: 'block',

  // A speaker line does not have editable text content in the editor schema in the same way a paragraph does, 
  // it's metadata stored in attrs. However, to make it selectable and behave like a block, we can make it an atom or just void.
  // Based on the data model, it doesn't have a content array: { type: 'speakerLine', attrs: { speaker: 'WOODY' } }
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'speaker-line',
      },
    };
  },

  addAttributes() {
    return {
      speaker: {
        default: '',
        parseHTML: element => element.getAttribute('data-speaker'),
        renderHTML: attributes => {
          return {
            'data-speaker': attributes.speaker,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="speakerLine"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Render the speaker text inside the div so it's visible in standard HTML export if needed,
    // though the canonical export pipeline will handle this differently.
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'speakerLine' }), HTMLAttributes.speaker || ''];
  },

  addCommands() {
    return {
      insertSpeakerLine: (speaker: string) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { speaker },
        });
      },
    };
  },
});
