import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToolsPane } from '../../../src/features/tools-pane/ToolsPane';
import { cachedToolLookupService } from '../../../src/domain/tools/tool-service';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { useWordLookupStore } from '../../../src/app/state/wordLookupStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';

vi.mock('../../../src/domain/tools/tool-service', () => ({
  cachedToolLookupService: { lookup: vi.fn() },
}));

function setUpProject() {
  const project = createDefaultProject('Test Song');
  const draft = project.drafts[0];
  draft.id = 'draft_1';
  useProjectStore.setState({
    isProjectLoaded: true,
    currentProject: createCyrilFile(project),
    activeView: { type: 'draft', draftId: draft.id },
    error: null,
  });
}

function mockResults(term: string, words: string[]) {
  (cachedToolLookupService.lookup as ReturnType<typeof vi.fn>).mockResolvedValue({
    term,
    mode: 'rhyme-exact',
    results: words.map((word, i) => ({ word, score: 9000 - i })),
    loading: false,
  });
}

/**
 * C-41 / DESIGN_PROPOSAL.md §13.1 — the rail's half of "double-click a word to
 * look it up". The editor's half (which word a click resolves to, the keyboard
 * twin, the preference gate) is in `tests/unit/editor/word-lookup.test.ts`; here
 * we assert that a raised request actually reaches the pane and is visible.
 */
describe('Tools pane: lookup requests from the editor (C-41)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWordLookupStore.setState({ enabled: true, request: null });
    setUpProject();
  });

  it('T-14.24: a lookup request from the editor searches that word and shows its results', async () => {
    mockResults('left', ['bereft', 'cleft', 'theft']);
    render(<ToolsPane />);

    expect(screen.queryByTestId('tools-results-list')).toBeNull();

    await act(async () => {
      useWordLookupStore.getState().requestLookup('left');
    });

    await waitFor(() => {
      expect(cachedToolLookupService.lookup).toHaveBeenCalledWith('left', 'rhyme-exact');
    });
    await waitFor(() => {
      expect(screen.getByText('bereft')).toBeTruthy();
    });
    // The search box shows the looked-up word, so the rail and the box agree.
    expect((screen.getByTestId('tools-search-input') as HTMLInputElement).value).toBe('left');
  });

  it('T-14.25: the rail names the word the results are for', async () => {
    mockResults('left', ['bereft', 'cleft']);
    render(<ToolsPane />);

    await act(async () => {
      useWordLookupStore.getState().requestLookup('left');
    });

    const subject = await screen.findByTestId('tools-lookup-subject');
    expect(subject.textContent).toContain('rhymes');
    expect(subject.textContent).toContain('left');
  });

  it('T-14.24: looking the same word up twice in a row searches twice', async () => {
    mockResults('left', ['bereft']);
    render(<ToolsPane />);

    await act(async () => {
      useWordLookupStore.getState().requestLookup('left');
    });
    await waitFor(() => expect(cachedToolLookupService.lookup).toHaveBeenCalledTimes(1));

    await act(async () => {
      useWordLookupStore.getState().requestLookup('left');
    });
    await waitFor(() => expect(cachedToolLookupService.lookup).toHaveBeenCalledTimes(2));
  });

  it('T-14.27: the pane offers the opt-out, and turning it off stops lookups reaching the rail', async () => {
    mockResults('left', ['bereft']);
    render(<ToolsPane />);

    const checkbox = screen.getByTestId('tools-lookup-pref-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(useWordLookupStore.getState().enabled).toBe(false);

    await act(async () => {
      // The editor asks; the store refuses, so the rail never searches.
      expect(useWordLookupStore.getState().requestLookup('left')).toBe(false);
    });
    expect(cachedToolLookupService.lookup).not.toHaveBeenCalled();

    // Turning it back on restores the loop in the same session.
    fireEvent.click(checkbox);
    await act(async () => {
      useWordLookupStore.getState().requestLookup('left');
    });
    await waitFor(() => expect(cachedToolLookupService.lookup).toHaveBeenCalledWith('left', 'rhyme-exact'));
  });

  it('T-14.24: switching tool tabs does not re-fire the last lookup', async () => {
    mockResults('left', ['bereft']);
    render(<ToolsPane />);

    await act(async () => {
      useWordLookupStore.getState().requestLookup('left');
    });
    await waitFor(() => expect(cachedToolLookupService.lookup).toHaveBeenCalledTimes(1));

    // Changing the mode re-searches the current term once — deliberate — but the
    // stale lookup request must not fire a second search on top of it. A rail that
    // lurched on its own is exactly what §13.1 rules out.
    (cachedToolLookupService.lookup as ReturnType<typeof vi.fn>).mockClear();
    fireEvent.click(screen.getByTestId('tools-tab-thesaurus'));

    await waitFor(() => expect(cachedToolLookupService.lookup).toHaveBeenCalledTimes(1));
    expect(cachedToolLookupService.lookup).toHaveBeenCalledWith('left', 'thesaurus');
  });

  it('T-14.29: the inert ⌖ "populate from selection" control is gone (D-24)', () => {
    render(<ToolsPane />);
    expect(screen.queryByTestId('tools-populate-button')).toBeNull();
  });
});
