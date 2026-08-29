import { test, expect } from './fixtures';

/**
 * Stage 13 — Concurrent Speakers e2e tests (T-13.15)
 *
 * Tests the full authoring workflow for concurrent blocks in the browser:
 * insert, speaker name edit, column navigation, and export.
 */

test.describe('Stage 13: Concurrent Speakers', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a new project so we have an active draft to work in
    await page.getByTestId('create-project-button').click();
    await expect(page.getByTestId('editor-toolbar')).toBeVisible();
  });

  test('T-13.15a: concurrent block can be inserted from the toolbar', async ({ page }) => {
    // Open the concurrent block dialog
    await page.getByTestId('toolbar-insert-concurrent').click();
    await expect(page.getByTestId('insert-concurrent-dialog')).toBeVisible();

    // Default is 2 speakers
    await expect(page.getByTestId('concurrent-speaker-name-input-0')).toBeVisible();
    await expect(page.getByTestId('concurrent-speaker-name-input-1')).toBeVisible();

    // Confirm insert
    await page.getByTestId('concurrent-dialog-confirm').click();
    await expect(page.getByTestId('insert-concurrent-dialog')).not.toBeVisible();

    // Concurrent block should appear in the editor
    await expect(page.locator('.concurrent-block')).toBeVisible();
  });

  test('T-13.15b: speaker names can be set in the dialog before inserting', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();

    // Change speaker names
    await page.getByTestId('concurrent-speaker-name-input-0').fill('ELPHABA');
    await page.getByTestId('concurrent-speaker-name-input-1').fill('GLINDA');

    await page.getByTestId('concurrent-dialog-confirm').click();

    // The header inputs show the names (inputs: use toHaveValue, not toContainText)
    await expect(page.locator('[data-testid="concurrent-speaker-name-0"]')).toHaveValue('ELPHABA');
    await expect(page.locator('[data-testid="concurrent-speaker-name-1"]')).toHaveValue('GLINDA');
  });

  test('T-13.15k: speaker names can be edited inline in the header after insertion', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await page.getByTestId('concurrent-dialog-confirm').click();

    // Click into the first speaker name input and change it
    const nameInput = page.locator('[data-testid="concurrent-speaker-name-0"]');
    await nameInput.click();
    await nameInput.fill('ELPHABA');
    // Blur to commit (Tab or click elsewhere)
    await page.keyboard.press('Tab');

    // The input should show the new name
    await expect(page.locator('[data-testid="concurrent-speaker-name-0"]')).toHaveValue('ELPHABA');

    // The editor cursor should NOT have jumped to after the block —
    // verify by typing into the first column lyric line
    const firstColumn = page.locator('.speaker-column').first();
    await firstColumn.locator('[data-type="lyricLine"]').first().click();
    await page.keyboard.type('still here');
    await expect(firstColumn).toContainText('still here');
  });

  test('T-13.15c: 3-speaker block can be inserted', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();

    // Select 3 speakers
    await page.getByTestId('concurrent-count-3').click();
    await expect(page.getByTestId('concurrent-speaker-name-input-2')).toBeVisible();

    await page.getByTestId('concurrent-dialog-confirm').click();

    // Should have 3 column headers
    await expect(page.locator('.concurrent-column-header')).toHaveCount(3);
  });

  test('T-13.15d: cancel button closes dialog without inserting', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await expect(page.getByTestId('insert-concurrent-dialog')).toBeVisible();

    await page.getByTestId('concurrent-dialog-cancel').click();
    await expect(page.getByTestId('insert-concurrent-dialog')).not.toBeVisible();
    await expect(page.locator('.concurrent-block')).not.toBeVisible();
  });

  test('T-13.15e: add column button appears when block has fewer than 4 columns', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await page.getByTestId('concurrent-dialog-confirm').click();

    // 2-column block should show add-column button
    await expect(page.getByTestId('concurrent-add-col-btn')).toBeVisible();
  });

  test('T-13.15f: add column button adds a new column', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await page.getByTestId('concurrent-dialog-confirm').click();

    // Start with 2 columns
    await expect(page.locator('.concurrent-column-header')).toHaveCount(2);

    // Add a third
    await page.getByTestId('concurrent-add-col-btn').click();
    await expect(page.locator('.concurrent-column-header')).toHaveCount(3);
  });

  test('T-13.15g: add column button disappears when block has 4 columns', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await page.getByTestId('concurrent-count-4').click();
    await page.getByTestId('concurrent-dialog-confirm').click();

    // 4-column block should NOT show add-column button
    await expect(page.getByTestId('concurrent-add-col-btn')).not.toBeVisible();
    await expect(page.locator('.concurrent-column-header')).toHaveCount(4);
  });

  test('T-13.15i: concurrent block spans the full editor surface width', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await page.getByTestId('concurrent-dialog-confirm').click();

    const surface = page.locator('[data-testid="editor-surface"]');
    const block = page.locator('.concurrent-block').first();

    const surfaceBox = await surface.boundingBox();
    const blockBox = await block.boundingBox();

    expect(surfaceBox).not.toBeNull();
    expect(blockBox).not.toBeNull();

    // Block should span most of the editor surface width
    // Allow tolerance for padding, borders, scrollbar
    expect(blockBox!.width).toBeGreaterThanOrEqual(surfaceBox!.width * 0.9);
  });

  test('T-13.15j: pressing Enter always stays in the same column', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await page.getByTestId('concurrent-dialog-confirm').click();

    const block = page.locator('.concurrent-block').first();

    // Click the lyric line inside the LAST (rightmost) column
    const lastColumn = block.locator('.speaker-column').last();
    const lastColumnLine = lastColumn.locator('[data-type="lyricLine"]').first();
    await lastColumnLine.click();

    // Type something so the line is non-empty, then press Enter
    await page.keyboard.type('hello');
    await page.keyboard.press('Enter');
    await page.keyboard.type('world');

    // Both lines should appear in the last column, not the first
    await expect(lastColumn).toContainText('hello');
    await expect(lastColumn).toContainText('world');

    // First column should have no user-typed text
    const firstColumn = block.locator('.speaker-column').first();
    await expect(firstColumn).not.toContainText('hello');
    await expect(firstColumn).not.toContainText('world');
  });

  test('T-13.15h: typing in first column does not leak into second column', async ({ page }) => {
    await page.getByTestId('toolbar-insert-concurrent').click();
    await page.getByTestId('concurrent-dialog-confirm').click();

    // Click into the editor region (first column)
    const block = page.locator('.concurrent-block');
    const firstColumn = block.locator('.speaker-column').first();
    await firstColumn.click();

    // Type some text
    await page.keyboard.type('Hello world');

    // Second column should be empty
    const secondColumn = block.locator('.speaker-column').nth(1);
    await expect(secondColumn).not.toContainText('Hello world');
  });
});
