/**
 * Chord extension for Tiptap.
 * 
 * Provides decoration-based rendering of chord markers above lyric lines.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import { buildAllChordDecorations } from './chordDecorations';

export interface ChordExtensionOptions {
  /**
   * Whether chords should be visible.
   */
  showChords?: boolean;
  
  /**
   * Current draft mode ('lyrics' or 'lyricsWithChords').
   */
  draftMode?: 'lyrics' | 'lyricsWithChords';
}

interface ChordPluginState {
  showChords: boolean;
  draftMode: 'lyrics' | 'lyricsWithChords';
}

export const chordPluginKey = new PluginKey<ChordPluginState>('chord');

export const ChordExtension = Extension.create<ChordExtensionOptions>({
  name: 'chord',

  addOptions() {
    return {
      showChords: true,
      draftMode: 'lyrics',
    };
  },

  addProseMirrorPlugins() {
    const initialShowChords = this.options.showChords ?? true;
    const initialDraftMode = this.options.draftMode ?? 'lyrics';

    return [
      new Plugin<ChordPluginState>({
        key: chordPluginKey,

        state: {
          init(): ChordPluginState {
            return { showChords: initialShowChords, draftMode: initialDraftMode };
          },
          apply(tr, pluginState): ChordPluginState {
            const meta = tr.getMeta(chordPluginKey);
            if (meta) {
              return { ...pluginState, ...meta };
            }
            return pluginState;
          },
        },

        props: {
          decorations(state) {
            const { showChords, draftMode } = chordPluginKey.getState(state) ?? {
              showChords: false,
              draftMode: 'lyrics' as const,
            };
            if (draftMode !== 'lyricsWithChords' || !showChords) {
              return DecorationSet.empty;
            }
            return buildAllChordDecorations(state.doc);
          },
        },
      }),
    ];
  },
});
