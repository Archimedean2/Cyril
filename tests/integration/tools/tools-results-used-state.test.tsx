import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToolsPane } from '../../../src/features/tools-pane/ToolsPane';
import { cachedToolLookupService } from '../../../src/domain/tools/tool-service';
import { useProjectStore } from '../../../src/app/state/projectStore';
import { createDefaultProject, createCyrilFile } from '../../../src/domain/project/defaults';
import { DraftDocument } from '../../../src/domain/project/types';

vi.mock('../../../src/domain/tools/tool-service', () => ({
  cachedToolLookupService: {
    lookup: vi.fn(),
  },
}));

function lyricLineDoc(text: string): DraftDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'lyricLine',
        attrs: { id: 'l1', rhymeGroup: null, lineType: 'lyric' },
        meta: { alternates: [], prosody: null, chords: [] },
        content: text ? [{ type: 'text', text }] : [],
      } as any,
    ],
  };
}

function setUpProject({ draftText = '', inventoryLines = [] as string[] } = {}) {
  const project = createDefaultProject('Test Song');
  const draft = project.drafts[0];
  draft.id = 'draft_1';
  draft.doc = lyricLineDoc(draftText);
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

/**
 * C-44 / DESIGN_PROPOSAL.md §13.4: the results list dims rhymes already in the draft
 * or already collected, so the writer scans what is new.
 */
describe('Tools results "used" state (C-44)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('T-14.22: a rhyme result already present in the draft renders dimmed', async () => {
    setUpProject({ draftText: 'the day fades into night' });

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'light', mode: 'rhyme-exact',
      results: [
        { word: 'night', score: 900 },
        { word: 'bright', score: 800 },
      ],
      loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);
    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'light' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => expect(screen.getByText('night')).toBeInTheDocument());

    expect(screen.getByText('night').className).toMatch(/rhyme-word-used/);
    expect(screen.getByText('bright').className).not.toMatch(/rhyme-word-used/);
  });

  it('T-14.22: a rhyme result already collected into Inventory renders dimmed', async () => {
    setUpProject({ inventoryLines: ['bright'] });

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'light', mode: 'rhyme-exact',
      results: [
        { word: 'night', score: 900 },
        { word: 'bright', score: 800 },
      ],
      loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);
    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'light' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => expect(screen.getByText('bright')).toBeInTheDocument());

    expect(screen.getByText('bright').className).toMatch(/rhyme-word-used/);
    expect(screen.getByText('night').className).not.toMatch(/rhyme-word-used/);
  });

  it('T-14.22: a result that is neither in the draft nor collected renders normally (not dimmed)', async () => {
    setUpProject({ draftText: 'an unrelated line', inventoryLines: ['other'] });

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'light', mode: 'rhyme-exact',
      results: [{ word: 'night', score: 900 }],
      loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);
    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'light' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => expect(screen.getByText('night')).toBeInTheDocument());
    expect(screen.getByText('night').className).not.toMatch(/rhyme-word-used/);
  });

  it('T-14.22: a non-rhyme (generic) result already in the draft renders dimmed', async () => {
    setUpProject({ draftText: 'the sparkle in your eyes' });

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'star', mode: 'thesaurus',
      results: [
        { word: 'sparkle', score: 700 },
        { word: 'glow', score: 600 },
      ],
      loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);
    fireEvent.click(screen.getByTestId('tools-tab-thesaurus'));
    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'star' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => expect(screen.getByText('sparkle')).toBeInTheDocument());

    const sparkleItem = screen.getByText('sparkle').closest('[data-testid="tools-result-item"]')!;
    const glowItem = screen.getByText('glow').closest('[data-testid="tools-result-item"]')!;
    expect(sparkleItem.className).toMatch(/tools-result-item-used/);
    expect(glowItem.className).not.toMatch(/tools-result-item-used/);
  });

  it('T-14.22: dimming is derived — a result un-dims once the word leaves the draft', async () => {
    const draftId = setUpProject({ draftText: 'the day fades into night' });

    const mockLookup = vi.fn().mockResolvedValue({
      term: 'light', mode: 'rhyme-exact',
      results: [{ word: 'night', score: 900 }],
      loading: false, source: 'live',
    });
    (cachedToolLookupService.lookup as any) = mockLookup;

    render(<ToolsPane />);
    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'light' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));
    await waitFor(() => expect(screen.getByText('night')).toBeInTheDocument());
    expect(screen.getByText('night').className).toMatch(/rhyme-word-used/);

    fireEvent.change(screen.getByTestId('tools-search-input'), { target: { value: 'light' } });
    act(() => {
      useProjectStore.getState().updateDraftDoc(draftId, lyricLineDoc('a bright new day'));
    });

    await waitFor(() => expect(screen.getByText('night').className).not.toMatch(/rhyme-word-used/));
  });
});
