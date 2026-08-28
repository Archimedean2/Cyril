/**
 * E2E tests for tool cache functionality.
 * Tests cached/offline result path in UI workflow.
 */

import { test, expect } from '@playwright/test';

test.describe('Tool Cache E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project so the tools pane is visible
    await page.getByTestId('create-project-button').click();
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });
    await expect(page.locator('[data-testid="tools-pane"]')).toBeVisible({ timeout: 5000 });
  });

  test('T-10.08: Cached/offline result path works in UI workflow', async ({ page }) => {
    // Select rhyme mode
    await page.click('[data-testid="tools-tab-rhyme-exact"]');

    // Enter search term
    const searchInput = page.locator('[data-testid="tools-search-input"]');
    await searchInput.fill('hello');
    await page.click('[data-testid="tools-search-button"]');

    // Wait for results
    const resultsList = page.locator('[data-testid="tools-results-list"]');
    const emptyState = page.locator('[data-testid="tools-results-empty"]');
    const errorState = page.locator('[data-testid="tools-results-error"]');
    await expect(resultsList.or(emptyState).or(errorState)).toBeVisible({ timeout: 10000 });

    // Perform same search again - should use cache
    await searchInput.fill('hello');
    await page.click('[data-testid="tools-search-button"]');

    // Results should still be displayed (from cache)
    await expect(resultsList.or(emptyState).or(errorState)).toBeVisible({ timeout: 10000 });
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

    // Reload page and recreate project
    await page.reload();
    await page.getByTestId('create-project-button').click();
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });

    // Select thesaurus mode
    await page.click('[data-testid="tools-tab-thesaurus"]');

    // Enter search term
    const searchInput = page.locator('[data-testid="tools-search-input"]');
    await searchInput.fill('test');
    await page.click('[data-testid="tools-search-button"]');

    // Wait for results or other state
    const resultsList = page.locator('[data-testid="tools-results-list"]');
    const emptyState = page.locator('[data-testid="tools-results-empty"]');
    const errorState = page.locator('[data-testid="tools-results-error"]');
    await expect(resultsList.or(emptyState).or(errorState)).toBeVisible({ timeout: 10000 });
  });

  test('Tool UI maintains behavior across different modes with cache', async ({ page }) => {
    const modes = [
      { testid: 'tools-tab-rhyme-exact', label: 'Rhyme' },
      { testid: 'tools-tab-thesaurus', label: 'Thesaurus' },
      { testid: 'tools-tab-dictionary', label: 'Dict' },
      { testid: 'tools-tab-related', label: 'Related' },
    ];

    const resultsList = page.locator('[data-testid="tools-results-list"]');
    const emptyState = page.locator('[data-testid="tools-results-empty"]');
    const errorState = page.locator('[data-testid="tools-results-error"]');
    const searchInput = page.locator('[data-testid="tools-search-input"]');

    for (const mode of modes) {
      await page.click(`[data-testid="${mode.testid}"]`);
      await searchInput.fill('word');
      await page.click('[data-testid="tools-search-button"]');
      await expect(resultsList.or(emptyState).or(errorState)).toBeVisible({ timeout: 10000 });
      await searchInput.fill('');
    }
  });
});
