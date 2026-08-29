import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection, Plugin } from '@tiptap/pm/state';
import { generateId } from '../../../domain/project/ids';

export interface SpeakerColumnOptions {
  HTMLAttributes: Record<string, unknown>;
}


export const SpeakerColumn = Node.create<SpeakerColumnOptions>({
  name: 'speakerColumn',

  group: 'block',

  content: 'lyricLine+',

  isolating: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      id: {
        default: '',
        parseHTML: element => element.getAttribute('data-id') || '',
        renderHTML: attributes => ({ 'data-id': attributes.id }),
      },
      speakerName: {
        default: 'Speaker A',
        parseHTML: element => element.getAttribute('data-speaker-name') || 'Speaker A',
        renderHTML: attributes => ({ 'data-speaker-name': attributes.speakerName }),
      },
      // C-20: links this column to a Character in the project's registry —
      // same semantics as LyricLine's `characterId`.
      characterId: {
        default: null,
        parseHTML: element => element.getAttribute('data-character-id') || null,
        renderHTML: attributes => {
          if (!attributes.characterId) return {};
          return { 'data-character-id': attributes.characterId };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="speakerColumn"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'speaker-column',
        'data-type': 'speakerColumn',
        'data-id': node.attrs.id,
        'data-speaker-name': node.attrs.speakerName,
      }),
      0,
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleKeyDown(view, event) {
            if (event.key === 'Backspace') {
              const { $from } = view.state.selection;

              // Only intercept when at offset 0 of a lyricLine inside a speakerColumn
              let colDepth = -1;
              let blockDepth = -1;
              for (let d = $from.depth; d > 0; d--) {
                const name = $from.node(d).type.name;
                if (name === 'speakerColumn' && colDepth === -1) colDepth = d;
                if (name === 'concurrentBlock' && blockDepth === -1) blockDepth = d;
              }
              if (colDepth === -1 || $from.parent.type.name !== 'lyricLine' || $from.parentOffset !== 0) {
                return false;
              }

              const block = $from.node(blockDepth);
              const col = $from.node(colDepth);
              const blockPos = $from.before(blockDepth);
              const colStart = $from.before(colDepth);

              // Find column index
              let colIndex = -1;
              let colCursor = blockPos + 1;
              block.forEach((c, _, i) => {
                if (colCursor === colStart) colIndex = i;
                colCursor += c.nodeSize;
              });

              // Find line index within column
              let lineIndex = -1;
              let lineCursor = colStart + 1;
              col.forEach((line, _, li) => {
                if ($from.pos >= lineCursor && $from.pos <= lineCursor + line.nodeSize) {
                  lineIndex = li;
                }
                lineCursor += line.nodeSize;
              });

              if (colIndex === -1 || lineIndex === -1) return true; // safety block

              // Non-first columns: always block at start of any line to prevent
              // ProseMirror from merging across column boundaries.
              if (colIndex !== 0) return true;

              // First column. Allow within-column merge when the line has content and
              // is not the first line (standard merge with the previous line).
              if ($from.parent.content.size > 0) {
                if (lineIndex === 0) return true; // can't merge out of the block
                return false; // allow within-column merge
              }

              // Check whether every column is also empty at this row index.
              let allEmpty = true;
              block.forEach((c) => {
                if (c.type.name === 'speakerColumn' && c.childCount > lineIndex) {
                  if (c.child(lineIndex).content.size > 0) allEmpty = false;
                }
              });
              if (!allEmpty) return true; // row has content elsewhere — block

              // Smart delete: entire row is empty.
              // If every column has exactly 1 line, this is the last row — delete the block.
              let maxLines = 0;
              block.forEach((c) => { if (c.childCount > maxLines) maxLines = c.childCount; });

              const { tr } = view.state;

              if (maxLines === 1) {
                // Delete the whole concurrent block; leave an empty lyricLine in its place.
                const emptyLine = view.state.schema.nodeFromJSON({
                  type: 'lyricLine',
                  attrs: { id: generateId('line'), rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
                  content: [],
                });
                if (!emptyLine) return true;
                tr.replaceWith(blockPos, blockPos + block.nodeSize, emptyLine);
                const $target = tr.doc.resolve(blockPos + 1);
                tr.setSelection(TextSelection.near($target));
              } else {
                // Delete the empty row from every column (reverse order preserves positions).
                const deleteRanges: { from: number; to: number }[] = [];
                let cPos = blockPos + 1;
                block.forEach((c) => {
                  if (c.type.name === 'speakerColumn' && c.childCount > lineIndex) {
                    let lPos = cPos + 1;
                    for (let li = 0; li < lineIndex; li++) lPos += c.child(li).nodeSize;
                    deleteRanges.push({ from: lPos, to: lPos + c.child(lineIndex).nodeSize });
                  }
                  cPos += c.nodeSize;
                });
                [...deleteRanges].reverse().forEach(({ from, to }) => tr.delete(from, to));

                // Place cursor in first column at the row above (or row 0).
                const targetRow = Math.max(0, lineIndex - 1);
                const newBlockPos = tr.mapping.map(blockPos);
                const newBlock = tr.doc.nodeAt(newBlockPos);
                if (newBlock && newBlock.childCount > 0) {
                  const firstCol = newBlock.child(0);
                  let targetPos = newBlockPos + 2; // past block-open + col-open
                  for (let li = 0; li < Math.min(targetRow, firstCol.childCount - 1); li++) {
                    targetPos += firstCol.child(li).nodeSize;
                  }
                  targetPos += 1; // inside the line open token
                  const $target = tr.doc.resolve(Math.min(targetPos, tr.doc.content.size - 1));
                  tr.setSelection(TextSelection.near($target));
                }
              }

              view.dispatch(tr.scrollIntoView());
              return true;
            }

            if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.metaKey) return false;

            const { state } = view;
            const { $from } = state.selection;
            const $full = state.doc.resolve($from.pos);

            let colStart = -1;
            let blockPos = -1;
            let thisColIndex = -1;

            for (let d = $full.depth; d > 0; d--) {
              const name = $full.node(d).type.name;
              if (name === 'speakerColumn' && colStart === -1) {
                colStart = $full.before(d);
              }
              if (name === 'concurrentBlock' && blockPos === -1) {
                blockPos = $full.before(d);
                const blk = $full.node(d);
                let cursor = blockPos + 1;
                blk.forEach((c, _, i) => {
                  if (cursor === colStart) thisColIndex = i;
                  cursor += c.nodeSize;
                });
              }
            }
            if (colStart === -1 || blockPos === -1 || thisColIndex === -1) return false;

            const preBlock = state.doc.nodeAt(blockPos)!;
            const col = preBlock.child(thisColIndex);

            // Find which lyricLine the cursor is in
            let lineIndex = 0;
            let lineAbsStart = colStart + 1;
            col.forEach((line, _, li) => {
              if ($from.pos >= lineAbsStart && $from.pos <= lineAbsStart + line.nodeSize) {
                lineIndex = li;
              }
              lineAbsStart += line.nodeSize;
            });

            // Position immediately after the current line
            let newLineInsertPos = colStart + 1;
            for (let i = 0; i <= lineIndex; i++) newLineInsertPos += col.child(i).nodeSize;

            const makeLine = () =>
              state.schema.nodeFromJSON({
                type: 'lyricLine',
                attrs: { id: generateId('line'), rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
                content: [],
              });

            const newLine = makeLine();
            if (!newLine) return false;

            const { tr } = state;
            tr.insert(newLineInsertPos, newLine);

            // Pad other columns to match targetCount = col.childCount + 1
            const targetCount = col.childCount + 1;
            const padJobs: { pos: number; shortage: number }[] = [];
            let colCursor = blockPos + 1;
            preBlock.forEach((c, _, i) => {
              if (i !== thisColIndex) {
                const shortage = targetCount - c.childCount;
                if (shortage > 0) {
                  const safeRow = Math.min(lineIndex + 1, c.childCount);
                  let rowPos = colCursor + 1;
                  for (let li = 0; li < safeRow; li++) rowPos += c.child(li).nodeSize;
                  padJobs.push({ pos: rowPos, shortage });
                }
              }
              colCursor += c.nodeSize;
            });

            for (const job of padJobs) {
              for (let p = 0; p < job.shortage; p++) {
                const padLine = makeLine();
                if (padLine) tr.insert(tr.mapping.map(job.pos), padLine);
              }
            }

            // Walk tr.doc to find the exact position of the new line in thisColIndex.
            const updatedBlock = tr.doc.nodeAt(tr.mapping.map(blockPos));
            if (!updatedBlock) return false;

            let updatedColAbsStart = tr.mapping.map(blockPos) + 1;
            for (let ci = 0; ci < thisColIndex; ci++) {
              updatedColAbsStart += updatedBlock.child(ci).nodeSize;
            }
            const updatedCol = updatedBlock.child(thisColIndex);
            const newLineIndex = lineIndex + 1;
            let cursorPos = updatedColAbsStart + 1;
            for (let li = 0; li < newLineIndex; li++) cursorPos += updatedCol.child(li).nodeSize;
            cursorPos += 1;

            const $target = tr.doc.resolve(Math.min(cursorPos, tr.doc.content.size - 1));
            tr.setSelection(TextSelection.near($target));
            view.dispatch(tr.scrollIntoView());
            return true;
          },
        },
      }),
    ];
  },
});
