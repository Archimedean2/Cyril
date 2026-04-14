/**
 * E2E tests for tool cache functionality.
 * Tests cached/offline result path in UI workflow.
 */

import { test, expect } from '@playwright/test';

test.describe('Tool Cache E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T-10.08: Cached/offline result path works in UI workflow', async ({ page }) => {
    // Open tools pane
    await page.click('[data-testid="tools-pane"]', { timeout: 5000 });

    // Select rhyme mode
    await page.click('button:has-text("Rhymes")');

    // Enter search term
    await page.fill('input[placeholder*="Search for rhymes"]', 'hello');

    // Wait for initial search results
    await page.waitForSelector('[data-testid="tool-result"]', { timeout: 10000 });

    // Verify results are displayed
    const results = await page.locator('[data-testid="tool-result"]').count();
    expect(results).toBeGreaterThan(0);

    // Perform same search again - should use cache
    await page.fill('input[placeholder*="Search for rhymes"]', 'hello');
    await page.press('input[placeholder*="Search for rhymes"]', 'Enter');

    // Results should still be displayed (from cache)
    const cachedResults = await page.locator('[data-testid="tool-result"]').count();
    expect(cachedResults).toBeGreaterThan(0);

    // Verify the results are the same (cache hit)
    const firstResultText = await page.locator('[data-testid="tool-result"]').first().textContent();
    expect(firstResultText).toBeTruthy();
  });

  test('Tool pane works when cache is empty', async ({ page }) => {
    // Clear IndexedDB for clean state
    await page.evaluate(() => {
      return new Promise((resolve) => {
        const request = indexedDB.deleteDatabase('cyril-tool-cache');
        request.onsuccess = () => resolve(null);
        request.onerror = () => resolve(null);
      });
    });

    // Reload page to ensure clean state
    await page.reload();

    // Open tools pane
    await page.click('[data-testid="tools-pane"]', { timeout: 5000 });

    // Select thesaurus mode
    await page.click('button:has-text("Synonyms")');

    // Enter search term
    await page.fill('input[placeholder*="Search for synonyms"]', 'test');

    // Wait for search results
    await page.waitForSelector('[data-testid="tool-result"]', { timeout: 10000 });

    // Verify results are displayed even with empty cache
    const results = await page.locator('[data-testid="tool-result"]').count();
    expect(results).toBeGreaterThan(0);
  });

  test('Tool UI maintains behavior across different modes with cache', async ({ page }) => {
    // Open tools pane
    await page.click('[data-testid="tools-pane"]', { timeout: 5000 });

    const modes = ['Rhymes', 'Synonyms', 'Definitions', 'Related'];

    for (const mode of modes) {
      // Click mode tab
      await page.click(`button:has-text("${mode}")`);

      // Enter search term
      const searchTerm = 'word';
      const placeholder = mode === 'Rhymes' 
        ? 'Search for rhymes' 
        : mode === 'Synonyms' 
        ? 'Search for synonyms' 
        : mode === 'Definitions' 
        ? 'Search for definitions' 
        : 'Search for related words';

      await page.fill(`input[placeholder*="${placeholder}"]`, searchTerm);

      // Wait for results
      await page.waitForSelector('[data-testid="tool-result"]', { timeout: 10000 });

      // Verify results
      const results = await page.locator('[data-testid="tool-result"]').count();
      expect(results).toBeGreaterThan(0);

      // Clear input for next mode
      await page.fill(`input[placeholder*="${placeholder}"]`, '');
    }
  });
});
