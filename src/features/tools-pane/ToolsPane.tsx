import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ToolMode, ToolLookupResponse, ToolResultSource } from '../../domain/tools/types';
import { cachedToolLookupService } from '../../domain/tools/tool-service';
import { RhymeFilter, rhymeFilterToMode, applyRhymeFilter } from '../../domain/tools/rhymeFilter';
import { useProjectStore } from '../../app/state/projectStore';
import { useWordLookupStore } from '../../app/state/wordLookupStore';
import { inventoryDocToItems, itemsToInventoryDoc } from '../inventory/inventoryDoc';
import { extractDraftPlainText, tokenizeWords, isPhraseUsedInDraft } from '../../domain/tools/draftWordUsage';
import { ToolsModeTabs } from './ToolsModeTabs';
import { ToolsFilterChips } from './ToolsFilterChips';
import { ToolsSyllableChips } from './ToolsSyllableChips';
import { applySyllableFilter, availableSyllableCounts } from '../../domain/tools/syllableFilter';
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

const RHYME_MODES: ToolMode[] = ['rhyme-exact', 'rhyme-near'];

export function ToolsPane() {
  const [activeMode, setActiveMode] = useState<ToolMode>('rhyme-exact');
  const [rhymeFilter, setRhymeFilter] = useState<RhymeFilter>('perfect');
  // C-50: narrow rhymes to one syllable count. Sticky across lookups on purpose — a writer
  // filling a fixed slot in a melody wants the next word to be the same length as the last.
  const [syllableFilter, setSyllableFilter] = useState<number | null>(null);
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

  // C-44 / DESIGN_PROPOSAL.md §13.4: dim rhymes/results already in the draft or
  // already collected, so the writer scans what is new. DERIVED from the store on
  // every render — never stored — so it stays correct as the writer edits or collects.
  const draftWords = useMemo(() => {
    if (!currentProject || activeView.type !== 'draft') return [];
    const draft = currentProject.project.drafts.find((d) => d.id === activeView.draftId);
    return draft ? tokenizeWords(extractDraftPlainText(draft.doc)) : [];
  }, [currentProject, activeView]);

  const collectedItems = useMemo(() => {
    if (!currentProject || activeView.type !== 'draft') return [];
    const draft = currentProject.project.drafts.find((d) => d.id === activeView.draftId);
    return draft ? inventoryDocToItems(draft.inventory.doc) : [];
  }, [currentProject, activeView]);

  const isResultUsed = useCallback((word: string): boolean => {
    if (isPhraseUsedInDraft(word, draftWords)) return true;
    const normalized = word.trim().toLowerCase();
    return collectedItems.some((item) => item.trim().toLowerCase() === normalized);
  }, [draftWords, collectedItems]);

  // C-41 / DESIGN_PROPOSAL.md §13.1: a double-click (or Mod-Shift-L) in the lyric
  // raises a request on `wordLookupStore`; the rail answers it with the mode and
  // filters the writer already has selected. This replaces the inert ⌖
  // "populate from selection" control (D-24), which is removed.
  //
  // Keyed on the request's nonce, NOT on the term: looking the same word up twice
  // in a row is ordinary, and an unchanged term would be an unchanged dependency.
  // `activeMode` is deliberately read through a ref rather than listed as a
  // dependency — including it would re-run the last lookup whenever the writer
  // switched tabs, which is the rail lurching on its own that §13.1 warns against.
  const lookupRequest = useWordLookupStore((s) => s.request);
  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;
  const handledLookupNonce = useRef(0);

  useEffect(() => {
    if (!lookupRequest || lookupRequest.nonce === handledLookupNonce.current) return;
    handledLookupNonce.current = lookupRequest.nonce;
    performSearch(lookupRequest.term, activeModeRef.current);
  }, [lookupRequest, performSearch]);

  const lookupEnabled = useWordLookupStore((s) => s.enabled);
  const setLookupEnabled = useWordLookupStore((s) => s.setEnabled);

  // Build a loading response for UI feedback, then apply the Close/Wide client-side
  // score filter on top of the near-rhyme result set.
  const filteredResponse: PaneResponse | null = useMemo(() => {
    const displayResponse: PaneResponse | null = isSearching
      ? { term: searchTerm, mode: activeMode, results: [], loading: true }
      : response;

    if (!displayResponse) return displayResponse;

    const scored = displayResponse.mode === 'rhyme-near'
      ? applyRhymeFilter(displayResponse.results, rhymeFilter)
      : displayResponse.results;

    // C-50: syllable narrowing applies to rhyme modes only — it is a melodic constraint,
    // and a definition or a synonym is not chosen by length.
    if (!RHYME_MODES.includes(displayResponse.mode)) return { ...displayResponse, results: scored };
    return { ...displayResponse, results: applySyllableFilter(scored, syllableFilter) };
  }, [isSearching, searchTerm, activeMode, response, rhymeFilter, syllableFilter]);

  // The chips offer counts from the scored-but-unnarrowed set, so narrowing never removes
  // the chip you would need to widen again.
  const syllableChoices = useMemo(() => {
    if (!response || !RHYME_MODES.includes(response.mode)) return [];
    const scored = response.mode === 'rhyme-near'
      ? applyRhymeFilter(response.results, rhymeFilter)
      : response.results;
    return scored;
  }, [response, rhymeFilter]);

  // Drop a narrowing the new results cannot honour, rather than leaving a chip active that
  // no longer matches anything the writer can see.
  useEffect(() => {
    if (syllableFilter === null) return;
    if (syllableChoices.length === 0) return;
    if (!availableSyllableCounts(syllableChoices).includes(syllableFilter)) {
      setSyllableFilter(null);
    }
  }, [syllableChoices, syllableFilter]);

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
        placeholder={`Search for ${getModeLabel(activeMode)}...`}
      />

      {isRhymeMode && (
        <ToolsFilterChips active={rhymeFilter} onChange={handleFilterChange} />
      )}

      {isRhymeMode && (
        <ToolsSyllableChips
          results={syllableChoices}
          active={syllableFilter}
          onChange={setSyllableFilter}
        />
      )}

      {/* §13.1: "Name what was looked up" — a list that changes under you is
          never mysterious if the rail says what it is a list of. */}
      {searchTerm && (
        <p className="tools-lookup-subject" data-testid="tools-lookup-subject">
          {getModeLabel(activeMode)} for <strong>{searchTerm}</strong>
        </p>
      )}

      <ToolsResultsList
        response={filteredResponse}
        onCopyResult={handleCopyResult}
        onCollectResult={handleCollectResult}
        isResultUsed={isResultUsed}
        lookupEnabled={lookupEnabled}
      />

      {/* §13.1: the gesture is opt-out. The control sits with the behaviour it
          governs rather than in the draft's View toggles — those describe the
          song, this describes how this person likes to work. */}
      <label className="tools-lookup-pref" data-testid="tools-lookup-pref">
        <input
          type="checkbox"
          checked={lookupEnabled}
          onChange={(e) => setLookupEnabled(e.target.checked)}
          data-testid="tools-lookup-pref-checkbox"
        />
        Look up on double-click
      </label>
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
