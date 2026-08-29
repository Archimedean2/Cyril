/**
 * T-14.23 — the rhyme list must stay skimmable.
 *
 * Regression guard for a real defect (D-25): the secondary copy control was
 * rendered in the normal layout flow at `opacity: 0`, so it reserved width beside
 * every single result, and each result carried its own comma element. The gaps
 * varied word to word and commas orphaned themselves at the start of wrapped
 * lines, which is exactly what a writer scanning forty rhymes cannot tolerate.
 *
 * jsdom runs no layout, so the "out of flow" half is asserted against the CSS
 * source. That is deliberate: a pixel assertion here could never fail.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import { ToolsResultsList } from '../../../src/features/tools-pane/ToolsResultsList';

const response = {
  term: 'left',
  mode: 'rhyme-exact' as const,
  loading: false,
  source: 'live' as const,
  results: [
    { word: 'cleft', score: 46033, numSyllables: 1 },
    { word: 'deft', score: 12000, numSyllables: 1 },
    { word: 'klepht', score: 13, numSyllables: 1 },
  ],
};

const css = fs.readFileSync(path.join(process.cwd(), 'src/index.css'), 'utf8');
/** The declaration block for a selector, so we assert on the rule we mean. */
function ruleFor(selector: string): string {
  const i = css.indexOf(`\n${selector} {`);
  expect(i, `${selector} should exist in src/index.css`).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf('}', i));
}

describe('T-14.23: the rhyme list stays skimmable', () => {
  it('T-14.23: no comma separators are rendered between results', () => {
    const { container } = render(
      <ToolsResultsList response={response} onCopyResult={() => true} onCollectResult={() => {}} />,
    );
    expect(container.querySelectorAll('.rhyme-sep')).toHaveLength(0);
    // The words themselves are all still there — we removed punctuation, not content.
    for (const w of ['cleft', 'deft', 'klepht']) {
      expect(screen.getByText(w)).toBeInTheDocument();
    }
  });

  it('T-14.23: the copy control is taken out of the layout flow', () => {
    const rule = ruleFor('.rhyme-copy-btn');
    expect(rule).toMatch(/position:\s*absolute/);
    // In flow at opacity 0 it still reserves width — that was the bug.
    expect(rule).not.toMatch(/position:\s*(static|relative)/);
  });

  it('T-14.23: the word row lays out with an even, explicit gap', () => {
    const rule = ruleFor('.rhyme-word-row');
    expect(rule).toMatch(/flex-wrap:\s*wrap/);
    expect(rule).toMatch(/column-gap:\s*\d/);
  });

  it('T-14.23: copy is still reachable and labelled for screen readers', () => {
    render(<ToolsResultsList response={response} onCopyResult={() => true} onCollectResult={() => {}} />);
    const buttons = screen.getAllByRole('button', { name: /copy "\w+" to clipboard/i });
    expect(buttons).toHaveLength(3);
  });
});
