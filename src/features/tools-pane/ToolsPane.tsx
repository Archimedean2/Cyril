import { useState, useCallback, useMemo, useRef } from 'react';
import { ToolMode, ToolLookupResponse, ToolResultSource } from '../../domain/tools/types';
import { cachedToolLookupService } from '../../domain/tools/tool-service';
import { RhymeFilter, rhymeFilterToMode, applyRhymeFilter } from '../../domain/tools/rhymeFilter';
import { useProjectStore } from '../../app/state/projectStore';
import { inventoryDocToItems, itemsToInventoryDoc } from '../inventory/inventoryDoc';
import { ToolsModeTabs } from './ToolsModeTabs';
import { ToolsFilterChips } from './ToolsFilterChips';
import { ToolsSearchInput } from './ToolsSearchInput';
import { ToolsResultsList } from './ToolsResultsList';

/** How long a lookup can run before the pane gives up and shows the offline state,
 * instead of spinning forever on a hung network request. */
const LOOKUP_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Lookup timed out')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}

/** Local response shape: same as ToolLookupResponse, plus the optional cache
 * provenance the cache-aware service reports (absent while a search is in flight). */
interface PaneResponse extends ToolLookupResponse {
  source?: ToolResultSource;
}

interface ToolsPaneProps {
  /** Optional callback to get selected text from editor */
  getSelectedText?: () => string | null;
}

const RHYME_MODES: ToolMode[] = ['rhyme-exact', 'rhyme-near'];

export function ToolsPane({ getSelectedText }: ToolsPaneProps) {
  const [activeMode, setActiveMode] = useState<ToolMode>('rhyme-exact');
  const [rhymeFilter, setRhymeFilter] = useState<RhymeFilter>('perfect');
  const [searchTerm, setSearchTerm] = useState('');
  const [response, setResponse] = useState<PaneResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const requestIdRef = useRef(0);

  const currentProject = useProjectStore((s) => s.currentProject);
  const activeView = useProjectStore((s) => s.activeView);
  const updateDraftInventory = useProjectStore((s) => s.updateDraftInventory);

  // Perform search when term or mode changes
  const performSearch = useCallback(async (term: string, mode: ToolMode) => {
    if (!term.trim()) {
      setResponse(null);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    setSearchTerm(term);

    try {
      const result = await withTimeout(cachedToolLookupService.lookup(term, mode), LOOKUP_TIMEOUT_MS);
      if (requestIdRef.current !== requestId) return; // a newer search superseded this one
      setResponse(result);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      setResponse({
        term,
        mode,
        results: [],
        loading: false,
        error: "Can't reach the word service. Check your connection and try again.",
        source: 'live',
      });
    } finally {
      if (requestIdRef.current === requestId) setIsSearching(false);
    }
  }, []);

  // Handle mode change - re-search if we have a term
  const handleModeChange = useCallback((mode: ToolMode) => {
    setActiveMode(mode);
    if (mode === 'rhyme-exact') setRhymeFilter('perfect');
    else if (mode === 'rhyme-near') setRhymeFilter((prev) => (prev === 'perfect' ? 'wide' : prev));

    if (searchTerm) {
      performSearch(searchTerm, mode);
    }
  }, [searchTerm, performSearch]);

  // Handle filter chip change (Perfect / Close / Wide) - re-search if we have a term
  const handleFilterChange = useCallback((filter: RhymeFilter) => {
    setRhymeFilter(filter);
    const mode = rhymeFilterToMode(filter);
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
  // Returns whether the copy actually happened, so the result list can tell the
  // writer the truth rather than flashing "Copied" over a failure.
  //
  // A denied or unavailable clipboard is an ordinary environment condition — an
  // insecure context, a browser that gates the permission, an automated session —
  // not a fault. It must degrade quietly (EDGE_CASES §10) and must NOT log an
  // error: doing so trains people to ignore the console, and the e2e console guard
  // would fail every run.
  const handleCopyResult = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (!navigator.clipboard?.writeText) return false;
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle collect into the active draft's Inventory
  const handleCollectResult = useCallback((word: string) => {
    if (!currentProject || activeView.type !== 'draft') return;
    const draft = currentProject.project.drafts.find((d) => d.id === activeView.draftId);
    if (!draft) return;

    const items = inventoryDocToItems(draft.inventory.doc);
    if (items.includes(word)) return; // already collected

    updateDraftInventory(activeView.draftId, itemsToInventoryDoc([...items, word]));
  }, [currentProject, activeView, updateDraftInventory]);

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

  // Build a loading response for UI feedback, then apply the Close/Wide client-side
  // score filter on top of the near-rhyme result set.
  const filteredResponse: PaneResponse | null = useMemo(() => {
    const displayResponse: PaneResponse | null = isSearching
      ? { term: searchTerm, mode: activeMode, results: [], loading: true }
      : response;

    if (!displayResponse || displayResponse.mode !== 'rhyme-near') return displayResponse;
    return { ...displayResponse, results: applyRhymeFilter(displayResponse.results, rhymeFilter) };
  }, [isSearching, searchTerm, activeMode, response, rhymeFilter]);

  const isRhymeMode = RHYME_MODES.includes(activeMode);

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

      {isRhymeMode && (
        <ToolsFilterChips active={rhymeFilter} onChange={handleFilterChange} />
      )}

      <ToolsResultsList
        response={filteredResponse}
        onCopyResult={handleCopyResult}
        onCollectResult={handleCollectResult}
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
