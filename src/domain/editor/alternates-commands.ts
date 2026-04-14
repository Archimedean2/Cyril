/**
 * Alternate lyrics commands for Tiptap editor.
 * 
 * Provides commands to add, activate, update, and remove alternate
 * lyric versions for a line.
 */

import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { AlternateLine, RichTextDocument, LyricLineNode, LyricLineMeta } from '../project/types';
import { generateId } from '../project/ids';

interface LyricLineInfo {
  node: ProseMirrorNode;
  pos: number;
  attrs: LyricLineNode;
  meta: LyricLineMeta;
}

/**
 * Get the lyric line node at the current selection.
 */
export function getLyricLineAtSelection(editor: Editor): LyricLineInfo | null {
  const { state } = editor;
  const { selection } = state;
  
  let result: LyricLineInfo | null = null;
  
  state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
    if (node.type.name === 'lyricLine') {
      const attrs = node.attrs as unknown as LyricLineNode;
      result = {
        node,
        pos,
        attrs,
        meta: attrs.meta,
      };
      return false; // Stop traversing
    }
    return true;
  });
  
  return result;
}

/**
 * Create a new alternate line with the given text.
 */
export function createAlternateLine(
  text: string,
  label?: string,
  isActive: boolean = false
): AlternateLine {
  const doc: RichTextDocument = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : []
      }
    ]
  };
  
  return {
    id: generateId('alt'),
    label,
    doc,
    isActive,
  };
}

/**
 * Extract plain text from a RichTextDocument.
 */
export function extractTextFromDoc(doc: RichTextDocument): string {
  if (!doc.content || doc.content.length === 0) return '';
  
  return doc.content
    .map(node => {
      if (node.type === 'paragraph' && node.content) {
        return node.content
          .map(child => child.text || '')
          .join('');
      }
      return '';
    })
    .join('\n');
}

/**
 * Command: Add a new alternate to the current lyric line.
 * 
 * The current line content becomes an alternate, and the user can
 * edit a new version.
 */
export function addAlternate(
  editor: Editor,
  alternateText?: string,
  label?: string
): boolean {
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { node, pos, meta } = lineInfo;
  
  // Get current line content as text
  const currentText = editor.state.doc.textBetween(
    pos + 1, // +1 to skip past the node start
    pos + node.nodeSize - 1, // -1 to stop before node end
    '\n'
  );
  
  // Create a new alternate from the current content
  const newAlternate = createAlternateLine(
    alternateText || currentText,
    label || `Alt ${(meta.alternates.length + 1)}`
  );
  
  // Add the alternate to the line's meta
  const updatedAlternates = [...meta.alternates, newAlternate];
  
  return editor
    .chain()
    .updateAttributes('lyricLine', {
      meta: {
        ...meta,
        alternates: updatedAlternates,
      }
    })
    .run();
}

/**
 * Command: Activate an alternate (make it the active line content).
 * 
 * This swaps the current line content with the alternate content.
 * The previous content is saved as a non-active alternate.
 */
export function activateAlternate(
  editor: Editor,
  alternateId: string
): boolean {
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { node, pos, meta } = lineInfo;
  
  // Find the alternate to activate
  const alternateIndex = meta.alternates.findIndex(
    alt => alt.id === alternateId
  );
  
  if (alternateIndex === -1) return false;
  
  const alternate = meta.alternates[alternateIndex];
  const alternateText = extractTextFromDoc(alternate.doc);
  
  // Get current content as text to save as an alternate
  const currentText = editor.state.doc.textBetween(
    pos + 1,
    pos + node.nodeSize - 1,
    '\n'
  );
  
  // Create a new alternate from current content if it differs
  const updatedAlternates = meta.alternates.map((alt, idx) => {
    if (idx === alternateIndex) {
      // Mark the target as active
      return { ...alt, isActive: true };
    }
    // Mark all others as inactive
    return { ...alt, isActive: false };
  });
  
  // Check if current content is already in alternates
  const currentExists = updatedAlternates.some(
    alt => extractTextFromDoc(alt.doc) === currentText
  );
  
  // If current content isn't saved, add it as a non-active alternate
  if (!currentExists && currentText !== alternateText) {
    const currentAlternate = createAlternateLine(
      currentText,
      'Previous',
      false
    );
    updatedAlternates.push(currentAlternate);
  }
  
  // Update the line with the alternate content and updated alternates
  return editor
    .chain()
    .updateAttributes('lyricLine', {
      meta: {
        ...meta,
        alternates: updatedAlternates,
      }
    })
    // Replace the content with the alternate text
    .command(({ state, dispatch }) => {
      if (!dispatch) return false;
      
      const lineStart = pos + 1;
      const lineEnd = pos + node.nodeSize - 1;
      
      // Create new content from the alternate
      const newContent = state.schema.text(alternateText);
      
      // Replace the content
      const tr = state.tr.replaceWith(lineStart, lineEnd, newContent);
      dispatch(tr);
      
      return true;
    })
    .run();
}

/**
 * Command: Update an alternate's text.
 */
export function updateAlternate(
  editor: Editor,
  alternateId: string,
  newText: string,
  newLabel?: string
): boolean {
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { meta } = lineInfo;
  
  const alternateIndex = meta.alternates.findIndex(
    alt => alt.id === alternateId
  );
  
  if (alternateIndex === -1) return false;
  
  const updatedAlternates = meta.alternates.map((alt, idx) => {
    if (idx === alternateIndex) {
      const updatedDoc: RichTextDocument = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: newText ? [{ type: 'text', text: newText }] : []
          }
        ]
      };
      
      return {
        ...alt,
        doc: updatedDoc,
        label: newLabel !== undefined ? newLabel : alt.label,
      };
    }
    return alt;
  });
  
  return editor
    .chain()
    .updateAttributes('lyricLine', {
      meta: {
        ...meta,
        alternates: updatedAlternates,
      }
    })
    .run();
}

/**
 * Command: Remove an alternate.
 * 
 * If removing the active alternate, the main line content is preserved.
 */
export function removeAlternate(
  editor: Editor,
  alternateId: string
): boolean {
  const lineInfo = getLyricLineAtSelection(editor);
  if (!lineInfo) return false;
  
  const { meta } = lineInfo;
  
  const updatedAlternates = meta.alternates.filter(
    alt => alt.id !== alternateId
  );
  
  return editor
    .chain()
    .updateAttributes('lyricLine', {
      meta: {
        ...meta,
        alternates: updatedAlternates,
      }
    })
    .run();
}

/**
 * Get all alternates for the current lyric line.
 */
export function getAlternates(editor: Editor): AlternateLine[] {
  const lineInfo = getLyricLineAtSelection(editor);
  return lineInfo?.meta.alternates || [];
}

/**
 * Check if the current selection is in a lyric line.
 */
export function isInLyricLine(editor: Editor): boolean {
  return getLyricLineAtSelection(editor) !== null;
}

/**
 * Get the position of the lyric line node at the current selection.
 * @deprecated Use getLyricLineAtSelection instead
 */
export function getLyricLinePosition(editor: Editor): number | null {
  const info = getLyricLineAtSelection(editor);
  return info?.pos ?? null;
}
