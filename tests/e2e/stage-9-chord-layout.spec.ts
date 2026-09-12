import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

/**
 * C-25 / DESIGN_PROPOSAL.md §4.4 — where a chord actually lands on the page.
 *
 * These two acceptance criteria have been true since C-17 but had nothing guarding them:
 * they are claims about *layout*, and jsdom runs none, so only a browser can check them.
 * Both are measured against the real glyph boxes rather than asserted about CSS source,
 * because the thing that matters to a writer is where the pill appears, not how it got there.
 */

/** Set up a chord-mode draft with one line of lyric, and return the editor locator. */
async function setUp(page: Page, text: string) {
  await page.goto('/');
  await page.waitForSelector('[data-testid="create-project-button"]', { state: 'visible', timeout: 15000 });
  await page.click('[data-testid="create-project-button"]');
  await page.click('text=Draft 1');
  await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible({ timeout: 10000 });
  await page.locator('[data-testid="toggle-show-chords"]').check();

  const editor = page.locator('[data-testid="editor-surface"] .ProseMirror');
  await editor.click();
  await page.keyboard.type(text, { delay: 20 });
  return editor;
}

/** Put the caret `offset` characters into the line, then add a chord there. */
async function addChordAt(page: Page, offset: number, symbol: string) {
  await page.keyboard.press('Home');
  for (let i = 0; i < offset; i++) await page.keyboard.press('ArrowRight');
  page.once('dialog', (d) => d.accept(symbol));
  await page.click('[data-testid="chord-add-button"]');
  await expect(page.locator(`[data-testid="chord-marker"][data-symbol="${symbol}"]`)).toBeVisible({ timeout: 5000 });
}

/**
 * The on-screen box of the `index`-th character of the LYRIC text.
 *
 * Walks every text node and skips any that sits inside a chord pill: adding a chord splits
 * the line's text node around the widget, so "the first text node" stops being the line
 * after the very first chord, and the pill's own label would otherwise be counted as lyric.
 */
async function charBox(page: Page, index: number) {
  return page.evaluate((i) => {
    const root = document.querySelector('[data-testid="editor-surface"] .ProseMirror')!;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let seen = 0;
    let node = walker.nextNode() as Text | null;
    while (node) {
      const insideChord = (node.parentElement?.closest('.cyril-chord-anchor')) !== null
        && (node.parentElement?.closest('.cyril-chord-anchor')) !== undefined;
      if (!insideChord) {
        if (i < seen + node.data.length) {
          const offset = i - seen;
          const range = document.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + 1);
          const rect = range.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        }
        seen += node.data.length;
      }
      node = walker.nextNode() as Text | null;
    }
    return null;
  }, index);
}

const pillBox = async (page: Page, symbol: string) => {
  const box = await page.locator(`[data-testid="chord-marker"][data-symbol="${symbol}"]`).boundingBox();
  expect(box, `chord "${symbol}" has no box on screen`).not.toBeNull();
  return box!;
};

test.describe('Stage 9: chord layout (C-25)', () => {
  test('E-9.27: a chord\'s left edge sits above the first letter of its anchor word', async ({ page }) => {
    await setUp(page, 'nothing left to lose');
    await addChordAt(page, 8, 'C'); // "left" starts at offset 8

    const letter = await charBox(page, 8);
    const pill = await pillBox(page, 'C');

    expect(letter).not.toBeNull();
    // Left-aligned to the anchor letter, not centred over it — a centred pill floats off to
    // the left of the word it belongs to, which is the defect C-17 fixed.
    expect(Math.abs(pill.x - letter!.left)).toBeLessThan(4);
  });

  test('E-9.28: the chord stays aligned when the line reflows at a narrower pane', async ({ page }) => {
    await setUp(page, 'nothing left to lose');
    await addChordAt(page, 8, 'C');

    await page.setViewportSize({ width: 1024, height: 900 });
    // Let the reflow settle before measuring.
    await expect(page.locator('[data-testid="chord-marker"][data-symbol="C"]')).toBeVisible();

    const letter = await charBox(page, 8);
    const pill = await pillBox(page, 'C');
    expect(Math.abs(pill.x - letter!.left)).toBeLessThan(4);
  });

  test('E-9.29: two chords on one word render at their own letters without overlapping', async ({ page }) => {
    await setUp(page, 'nothing left to lose');
    await addChordAt(page, 0, 'C');
    await addChordAt(page, 5, 'G');

    const first = await pillBox(page, 'C');
    const second = await pillBox(page, 'G');

    // Each over its own letter…
    const firstLetter = await charBox(page, 0);
    const secondLetter = await charBox(page, 5);
    expect(Math.abs(first.x - firstLetter!.left)).toBeLessThan(4);
    expect(Math.abs(second.x - secondLetter!.left)).toBeLessThan(4);

    // …and not on top of each other.
    expect(first.x + first.width).toBeLessThanOrEqual(second.x + 0.5);
  });

  test('E-9.30: an instrumental line renders its chords as a spaced run, not stacked', async ({ page }) => {
    await setUp(page, 'nothing left to lose');
    // A new, empty line: every chord added here belongs to a wordless measure (§4.4).
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');

    page.once('dialog', (d) => d.accept('Am'));
    await page.click('[data-testid="chord-add-button"]');
    page.once('dialog', (d) => d.accept('F'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-run"]')).toBeVisible();

    const am = await pillBox(page, 'Am');
    const f = await pillBox(page, 'F');
    // Before C-25 both landed at offset 0, one on top of the other.
    expect(am.x + am.width).toBeLessThanOrEqual(f.x + 0.5);
  });
});
