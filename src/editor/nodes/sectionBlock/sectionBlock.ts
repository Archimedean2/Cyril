import { Node, mergeAttributes, InputRule, NodeViewRendererProps } from '@tiptap/core';
import { EditorState, Selection } from '@tiptap/pm/state';
import { Editor } from '@tiptap/core';
import { generateId } from '../../../domain/project/ids';
import { useSectionMenuStore } from '../../../app/state/sectionMenuStore';

// ─── Public helpers ──────────────────────────────────────────────────────────

export function findParentSection(
  state: EditorState
): { node: any; pos: number; depth: number } | null {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth--) {
    if ($from.node(depth).type.name === 'sectionBlock') {
      return { node: $from.node(depth), pos: $from.before(depth), depth };
    }
  }
  return null;
}

export function isInsideSection(state: EditorState): boolean {
  return findParentSection(state) !== null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const KNOWN_TYPES: Record<string, string> = {
  verse: 'verse',
  chorus: 'chorus',
  'pre-chorus': 'pre-chorus',
  prechorus: 'pre-chorus',
  bridge: 'bridge',
  intro: 'intro',
  outro: 'outro',
  spoken: 'spoken',
  reprise: 'reprise',
};

function resolveSectionType(text: string): { sectionType: string; customLabel: string } {
  const normalized = text.toLowerCase().trim();
  if (KNOWN_TYPES[normalized]) {
    return { sectionType: KNOWN_TYPES[normalized], customLabel: '' };
  }
  return { sectionType: 'custom', customLabel: text };
}

function getDisplayLabel(node: any): string {
  if (node.attrs.sectionType === 'custom') {
    const label = (node.attrs.customLabel || '').toUpperCase();
    return label || 'NEW SECTION';
  }
  return node.attrs.sectionType.toUpperCase().replace('-', ' ');
}

function unwrapSectionAt(pos: number, editor: Editor) {
  editor
    .chain()
    .focus()
    .command(({ tr, state }) => {
      const node = state.doc.nodeAt(pos);
      if (!node || node.type.name !== 'sectionBlock') return false;
      tr.replaceWith(pos, pos + node.nodeSize, node.content);
      return true;
    })
    .run();
}

function exitEditMode(labelEl: HTMLElement, fallbackText: string) {
  labelEl.textContent = fallbackText;
}

function confirmLabelEdit(
  rawValue: string,
  node: any,
  getPos: () => number | undefined,
  editor: Editor,
  labelEl: HTMLElement
) {
  const text = rawValue.trim();

  const pos = getPos();
  if (pos === undefined) return;

  if (!text) {
    labelEl.textContent = '';
    unwrapSectionAt(pos, editor);
    return;
  }

  const resolved = resolveSectionType(text);

  const newDisplayLabel = resolved.sectionType === 'custom'
    ? (resolved.customLabel || 'CUSTOM').toUpperCase()
    : resolved.sectionType.toUpperCase();

  labelEl.textContent = newDisplayLabel;

  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        sectionType: resolved.sectionType,
        customLabel: resolved.customLabel || '',
      });
      return true;
    })
    .run();
}

function enterEditMode(
  labelEl: HTMLElement,
  node: any,
  getPos: () => number | undefined,
  editor: Editor
) {
  const currentLabel = getDisplayLabel(node);
  const originalLabel = currentLabel;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'section-label-input';
  input.value = currentLabel;

  labelEl.textContent = '';
  labelEl.appendChild(input);

  input.focus();
  input.select();

  const stopProp = (e: Event) => e.stopPropagation();
  input.addEventListener('keypress', stopProp);
  input.addEventListener('keyup', stopProp);

  input.addEventListener('keydown', (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmLabelEdit(input.value.trim(), node, getPos, editor, labelEl);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      exitEditMode(labelEl, originalLabel);
    }
  });

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (labelEl.contains(input)) {
        exitEditMode(labelEl, originalLabel);
      }
    }, 150);
  });
}

// ─── Tiptap declarations ──────────────────────────────────────────────────────

export interface SectionBlockOptions {
  HTMLAttributes: Record<string, any>;
}

