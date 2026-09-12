import { test, expect } from './fixtures';

/**
 * C-41 / DESIGN_PROPOSAL.md §13.1 — the double-click gesture itself, in a browser
 * that has layout.
 *
 * This is the half the unit tests deliberately cannot cover: ProseMirror resolves a
 * click to a document position through `posAtCoords`, which needs real glyph
 * geometry. jsdom reports every coordinate as 0, so only a real browser can prove
 * that double-clicking the word "left" looks up "left".
 *
 * The assertions stop at "the rail is now looking this word up" — which word was
 * requested, and that the editor kept focus. Whether Datamuse answers is the
 * network's business, and `stage-7-tools.spec.ts` already covers the result states;
 * asserting results here would make the gesture test fail for offline reasons.
 */
test.describe('Stage 14: look up a word by double-clicking it (C-41)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('create-project-button').click();
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });
  });

  async function typeLyric(page: import('@playwright/test').Page, text: string) {
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    // Typed with a delay: input rules fire on real keystroke pacing, and typing a
    // whole string in under a millisecond has produced false failures before
    // (see DEFECTS.md, "False alarms").
    await page.keyboard.type(text, { delay: 20 });
    return editor;
  }

  /**
   * Double-click the centre of a specific word. Playwright's own `dblclick`
   * targets an element's centre, which for a line of lyric is whatever word
   * happens to sit in the middle — so measure the word's own client rect and
   * click that.
   */
  async function dblclickWord(page: import('@playwright/test').Page, word: string) {
    const box = await page.evaluate((target) => {
      const walker = document.createTreeWalker(document.querySelector('.ProseMirror')!, NodeFilter.SHOW_TEXT);
      const node = walker.nextNode() as Text | null;
      if (!node) return null;
      const index = node.data.indexOf(target);
      if (index < 0) return null;
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + target.length);
      const rect = range.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }, word);

    expect(box, `could not locate the word "${word}" on screen`).not.toBeNull();
    await page.mouse.dblclick(box!.x, box!.y);
  }

  test('T-14.24: double-clicking a word looks it up without taking focus from the lyric', async ({ page }) => {
    await typeLyric(page, 'there is nothing left to lose');
    await dblclickWord(page, 'left');

    // The rail is now looking up exactly that word…
    await expect(page.getByTestId('tools-search-input')).toHaveValue('left');
    await expect(page.getByTestId('tools-lookup-subject')).toContainText('left');

    // …and the writer never left the lyric.
    const editorHasFocus = await page.evaluate(() =>
      document.activeElement?.classList.contains('ProseMirror') ?? false
    );
    expect(editorHasFocus).toBe(true);
  });

  test('T-14.27: with the setting off, double-click only selects', async ({ page }) => {
    const editor = await typeLyric(page, 'there is nothing left to lose');

    await page.getByTestId('tools-lookup-pref-checkbox').uncheck();
    await editor.click();
    await dblclickWord(page, 'left');

    // No lookup was raised…
    await expect(page.getByTestId('tools-search-input')).toHaveValue('');
    await expect(page.getByTestId('tools-lookup-subject')).toHaveCount(0);

    // …but the browser still selected the word, which is the whole point of "only selects".
    const selected = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selected.trim()).toBe('left');
  });
});
