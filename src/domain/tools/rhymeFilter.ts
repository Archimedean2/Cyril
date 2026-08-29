import { ToolMode, ToolResult } from './types';

/**
 * Rhyme filter chips shown in the Tools pane (DESIGN_PROPOSAL.md §6): Perfect / Close / Wide.
 *
 * These are wired to the *existing* rhyme modes/provider rather than inventing a new
 * ToolMode or provider call:
 * - "Perfect" queries the existing 'rhyme-exact' mode as-is.
 * - "Close" and "Wide" both query the existing 'rhyme-near' mode; "Close" narrows the
 *   near-rhyme result set to its higher-scoring (closer) subset client-side, "Wide"
 *   shows the full near-rhyme set.
 */
export type RhymeFilter = 'perfect' | 'close' | 'wide';

/** Which underlying ToolMode a rhyme filter chip should query. */
export function rhymeFilterToMode(filter: RhymeFilter): ToolMode {
  return filter === 'perfect' ? 'rhyme-exact' : 'rhyme-near';
}

/**
 * Narrow a near-rhyme result set for the "Close" filter: keep the higher-scoring
 * ~40% of results (by Datamuse relevance score). "Wide" and "Perfect" pass results
 * through unchanged.
 */
export function applyRhymeFilter(results: ToolResult[], filter: RhymeFilter): ToolResult[] {
  if (filter !== 'close') return results;

  const scores = results.map(r => r.score ?? 0).filter(s => s > 0);
  if (scores.length === 0) return results;

  const sorted = scores.slice().sort((a, b) => b - a);
  const threshold = sorted[Math.floor(sorted.length * 0.4)] ?? 0;

  return results.filter(r => (r.score ?? 0) >= threshold);
}
