/**
 * Syllable gutter extension for Tiptap.
 *
 * Renders a subtle syllable count badge to the right of each lyric line
 * using a ProseMirror widget decoration. The count is computed via the
 * heuristic-only fallback (browser-safe — no cmudict require()).
 *
 * Visibility is controlled by plugin state carrying `showSyllableCounts`.
 * DraftEditor pushes config updates via transaction meta.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { countSyllablesBrowser, getSyllableRanges } from '../../../domain/prosody/syllables-browser';

export interface SyllableExtensionOptions {
  showSyllableCounts?: boolean;
  showStressMarks?: boolean;
}

interface SyllablePluginState {
  showSyllableCounts: boolean;
  showStressMarks: boolean;
}

export const syllablePluginKey = new PluginKey<SyllablePluginState>('syllables');

export const SyllableExtension = Extension.create<SyllableExtensionOptions>({
  name: 'syllables',

  addOptions() {
    return {
      showSyllableCounts: false,
      showStressMarks: false,
    };
  },

  addProseMirrorPlugins() {
    const initialShow = this.options.showSyllableCounts ?? false;
    const initialStress = this.options.showStressMarks ?? false;

    return [
      new Plugin<SyllablePluginState>({
        key: syllablePluginKey,

        state: {
          init(): SyllablePluginState {
            return { showSyllableCounts: initialShow, showStressMarks: initialStress };
          },
          apply(tr, pluginState): SyllablePluginState {
            const meta = tr.getMeta(syllablePluginKey);
            if (meta) {
              return { ...pluginState, ...meta };
            }
            return pluginState;
          },
        },

        props: {
          decorations(state) {
            try {
              const pluginState = syllablePluginKey.getState(state);
              const showSyllableCounts = pluginState?.showSyllableCounts ?? false;
              const showStressMarks = pluginState?.showStressMarks ?? false;
              if (!showSyllableCounts && !showStressMarks) {
                return DecorationSet.empty;
              }

              const decorations: Decoration[] = [];

              state.doc.descendants((node, pos) => {
                if (node.type.name !== 'lyricLine') return true;
                if (node.attrs.lineType !== 'lyric') return true;

                const text = node.textContent;
                const textStart = pos + 1;

                if (showSyllableCounts) {
                  const count = countSyllablesBrowser(text);
                  if (count > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'cyril-syllable-badge';
                    badge.setAttribute('data-testid', 'syllable-count');
                    badge.setAttribute('contenteditable', 'false');
                    badge.textContent = String(count);
                    decorations.push(
                      Decoration.widget(pos + node.nodeSize - 1, badge, {
                        side: 1,
                        key: `syllable-${node.attrs.id ?? pos}`,
                      })
                    );
                  }
                }

                if (showStressMarks) {
                  const syllables = getSyllableRanges(text);
                  for (const syl of syllables) {
                    decorations.push(
                      Decoration.inline(textStart + syl.start, textStart + syl.end, {
                        class: syl.stressed ? 'cyril-stress-mark cyril-stress-mark--stressed' : 'cyril-stress-mark cyril-stress-mark--unstressed',
                      })
                    );
                  }
                }

                return true;
              });

              return DecorationSet.create(state.doc, decorations);
            } catch (err) {
              console.error('[SyllableExtension] decorations() threw:', err);
              return DecorationSet.empty;
            }
          },
        },
      }),
    ];
  },
});
