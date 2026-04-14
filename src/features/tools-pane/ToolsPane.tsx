import { useState, useCallback } from 'react';
import { ToolMode, ToolLookupResponse } from '../../domain/tools/types';
import { toolService } from '../../domain/tools/tool-service';
import { ToolsModeTabs } from './ToolsModeTabs';
import { ToolsSearchInput } from './ToolsSearchInput';
import { ToolsResultsList } from './ToolsResultsList';

interface ToolsPaneProps {
  /** Optional callback to get selected text from editor */
  getSelectedText?: () => string | null;
}

export function ToolsPane({ getSelectedText }: ToolsPaneProps) {
  const [activeMode, setActiveMode] = useState<ToolMode>('rhyme-exact');
  const [searchTerm, setSearchTerm] = useState('');
  const [response, setResponse] = useState<ToolLookupResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Perform search when term or mode changes
  const performSearch = useCallback(async (term: string, mode: ToolMode) => {
    if (!term.trim()) {
      setResponse(null);
      return;
    }

    setIsSearching(true);
    setSearchTerm(term);

    try {
      const result = await toolService.lookup(term, mode);
      setResponse(result);
    } catch (error) {
      setResponse({
        term,
        mode,
        results: [],
        loading: false,
        error: 'Search failed. Please try again.',
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle mode change - re-search if we have a term
  const handleModeChange = useCallback((mode: ToolMode) => {
    setActiveMode(mode);
    if (searchTerm) {
      performSearch(searchTerm, mode);
    }
  }, [searchTerm, performSearch]);

  // Handle new search
  const handleSearch = useCallback((term: string) => {
    performSearch(term, activeMode);
  }, [activeMode, performSearch]);

  // Handle copy to clipboard
  const handleCopyResult = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could show a toast here in the future
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: try to select the text
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  }, []);

  // Handle populate from selection
  const handlePopulateFromSelection = useCallback(() => {
    if (getSelectedText) {
      const selected = getSelectedText();
      if (selected && selected.trim()) {
        const trimmed = selected.trim();
        setSearchTerm(trimmed);
        performSearch(trimmed, activeMode);
        return trimmed;
      }
    }
    return null;
  }, [getSelectedText, activeMode, performSearch]);

  // Build a loading response for UI feedback
  const displayResponse: ToolLookupResponse | null = isSearching
    ? { term: searchTerm, mode: activeMode, results: [], loading: true }
    : response;

  return (
    <div className="tools-pane" data-testid="tools-pane">
      <ToolsModeTabs
        activeMode={activeMode}
        onModeChange={handleModeChange}
      />
      
      <ToolsSearchInput
        searchTerm={searchTerm}
        onSearch={handleSearch}
        onPopulateFromSelection={getSelectedText ? handlePopulateFromSelection : undefined}
        placeholder={`Search for ${getModeLabel(activeMode)}...`}
      />
      
      <ToolsResultsList
        response={displayResponse}
        onCopyResult={handleCopyResult}
      />
    </div>
  );
}

function getModeLabel(mode: ToolMode): string {
  switch (mode) {
    case 'rhyme-exact': return 'rhymes';
    case 'rhyme-near': return 'near rhymes';
    case 'thesaurus': return 'synonyms';
    case 'dictionary': return 'definitions';
    case 'related': return 'related words';
    default: return 'words';
  }
}
