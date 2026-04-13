import { Extension } from '@tiptap/core';

export const Indent = Extension.create({
  name: 'indent',

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return this.editor.commands.insertContent('\t');
      },
    };
  },
});
