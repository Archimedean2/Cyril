/**
 * Character colour extension for Tiptap (C-20).
 *
 * Follows the same pattern as `../chords`: the character registry is kept as
 * reactive ProseMirror plugin state (synced in via `tr.setMeta`, since the
 * `characters` list changes over time but `useEditor` only builds the
 * extension list once), and decorations are built by a pure, unit-testable
 * function.
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DecorationSet } from '@tiptap/pm/view';
import { Character } from '../../../domain/project/types';
import { buildCharacterDecorations } from './characterDecorations';

export interface CharacterColorExtensionOptions {
  characters?: Character[];
}

interface CharacterColorPluginState {
  characters: Character[];
}

export const characterColorPluginKey = new PluginKey<CharacterColorPluginState>('characterColor');

export const CharacterColorExtension = Extension.create<CharacterColorExtensionOptions>({
  name: 'characterColor',

  addOptions() {
    return {
      characters: [],
    };
  },

  addProseMirrorPlugins() {
    const initialCharacters = this.options.characters ?? [];

    return [
      new Plugin<CharacterColorPluginState>({
        key: characterColorPluginKey,

        state: {
          init(): CharacterColorPluginState {
            return { characters: initialCharacters };
          },
          apply(tr, pluginState): CharacterColorPluginState {
            const meta = tr.getMeta(characterColorPluginKey);
            if (meta) {
              return { ...pluginState, ...meta };
            }
            return pluginState;
          },
        },

        props: {
          decorations(state) {
            const { characters } = characterColorPluginKey.getState(state) ?? { characters: [] };
            if (!characters.length) return DecorationSet.empty;
            return buildCharacterDecorations(state.doc, characters);
          },
        },
      }),
    ];
  },
});
