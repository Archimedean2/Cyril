import { ToolResult } from './types';

/**
 * C-50 — narrowing a rhyme result set to one syllable count
 * (`docs/product/MASTERWRITER_PLAN.md` §Phase 0).
 *
 * Lives beside `rhymeFilter.ts` because it is the same kind of thing: a pure rule over a
 * result set, with no React in it, so it can be tested directly and reused by whatever
 * renders the results next (C-51's phonetic tiers will reuse it unchanged).
 */
/** The distinct syllable counts present in a result set, ascending. Results with no
 * syllable data (the provider does not always supply it) offer no count to filter on. */
export function availableSyllableCounts(results: ToolResult[]): number[] {
  const counts = new Set<number>();
  for (const result of results) {
    if (typeof result.numSyllables === 'number' && result.numSyllables > 0) {
      counts.add(result.numSyllables);
    }
  }
  return [...counts].sort((a, b) => a - b);
}

/**
 * Narrow a result set to one syllable count. `null` means "all" and returns the set
 * untouched. A count that nothing in the set has returns the set untouched too, rather than
 * an empty list: a filter that cannot apply should not silently empty the rail.
 */
export function applySyllableFilter(results: ToolResult[], syllables: number | null): ToolResult[] {
  if (syllables === null) return results;
  const matching = results.filter((r) => r.numSyllables === syllables);
  return matching.length > 0 ? matching : results;
}
