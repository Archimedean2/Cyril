import { describe, it, expect } from 'vitest';
import { extractDraftPlainText, tokenizeWords, isPhraseUsedInDraft } from '../../../src/domain/tools/draftWordUsage';
import { DraftDocument } from '../../../src/domain/project/types';

/**
 * C-44 / DESIGN_PROPOSAL.md §13.4: the "used" state must be DERIVED from the draft's
 * actual content, never stored — so these are pure-function tests against plain
 * document shapes, with no store involved.
 *
 * Matching rule chosen: case-insensitive, whole-word, punctuation-insensitive. A
 * collected/result word counts as "used" only if it appears as a standalone token in
 * the draft — "low" must NOT match because the draft contains "below" (a substring,
 * not a whole word).
 */
describe('draftWordUsage (C-44)', () => {
  const docWithLyricLine = (text: string): DraftDocument => ({
    type: 'doc',
    content: [
      {
        type: 'sectionBlock',
        attrs: { id: 's1', sectionType: 'verse' },
      },
      {
        type: 'lyricLine',
        attrs: { id: 'l1', rhymeGroup: null, lineType: 'lyric' },
        meta: { alternates: [], prosody: null, chords: [] },
        content: [{ type: 'text', text }],
      } as any,
    ],
  });

  describe('extractDraftPlainText', () => {
    it('T-14.21: walks nested nodes (sectionBlock/concurrentBlock/speakerColumn/lyricLine) to collect all text', () => {
      const doc: DraftDocument = {
        type: 'doc',
        content: [
          {
            type: 'concurrentBlock',
            attrs: { id: 'c1' },
            content: [
              {
                type: 'speakerColumn',
                attrs: { id: 'sc1', speakerName: 'ANNA' },
                content: [
                  {
                    type: 'lyricLine',
                    attrs: { id: 'l1', rhymeGroup: null, lineType: 'lyric' },
                    meta: { alternates: [], prosody: null, chords: [] },
                    content: [{ type: 'text', text: 'the sun is bright' }],
                  } as any,
                ],
              },
            ],
          },
        ],
      };

      const text = extractDraftPlainText(doc);
      expect(text.toLowerCase()).toContain('sun');
      expect(text.toLowerCase()).toContain('bright');
    });

    it('T-14.21: returns empty string for an empty or missing document', () => {
      expect(extractDraftPlainText(null)).toBe('');
      expect(extractDraftPlainText(undefined)).toBe('');
      expect(extractDraftPlainText({ type: 'doc', content: [] })).toBe('');
    });
  });

  describe('tokenizeWords', () => {
    it('T-14.21: lowercases and strips surrounding punctuation', () => {
      expect(tokenizeWords('Hello, world! It\'s "great."')).toEqual(['hello', 'world', 'it\'s', 'great']);
    });
  });

  describe('isPhraseUsedInDraft', () => {
    it('T-14.21: a whole-word match is used', () => {
      const draft = docWithLyricLine('the day is bright');
      const words = tokenizeWords(extractDraftPlainText(draft));
      expect(isPhraseUsedInDraft('day', words)).toBe(true);
    });

    it('T-14.21: is case-insensitive', () => {
      const draft = docWithLyricLine('the DAY is bright');
      const words = tokenizeWords(extractDraftPlainText(draft));
      expect(isPhraseUsedInDraft('Day', words)).toBe(true);
    });

    it('T-14.21: ignores surrounding punctuation in the draft text', () => {
      const draft = docWithLyricLine('day, oh day! it\'s here.');
      const words = tokenizeWords(extractDraftPlainText(draft));
      expect(isPhraseUsedInDraft('day', words)).toBe(true);
      expect(isPhraseUsedInDraft("it's", words)).toBe(true);
    });

    it('T-14.21: "low" is NOT used merely because the draft contains "below" (substring, not whole word)', () => {
      const draft = docWithLyricLine('the stars are below the moon');
      const words = tokenizeWords(extractDraftPlainText(draft));
      expect(isPhraseUsedInDraft('low', words)).toBe(false);
    });

    it('T-14.21: a multi-word phrase must appear as a contiguous run of whole words', () => {
      const draft = docWithLyricLine('the milky way at night');
      const words = tokenizeWords(extractDraftPlainText(draft));
      expect(isPhraseUsedInDraft('milky way', words)).toBe(true);
      expect(isPhraseUsedInDraft('way milky', words)).toBe(false);
      expect(isPhraseUsedInDraft('milky night', words)).toBe(false);
    });

    it('T-14.21: an empty draft never marks anything as used', () => {
      const words = tokenizeWords(extractDraftPlainText({ type: 'doc', content: [] }));
      expect(isPhraseUsedInDraft('day', words)).toBe(false);
    });

    it('T-14.21: an empty phrase is never "used"', () => {
      const draft = docWithLyricLine('day after day');
      const words = tokenizeWords(extractDraftPlainText(draft));
      expect(isPhraseUsedInDraft('', words)).toBe(false);
      expect(isPhraseUsedInDraft('   ', words)).toBe(false);
    });
  });
});
