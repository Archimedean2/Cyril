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

    // Type some text then toggle it to a speaker line
    await page.locator('[data-testid="editor-surface"] .ProseMirror').click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('WOODY');
    await page.click('[data-testid="toolbar-speaker"]');
    await expect(page.locator('[data-line-type="speaker"]')).toBeAttached();

    // Type some text then toggle it to a stage direction
    await page.keyboard.press('Enter');
    await page.keyboard.type('Sighs heavily');
    await page.click('[data-testid="toolbar-stage-dir"]');
    await expect(page.locator('[data-line-type="stageDirection"]')).toBeAttached();

    // Toggle display settings
    const sectionToggle = page.locator('[data-testid="toggle-show-sections"]');
    await sectionToggle.uncheck();
    await expect(sectionToggle).not.toBeChecked();

    const speakerToggle = page.locator('[data-testid="toggle-show-speakers"]');
    await speakerToggle.uncheck();
    await expect(speakerToggle).not.toBeChecked();
  });
});
