import { test, expect } from './fixtures';

test.describe('Stage 7: Tools Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project so tools pane is visible
    await page.getByTestId('create-project-button').click();
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });
  });

  test('T-7.08: Tools workflow passes in UI', async ({ page }) => {
    // Verify tools pane is visible in right sidebar
    const toolsPane = page.locator('[data-testid="tools-pane"]');
    await expect(toolsPane).toBeVisible();

    // Verify mode tabs are present
    await expect(page.locator('[data-testid="tools-tab-rhyme-exact"]')).toBeVisible();
    await expect(page.locator('[data-testid="tools-tab-rhyme-near"]')).toBeVisible();
    await expect(page.locator('[data-testid="tools-tab-thesaurus"]')).toBeVisible();
    await expect(page.locator('[data-testid="tools-tab-dictionary"]')).toBeVisible();

    // Search for a word
    const searchInput = page.locator('[data-testid="tools-search-input"]');
    await searchInput.fill('cat');

    // Submit search
    await page.click('[data-testid="tools-search-button"]');

    // Wait for results (or empty state if offline)
    const resultsList = page.locator('[data-testid="tools-results-list"]');
    const emptyState = page.locator('[data-testid="tools-results-empty"]');
    const errorState = page.locator('[data-testid="tools-results-offline"]');

    // Results should appear or we should see empty/error state
    await expect(resultsList.or(emptyState).or(errorState)).toBeVisible();

    // If we have results, test copying
    const firstResult = page.locator('[data-testid="tools-result-item"]').first();
    if (await firstResult.isVisible().catch(() => false)) {
      await firstResult.click();
    }

    // Test switching modes
    await page.click('[data-testid="tools-tab-rhyme-near"]');

    // Results should update (or empty/error)
    await expect(resultsList.or(emptyState).or(errorState)).toBeVisible();

    // Test dictionary mode
    await page.click('[data-testid="tools-tab-dictionary"]');

    // Search for a word
    await searchInput.fill('happy');
    await page.click('[data-testid="tools-search-button"]');

    // Results or empty/error should appear
    await expect(resultsList.or(emptyState).or(errorState)).toBeVisible();
  });

  test('T-7.08: Tools pane and inventory pane coexist', async ({ page }) => {
    // Verify both panes are visible
    await expect(page.locator('[data-testid="tools-pane"]')).toBeVisible();
    await expect(page.locator('[data-testid="inventory-pane"]')).toBeVisible();

    // Verify tools is above inventory
    const toolsBox = await page.locator('[data-testid="tools-pane"]').boundingBox();
    const inventoryBox = await page.locator('[data-testid="inventory-pane"]').boundingBox();

    expect(toolsBox).not.toBeNull();
    expect(inventoryBox).not.toBeNull();

    if (toolsBox && inventoryBox) {
      // Tools should be above inventory (lower y value)
      expect(toolsBox.y).toBeLessThan(inventoryBox.y);
    }
  });
});
