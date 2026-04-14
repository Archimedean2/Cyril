import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Editor } from '@tiptap/core';
import {
  addAlternate,
  activateAlternate,
  updateAlternate,
  removeAlternate,
  getAlternates,
  isInLyricLine,
  createAlternateLine,
  extractTextFromDoc,
} from '../../../src/domain/editor/alternates-commands';
import { AlternateLine } from '../../../src/domain/project/types';

// Mock the id generator
vi.mock('../../../src/domain/project/ids', () => ({
  generateId: vi.fn().mockReturnValue('alt_test_123'),
}));

describe('Alternates Commands', () => {
  let mockEditor: Editor;
  let mockState: any;
  let mockChain: any;
  let mockDoc: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain
    mockChain = {
      updateAttributes: vi.fn().mockReturnThis(),
      command: vi.fn().mockReturnThis(),
      run: vi.fn().mockReturnValue(true),
    };

    // Setup mock doc
    mockDoc = {
      nodesBetween: vi.fn(),
      textBetween: vi.fn().mockReturnValue('Current line text'),
    };

    // Setup mock state
    mockState = {
      doc: mockDoc,
      selection: { from: 10, to: 15 },
      tr: { replaceWith: vi.fn().mockReturnThis() },
      schema: { text: vi.fn().mockReturnValue({}) },
    };

    // Setup mock editor
    mockEditor = {
      state: mockState,
      chain: vi.fn().mockReturnValue(mockChain),
    } as unknown as Editor;
  });

  describe('T-8.01: Add alternate to lyric line', () => {
    test('addAlternate creates a new alternate with current content', () => {
      // Setup: LyricLine node found at position
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 20,
        attrs: {
          meta: {
            alternates: [],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = addAlternate(mockEditor);

      expect(result).toBe(true);
      expect(mockChain.updateAttributes).toHaveBeenCalledWith('lyricLine', {
        meta: {
          alternates: expect.arrayContaining([
            expect.objectContaining({
              id: 'alt_test_123',
              isActive: false,
              label: 'Alt 1',
            }),
          ]),
        },
      });
    });

    test('addAlternate returns false when not in lyric line', () => {
      mockDoc.nodesBetween.mockImplementation(() => true);

      const result = addAlternate(mockEditor);

      expect(result).toBe(false);
    });

    test('addAlternate with custom text and label', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 20,
        attrs: {
          meta: {
            alternates: [],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = addAlternate(mockEditor, 'Custom alternate text', 'My Label');

      expect(result).toBe(true);
      expect(mockChain.updateAttributes).toHaveBeenCalledWith(
        'lyricLine',
        expect.objectContaining({
          meta: expect.objectContaining({
            alternates: expect.arrayContaining([
              expect.objectContaining({
                label: 'My Label',
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('T-8.02: Activating alternate updates active line content', () => {
    test('activateAlternate swaps content and marks alternate active', () => {
      const existingAlternate: AlternateLine = {
        id: 'alt_existing',
        label: 'Alternate 1',
        doc: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alternate text' }] }],
        },
        isActive: false,
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 25,
        attrs: {
          meta: {
            alternates: [existingAlternate],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = activateAlternate(mockEditor, 'alt_existing');

      expect(result).toBe(true);
      
      // Check that the alternate was marked active
      const updateCall = mockChain.updateAttributes.mock.calls[0];
      expect(updateCall[1].meta.alternates[0].isActive).toBe(true);
    });

    test('activateAlternate returns false when alternate not found', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 20,
        attrs: {
          meta: {
            alternates: [],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = activateAlternate(mockEditor, 'nonexistent_id');

      expect(result).toBe(false);
    });
  });

  describe('T-8.03: Removing alternate preserves active content', () => {
    test('removeAlternate filters out the specified alternate', () => {
      const alternate1: AlternateLine = {
        id: 'alt_1',
        label: 'First',
        doc: { type: 'doc', content: [] },
        isActive: false,
      };
      const alternate2: AlternateLine = {
        id: 'alt_2',
        label: 'Second',
        doc: { type: 'doc', content: [] },
        isActive: true,
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        attrs: {
          meta: {
            alternates: [alternate1, alternate2],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = removeAlternate(mockEditor, 'alt_1');

      expect(result).toBe(true);
      
      const updateCall = mockChain.updateAttributes.mock.calls[0];
      expect(updateCall[1].meta.alternates).toHaveLength(1);
      expect(updateCall[1].meta.alternates[0].id).toBe('alt_2');
    });

    test('removeAlternate preserves main content even if removing active alternate', () => {
      // The main content is separate from alternates, so removing an alternate
      // should not affect what's displayed
      const activeAlternate: AlternateLine = {
        id: 'alt_active',
        label: 'Active Alt',
        doc: { type: 'doc', content: [] },
        isActive: true,
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        attrs: {
          meta: {
            alternates: [activeAlternate],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = removeAlternate(mockEditor, 'alt_active');

      expect(result).toBe(true);
      
      // Verify the alternate list is now empty
      const updateCall = mockChain.updateAttributes.mock.calls[0];
      expect(updateCall[1].meta.alternates).toHaveLength(0);
    });
  });

  describe('Helper functions', () => {
    test('createAlternateLine creates alternate with correct structure', () => {
      const alternate = createAlternateLine('Test text', 'Test Label');

      expect(alternate.id).toBeDefined();
      expect(alternate.label).toBe('Test Label');
      expect(alternate.isActive).toBe(false);
      expect(alternate.doc.type).toBe('doc');
      expect(alternate.doc.content).toHaveLength(1);
    });

    test('extractTextFromDoc extracts text from RichTextDocument', () => {
      const doc = {
        type: 'doc' as const,
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'world' },
            ],
          },
        ],
      };

      const text = extractTextFromDoc(doc);

      expect(text).toBe('Hello world');
    });

    test('getAlternates returns alternates for current line', () => {
      const mockAlternate = {
        id: 'alt_1',
        label: 'Test',
        doc: { type: 'doc' as const, content: [] },
        isActive: false,
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        attrs: {
          meta: {
            alternates: [mockAlternate],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const alternates = getAlternates(mockEditor);

      expect(alternates).toHaveLength(1);
      expect(alternates[0].id).toBe('alt_1');
    });

    test('isInLyricLine returns true when in lyric line', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        attrs: { meta: { alternates: [] } },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      expect(isInLyricLine(mockEditor)).toBe(true);
    });

    test('isInLyricLine returns false when not in lyric line', () => {
      mockDoc.nodesBetween.mockImplementation(() => true);

      expect(isInLyricLine(mockEditor)).toBe(false);
    });
  });

  describe('T-8.02: updateAlternate updates alternate text', () => {
    test('updateAlternate modifies text and label', () => {
      const existingAlternate: AlternateLine = {
        id: 'alt_existing',
        label: 'Old Label',
        doc: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Old text' }] }],
        },
        isActive: false,
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        attrs: {
          meta: {
            alternates: [existingAlternate],
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = updateAlternate(mockEditor, 'alt_existing', 'New text', 'New Label');

      expect(result).toBe(true);
      
      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const updatedAlternates = updateCall[1].meta.alternates;
      expect(updatedAlternates[0].label).toBe('New Label');
    });
  });
});