function makeLyricLineNodeJSON() {
  return {
    type: 'lyricLine',
    attrs: {
      id: generateId('line'),
      delivery: 'sung',
      rhymeGroup: null,
      meta: { alternates: [], prosody: null, chords: [] },
    },
    content: [],
  };
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sectionBlock: {
      insertSectionBlock: (options?: {
        id?: string;
        sectionType?: string;
        label?: string;
        summary?: string;
        color?: string;
      }) => ReturnType;
      insertSection: (options: { sectionType: string; customLabel?: string }) => ReturnType;
      insertSectionAfter: (options: { sectionType: string; customLabel?: string }) => ReturnType;
      changeSectionType: (options: { sectionType: string; customLabel?: string }) => ReturnType;
      unwrapSection: () => ReturnType;
    };
  }
}

// ─── Input rule pattern ───────────────────────────────────────────────────────

const sectionInputRulePattern = /^<<$/;

// ─── Node definition ──────────────────────────────────────────────────────────

export const SectionBlock = Node.create<SectionBlockOptions>({
  name: 'sectionBlock',

  group: 'block',

  content: 'lyricLine+',

  defining: true,
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
      sectionType: {
        default: 'verse',
        parseHTML: element => element.getAttribute('data-section-type') || 'verse',
        renderHTML: attributes => ({ 'data-section-type': attributes.sectionType }),
      },
      customLabel: {
        default: '',
        parseHTML: element => element.getAttribute('data-custom-label') || '',
        renderHTML: attributes => ({ 'data-custom-label': attributes.customLabel }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="sectionBlock"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'section-block',
        'data-type': 'sectionBlock',
        'data-section-type': node.attrs.sectionType,
        'data-custom-label': node.attrs.customLabel,
        'data-id': node.attrs.id,
      }),
      0,
    ];
  },

  addNodeView() {
    return ({ node: initialNode, getPos, editor }: NodeViewRendererProps): {
      dom: HTMLDivElement;
      contentDOM: HTMLDivElement;
      update: (updatedNode: any) => boolean;
      stopEvent: (event: Event) => boolean;
      ignoreMutation: (mutation: any) => boolean;
    } => {
      // Mutable reference to track the current node (prevents stale closure)
      let currentNode = initialNode;

      const dom = document.createElement('div');
      dom.classList.add('section-block');
      dom.setAttribute('data-type', 'sectionBlock');
      dom.setAttribute('data-section-type', currentNode.attrs.sectionType);
      dom.setAttribute('data-id', currentNode.attrs.id);

      const label = document.createElement('div');
      label.classList.add('section-label');
      label.setAttribute('contenteditable', 'false');
      label.textContent = getDisplayLabel(currentNode);

      const contentDOM = document.createElement('div');
      contentDOM.classList.add('section-content');

      dom.appendChild(label);
      dom.appendChild(contentDOM);

      label.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        enterEditMode(label, currentNode, getPos as () => number | undefined, editor as Editor);
      });

      label.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = typeof getPos === 'function' ? getPos() : undefined;
        if (pos === undefined) return;
        useSectionMenuStore.getState().open({
          x: e.clientX,
          y: e.clientY,
          sectionPos: pos,
          sectionType: currentNode.attrs.sectionType,
          customLabel: currentNode.attrs.customLabel || '',
        });
      });

      // Auto-enter edit mode for newly created unnamed sections
      if (currentNode.attrs.sectionType === 'custom' && !currentNode.attrs.customLabel) {
        setTimeout(() => {
          enterEditMode(label, currentNode, getPos as () => number | undefined, editor as Editor);
        }, 50);
      }

      return {
        dom,
        contentDOM,
        update(updatedNode: any) {
          if (updatedNode.type.name !== 'sectionBlock') return false;

          // Update the mutable reference to keep closure current
          currentNode = updatedNode;

          dom.setAttribute('data-section-type', updatedNode.attrs.sectionType);
          dom.setAttribute('data-id', updatedNode.attrs.id);
          if (!label.querySelector('input')) {
            label.textContent = getDisplayLabel(updatedNode);
          }
          return true;
        },
        stopEvent(event: Event) {
          return label.contains(event.target as globalThis.Node);
        },
        ignoreMutation(mutation: any) {
          return label.contains(mutation.target as globalThis.Node);
        },
      };
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: sectionInputRulePattern,
        handler: ({ state, range }) => {
          const { tr } = state;

          // Delete the << characters
          tr.delete(range.from, range.to);

          // Find position for section creation
          const $from = tr.doc.resolve(range.from);
          let insideSection = false;
          let sectionDepth = 0;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === 'sectionBlock') {
              insideSection = true;
              sectionDepth = d;
              break;
            }
          }

          const sectionType = state.schema.nodes.sectionBlock;
          const lyricLineType = state.schema.nodes.lyricLine;

          const newLine = lyricLineType.createAndFill({
            id: generateId('line'),
            delivery: 'sung',
            rhymeGroup: null,
            meta: { alternates: [], prosody: null, chords: [] },
          });
          if (!newLine) return;

          // Create section with custom type (empty label triggers edit mode)
          const newSection = sectionType.createAndFill(
            {
              id: generateId('section'),
              sectionType: 'custom',
              customLabel: '',
            },
            newLine
          );
          if (!newSection) return;

          let insertPos: number;
          if (insideSection) {
            insertPos = $from.after(sectionDepth);
            tr.insert(insertPos, newSection);
          } else {
            insertPos = range.from;
            tr.insert(insertPos, newSection);
          }

          // Position cursor in the new section's lyric line
          const cursorPos = insertPos + 2;
          const resolvedPos = tr.doc.resolve(Math.min(cursorPos, tr.doc.content.size - 1));
          tr.setSelection(Selection.near(resolvedPos));

          return tr as any;
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertSectionBlock: (options) => ({ commands }) => {
        const sectionType = options?.sectionType || 'verse';
        const customLabel = options?.label || '';
        return commands.insertContent({
          type: this.name,
          attrs: {
            id: options?.id || generateId('section'),
            sectionType,
            customLabel,
          },
          content: [makeLyricLineNodeJSON()],
        });
      },

      insertSection: (options) => ({ state, commands }) => {
        const { sectionType, customLabel = '' } = options;
        if (isInsideSection(state)) {
          return commands.insertSectionAfter({ sectionType, customLabel });
        }
        return commands.insertContent({
          type: this.name,
          attrs: { id: generateId('section'), sectionType, customLabel },
          content: [makeLyricLineNodeJSON()],
        });
      },

      insertSectionAfter: (options) => ({ state, tr, dispatch, editor }) => {
        const { sectionType, customLabel = '' } = options;
        const parent = findParentSection(state);

        if (!parent) {
          return editor.commands.insertContent({
            type: this.name,
            attrs: { id: generateId('section'), sectionType, customLabel },
            content: [makeLyricLineNodeJSON()],
          });
        }

        const { pos: sectionPos, node: sectionNode } = parent;
        const insertPos = sectionPos + sectionNode.nodeSize;

        const newLine = state.schema.nodes.lyricLine.createAndFill({
          id: generateId('line'),
          delivery: 'sung',
          rhymeGroup: null,
          meta: { alternates: [], prosody: null, chords: [] },
        });
        if (!newLine) return false;

        const newSection = state.schema.nodes.sectionBlock.createAndFill(
          { id: generateId('section'), sectionType, customLabel },
          newLine
        );
        if (!newSection) return false;

        if (dispatch) {
          tr.insert(insertPos, newSection);
          const newSectionStart = tr.mapping.map(insertPos);
          tr.setSelection(Selection.near(tr.doc.resolve(newSectionStart + 2)));
          dispatch(tr.scrollIntoView());
        }
        return true;
      },

      changeSectionType: (options) => ({ state, tr, dispatch }) => {
        const { sectionType, customLabel = '' } = options;
        const parent = findParentSection(state);
        if (!parent) return false;
        if (dispatch) {
          tr.setNodeMarkup(parent.pos, undefined, {
            ...parent.node.attrs,
            sectionType,
            customLabel,
          });
          dispatch(tr);
        }
        return true;
      },

      unwrapSection: () => ({ state, tr, dispatch }) => {
        const parent = findParentSection(state);
        if (!parent) return false;
        const { pos, node } = parent;
        if (dispatch) {
          tr.replaceWith(pos, pos + node.nodeSize, node.content);
          dispatch(tr.scrollIntoView());
        }
        return true;
      },
    };
  },
});
