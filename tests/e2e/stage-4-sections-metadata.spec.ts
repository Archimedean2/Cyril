import { test, expect } from '@playwright/test';

test.describe('Stage 4: Sections and Metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Create a project first
    await page.click('text=Create Project');
  });

  test('T-4.10: Section/metadata workflow passes in UI', async ({ page }) => {
    // Switch to Draft
    await page.click('text=Draft 1');

    // Wait for the draft editor to be visible
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();

    // Verify the display toggles are visible in the left sidebar
    await expect(page.locator('text=View')).toBeVisible();
    await expect(page.locator('[data-testid="toggle-show-sections"]')).toBeVisible();
    await expect(page.locator('[data-testid="toggle-show-speakers"]')).toBeVisible();

    // Try to insert a section
    await page.click('[data-testid="editor-add-section-button"]');
    
    // Check that section is added by inspecting the editor surface
    await expect(page.locator('[data-type="sectionBlock"]')).toBeVisible();

    // Try to insert speaker
    await page.click('[data-testid="editor-add-speaker-button"]');
    await expect(page.locator('[data-type="speakerLine"]')).toBeAttached();

    // Try to insert stage direction
    await page.click('[data-testid="editor-add-stagedir-button"]');
    await expect(page.locator('[data-type="stageDirection"]')).toBeAttached();

    // Try to insert lyric line
    await page.click('[data-testid="editor-add-lyricline-button"]');
    await expect(page.locator('[data-type="lyricLine"]')).toBeAttached();

    // Toggle display settings
    const sectionToggle = page.locator('[data-testid="toggle-show-sections"]');
    await sectionToggle.uncheck();
    await expect(sectionToggle).not.toBeChecked();

    const speakerToggle = page.locator('[data-testid="toggle-show-speakers"]');
    await speakerToggle.uncheck();
    await expect(speakerToggle).not.toBeChecked();
  });
});
