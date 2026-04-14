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

const chordPluginKey = new PluginKey('chord');

export const ChordExtension = Extension.create<ChordExtensionOptions>({
  name: 'chord',

  addOptions() {
    return {
      showChords: true,
      draftMode: 'lyrics',
    };
  },

  addProseMirrorPlugins() {
    const { showChords, draftMode } = this.options;

    return [
      new Plugin({
        key: chordPluginKey,
        props: {
          decorations(state) {
            // Only render chords if mode is lyricsWithChords and showChords is true
            if (draftMode !== 'lyricsWithChords' || !showChords) {
              return DecorationSet.empty;
            }
            
            return buildAllChordDecorations(state.doc);
          },
        },
      }),
    ];
  },

  onUpdate() {
    // Re-render decorations when document changes
    // The plugin's decorations prop will be called automatically
  },
});
