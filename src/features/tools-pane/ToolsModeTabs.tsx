import { ToolMode } from '../../domain/tools/types';

interface ToolsModeTabsProps {
  activeMode: ToolMode;
  onModeChange: (mode: ToolMode) => void;
}

const MODES: { value: ToolMode; label: string }[] = [
  { value: 'rhyme-exact', label: 'Rhyme' },
  { value: 'rhyme-near', label: 'Near' },
  { value: 'thesaurus', label: 'Thesaurus' },
  { value: 'dictionary', label: 'Dict' },
  { value: 'related', label: 'Related' },
];

export function ToolsModeTabs({ activeMode, onModeChange }: ToolsModeTabsProps) {
  return (
    <div className="tools-mode-tabs" role="tablist" aria-label="Tool modes">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          role="tab"
          aria-selected={activeMode === value}
          className={`tools-tab ${activeMode === value ? 'active' : ''}`}
          onClick={() => onModeChange(value)}
          data-testid={`tools-tab-${value}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
