import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ToolsPane } from '../../../src/features/tools-pane/ToolsPane';
import { toolService } from '../../../src/domain/tools/tool-service';

// Mock the tool service
vi.mock('../../../src/domain/tools/tool-service', () => ({
  toolService: {
    lookup: vi.fn(),
  },
}));

describe('Tools Sidebar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('T-7.03: Tools pane renders in top-right panel', () => {
    render(<ToolsPane />);

    // Check main container
    expect(screen.getByTestId('tools-pane')).toBeInTheDocument();
    
    // Check tabs are rendered
    expect(screen.getByTestId('tools-tab-rhyme-exact')).toBeInTheDocument();
    expect(screen.getByTestId('tools-tab-rhyme-near')).toBeInTheDocument();
    expect(screen.getByTestId('tools-tab-thesaurus')).toBeInTheDocument();
    expect(screen.getByTestId('tools-tab-dictionary')).toBeInTheDocument();
    expect(screen.getByTestId('tools-tab-related')).toBeInTheDocument();

    // Check search input
    expect(screen.getByTestId('tools-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('tools-search-button')).toBeInTheDocument();

    // Check empty state
    expect(screen.getByTestId('tools-results-empty')).toBeInTheDocument();
  });

  test('T-7.04: Selected word populates tool search term', () => {
    const getSelectedText = vi.fn().mockReturnValue('example');
    
    render(<ToolsPane getSelectedText={getSelectedText} />);

    // Click populate button
    const populateButton = screen.getByTestId('tools-populate-button');
    fireEvent.click(populateButton);

    // Verify getSelectedText was called
    expect(getSelectedText).toHaveBeenCalled();
    
    // Verify input was populated
    const input = screen.getByTestId('tools-search-input') as HTMLInputElement;
    expect(input.value).toBe('example');
  });

  test('T-7.04: Populate button not shown when no getSelectedText callback', () => {
    render(<ToolsPane />);

    // Populate button should not exist
    expect(screen.queryByTestId('tools-populate-button')).not.toBeInTheDocument();
  });

  test('T-7.05: Switching tool modes works', async () => {
    const mockLookup = vi.fn().mockResolvedValue({
      term: 'test',
      mode: 'rhyme-near',
      results: [{ word: 'best', score: 1000 }],
      loading: false,
    });
    (toolService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    // Search first
    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => {
      expect(mockLookup).toHaveBeenCalledWith('test', 'rhyme-exact');
    });

    // Switch to near rhyme tab
    const nearTab = screen.getByTestId('tools-tab-rhyme-near');
    fireEvent.click(nearTab);

    // Should trigger new search with new mode
    await waitFor(() => {
      expect(mockLookup).toHaveBeenCalledWith('test', 'rhyme-near');
    });
  });

  test('T-7.06: Clicking result copies text to clipboard', async () => {
    const mockLookup = vi.fn().mockResolvedValue({
      term: 'cat',
      mode: 'rhyme-exact',
      results: [
        { word: 'bat', score: 1000 },
        { word: 'hat', score: 950 },
      ],
      loading: false,
    });
    (toolService.lookup as any) = mockLookup;

    // Mock clipboard
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<ToolsPane />);

    // Search for a word
    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'cat' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    // Wait for results
    await waitFor(() => {
      expect(screen.getAllByTestId('tools-result-item')).toHaveLength(2);
    });

    // Click first result
    const results = screen.getAllByTestId('tools-result-item');
    fireEvent.click(results[0]);

    // Verify clipboard was called
    expect(mockClipboard.writeText).toHaveBeenCalledWith('bat');
  });

  test('T-7.07: Provider failure does not crash editor', async () => {
    const mockLookup = vi.fn().mockRejectedValue(new Error('API Error'));
    (toolService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    // Search
    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('tools-results-error')).toBeInTheDocument();
    });

    // Component should still be functional
    expect(screen.getByTestId('tools-pane')).toBeInTheDocument();
    expect(screen.getByTestId('tools-search-input')).toBeInTheDocument();
  });

  test('T-7.07: Empty results state shown when no matches', async () => {
    const mockLookup = vi.fn().mockResolvedValue({
      term: 'xyzabc',
      mode: 'rhyme-exact',
      results: [],
      loading: false,
    });
    (toolService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'xyzabc' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => {
      expect(screen.getByTestId('tools-results-empty')).toBeInTheDocument();
    });
  });

  test('T-7.06: Results are keyboard accessible', async () => {
    const mockLookup = vi.fn().mockResolvedValue({
      term: 'cat',
      mode: 'rhyme-exact',
      results: [{ word: 'bat', score: 1000 }],
      loading: false,
    });
    (toolService.lookup as any) = mockLookup;

    render(<ToolsPane />);

    const input = screen.getByTestId('tools-search-input');
    fireEvent.change(input, { target: { value: 'cat' } });
    fireEvent.click(screen.getByTestId('tools-search-button'));

    await waitFor(() => {
      const result = screen.getByTestId('tools-result-item');
      expect(result).toHaveAttribute('role', 'button');
      expect(result).toHaveAttribute('tabIndex', '0');
    });
  });
});
