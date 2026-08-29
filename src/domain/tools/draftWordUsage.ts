import { DraftDocument, RichTextDocument, RichTextNode } from '../project/types';

/**
 * C-44 / DESIGN_PROPOSAL.md §13.4: "the shopping-list mechanic — dim what you have
 * used". A collected word (Inventory chip) or tool result whose text appears in the
 * active draft renders in a "used" state. This must be DERIVED from the draft's live
 * content on every render, never stored — a stored flag would go stale the moment the
 * writer edits a line.
 *
 * Matching rule: case-insensitive, whole-word, ignoring surrounding punctuation. A
 * word only counts as "used" if it appears as its own token — "low" is NOT used
 * merely because the draft contains "below" (below is not the same token as low, it
 * just happens to contain "low" as a substring). A multi-word phrase (an Inventory
 * item can be a whole line, e.g. "milky way") must appear as a contiguous run of
 * whole-word tokens, in order, for the same reason.
 */

/** Recursively collect every text leaf under a draft/rich-text node tree. Walks every
 * node type uniformly (sectionBlock, concurrentBlock, speakerColumn, lyricLine, plain
 * paragraph, etc.) since the draft schema nests lyric content several levels deep. */
function collectText(nodes: RichTextNode[] | undefined, out: string[]): void {
  if (!nodes) return;
  for (const node of nodes) {
    if (typeof node.text === 'string' && node.text.length > 0) out.push(node.text);
    if (node.content) collectText(node.content as RichTextNode[], out);
  }
}

/** Flatten a draft (or any rich-text) document into plain text, space-joined. */
export function extractDraftPlainText(doc: DraftDocument | RichTextDocument | null | undefined): string {
  if (!doc || !doc.content) return '';
  const out: string[] = [];
  collectText(doc.content as RichTextNode[], out);
  return out.join(' ');
}

// Unicode-aware "word" token: letters/digits plus internal apostrophes (so "it's"
// stays one token) — everything else (commas, periods, quotes, em dashes, ...) is a
// separator. Case folding happens here too, so callers never have to remember it.
const WORD_TOKEN_RE = /[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu;

/** Split text into lowercase word tokens, stripping punctuation. */
export function tokenizeWords(text: string): string[] {
  return text.toLowerCase().match(WORD_TOKEN_RE) ?? [];
}

/**
 * Whether `phrase` (a single word or a multi-word line) appears as a contiguous run
 * of whole-word tokens somewhere in `draftWords` (the already-tokenized draft text).
 * Case-insensitivity and punctuation-stripping are handled by `tokenizeWords` on both
 * sides — this just does the whole-word containment check.
 */
export function isPhraseUsedInDraft(phrase: string, draftWords: string[]): boolean {
  const target = tokenizeWords(phrase);
  if (target.length === 0) return false;

  for (let start = 0; start + target.length <= draftWords.length; start++) {
    let matched = true;
    for (let i = 0; i < target.length; i++) {
      if (draftWords[start + i] !== target[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}
