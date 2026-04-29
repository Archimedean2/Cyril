import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Editor } from '@tiptap/core';
import {
  addChordToCurrentLine,
  editChordOnCurrentLine,
  moveChordOnCurrentLine,
  removeChordFromCurrentLine,
  getChordsForCurrentLine,
  isInLyricLine,
} from '../../../src/domain/editor/chord-commands';
import { ChordMarker } from '../../../src/domain/project/types';

// Mock the id generator
vi.mock('../../../src/domain/project/ids', () => ({
  generateId: vi.fn().mockReturnValue('chord_test_123'),
}));

describe('Chord Commands', () => {
  let mockEditor: Editor;
  let mockState: any;
  let mockChain: any;
  let mockDoc: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock chain
    mockChain = {
      updateAttributes: vi.fn().mockReturnThis(),
      run: vi.fn().mockReturnValue(true),
    };

    // Setup mock doc
    mockDoc = {
      nodesBetween: vi.fn(),
      descendants: vi.fn(),
      textBetween: vi.fn().mockReturnValue('Current line text content'),
    };

    // Setup mock state
    mockState = {
      doc: mockDoc,
      selection: { from: 10, to: 15 },
    };

    // Setup mock editor
    mockEditor = {
      state: mockState,
      chain: vi.fn().mockReturnValue(mockChain),
    } as unknown as Editor;
  });

  describe('U-9.01: Add chord marker works', () => {
    test('addChordToCurrentLine creates a new chord with specified symbol', () => {
      // Setup: LyricLine node found at position
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = addChordToCurrentLine(mockEditor, 'Am');

      expect(result).toBe(true);
      expect(mockChain.updateAttributes).toHaveBeenCalledWith('lyricLine', {
        meta: expect.objectContaining({
          chords: expect.arrayContaining([
            expect.objectContaining({
              id: 'chord_test_123',
              symbol: 'Am',
              position: expect.objectContaining({
                anchorType: 'char',
                bias: 'on',
              }),
            }),
          ]),
          alternates: [],
          prosody: null,
        }),
      });
    });

    test('addChordToCurrentLine returns false when not in a lyric line', () => {
      // Setup: No lyric line found
      mockDoc.nodesBetween.mockImplementation(() => {
        return true; // Continue traversing, no lyricLine found
      });

      const result = addChordToCurrentLine(mockEditor, 'C');

      expect(result).toBe(false);
      expect(mockChain.updateAttributes).not.toHaveBeenCalled();
    });
  });

  describe('U-9.02: Chord marker position is stored correctly', () => {
    test('addChordToCurrentLine stores position at current caret offset', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [],
            alternates: [],
            prosody: null,
          },
        },
      };

      // Caret at position 12 (relative to line start at pos 5, so offset = 12 - 5 - 1 = 6)
      mockState.selection = { from: 12, to: 12 };
      mockDoc.textBetween.mockReturnValue('Current line text content');

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      addChordToCurrentLine(mockEditor, 'G');

      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords).toHaveLength(1);
      expect(chords[0].position.charOffset).toBe(6); // 12 - 5 - 1
    });

    test('addChordToCurrentLine clamps offset to valid range when beyond text length', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 20,
        attrs: {
          meta: {
            chords: [],
            alternates: [],
            prosody: null,
          },
        },
      };

      // Caret at position 50 (way beyond line length of ~25 chars)
      mockState.selection = { from: 50, to: 50 };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      addChordToCurrentLine(mockEditor, 'D');

      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      const textLength = 'Current line text content'.length;
      expect(chords[0].position.charOffset).toBeLessThanOrEqual(textLength);
      expect(chords[0].position.charOffset).toBeGreaterThanOrEqual(0);
    });

    test('addChordToCurrentLine uses provided explicit offset', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      addChordToCurrentLine(mockEditor, 'F', 15, 'before');

      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords[0].position.charOffset).toBe(15);
      expect(chords[0].position.bias).toBe('before');
    });
  });

  describe('U-9.03: Moving chord marker updates position correctly', () => {
    test('moveChordOnCurrentLine increments offset when moving right', () => {
      const existingChord: ChordMarker = {
        id: 'existing_chord_1',
        symbol: 'Am',
        position: { anchorType: 'char', charOffset: 5, bias: 'on' },
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [existingChord],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = moveChordOnCurrentLine(mockEditor, 'existing_chord_1', 1);

      expect(result).toBe(true);
      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords[0].position.charOffset).toBe(6);
    });

    test('moveChordOnCurrentLine decrements offset when moving left', () => {
      const existingChord: ChordMarker = {
        id: 'existing_chord_1',
        symbol: 'Am',
        position: { anchorType: 'char', charOffset: 10, bias: 'on' },
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [existingChord],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      moveChordOnCurrentLine(mockEditor, 'existing_chord_1', -1);

      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords[0].position.charOffset).toBe(9);
    });

    test('moveChordOnCurrentLine clamps offset to zero when moving left beyond start', () => {
      const existingChord: ChordMarker = {
        id: 'existing_chord_1',
        symbol: 'Am',
        position: { anchorType: 'char', charOffset: 0, bias: 'on' },
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [existingChord],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      moveChordOnCurrentLine(mockEditor, 'existing_chord_1', -1);

      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords[0].position.charOffset).toBe(0);
    });

    test('moveChordOnCurrentLine clamps offset to max when moving right beyond length', () => {
      const existingChord: ChordMarker = {
        id: 'existing_chord_1',
        symbol: 'Am',
        position: { anchorType: 'char', charOffset: 25, bias: 'on' },
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [existingChord],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      moveChordOnCurrentLine(mockEditor, 'existing_chord_1', 10);

      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      const textLength = 'Current line text content'.length;
      expect(chords[0].position.charOffset).toBe(textLength);
    });
  });

  describe('U-9.04: Edit chord symbol updates only the target marker', () => {
    test('editChordOnCurrentLine updates only the specified chord', () => {
      const chord1: ChordMarker = {
        id: 'chord_1',
        symbol: 'Am',
        position: { anchorType: 'char', charOffset: 5, bias: 'on' },
      };
      const chord2: ChordMarker = {
        id: 'chord_2',
        symbol: 'C',
        position: { anchorType: 'char', charOffset: 10, bias: 'on' },
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [chord1, chord2],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = editChordOnCurrentLine(mockEditor, 'chord_1', 'Em');

      expect(result).toBe(true);
      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords).toHaveLength(2);
      expect(chords[0].symbol).toBe('Em');
      expect(chords[1].symbol).toBe('C');
    });

    test('editChordOnCurrentLine returns false when chord not found', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = editChordOnCurrentLine(mockEditor, 'nonexistent_id', 'G');

      expect(result).toBe(false);
    });
  });

  describe('U-9.05: Remove chord deletes only the target marker', () => {
    test('removeChordFromCurrentLine removes only the specified chord', () => {
      const chord1: ChordMarker = {
        id: 'chord_1',
        symbol: 'Am',
        position: { anchorType: 'char', charOffset: 5, bias: 'on' },
      };
      const chord2: ChordMarker = {
        id: 'chord_2',
        symbol: 'C',
        position: { anchorType: 'char', charOffset: 10, bias: 'on' },
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [chord1, chord2],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = removeChordFromCurrentLine(mockEditor, 'chord_1');

      expect(result).toBe(true);
      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords).toHaveLength(1);
      expect(chords[0].id).toBe('chord_2');
    });

    test('removeChordFromCurrentLine returns false when not in lyric line', () => {
      mockDoc.nodesBetween.mockImplementation(() => true);

      const result = removeChordFromCurrentLine(mockEditor, 'chord_1');

      expect(result).toBe(false);
    });
  });

  describe('U-9.06: Safe failure outside lyric line', () => {
    test('addChordToCurrentLine returns false when selection outside lyric line', () => {
      // Simulate no lyric line being found
      mockDoc.nodesBetween.mockImplementation(() => true);

      const result = addChordToCurrentLine(mockEditor, 'C');

      expect(result).toBe(false);
      expect(mockChain.updateAttributes).not.toHaveBeenCalled();
    });

    test('getChordsForCurrentLine returns empty array outside lyric line', () => {
      mockDoc.nodesBetween.mockImplementation(() => true);

      const result = getChordsForCurrentLine(mockEditor);

      expect(result).toEqual([]);
    });

    test('isInLyricLine returns false outside lyric line', () => {
      mockDoc.nodesBetween.mockImplementation(() => true);

      const result = isInLyricLine(mockEditor);

      expect(result).toBe(false);
    });

    test('isInLyricLine returns true when in lyric line', () => {
      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        attrs: {
          meta: { chords: [], alternates: [], prosody: null },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      const result = isInLyricLine(mockEditor);

      expect(result).toBe(true);
    });
  });

  describe('Chord ordering', () => {
    test('addChordToCurrentLine sorts chords by position', () => {
      const existingChord: ChordMarker = {
        id: 'existing_chord',
        symbol: 'C',
        position: { anchorType: 'char', charOffset: 20, bias: 'on' },
      };

      const mockLyricLineNode = {
        type: { name: 'lyricLine' },
        nodeSize: 30,
        attrs: {
          meta: {
            chords: [existingChord],
            alternates: [],
            prosody: null,
          },
        },
      };

      mockDoc.nodesBetween.mockImplementation((_from: number, _to: number, callback: (node: any, pos: number) => boolean) => {
        callback(mockLyricLineNode, 5);
        return false;
      });

      // Add a chord at position 5 (which should come before position 20)
      addChordToCurrentLine(mockEditor, 'Am', 5);

      const updateCall = mockChain.updateAttributes.mock.calls[0];
      const chords = updateCall[1].meta.chords;
      expect(chords).toHaveLength(2);
      expect(chords[0].position.charOffset).toBeLessThan(chords[1].position.charOffset);
    });
  });
});
