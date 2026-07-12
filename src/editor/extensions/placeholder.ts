import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const placeholderKey = new PluginKey('draftPlaceholder');

export const DraftPlaceholder = Extension.create({
  name: 'draftPlaceholder',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: placeholderKey,
        props: {
          decorations(state) {
            const { doc } = state;
            // Only show on a doc that has exactly one empty lyricLine
            if (doc.childCount !== 1) return DecorationSet.empty;
            const first = doc.firstChild;
            if (!first || first.type.name !== 'lyricLine') return DecorationSet.empty;
            if (first.content.size !== 0) return DecorationSet.empty;

            const deco = Decoration.node(0, first.nodeSize, {
              'data-placeholder': 'Start writing…',
              class: 'is-empty',
            });
            return DecorationSet.create(doc, [deco]);
          },
        },
      }),
    ];
  },
});
