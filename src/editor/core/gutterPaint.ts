import { Node as ProseMirrorNode } from '@tiptap/pm/model';

/**
 * Collects the ProseMirror positions of every paintable `lyricLine` (i.e.
 * anything except a `stageDirection` line — never paintable) whose range
 * intersects `[from, to]`. Shared by the C-36 speaker gutter's own
 * drag/click collection and its `Mod-Shift-A` keyboard equivalent (§12.5) so
 * both paths feed the exact same rules into `paintCharacterRange`. Never
 * descends into a `concurrentBlock` — its multi-column lines are out of
 * scope for the gutter (see the hazard note on `SpeakerGutter.tsx`).
 */
export function collectPaintablePositions(doc: ProseMirrorNode, from: number, to: number): number[] {
  const positions: number[] = [];
  doc.nodesBetween(from, to, (node, pos) => {
    if (node.type.name === 'concurrentBlock') return false;
    if (node.type.name !== 'lyricLine') return true;
    if (node.attrs.lineType !== 'stageDirection') positions.push(pos);
    return false;
  });
  return positions;
}
