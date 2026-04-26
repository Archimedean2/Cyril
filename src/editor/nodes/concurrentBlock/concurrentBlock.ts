import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { generateId } from '../../../domain/project/ids';
import { createConcurrentBlockView } from '../../../components/editor/ConcurrentBlockView';

export interface ConcurrentBlockOptions {
  HTMLAttributes: Record<string, any>;
}

function makeLyricLineJSON() {
  return {
    type: 'lyricLine',
    attrs: {
      id: generateId('line'),
      delivery: 'sung',
      rhymeGroup: null,
      lineType: 'lyric',
      meta: { alternates: [], prosody: null, chords: [] },
    },
    content: [],
  };
}

function makeSpeakerColumnJSON(speakerName: string) {
  return {
    type: 'speakerColumn',
    attrs: {
      id: generateId('col'),
      speakerName,
    },
    content: [makeLyricLineJSON()],
  };
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    concurrentBlock: {
      insertConcurrentBlock: (options: {
        speakers: string[];
      }) => ReturnType;
      addColumnToConcurrentBlock: (blockPos: number, speakerName: string) => ReturnType;
      removeColumnFromConcurrentBlock: (blockPos: number, colIndex: number) => ReturnType;
    };
  }
}

export const ConcurrentBlock = Node.create<ConcurrentBlockOptions>({
  name: 'concurrentBlock',

  group: 'block',

  content: 'speakerColumn{2,4}',

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
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="concurrentBlock"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'concurrent-block',
        'data-type': 'concurrentBlock',
        'data-id': node.attrs.id,
      }),
      0,
    ];
  },

  addNodeView() {
    return createConcurrentBlockView;
  },

  addCommands() {
    return {
      insertConcurrentBlock: (options) => ({ state, tr, dispatch }) => {
        const { speakers } = options;
        if (speakers.length < 2 || speakers.length > 4) return false;

        const columns = speakers.map(name => makeSpeakerColumnJSON(name));
        const blockJSON = {
          type: 'concurrentBlock',
          attrs: { id: generateId('concurrent') },
          content: columns,
        };

        const { $from } = state.selection;

        // Insert after current block if possible
        let insertPos = $from.end($from.depth) + 1;
        if (insertPos > state.doc.content.size) {
          insertPos = state.doc.content.size;
        }

        const node = state.schema.nodeFromJSON(blockJSON);
        if (!node) return false;

        if (dispatch) {
          tr.insert(insertPos, node);
          // +1 block open, +1 col open, +1 lyricLine open = inside first line
          const targetPos = insertPos + 3;
          const $target = tr.doc.resolve(Math.min(targetPos, tr.doc.content.size - 1));
          tr.setSelection(TextSelection.near($target));
          dispatch(tr.scrollIntoView());
        }
        return true;
      },

      addColumnToConcurrentBlock: (blockPos, speakerName) => ({ state, tr, dispatch }) => {
        const block = state.doc.nodeAt(blockPos);
        if (!block || block.type.name !== 'concurrentBlock') return false;
        if (block.childCount >= 4) return false;

        const colJSON = makeSpeakerColumnJSON(speakerName);
        const colNode = state.schema.nodeFromJSON(colJSON);
        if (!colNode) return false;

        if (dispatch) {
          // Insert after last column
          const insertPos = blockPos + block.nodeSize - 1;
          tr.insert(insertPos, colNode);
          dispatch(tr);
        }
        return true;
      },

      removeColumnFromConcurrentBlock: (blockPos, colIndex) => ({ state, tr, dispatch }) => {
        const block = state.doc.nodeAt(blockPos);
        if (!block || block.type.name !== 'concurrentBlock') return false;
        if (block.childCount <= 2) return false;

        let colStart = blockPos + 1;
        for (let i = 0; i < colIndex; i++) {
          colStart += block.child(i).nodeSize;
        }
        const col = block.child(colIndex);

        if (dispatch) {
          tr.delete(colStart, colStart + col.nodeSize);
          dispatch(tr);
        }
        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        // Check if we are inside a speakerColumn inside a concurrentBlock
        let colDepth = -1;
        let blockDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          const name = $from.node(d).type.name;
          if (name === 'speakerColumn' && colDepth === -1) colDepth = d;
          if (name === 'concurrentBlock' && blockDepth === -1) blockDepth = d;
          if (colDepth !== -1 && blockDepth !== -1) break;
        }
        if (colDepth === -1 || blockDepth === -1) return false;

        const block = $from.node(blockDepth);
        const col = $from.node(colDepth);

        // Find current column index
        let colIndex = -1;
        block.forEach((child, _, i) => {
          if (child === col) colIndex = i;
        });
        if (colIndex === -1) return false;

        const nextColIndex = colIndex + 1;
        if (nextColIndex >= block.childCount) return false;

        // Move cursor to next column's same-row line (or first line)
        const blockPos = $from.before(blockDepth);
        let targetColStart = blockPos + 1;
        for (let i = 0; i < nextColIndex; i++) {
          targetColStart += block.child(i).nodeSize;
        }

        // Determine current row within the current column
        const colStart = $from.before(colDepth);
        let lineIndex = 0;
        let lineAccum = colStart + 1;
        col.forEach((line, _, li) => {
          if ($from.pos >= lineAccum && $from.pos <= lineAccum + line.nodeSize) {
            lineIndex = li;
          }
          lineAccum += line.nodeSize;
        });

        // Target line in next column at same row (or last line if column is shorter)
        const nextCol = block.child(nextColIndex);
        const targetLineIndex = Math.min(lineIndex, nextCol.childCount - 1);
        let targetLinePos = targetColStart + 1;
        for (let i = 0; i < targetLineIndex; i++) {
          targetLinePos += nextCol.child(i).nodeSize;
        }
        targetLinePos += 1; // inside the line

        const { tr } = state;
        const $target = tr.doc.resolve(Math.min(targetLinePos, tr.doc.content.size - 1));
        tr.setSelection(TextSelection.near($target));
        editor.view.dispatch(tr);
        return true;
      },

      'Shift-Tab': ({ editor }) => {
        const { state } = editor;
        const { $from } = state.selection;

        let colDepth = -1;
        let blockDepth = -1;
        for (let d = $from.depth; d > 0; d--) {
          const name = $from.node(d).type.name;
          if (name === 'speakerColumn' && colDepth === -1) colDepth = d;
          if (name === 'concurrentBlock' && blockDepth === -1) blockDepth = d;
          if (colDepth !== -1 && blockDepth !== -1) break;
        }
        if (colDepth === -1 || blockDepth === -1) return false;

        const block = $from.node(blockDepth);
        const col = $from.node(colDepth);

        let colIndex = -1;
        block.forEach((child, _, i) => {
          if (child === col) colIndex = i;
        });
        if (colIndex === -1 || colIndex === 0) return false;

        const prevColIndex = colIndex - 1;
        const blockPos = $from.before(blockDepth);
        let targetColStart = blockPos + 1;
        for (let i = 0; i < prevColIndex; i++) {
          targetColStart += block.child(i).nodeSize;
        }

        const colStart = $from.before(colDepth);
        let lineIndex = 0;
        let lineAccum = colStart + 1;
        col.forEach((line, _, li) => {
          if ($from.pos >= lineAccum && $from.pos <= lineAccum + line.nodeSize) {
            lineIndex = li;
          }
          lineAccum += line.nodeSize;
        });

        const prevCol = block.child(prevColIndex);
        const targetLineIndex = Math.min(lineIndex, prevCol.childCount - 1);
        let targetLinePos = targetColStart + 1;
        for (let i = 0; i < targetLineIndex; i++) {
          targetLinePos += prevCol.child(i).nodeSize;
        }
        targetLinePos += 1;

        const { tr } = state;
        const $target = tr.doc.resolve(Math.min(targetLinePos, tr.doc.content.size - 1));
        tr.setSelection(TextSelection.near($target));
        editor.view.dispatch(tr);
        return true;
      },

      // Enter is handled by speakerColumn's own addKeyboardShortcuts,
      // which fires before the isolating-node default. Nothing to do here.
      Enter: () => false,
    };
  },
});
