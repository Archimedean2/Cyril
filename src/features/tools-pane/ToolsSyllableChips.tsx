import { ToolResult } from '../../domain/tools/types';
import { availableSyllableCounts } from '../../domain/tools/syllableFilter';

interface ToolsSyllableChipsProps {
  /** The unfiltered result set — the chips offer only counts that actually occur in it. */
  results: ToolResult[];
  /** The active syllable count, or `null` for "all". */
  active: number | null;
  onChange: (syllables: number | null) => void;
}

/**
 * C-50 — narrow rhyme results to a single syllable count
 * (`docs/product/MASTERWRITER_PLAN.md` §Phase 0).
 *
 * A lyricist writing to a melody needs a word of a particular length far more often than a
 * word of a particular relevance: the line has a shape and the syllable count is that shape.
 * The rhyme list already groups by count (`RhymeResultsList`), so this is narrowing, not
 * reordering — the groups stay exactly where they were, the others are hidden.
 *
 * The chips offer only counts present in the current results, so the writer is never invited
 * to filter a list down to nothing.
 */
export function ToolsSyllableChips({ results, active, onChange }: ToolsSyllableChipsProps) {
  const counts = availableSyllableCounts(results);
  // With one count (or none), filtering by it is a no-op — don't show a control that does nothing.
  if (counts.length < 2) return null;

  return (
    <div
      className="tools-syllable-chips"
      role="group"
      aria-label="Filter by syllable count"
      data-testid="tools-syllable-chips"
    >
      <button
        type="button"
        className={`tools-filter-chip ${active === null ? 'active' : ''}`}
        aria-pressed={active === null}
        onClick={() => onChange(null)}
        data-testid="tools-syllable-chip-all"
      >
        All
      </button>
      {counts.map((count) => (
        <button
          key={count}
          type="button"
          className={`tools-filter-chip ${active === count ? 'active' : ''}`}
          aria-pressed={active === count}
          // Clicking the active chip clears it — the same gesture both ways, so the writer
          // never has to hunt for "All" to undo a narrowing they just made.
          onClick={() => onChange(active === count ? null : count)}
          data-testid={`tools-syllable-chip-${count}`}
          aria-label={`${count}-syllable words`}
        >
          {count}
        </button>
      ))}
    </div>
  );
}
