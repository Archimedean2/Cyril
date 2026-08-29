import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ToolsResultsList } from '../../../src/features/tools-pane/ToolsResultsList';
import { ToolLookupResponse } from '../../../src/domain/tools/types';

/**
 * C-45 / DESIGN_PROPOSAL.md §13.5: emphasis is an ABSOLUTE score threshold, not a
 * relative "top 30% of whatever came back" — a weak result set should correctly show
 * nothing bold, and a strong word should be bold regardless of what else is in the set.
 */
describe('RhymeResultsList emphasis threshold (C-45)', () => {
  const baseResponse = (results: ToolLookupResponse['results']): ToolLookupResponse => ({
    term: 'left',
    mode: 'rhyme-exact',
    results,
    loading: false,
  });

  it('T-14.19: a weak result set (nothing clears the absolute threshold) renders with nothing emphasised', () => {
    // Mirrors the real "left" rhyme junk from D-22/DEFECTS.md: klepht, kreft, neft,
    // tefft, antitheft — all genuinely weak/obscure matches, none of them should bold.
    const results = [
      { word: 'klepht', score: 13 },
      { word: 'antitheft', score: 1008 },
      { word: 'tefft', score: 900 },
      { word: 'neft', score: 500 },
    ];

    render(
      <ToolsResultsList
        response={baseResponse(results)}
        onCopyResult={() => {}}
        onCollectResult={() => {}}
      />,
    );

    const words = screen.getAllByTestId('tools-result-item');
    expect(words).toHaveLength(4);
    for (const w of words) {
      expect(w.className).not.toMatch(/rhyme-word-bold/);
    }
  });

  it('T-14.19: a result whose own score clears the threshold is emphasised even inside an otherwise-weak set', () => {
    const results = [
      { word: 'bereft', score: 46033 }, // genuinely strong — should bold
      { word: 'antitheft', score: 1008 }, // weak — should not bold, even though it is "top of the rest"
      { word: 'klepht', score: 13 },
    ];

    render(
      <ToolsResultsList
        response={baseResponse(results)}
        onCopyResult={() => {}}
        onCollectResult={() => {}}
      />,
    );

    const bereft = screen.getByText('bereft');
    const antitheft = screen.getByText('antitheft');
    expect(bereft.className).toMatch(/rhyme-word-bold/);
    expect(antitheft.className).not.toMatch(/rhyme-word-bold/);
  });

  it('T-14.19: emphasis depends only on a result\'s own score, never on the shape of the rest of the set', () => {
    // Same single strong word, once among only weak company and once among only
    // other strong company — it must bold in both cases, and nothing else changes
    // just because the neighbours changed.
    const strongAlone = [
      { word: 'bereft', score: 46033 },
      { word: 'klepht', score: 13 },
      { word: 'kreft', score: 5 },
    ];
    const strongCrowded = [
      { word: 'bereft', score: 46033 },
      { word: 'cleft', score: 19046 },
      { word: 'deft', score: 9035 },
      { word: 'theft', score: 7049 },
      { word: 'heft', score: 6036 },
    ];

    const { unmount } = render(
      <ToolsResultsList response={baseResponse(strongAlone)} onCopyResult={() => {}} onCollectResult={() => {}} />,
    );
    expect(screen.getByText('bereft').className).toMatch(/rhyme-word-bold/);
    unmount();

    render(
      <ToolsResultsList response={baseResponse(strongCrowded)} onCopyResult={() => {}} onCollectResult={() => {}} />,
    );
    expect(screen.getByText('bereft').className).toMatch(/rhyme-word-bold/);
  });

  it('T-14.19: no result is hidden or removed on the basis of score — low scores stay in the list', () => {
    const results = [
      { word: 'bereft', score: 46033 },
      { word: 'klepht', score: 13 },
      { word: 'kreft', score: undefined },
    ];

    render(
      <ToolsResultsList response={baseResponse(results)} onCopyResult={() => {}} onCollectResult={() => {}} />,
    );

    expect(screen.getByText('bereft')).toBeInTheDocument();
    expect(screen.getByText('klepht')).toBeInTheDocument();
    expect(screen.getByText('kreft')).toBeInTheDocument();
  });
});
