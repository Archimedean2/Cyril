import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToolsPane } from '../../../src/features/tools-pane/ToolsPane';
import { applySyllableFilter, availableSyllableCounts } from '../../../src/domain/tools/syllableFilter';
import { cachedToolLookupService } from '../../../src/domain/tools/tool-service';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { useWordLookupStore } from '../../../src/app/state/wordLookupStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { ToolResult } from '../../../src/domain/tools/types';

vi.mock('../../../src/domain/tools/tool-service', () => ({
  cachedToolLookupService: { lookup: vi.fn() },
}));

function setUpProject() {
  const project = createDefaultProject('Test Song');
  project.drafts[0].id = 'draft_1';
  useProjectStore.setState({
    isProjectLoaded: true,
    currentProject: createCyrilFile(project),
    activeView: { type: 'draft', draftId: 'draft_1' },
    error: null,
  });
}

function mockRhymes(results: ToolResult[]) {
  (cachedToolLookupService.lookup as ReturnType<typeof vi.fn>).mockResolvedValue({
    term: 'light', mode: 'rhyme-exact', results, loading: false,
  });
}

async function search(term = 'light') {
  fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: term } });
  fireEvent.click(screen.getByTestId('tools-search-button'));
  await waitFor(() => expect(screen.getByTestId('tools-results-list')).toBeTruthy());
}

const words = () =>
  Array.from(document.querySelectorAll('[data-testid="tools-result-item"]')).map((el) => el.textContent);

/**
 * C-50 / MASTERWRITER_PLAN.md §Phase 0 — narrow rhyme results to one syllable count.
 * A lyricist filling a fixed slot in a melody needs a word of a given length far more often
 * than a word of a given relevance.
 */
describe('Tools pane: syllable filter (C-50)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWordLookupStore.setState({ enabled: true, request: null });
    setUpProject();
  });

  it('T-14.33: choosing a syllable count shows only results of that length', async () => {
    mockRhymes([
      { word: 'night', score: 900, numSyllables: 1 },
      { word: 'bright', score: 880, numSyllables: 1 },
      { word: 'delight', score: 870, numSyllables: 2 },
      { word: 'satellite', score: 500, numSyllables: 3 },
    ]);
    render(<ToolsPane />);
    await search();

    expect(words()).toEqual(expect.arrayContaining(['night', 'bright', 'delight', 'satellite']));

    fireEvent.click(screen.getByTestId('tools-syllable-chip-2'));

    await waitFor(() => expect(words()).toEqual(['delight']));
  });

  it('T-14.34: the chips offer only counts present in the results', async () => {
    mockRhymes([
      { word: 'night', score: 900, numSyllables: 1 },
      { word: 'delight', score: 870, numSyllables: 2 },
    ]);
    render(<ToolsPane />);
    await search();

    expect(screen.getByTestId('tools-syllable-chip-1')).toBeTruthy();
    expect(screen.getByTestId('tools-syllable-chip-2')).toBeTruthy();
    // Nothing in the set has three syllables, so the writer is never offered a filter
    // that would empty the rail.
    expect(screen.queryByTestId('tools-syllable-chip-3')).toBeNull();
  });

  it('T-14.34: clicking the active chip again clears the narrowing', async () => {
    mockRhymes([
      { word: 'night', score: 900, numSyllables: 1 },
      { word: 'delight', score: 870, numSyllables: 2 },
    ]);
    render(<ToolsPane />);
    await search();

    fireEvent.click(screen.getByTestId('tools-syllable-chip-1'));
    await waitFor(() => expect(words()).toEqual(['night']));

    fireEvent.click(screen.getByTestId('tools-syllable-chip-1'));
    await waitFor(() => expect(words()).toHaveLength(2));
  });

  it('T-14.35: a narrowing the next lookup cannot honour resets instead of emptying the rail', async () => {
    mockRhymes([
      { word: 'night', score: 900, numSyllables: 1 },
      { word: 'satellite', score: 500, numSyllables: 3 },
    ]);
    render(<ToolsPane />);
    await search();

    fireEvent.click(screen.getByTestId('tools-syllable-chip-3'));
    await waitFor(() => expect(words()).toEqual(['satellite']));

    // A new lookup whose results have no three-syllable word at all.
    mockRhymes([
      { word: 'day', score: 900, numSyllables: 1 },
      { word: 'away', score: 880, numSyllables: 2 },
    ]);
    await act(async () => {
      useWordLookupStore.getState().requestLookup('grey');
    });

    await waitFor(() => expect(words()).toHaveLength(2));
    // …and the control says so: "All" is active again, rather than a stale 3 chip.
    expect(screen.getByTestId('tools-syllable-chip-all').getAttribute('aria-pressed')).toBe('true');
  });

  it('T-14.36: the filter is not offered outside rhyme modes', async () => {
    mockRhymes([
      { word: 'night', score: 900, numSyllables: 1 },
      { word: 'delight', score: 870, numSyllables: 2 },
    ]);
    render(<ToolsPane />);
    await search();
    expect(screen.getByTestId('tools-syllable-chips')).toBeTruthy();

    (cachedToolLookupService.lookup as ReturnType<typeof vi.fn>).mockResolvedValue({
      term: 'light', mode: 'thesaurus',
      results: [{ word: 'glow', score: 100, numSyllables: 1 }, { word: 'radiance', score: 90, numSyllables: 3 }],
      loading: false,
    });
    fireEvent.click(screen.getByTestId('tools-tab-thesaurus'));

    // A synonym is not chosen by its length; the control would be noise here.
    await waitFor(() => expect(screen.queryByTestId('tools-syllable-chips')).toBeNull());
  });
});

/** The narrowing rules themselves, away from the React tree. */
describe('C-50: syllable filter rules', () => {
  const set: ToolResult[] = [
    { word: 'night', numSyllables: 1 },
    { word: 'delight', numSyllables: 2 },
    { word: 'unknown' }, // provider supplied no syllable data
  ];

  it('T-14.34: available counts are distinct, ascending, and skip results with no data', () => {
    expect(availableSyllableCounts(set)).toEqual([1, 2]);
    expect(availableSyllableCounts([{ word: 'x' }])).toEqual([]);
  });

  it('T-14.33: filtering to a count keeps only that count; null keeps everything', () => {
    expect(applySyllableFilter(set, 1).map((r) => r.word)).toEqual(['night']);
    expect(applySyllableFilter(set, null)).toHaveLength(3);
  });

  it('T-14.35: a count nothing has returns the full set rather than an empty rail', () => {
    expect(applySyllableFilter(set, 9)).toHaveLength(3);
  });
});
