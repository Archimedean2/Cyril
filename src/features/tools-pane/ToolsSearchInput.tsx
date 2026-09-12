import { useState, useEffect } from 'react';

interface ToolsSearchInputProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  placeholder?: string;
}

export function ToolsSearchInput({
  searchTerm,
  onSearch,
  placeholder = 'Enter a word...',
}: ToolsSearchInputProps) {
  const [inputValue, setInputValue] = useState(searchTerm);

  // C-41: the box is no longer only an input — a double-click in the lyric sets
  // the term from outside, and the box has to show the word that was looked up.
  // (Until now this component only read `searchTerm` once, on mount; the
  // "Sync with external searchTerm" comment described an effect that was never
  // written.)
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

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
      </div>
    </form>
  );
}
