import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection, Plugin } from '@tiptap/pm/state';
import { generateId } from '../../../domain/project/ids';

export interface SpeakerColumnOptions {
  HTMLAttributes: Record<string, any>;
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
                attrs: { id: generateId('line'), delivery: 'sung', rhymeGroup: null, lineType: 'lyric', meta: { alternates: [], prosody: null, chords: [] } },
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
            // This is robust to any reordering caused by padding inserts in earlier columns.
            const updatedBlock = tr.doc.nodeAt(tr.mapping.map(blockPos));
            if (!updatedBlock) return false;

            let updatedColAbsStart = tr.mapping.map(blockPos) + 1;
            for (let ci = 0; ci < thisColIndex; ci++) {
              updatedColAbsStart += updatedBlock.child(ci).nodeSize;
            }
            const updatedCol = updatedBlock.child(thisColIndex);
            // The newly inserted line is at lineIndex + 1 (0-based)
            const newLineIndex = lineIndex + 1;
            let cursorPos = updatedColAbsStart + 1; // past col open token
            for (let li = 0; li < newLineIndex; li++) cursorPos += updatedCol.child(li).nodeSize;
            cursorPos += 1; // step inside the new line's open token

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
