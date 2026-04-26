import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Helper to wait for editor to be ready for input.
 * Ensures ProseMirror is focused and editable before typing.
 */
async function waitForEditorReady(page: Page): Promise<Locator> {
  const proseMirror = page.locator('[data-testid="editor-surface"] .ProseMirror');
  await proseMirror.waitFor({ state: 'visible', timeout: 10000 });
  await proseMirror.click();
  // Wait for the editor to actually be focused and ready
  await expect(proseMirror).toHaveAttribute('contenteditable', 'true');
  return proseMirror;
}

/**
 * Helper to wait for line type conversion with retry.
 * Input rules and button clicks take time to process.
 */
async function waitForLineType(page: Page, lineType: string, timeout = 5000): Promise<void> {
  await expect(async () => {
    const line = page.locator(`[data-line-type="${lineType}"]`).first();
    const count = await line.count();
    expect(count).toBeGreaterThan(0);
  }).toPass({ timeout });
}

test.describe('Speaker and Stage Direction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for app shell to be fully loaded
    await page.waitForSelector('.app-shell', { state: 'visible', timeout: 15000 });

    // Create project and navigate to draft
    await page.click('text=Create Project');
    await page.click('text=Draft 1');

    // Wait for editor to be fully initialized
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible({ timeout: 10000 });
    // Ensure ProseMirror is ready
    await waitForEditorReady(page);
  });

  test('T-4.07a: Clicking Speaker button converts line to speaker type', async ({ page }) => {
    // Type some text
    await page.keyboard.type('WOODY');

    // Click the Speaker button
    await page.click('[data-testid="toolbar-speaker"]');

    // Wait for line type conversion with retry
    await waitForLineType(page, 'speaker');

    // Verify the line is now a speaker line by checking the DOM
    const speakerLine = page.locator('[data-line-type="speaker"]').first();
    await expect(speakerLine).toBeVisible();
    await expect(speakerLine).toContainText('WOODY');
  });

  test('T-4.07b: Clicking Speaker button again toggles back to lyric', async ({ page }) => {
    // Type text first
    await page.keyboard.type('CHARACTER');

    // Click Speaker button to make it a speaker line
    await page.click('[data-testid="toolbar-speaker"]');
    await waitForLineType(page, 'speaker');

    // Click Speaker button again to toggle back
    await page.click('[data-testid="toolbar-speaker"]');

    // Wait for line type to change back to lyric with retry
    await expect(async () => {
      const lyricLine = page.locator('[data-line-type="lyric"]').first();
      const count = await lyricLine.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    // Verify it's back to a regular lyric line
    const lyricLine = page.locator('[data-line-type="lyric"]').first();
    await expect(lyricLine).toBeVisible();
    await expect(lyricLine).toContainText('CHARACTER');
  });

  test('T-4.08a: Clicking Stage Dir button converts line to stage direction', async ({ page }) => {
    // Type some text
    await page.keyboard.type('Sighs heavily');

    // Click the Stage Dir button
    await page.click('[data-testid="toolbar-stage-dir"]');
    await waitForLineType(page, 'stageDirection');

    // Verify the line is now a stage direction
    const stageDirLine = page.locator('[data-line-type="stageDirection"]').first();
    await expect(stageDirLine).toBeVisible();
    await expect(stageDirLine).toContainText('Sighs heavily');
  });

  test('T-4.08b: Clicking Stage Dir button again toggles back to lyric', async ({ page }) => {
    // Type text first
    await page.keyboard.type('(whispers)');

    // Click Stage Dir button
    await page.click('[data-testid="toolbar-stage-dir"]');
    await waitForLineType(page, 'stageDirection');

    // Click again to toggle back
    await page.click('[data-testid="toolbar-stage-dir"]');

    // Wait for line type to change back to lyric with retry
    await expect(async () => {
      const lyricLine = page.locator('[data-line-type="lyric"]').first();
      const count = await lyricLine.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 5000 });

    // Verify it's back to lyric
    const lyricLine = page.locator('[data-line-type="lyric"]').first();
    await expect(lyricLine).toBeVisible();
  });

  test('T-4.09a: Typing [[ at line start converts to speaker line', async ({ page }) => {
    // Type [[ to trigger speaker conversion
    await page.keyboard.type('[[');

    // Wait for line type conversion with retry
    await waitForLineType(page, 'speaker');

    // Verify the line is now a speaker type
    const speakerLine = page.locator('[data-line-type="speaker"]').first();
    await expect(speakerLine).toBeVisible();
  });

  test('T-4.09b: Typing [[ then text creates speaker line with content', async ({ page }) => {
    // Type [[ followed by speaker name
    await page.keyboard.type('[[JESSE');

    // Wait for line type conversion with retry
    await waitForLineType(page, 'speaker');

    // Verify the line is a speaker line with the text
    const speakerLine = page.locator('[data-line-type="speaker"]').first();
    await expect(speakerLine).toBeVisible();
    await expect(speakerLine).toContainText('JESSE');
  });

  test('T-4.10a: Typing (( at line start converts to stage direction', async ({ page }) => {
    // Type (( to trigger stage direction conversion
    await page.keyboard.type('((');

    // Wait for line type conversion with retry
    await waitForLineType(page, 'stageDirection');

    // Verify the line is now a stage direction type
    const stageDirLine = page.locator('[data-line-type="stageDirection"]').first();
    await expect(stageDirLine).toBeVisible();
  });

  test('T-4.10b: Typing (( then text creates stage direction with content', async ({ page }) => {
    // Type (( followed by stage direction text
    await page.keyboard.type('((Sighs and looks away');

    // Wait for line type conversion with retry
    await waitForLineType(page, 'stageDirection');

    // Verify the line is a stage direction with the text
    const stageDirLine = page.locator('[data-line-type="stageDirection"]').first();
    await expect(stageDirLine).toBeVisible();
    await expect(stageDirLine).toContainText('Sighs and looks away');
  });

  test('T-4.11: Speaker and stage direction buttons are visible in toolbar', async ({ page }) => {
    // Verify both buttons are visible
    await expect(page.locator('[data-testid="toolbar-speaker"]')).toBeVisible();
    await expect(page.locator('[data-testid="toolbar-stage-dir"]')).toBeVisible();

    // Verify they have the correct labels
    await expect(page.locator('[data-testid="toolbar-speaker"]')).toContainText('Speaker');
    await expect(page.locator('[data-testid="toolbar-stage-dir"]')).toContainText('Stage Dir');
  });

  test('T-4.12: Multiple lines with different types in same document', async ({ page }) => {
    // Type first speaker line
    await page.keyboard.type('[[WOODY');
    await waitForLineType(page, 'speaker');

    // Press Enter to create new line
    await page.keyboard.press('Enter');

    // Type a lyric line
    await page.keyboard.type('You got a friend in me');

    // Press Enter and add stage direction
    await page.keyboard.press('Enter');
    await page.keyboard.type('((Woody smiles');
    await waitForLineType(page, 'stageDirection');

    // Verify all three line types exist with retry
    await expect(async () => {
      const speakerText = await page.locator('[data-line-type="speaker"]').first().textContent();
      expect(speakerText).toContain('WOODY');
    }).toPass({ timeout: 5000 });

    await expect(async () => {
      const lyricText = await page.locator('[data-line-type="lyric"]').first().textContent();
      expect(lyricText).toContain('You got a friend in me');
    }).toPass({ timeout: 5000 });

    await expect(async () => {
      const stageDirText = await page.locator('[data-line-type="stageDirection"]').first().textContent();
      expect(stageDirText).toContain('Woody smiles');
    }).toPass({ timeout: 5000 });
  });

  test('T-4.13: Speaker line text is rendered in bold after typing [[', async ({ page }) => {
    // Type [[ followed by speaker name
    await page.keyboard.type('[[WOODY');
    await waitForLineType(page, 'speaker');

    // Get the speaker line element
    const speakerLine = page.locator('[data-line-type="speaker"]').first();

    // Verify it contains the text
    await expect(speakerLine).toContainText('WOODY');

    // Verify it has bold styling with retry (CSS may take time to apply)
    await expect(async () => {
      const fontWeight = await speakerLine.evaluate(el => getComputedStyle(el).fontWeight);
      expect(fontWeight).toBe('700');
    }).toPass({ timeout: 5000 });

    // Verify it's uppercase with retry
    await expect(async () => {
      const textTransform = await speakerLine.evaluate(el => getComputedStyle(el).textTransform);
      expect(textTransform).toBe('uppercase');
    }).toPass({ timeout: 5000 });
  });

  test('T-4.14: Speaker line works outside of a section block', async ({ page }) => {
    // Verify we're not inside a section by checking no section-block exists
    const sectionCount = await page.locator('.section-block').count();
    expect(sectionCount).toBe(0);

    // Type [[ followed by speaker name (outside any section)
    await page.keyboard.type('[[BUZZ');
    await waitForLineType(page, 'speaker');

    // Verify the line is now a speaker type
    const speakerLine = page.locator('[data-line-type="speaker"]').first();
    await expect(speakerLine).toBeVisible();
    await expect(speakerLine).toContainText('BUZZ');
  });

  test('T-4.15: Stage direction works outside of a section block', async ({ page }) => {
    // Type (( followed by stage direction (outside any section)
    await page.keyboard.type('((To infinity and beyond!');
    await waitForLineType(page, 'stageDirection');

    // Verify the line is now a stage direction type
    const stageDirLine = page.locator('[data-line-type="stageDirection"]').first();
    await expect(stageDirLine).toBeVisible();
    await expect(stageDirLine).toContainText('To infinity and beyond!');
  });
});
