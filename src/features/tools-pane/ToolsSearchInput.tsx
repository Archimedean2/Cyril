import { useState, useCallback } from 'react';

interface ToolsSearchInputProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  onPopulateFromSelection?: () => string | null;
  placeholder?: string;
}

export function ToolsSearchInput({
  searchTerm,
  onSearch,
  onPopulateFromSelection,
  placeholder = 'Enter a word...',
}: ToolsSearchInputProps) {
  const [inputValue, setInputValue] = useState(searchTerm);

  // Sync with external searchTerm
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handlePopulateFromSelection = useCallback(() => {
    if (onPopulateFromSelection) {
      const selected = onPopulateFromSelection();
      if (selected) {
        setInputValue(selected);
        onSearch(selected);
      }
    }
  }, [onPopulateFromSelection, onSearch]);

  return (
    <form onSubmit={handleSubmit} className="tools-search-form">
      <div className="tools-search-row">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="tools-search-input"
          data-testid="tools-search-input"
          aria-label="Search term"
        />
        <button
          type="submit"
          className="tools-search-button"
          data-testid="tools-search-button"
          aria-label="Search"
        >
          →
        </button>
        {onPopulateFromSelection && (
          <button
            type="button"
            onClick={handlePopulateFromSelection}
            className="tools-populate-button"
            data-testid="tools-populate-button"
            aria-label="Use selected word"
            title="Use selected word"
          >
            ⌖
          </button>
        )}
      </div>
    </form>
  );
}
