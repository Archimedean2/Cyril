import { RhymeFilter } from '../../domain/tools/rhymeFilter';

interface ToolsFilterChipsProps {
  active: RhymeFilter;
  onChange: (filter: RhymeFilter) => void;
}

const FILTERS: { value: RhymeFilter; label: string }[] = [
  { value: 'perfect', label: 'Perfect' },
  { value: 'close', label: 'Close' },
  { value: 'wide', label: 'Wide' },
];

/** Perfect / Close / Wide rhyme filter chips (DESIGN_PROPOSAL.md §6). */
export function ToolsFilterChips({ active, onChange }: ToolsFilterChipsProps) {
  return (
    <div className="tools-filter-chips" role="group" aria-label="Rhyme filter" data-testid="tools-filter-chips">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`tools-filter-chip ${active === value ? 'active' : ''}`}
          aria-pressed={active === value}
          onClick={() => onChange(value)}
          data-testid={`tools-filter-chip-${value}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
