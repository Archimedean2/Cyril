import { test, expect } from '@playwright/test';

test.describe('Stage 12: Lightweight Sharing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app to initialize
    await page.waitForTimeout(500);
  });

  test('T-12.19: Share button is visible in ExportDialog', async ({ page }) => {
    // Open the export dialog via the export button in TopBar
    await page.click('[data-testid="export-button"]');

    // Verify ExportDialog is open
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible();

    // Verify Copy Share button is visible
    await expect(page.locator('[data-testid="export-share-button"]')).toBeVisible();
  });

  test('T-12.20: Copy Share button shows feedback on click', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write']);

    // Open export dialog and click share
    await page.click('[data-testid="export-button"]');
    await page.click('[data-testid="export-share-button"]');

    // Verify button text changes to indicate success
    await expect(page.locator('[data-testid="export-share-button"]')).toContainText('Copied!');
  });

  test('T-12.21: Import Share dialog can be opened from left nav', async ({ page }) => {
    // The import share button should be visible in the left nav
    await expect(page.locator('[data-testid="import-share-button"]')).toBeVisible();

    // Click to open the dialog
    await page.click('[data-testid="import-share-button"]');

    // Verify dialog is open
    await expect(page.locator('[data-testid="share-import-dialog"]')).toBeVisible();
  });

  test('T-12.22: Import Share dialog has input field and submit button', async ({ page }) => {
    await page.click('[data-testid="import-share-button"]');

    // Verify input field exists
    await expect(page.locator('[data-testid="share-import-input"]')).toBeVisible();

    // Verify submit button exists
    await expect(page.locator('[data-testid="share-import-submit"]')).toBeVisible();
  });

  test('T-12.23: Import Share dialog validates input format', async ({ page }) => {
    await page.click('[data-testid="import-share-button"]');

    // Enter invalid share blob
    await page.fill('[data-testid="share-import-input"]', 'invalid-blob');
    await page.click('[data-testid="share-import-submit"]');

    // Should show validation error
    await expect(page.locator('[data-testid="share-import-input"]')).toHaveCSS(
      'border-color',
      'rgb(204, 68, 68)'
    );
  });

  test('T-12.24: Import Share dialog closes on close button click', async ({ page }) => {
    await page.click('[data-testid="import-share-button"]');

    // Verify dialog is open
    await expect(page.locator('[data-testid="share-import-dialog"]')).toBeVisible();

    // Click close
    await page.click('[data-testid="share-import-dialog-close"]');

    // Verify dialog is closed
    await expect(page.locator('[data-testid="share-import-dialog"]')).not.toBeVisible();
  });

  test('T-12.25: Export settings are not affected by share', async ({ page }) => {
    // Open export dialog
    await page.click('[data-testid="export-button"]');

    // Toggle a setting
    await page.click('[data-testid="toggle-chords"]');

    // Close and reopen
    await page.click('[data-testid="export-dialog-close"]');
    await page.click('[data-testid="export-button"]');

    // Verify setting persisted (should still be toggled)
    const checkbox = page.locator('[data-testid="toggle-chords"] input');
    await expect(checkbox).toBeChecked();
  });
});
