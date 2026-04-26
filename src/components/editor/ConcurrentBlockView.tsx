/**
 * ConcurrentBlockView
 *
 * This file exports a vanilla NodeView factory (not a React component) for the
 * concurrentBlock node.  We use a vanilla DOM NodeView rather than a React
 * NodeView because each speakerColumn needs its own ProseMirror contentDOM —
 * something that React NodeViewWrapper/NodeViewContent cannot provide per-child.
 *
 * The NodeView renders:
 *  - A flex-row header bar with editable speaker name labels and add/remove buttons
 *  - A flex-row content area whose children are the speakerColumn contentDOMs
 *    (ProseMirror owns those; this NodeView just supplies the outer container)
 */

import { NodeViewRendererProps } from '@tiptap/core';
import { Editor } from '@tiptap/core';
import { ViewMutationRecord } from '@tiptap/pm/view';

export function createConcurrentBlockView({
  node: initialNode,
  getPos,
  editor,
}: NodeViewRendererProps) {
  let currentNode = initialNode;

  // Outer wrapper
  const dom = document.createElement('div');
  dom.classList.add('concurrent-block');
  dom.setAttribute('data-type', 'concurrentBlock');
  dom.setAttribute('data-id', currentNode.attrs.id);

  // Header row: spans full width, contains only per-column name labels
  const headerRow = document.createElement('div');
  headerRow.classList.add('concurrent-block-header');
  headerRow.setAttribute('contenteditable', 'false');
  dom.appendChild(headerRow);

  // The add-button toolbar sits below the header, absolutely positioned
  // so it takes zero width and never affects column alignment
  const addBtnRow = document.createElement('div');
  addBtnRow.classList.add('concurrent-block-add-row');
  addBtnRow.setAttribute('contenteditable', 'false');
  dom.appendChild(addBtnRow);

  // Content DOM: columns render here (PM manages children)
  const contentDOM = document.createElement('div');
  contentDOM.classList.add('concurrent-block-columns');
  dom.appendChild(contentDOM);


  function rebuildHeader(node: typeof initialNode) {
    headerRow.innerHTML = '';
    addBtnRow.innerHTML = '';

    const colCount = node.childCount;

    for (let i = 0; i < colCount; i++) {
      const col = node.child(i);
      const colHeader = document.createElement('div');
      colHeader.classList.add('concurrent-column-header');
      colHeader.style.flex = '1';
      colHeader.style.minWidth = '0';

      // Editable speaker name
      const nameSpan = document.createElement('span');
      nameSpan.classList.add('concurrent-speaker-name');
      nameSpan.setAttribute('contenteditable', 'true');
      nameSpan.setAttribute('data-testid', `concurrent-speaker-name-${i}`);
      const LETTERS = ['A', 'B', 'C', 'D'];
      nameSpan.textContent = col.attrs.speakerName || `Speaker ${LETTERS[i] ?? i + 1}`;

      nameSpan.addEventListener('keydown', (e: KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          nameSpan.blur();
        }
      });
      nameSpan.addEventListener('keypress', (e) => e.stopPropagation());
      nameSpan.addEventListener('keyup', (e) => e.stopPropagation());

      nameSpan.addEventListener('blur', () => {
        const FALLBACK_LETTERS = ['A', 'B', 'C', 'D'];
        const newName = nameSpan.textContent?.trim() || `Speaker ${FALLBACK_LETTERS[i] ?? i + 1}`;
        nameSpan.textContent = newName;
        const pos = typeof getPos === 'function' ? getPos() : undefined;
        if (pos === undefined) return;

        const { tr } = (editor as Editor).state;
        const blockNode = (editor as Editor).state.doc.nodeAt(pos);
        if (!blockNode) return;

        let colStart = pos + 1;
        for (let ci = 0; ci < i; ci++) {
          colStart += blockNode.child(ci).nodeSize;
        }
        tr.setNodeMarkup(colStart, undefined, {
          ...blockNode.child(i).attrs,
          speakerName: newName,
        });
        (editor as Editor).view.dispatch(tr);
      });

      colHeader.appendChild(nameSpan);

      // Remove button (only when > 2 columns)
      if (colCount > 2) {
        const removeBtn = document.createElement('button');
        removeBtn.classList.add('concurrent-remove-col-btn');
        removeBtn.setAttribute('data-testid', `concurrent-remove-col-${i}`);
        const REMOVE_LETTERS = ['A', 'B', 'C', 'D'];
        removeBtn.title = `Remove ${col.attrs.speakerName || `Speaker ${REMOVE_LETTERS[i] ?? i + 1}`}`;
        removeBtn.textContent = '✕';

        const capturedIndex = i;
        removeBtn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const pos = typeof getPos === 'function' ? getPos() : undefined;
          if (pos === undefined) return;
          const colNode = currentNode.child(capturedIndex);
          const hasContent =
            colNode.childCount > 1 ||
            (colNode.childCount === 1 && colNode.child(0).textContent.trim() !== '');
          if (
            hasContent &&
            !window.confirm(
              `Remove ${colNode.attrs.speakerName || `Speaker ${capturedIndex + 1}`}? Their lines will be deleted.`
            )
          ) {
            return;
          }
          (editor as Editor).commands.removeColumnFromConcurrentBlock(pos, capturedIndex);
        });
        colHeader.appendChild(removeBtn);
      }

      headerRow.appendChild(colHeader);
    }

    // Add column button (when < 4 columns) — lives in addBtnRow below the header
    // so it never participates in the header flex layout
    if (colCount < 4) {
      const addBtn = document.createElement('button');
      addBtn.classList.add('concurrent-add-col-btn');
      addBtn.setAttribute('data-testid', 'concurrent-add-col-btn');
      addBtn.title = 'Add speaker column';
      addBtn.textContent = '+ Speaker';

      addBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === 'function' ? getPos() : undefined;
        if (pos === undefined) return;
        // Pick next unused letter A-D
        const ALL_LETTERS = ['A', 'B', 'C', 'D'];
        const usedNames = new Set<string>();
        currentNode.forEach(c => usedNames.add((c.attrs.speakerName || '').toLowerCase()));
        const nextLetter = ALL_LETTERS.find(
          l => !usedNames.has(`speaker ${l.toLowerCase()}`)
        ) ?? ALL_LETTERS[currentNode.childCount] ?? 'D';
        (editor as Editor).commands.addColumnToConcurrentBlock(
          pos,
          `Speaker ${nextLetter}`
        );
      });
      addBtnRow.appendChild(addBtn);
    }
  }

  rebuildHeader(currentNode);

  return {
    dom,
    contentDOM,

    update(updatedNode: typeof initialNode) {
      if (updatedNode.type.name !== 'concurrentBlock') return false;
      currentNode = updatedNode;
      dom.setAttribute('data-id', updatedNode.attrs.id);
      rebuildHeader(updatedNode);
      return true;
    },

    stopEvent(event: Event) {
      const t = event.target as globalThis.Node;
      return headerRow.contains(t) || addBtnRow.contains(t);
    },

    ignoreMutation(mutation: ViewMutationRecord) {
      if (mutation.type === 'selection') return true;
      const t = (mutation as MutationRecord).target as globalThis.Node;
      return headerRow.contains(t) || addBtnRow.contains(t);
    },
  };
}
