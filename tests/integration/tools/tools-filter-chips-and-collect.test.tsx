import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolsPane } from '../../../src/features/tools-pane/ToolsPane';
import { cachedToolLookupService } from '../../../src/domain/tools/tool-service';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

vi.mock('../../../src/domain/tools/tool-service', () => ({
  cachedToolLookupService: {
    lookup: vi.fn(),
  },
}));

function setUpProject(inventoryLines: string[] = []) {
  const project = createDefaultProject('Test Song');
  const draft = project.drafts[0];
  draft.id = 'draft_1';
  draft.inventory = {
    type: 'inventory',
    doc: {
      type: 'doc',
      content: inventoryLines.length === 0
        ? [{ type: 'paragraph' }]
        : inventoryLines.map((line) => ({ type: 'paragraph', content: [{ type: 'text', text: line }] })),
    },
  };

  useProjectStore.setState({
    isProjectLoaded: true,
    currentProject: createCyrilFile(project),
    activeView: { type: 'draft', draftId: draft.id },
    error: null,
  });

  return draft.id;
}

class NotAllowedErrorStub extends Error {
  constructor() { super('Write permission denied'); this.name = 'NotAllowedError'; }
}

describe('Tools pane — filter chips, honest states, and collect (C-14)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('T-14.14: filter chips render for rhyme modes and switching them re-queries the appropriate underlying mode', async () => {
    const mockLookup = vi.fn().mockResolvedValue({
      term: 'day', mode: 'rhyme-exact', results: [{ word: 'play', score: 900 }], loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    // Chips are visible by default (starting mode is rhyme-exact)
    expect(screen.getByTestId('tools-filter-chips')).toBeInTheDocument();
    expect(screen.getByTestId('tools-filter-chip-perfect')).toHaveAttribute('aria-pressed', 'true');

    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'day' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => expect(mockLookup).toHaveBeenCalledWith('day', 'rhyme-exact'));

    // Switching to "Wide" re-queries using the existing rhyme-near mode (no new mode/provider)
    fireEvent.click(screen.getByTestId('tools-filter-chip-wide'));
    await waitFor(() => expect(mockLookup).toHaveBeenLastCalledWith('day', 'rhyme-near'));
    expect(screen.getByTestId('tools-filter-chip-wide')).toHaveAttribute('aria-pressed', 'true');

    // Switching back to "Perfect" re-queries rhyme-exact
    fireEvent.click(screen.getByTestId('tools-filter-chip-perfect'));
    await waitFor(() => expect(mockLookup).toHaveBeenLastCalledWith('day', 'rhyme-exact'));

    // Chips disappear for a non-rhyme mode
    fireEvent.click(screen.getByTestId('tools-tab-thesaurus'));
    expect(screen.queryByTestId('tools-filter-chips')).not.toBeInTheDocument();
  });

  it('T-14.14: the "Close" filter narrows the near-rhyme result set relative to "Wide"', async () => {
    const nearResults = [
      { word: 'high', score: 1000, numSyllables: 1 },
      { word: 'mid', score: 500, numSyllables: 1 },
      { word: 'low', score: 10, numSyllables: 1 },
    ];
    const mockLookup = vi.fn().mockResolvedValue({
      term: 'sky', mode: 'rhyme-near', results: nearResults, loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'sky' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));
    await waitFor(() => expect(mockLookup).toHaveBeenCalledWith('sky', 'rhyme-exact'));

    // Wide: shows every near-rhyme result
    fireEvent.click(screen.getByTestId('tools-filter-chip-wide'));
    await waitFor(() => expect(mockLookup).toHaveBeenLastCalledWith('sky', 'rhyme-near'));
    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    // Close: narrows to the higher-scoring subset — the lowest-scoring word drops out
    fireEvent.click(screen.getByTestId('tools-filter-chip-close'));
    await waitFor(() => {
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.queryByText('low')).not.toBeInTheDocument();
    });
  });

  it('T-14.15: a failed provider lookup shows the offline state, not an endless spinner', async () => {
    const mockLookup = vi.fn().mockRejectedValue(new Error('network down'));
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    // The loading state resolves — it does not spin forever.
    await waitFor(() => {
      expect(screen.queryByTestId('tools-results-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('tools-results-offline')).toBeInTheDocument();
    });
  });

  it('T-14.15: a lookup that never resolves times out into the offline state instead of spinning forever', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const mockLookup = vi.fn().mockReturnValue(new Promise(() => { /* never resolves */ }));
      (cachedToolLookupService.lookup as any) = mockLookup;

      render(<ToolsPane />);

      const input = screen.getByTestId('tools-search-input');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.click(screen.getByTestId('tools-search-button'));

      expect(screen.getByTestId('tools-results-loading')).toBeInTheDocument();

      // Advance past the pane's own lookup timeout.
      await vi.advanceTimersByTimeAsync(10000);

      expect(screen.queryByTestId('tools-results-loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('tools-results-offline')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('T-14.16: results sourced from the cache surface a cache/offline note', async () => {
    const mockLookup = vi.fn().mockResolvedValue({
      term: 'moon', mode: 'rhyme-exact', results: [{ word: 'june', score: 800 }], loading: false, source: 'cache-fallback',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'moon' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => {
      const note = screen.getByTestId('tools-results-cache-note');
      expect(note.textContent?.toLowerCase()).toContain('offline');
    });
  });

  it('T-14.17: clicking "+ collect" adds the word to the active draft Inventory and persists it', async () => {
    const draftId = setUpProject(['Existing item']);

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'star', mode: 'thesaurus', results: [{ word: 'sparkle', score: 700 }], loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    fireEvent.click(screen.getByTestId('tools-tab-thesaurus'));
    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'star' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => expect(screen.getByText('sparkle')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('tools-collect-button'));

    const draft = useProjectStore.getState()
      .currentProject!.project.drafts.find((d) => d.id === draftId)!;
    const texts = draft.inventory.doc.content.map((n) => (n.content ?? []).map((c) => c.text ?? '').join(''));
    expect(texts).toEqual(['Existing item', 'sparkle']);
  });

  it('T-14.17: collecting gives feedback distinguishable from the copy feedback', async () => {
    setUpProject([]);

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'star', mode: 'thesaurus', results: [{ word: 'sparkle', score: 700 }], loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });

    render(<ToolsPane />);

    fireEvent.click(screen.getByTestId('tools-tab-thesaurus'));
    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'star' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));
    await waitFor(() => expect(screen.getByText('sparkle')).toBeInTheDocument());

    // Single click -> copy feedback. The clipboard write is genuinely async, and the
    // feedback now waits for it so it can tell the truth (D-22), hence waitFor.
    fireEvent.click(screen.getByTestId('tools-result-item'));
    await waitFor(() =>
      expect(screen.getByTestId('tools-result-feedback').textContent).toMatch(/^copied$/i),
    );

    // + collect button -> distinct "collected" feedback
    fireEvent.click(screen.getByTestId('tools-collect-button'));
    await waitFor(() =>
      expect(screen.getByTestId('tools-result-feedback').textContent).toMatch(/collected/i),
    );
  });

  it('T-14.18: a refused clipboard says so instead of claiming "Copied" (D-22)', async () => {
    setUpProject([]);

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'star', mode: 'thesaurus', results: [{ word: 'sparkle', score: 700 }], loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    // A denied clipboard is an ordinary environment condition: an insecure context, a
    // gated permission, an automated session. It must never be reported as success,
    // and must not log an error.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new NotAllowedErrorStub()) },
      configurable: true,
      writable: true,
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ToolsPane />);
    fireEvent.click(screen.getByTestId('tools-tab-thesaurus'));
    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'star' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));
    await waitFor(() => expect(screen.getByText('sparkle')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('tools-result-item'));

    await waitFor(() =>
      expect(screen.getByTestId('tools-result-feedback').textContent).toMatch(/couldn't copy/i),
    );
    expect(screen.getByTestId('tools-result-feedback').textContent).not.toMatch(/^copied$/i);
    expect(consoleError).not.toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
