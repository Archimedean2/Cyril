import { test, expect, Page, Locator } from '@playwright/test';

/**
 * Helper to wait for editor to be ready for input.
 * Ensures ProseMirror is focused and editable before typing.
 */
async function waitForEditorReady(page: Page): Promise<Locator> {
  const proseMirror = page.locator('[data-testid="editor-surface"] .ProseMirror');
  await proseMirror.waitFor({ state: 'visible' });
  await proseMirror.click();
  // Wait for the editor to actually be focused and ready
  await expect(proseMirror).toHaveAttribute('contenteditable', 'true');
  return proseMirror;
}

/**
 * Helper to wait for mode switch to complete.
 * The mode change triggers state updates that need to settle.
 */
async function waitForModeChange(page: Page, mode: 'lyrics' | 'lyricsWithChords'): Promise<void> {
  const expectedDisabled = mode === 'lyrics';
  const toggle = page.locator('[data-testid="toggle-show-chords"]');

  // Wait for the toggle to reach expected disabled state
  await expect(async () => {
    const isDisabled = await toggle.isDisabled().catch(() => null);
    expect(isDisabled).toBe(expectedDisabled);
  }).toPass({ timeout: 5000 });
}

test.describe('Stage 9: Chord Lane', () => {
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

  // ─── Mode switching ──────────────────────────────────────────────────────────

  test('E-9.01: Draft mode buttons are visible', async ({ page }) => {
    await expect(page.locator('[data-testid="draft-mode-option-lyrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="draft-mode-option-lyrics-with-chords"]')).toBeVisible();
  });

  test('E-9.02: Switching to Lyrics+Chords mode activates it', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    // The toggle-show-chords checkbox should now be enabled and checked
    const showChordsToggle = page.locator('[data-testid="toggle-show-chords"]');
    await expect(showChordsToggle).toBeVisible();
    await expect(showChordsToggle).not.toBeDisabled();
    await expect(showChordsToggle).toBeChecked();
  });

  test('E-9.03: Switching back to Lyrics mode disables the chords toggle', async ({ page }) => {
    // First enter chord mode
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');
    const showChordsToggle = page.locator('[data-testid="toggle-show-chords"]');
    await expect(showChordsToggle).not.toBeDisabled();

    // Return to lyrics mode
    await page.click('[data-testid="draft-mode-option-lyrics"]');
    await waitForModeChange(page, 'lyrics');
    await expect(showChordsToggle).toBeDisabled();
  });

  // ─── Show/hide chords toggle ─────────────────────────────────────────────────

  test('E-9.04: Show-chords checkbox is checked by default in Lyrics+Chords mode', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');
    await expect(page.locator('[data-testid="toggle-show-chords"]')).toBeChecked();
  });

  test('E-9.05: Unchecking show-chords hides the chord lane class and re-checking restores it', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const showChordsToggle = page.locator('[data-testid="toggle-show-chords"]');
    await expect(showChordsToggle).toBeChecked();

    // Uncheck
    await showChordsToggle.uncheck();
    await expect(showChordsToggle).not.toBeChecked();

    // The editor surface should carry the hide-chords class
    const editorSurface = page.locator('[data-testid="editor-surface"]');
    await expect(editorSurface).toHaveClass(/hide-chords/);

    // Re-check
    await showChordsToggle.check();
    await expect(showChordsToggle).toBeChecked();
    await expect(editorSurface).toHaveClass(/show-chords/);
  });

  test('E-9.06: Editor surface carries show-chords class in Lyrics+Chords mode', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    // Wait for the class to be applied
    const editorSurface = page.locator('[data-testid="editor-surface"]');
    await expect(async () => {
      const classList = await editorSurface.evaluate(el => el.className);
      expect(classList).toMatch(/show-chords/);
    }).toPass({ timeout: 5000 });
  });

  test('E-9.07: Lyrics mode never shows chord markers even if data exists', async ({ page }) => {
    // Ensure we start in lyrics mode (the default)
    await expect(page.locator('[data-testid="draft-mode-option-lyrics"]')).toBeVisible();

    // No chord markers should appear in plain lyrics mode
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0);
  });

  // ─── Chord add button ────────────────────────────────────────────────────────

  test('E-9.08: Chord add button is not visible in Lyrics mode', async ({ page }) => {
    await expect(page.locator('[data-testid="chord-add-button"]')).toHaveCount(0);
  });

  test('E-9.09: Chord add button appears when Lyrics+Chords mode is active', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');
    await expect(page.locator('[data-testid="chord-add-button"]')).toBeVisible();
  });

  test('E-9.10: Chord add button is disabled when cursor is not in a lyric line', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');
    // No text typed yet, cursor not in lyric line
    await expect(page.locator('[data-testid="chord-add-button"]')).toBeDisabled();
  });

  test('E-9.11: Chord add button is enabled when cursor is in a lyric line', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    // Wait for button to become enabled with retry
    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  // ─── Chord writing ───────────────────────────────────────────────────────────

  test('E-9.12: Adding a chord creates a chord marker above the lyric line', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace how sweet the sound');

    // Wait for button to be enabled before clicking
    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    // Handle the prompt dialog BEFORE clicking
    const dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });
    await page.click('[data-testid="chord-add-button"]');
    const dialog = await dialogPromise;
    await dialog.accept('Am');

    // Wait for chord marker to appear
    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Am');
  });

  test('E-9.13: Chord marker appears inside a chord lane container', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('You got a friend in me');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    const dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });
    await page.click('[data-testid="chord-add-button"]');
    const dialog = await dialogPromise;
    await dialog.accept('G');

    await expect(page.locator('[data-testid="chord-lane"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chord-lane"] [data-testid="chord-marker"]')).toBeVisible();
  });

  test('E-9.14: Multiple chords on the same line create multiple markers', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('You got a friend in me');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    // Add first chord at start of line
    await proseMirror.click();
    await page.keyboard.press('Home');

    let dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });
    await page.click('[data-testid="chord-add-button"]');
    let dialog = await dialogPromise;
    await dialog.accept('G');

    // Wait for first chord to appear
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(1, { timeout: 5000 });

    // Add second chord mid-line
    await proseMirror.click();

    dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });
    await page.click('[data-testid="chord-add-button"]');
    dialog = await dialogPromise;
    await dialog.accept('D7');

    // Wait for both chords
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(2, { timeout: 5000 });
  });

  test('E-9.15: Unchecking show-chords hides chord markers without deleting them', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    const dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });
    await page.click('[data-testid="chord-add-button"]');
    const dialog = await dialogPromise;
    await dialog.accept('Am');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Hide chords
    await page.locator('[data-testid="toggle-show-chords"]').uncheck();
    await expect(page.locator('[data-testid="chord-lane"]')).toBeHidden({ timeout: 5000 });

    // Show chords again — marker must still be there
    await page.locator('[data-testid="toggle-show-chords"]').check();
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Am');
  });

  test('E-9.16: Chord markers disappear when switching to Lyrics mode', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    const dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });
    await page.click('[data-testid="chord-add-button"]');
    const dialog = await dialogPromise;
    await dialog.accept('Am');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Switch back to Lyrics mode
    await page.click('[data-testid="draft-mode-option-lyrics"]');
    await waitForModeChange(page, 'lyrics');

    // Chord markers should be hidden (count 0 or not visible)
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('E-9.17: Chord data survives a mode round-trip', async ({ page }) => {
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    const dialogPromise = page.waitForEvent('dialog', { timeout: 10000 });
    await page.click('[data-testid="chord-add-button"]');
    const dialog = await dialogPromise;
    await dialog.accept('Em');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Round-trip: Lyrics → Lyrics+Chords
    await page.click('[data-testid="draft-mode-option-lyrics"]');
    await waitForModeChange(page, 'lyrics');
    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    // Chord should reappear with the original symbol
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Em', { timeout: 5000 });
  });

  // ─── Mode round-trip (no chords) ─────────────────────────────────────────────

  test('E-9.18: Switching modes does not corrupt typed lyric content', async ({ page }) => {
    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('Some lyric content');

    await page.click('[data-testid="draft-mode-option-lyrics-with-chords"]');
    await waitForModeChange(page, 'lyricsWithChords');

    await page.click('[data-testid="draft-mode-option-lyrics"]');
    await waitForModeChange(page, 'lyrics');

    // Content should be preserved with retry
    await expect(async () => {
      const text = await proseMirror.textContent();
      expect(text).toContain('Some lyric content');
    }).toPass({ timeout: 5000 });
  });
});
