/**
 * Character colour decoration builder for Tiptap/ProseMirror (C-20).
 *
 * Two jobs, both purely presentational (no doc mutation):
 *  1. Resolve each speaker line / concurrent-block column to its character's
 *     colour (via `characterId`, falling back to a name match) and expose it
 *     as the `--speaker-color` custom property on that node's DOM element.
 *  2. Detect "consecutive lines by the same character" in the main document
 *     flow (a speaker line whose resolved identity matches the last speaker
 *     line seen, ignoring any lyric/stage-direction lines in between) and
 *     mark the repeat as a continuation — the editor CSS hides its label and
 *     shows a persistent colour tick in the gutter instead, script-style.
 */

import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Node } from '@tiptap/pm/model';
import { Character } from '../../../domain/project/types';
import { characterColorVar, resolveCharacterColor } from '../../../domain/project/characters';

/**
 * A stable "who is this" key for continuation tracking: prefers the linked
 * `characterId`; falls back to the normalized line text so two consecutive
 * un-linked lines with the same typed name still count as the same speaker.
 */
function speakerKey(characterId: string | null | undefined, name: string): string | null {
  if (characterId) return `id:${characterId}`;
  const normalized = name.trim().toLowerCase();
  return normalized ? `name:${normalized}` : null;
}

export function buildCharacterDecorations(doc: Node, characters: Character[]): DecorationSet {
  const decorations: Decoration[] = [];
  // Tracks the most recently seen speaker-line identity across the whole
  // document flow (not reset per section) — a character's dialogue can
  // resume after stage directions or other non-speaker lines without losing
  // "consecutive" status.
  let activeKey: string | null = null;

  doc.descendants((node, pos) => {
    if (node.type.name === 'speakerColumn') {
      const name = String(node.attrs.speakerName || '');
      const characterId = (node.attrs.characterId as string | null) ?? null;
      const color = resolveCharacterColor(characters, characterId, name);
      if (color) {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            class: 'has-character-color',
            style: `--speaker-color: ${characterColorVar(color)}`,
          })
        );
      }
      // Continue descending — the column's dialogue lines are plain
      // lineType 'lyric' lines and don't participate in speaker-key tracking.
      return true;
    }

    if (node.type.name === 'lyricLine' && node.attrs.lineType === 'speaker') {
      const name = node.textContent;
      const characterId = (node.attrs.characterId as string | null) ?? null;
      const color = resolveCharacterColor(characters, characterId, name);
      const key = speakerKey(characterId, name);

      const classes: string[] = [];
      const styleParts: string[] = [];
      if (color) {
        styleParts.push(`--speaker-color: ${characterColorVar(color)}`);
        classes.push('has-character-color');
      }

      if (key !== null && key === activeKey) {
        classes.push('speaker-continuation');
      }
      if (key !== null) activeKey = key;

      if (classes.length || styleParts.length) {
        const attrs: Record<string, string> = {};
        if (classes.length) attrs.class = classes.join(' ');
        if (styleParts.length) attrs.style = styleParts.join('; ');
        decorations.push(Decoration.node(pos, pos + node.nodeSize, attrs));
      }
      return false; // no block-level children to inspect
    }

    return true;
  });

  return DecorationSet.create(doc, decorations);
}
