import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Prosemirror/Tiptap relies on DOM methods that JSDOM doesn't implement.
// We must mock them so the editor doesn't crash during integration tests.
if (typeof window !== 'undefined') {
  if (!document.createRange) {
    document.createRange = () => ({
      setStart: () => {},
      setEnd: () => {},
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
      },
      getClientRects: () => [],
      getBoundingClientRect: () => ({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      }),
    } as any);
  }

  if (!window.getSelection) {
    window.getSelection = () => ({
      removeAllRanges: () => {},
      addRange: () => {},
    } as any);
  }
  
  if (typeof Document !== 'undefined' && !Document.prototype.elementFromPoint) {
    Document.prototype.elementFromPoint = () => null;
  }
  
  // Provide mock for Node getClientRects (which covers Elements, Text nodes, etc in some environments)
  if (typeof Node !== 'undefined') {
    (Node.prototype as any).getClientRects = function() {
      return [] as unknown as DOMRectList;
    };
    (Node.prototype as any).getBoundingClientRect = function() {
      return {
        width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {}
      };
    };
  }

  // Mock getClientRects and getBoundingClientRect which are used heavily by Prosemirror
  if (typeof Element !== 'undefined') {
    Element.prototype.getClientRects = function() {
      return [] as unknown as DOMRectList;
    };
    Element.prototype.getBoundingClientRect = function() {
      return {
        width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {}
      };
    };
  }
  
  // Provide mock for TextNode getClientRects specifically
  if (typeof Text !== 'undefined') {
    (Text.prototype as any).getClientRects = function() {
      return [] as unknown as DOMRectList;
    };
    (Text.prototype as any).getBoundingClientRect = function() {
      return {
        width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {}
      };
    };
  }

  if (typeof Range !== 'undefined') {
    Range.prototype.getClientRects = function() {
      return [] as unknown as DOMRectList;
    };
    Range.prototype.getBoundingClientRect = function() {
      return {
        width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => {}
      };
    };
  }
}
