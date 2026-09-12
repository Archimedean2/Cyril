import { test, expect } from './fixtures';

/**
 * C-42 / DESIGN_PROPOSAL.md §13.2 — clicking an Inventory chip puts its word in
 * the lyric.
 *
 * Worth proving in a real browser specifically because of focus: clicking a
 * button in the rail blurs the contenteditable, and a naive implementation
 * inserts into a selection that no longer exists (or drops the text entirely).
 * jsdom has no real selection model, so only a browser can tell us the word
 * actually lands where the writer left off.
 */
test.describe('Stage 14: an Inventory chip puts its word in the lyric (C-42)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('create-project-button').click();
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });
  });

  test('T-14.30: clicking a chip inserts at the caret and hands focus back to the lyric', async ({ page }) => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await page.keyboard.type('there is nothing ', { delay: 20 });

    // Collect a word the long way round, so the test does not depend on the network.
    await page.getByTestId('inventory-add-input').fill('left');
    await page.getByTestId('inventory-add-button').click();
    await expect(page.getByTestId('inventory-chip').first()).toBeVisible();

    // Put the caret back at the end of the lyric, then click the chip.
    await editor.click();
    await page.keyboard.press('End');
    await page.getByTestId('inventory-chip-insert').first().click();

    await expect(editor).toContainText('there is nothing left');

    // The writer can keep typing straight away — focus came back with the word.
    const editorHasFocus = await page.evaluate(() =>
      document.activeElement?.classList.contains('ProseMirror') ?? false
    );
    expect(editorHasFocus).toBe(true);

    await page.keyboard.type(' to lose', { delay: 20 });
    await expect(editor).toContainText('there is nothing left to lose');
  });

  test('T-14.31: the inserted word undoes in a single step', async ({ page }) => {
    const editor = page.locator('.ProseMirror').first();
    await editor.click();
    await page.keyboard.type('there is nothing ', { delay: 20 });

    await page.getByTestId('inventory-add-input').fill('left');
    await page.getByTestId('inventory-add-button').click();
    await editor.click();
    await page.keyboard.press('End');
    await page.getByTestId('inventory-chip-insert').first().click();
    await expect(editor).toContainText('there is nothing left');

    await page.keyboard.press('ControlOrMeta+z');

    // One undo removes the whole word — not one letter of it.
    await expect(editor).not.toContainText('left');
    await expect(editor).toContainText('there is nothing');
  });
});
