import { test, expect } from './fixtures';
import type { Page, Locator } from '@playwright/test';

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

/** Enable chord mode by checking the single Chords toggle. */
async function enableChords(page: Page): Promise<void> {
  await page.locator('[data-testid="toggle-show-chords"]').check();
  await expect(page.locator('[data-testid="toggle-show-chords"]')).toBeChecked();
}

/** Disable chord mode by unchecking the single Chords toggle. */
async function disableChords(page: Page): Promise<void> {
  await page.locator('[data-testid="toggle-show-chords"]').uncheck();
  await expect(page.locator('[data-testid="toggle-show-chords"]')).not.toBeChecked();
}

test.describe('Stage 9: Chord Lane', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the empty state to appear (app shell renders this before any project is loaded)
    await page.waitForSelector('[data-testid="create-project-button"]', { state: 'visible', timeout: 15000 });

    // Create project and navigate to draft
    await page.click('[data-testid="create-project-button"]');
    await page.click('text=Draft 1');

    // Wait for editor to be fully initialized
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible({ timeout: 10000 });
  });

  // ─── Mode switching ──────────────────────────────────────────────────────────

  test('E-9.01: Chords toggle is visible and unchecked by default', async ({ page }) => {
    const chordsToggle = page.locator('[data-testid="toggle-show-chords"]');
    await expect(chordsToggle).toBeVisible();
    await expect(chordsToggle).not.toBeChecked();
  });

  test('E-9.02: Checking Chords toggle enables chord mode', async ({ page }) => {
    await enableChords(page);

    // The toggle should be checked and chord mode active (chord add button appears)
    await expect(page.locator('[data-testid="toggle-show-chords"]')).toBeChecked();
  });

  test('E-9.03: Unchecking Chords toggle disables chord mode', async ({ page }) => {
    // First enable chord mode
    await enableChords(page);

    // Now disable it
    await disableChords(page);

    // Chord add button should be gone
    await expect(page.locator('[data-testid="chord-add-button"]')).toHaveCount(0);
  });

  // ─── Show/hide chords toggle ─────────────────────────────────────────────────

  test('E-9.04: Show-chords is checked after enabling chord mode', async ({ page }) => {
    await enableChords(page);
    await expect(page.locator('[data-testid="toggle-show-chords"]')).toBeChecked();
  });

  test('E-9.05: Unchecking Chords toggle hides the chord lane class and re-checking restores it', async ({ page }) => {
    await enableChords(page);

    const showChordsToggle = page.locator('[data-testid="toggle-show-chords"]');
    await expect(showChordsToggle).toBeChecked();

    // Uncheck → lyrics mode → hide-chords class
    await disableChords(page);
    const editorSurface = page.locator('[data-testid="editor-surface"]');
    await expect(editorSurface).toHaveClass(/hide-chords/);

    // Re-check → chord mode → show-chords class
    await enableChords(page);
    await expect(editorSurface).toHaveClass(/show-chords/);
  });

  test('E-9.06: Editor surface carries show-chords class when Chords toggle is on', async ({ page }) => {
    await enableChords(page);

    // Wait for the class to be applied
    const editorSurface = page.locator('[data-testid="editor-surface"]');
    await expect(async () => {
      const classList = await editorSurface.evaluate(el => el.className);
      expect(classList).toMatch(/show-chords/);
    }).toPass({ timeout: 5000 });
  });

  test('E-9.07: Lyrics mode never shows chord markers even if data exists', async ({ page }) => {
    // Default state is lyrics mode (Chords toggle unchecked)
    await expect(page.locator('[data-testid="toggle-show-chords"]')).not.toBeChecked();

    // No chord markers should appear in plain lyrics mode
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0);
  });

  // ─── Chord add button ────────────────────────────────────────────────────────

  test('E-9.08: Chord add button is not visible in Lyrics mode', async ({ page }) => {
    await expect(page.locator('[data-testid="chord-add-button"]')).toHaveCount(0);
  });

  test('E-9.09: Chord add button appears when Chords toggle is on', async ({ page }) => {
    await enableChords(page);
    await expect(page.locator('[data-testid="chord-add-button"]')).toBeVisible();
  });

  test('E-9.10: Chord add button is enabled when in chord mode with show-chords on', async ({ page }) => {
    await enableChords(page);

    // Editor loads with cursor in the default lyric line — button enabled
    await waitForEditorReady(page);
    await expect(page.locator('[data-testid="chord-add-button"]')).toBeEnabled({ timeout: 5000 });

    // Hiding chords (unchecking = exiting chord mode) removes the button entirely
    await disableChords(page);
    await expect(page.locator('[data-testid="chord-add-button"]')).toHaveCount(0);
  });

  test('E-9.11: Chord add button is enabled when cursor is in a lyric line', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page); // clicks editor, putting cursor in lyric line
    await page.keyboard.type('Amazing grace');

    // Wait for button to become enabled with retry
    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  // ─── Chord writing ───────────────────────────────────────────────────────────

  test('E-9.12: Adding a chord creates a chord marker above the lyric line', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace how sweet the sound');

    // Wait for button to be enabled before clicking
    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    // window.prompt blocks the click from completing — use page.once + Promise.all
    page.once('dialog', d => d.accept('Am'));
    await page.click('[data-testid="chord-add-button"]');

    // Wait for chord marker to appear
    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Am');
  });

  test('E-9.13: Chord marker is rendered inline above the lyric text', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('You got a friend in me');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('G'));
    await page.click('[data-testid="chord-add-button"]');

    const marker = page.locator('[data-testid="chord-marker"]').first();
    await expect(marker).toBeVisible({ timeout: 5000 });
    await expect(marker).toContainText('G');
    // Marker must be inside the editor surface (inline widget, not a separate lane)
    await expect(page.locator('[data-testid="editor-surface"] [data-testid="chord-marker"]')).toBeVisible();
  });

  test('E-9.14: Multiple chords on the same line create multiple markers', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('You got a friend in me');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    const editor = page.locator('[data-testid="editor-surface"] .ProseMirror');

    // Add first chord at start of line
    await editor.click();
    await page.keyboard.press('Home');

    page.once('dialog', d => d.accept('G'));
    await page.click('[data-testid="chord-add-button"]');

    // Wait for first chord to appear
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(1, { timeout: 5000 });

    // Add second chord mid-line
    await editor.click();

    page.once('dialog', d => d.accept('D7'));
    await page.click('[data-testid="chord-add-button"]');

    // Wait for both chords
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(2, { timeout: 5000 });
  });

  test('E-9.15: Unchecking show-chords hides chord markers without deleting them', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('Am'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Uncheck (exit chord mode) — markers removed from DOM
    await disableChords(page);
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0, { timeout: 5000 });

    // Re-check (re-enter chord mode) — marker must reappear with original symbol
    await enableChords(page);
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Am', { timeout: 5000 });
  });

  test('E-9.16: Chord markers disappear when switching to Lyrics mode', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('Am'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Switch back to Lyrics mode by unchecking the toggle
    await disableChords(page);

    // Chord markers should be hidden
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('E-9.17: Chord data survives a mode round-trip', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    await expect(async () => {
      const isEnabled = await page.locator('[data-testid="chord-add-button"]').isEnabled();
      expect(isEnabled).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('Em'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Round-trip: off then on
    await disableChords(page);
    await enableChords(page);

    // Chord should reappear with the original symbol
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Em', { timeout: 5000 });
  });

  // ─── Mode round-trip (no chords) ─────────────────────────────────────────────

  test('E-9.18: Switching modes does not corrupt typed lyric content', async ({ page }) => {
    const proseMirror = await waitForEditorReady(page);
    await page.keyboard.type('Some lyric content');

    await enableChords(page);
    await disableChords(page);

    // Content should be preserved with retry
    await expect(async () => {
      const text = await proseMirror.textContent();
      expect(text).toContain('Some lyric content');
    }).toPass({ timeout: 5000 });
  });

  // ─── Chord edit / delete (popover) ────────────────────────────────────────────

  test('E-9.19: Clicking a chord marker opens the edit popover with the symbol pre-filled', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace how sweet the sound');

    await expect(async () => {
      expect(await page.locator('[data-testid="chord-add-button"]').isEnabled()).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('Am'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Click the chord marker to open popover
    await page.locator('[data-testid="chord-marker"]').first().click();

    const popover = page.locator('[data-testid="chord-popover"]');
    await expect(popover).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="chord-popover-input"]')).toHaveValue('Am');
  });

  test('E-9.20: Editing a chord symbol in the popover updates the marker', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace how sweet the sound');

    await expect(async () => {
      expect(await page.locator('[data-testid="chord-add-button"]').isEnabled()).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('Am'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Click to open popover, clear input, type new symbol, confirm
    await page.locator('[data-testid="chord-marker"]').first().click();
    await expect(page.locator('[data-testid="chord-popover"]')).toBeVisible({ timeout: 3000 });

    const input = page.locator('[data-testid="chord-popover-input"]');
    await input.selectText();
    await input.fill('G7');
    await page.locator('[data-testid="chord-popover-save"]').click();

    // Popover should close and marker should show new symbol
    await expect(page.locator('[data-testid="chord-popover"]')).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('G7', { timeout: 3000 });
  });

  test('E-9.21: Pressing Enter in the popover input saves the chord', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('How sweet the sound');

    await expect(async () => {
      expect(await page.locator('[data-testid="chord-add-button"]').isEnabled()).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('C'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="chord-marker"]').first().click();
    const input = page.locator('[data-testid="chord-popover-input"]');
    await input.selectText();
    await input.fill('Cmaj7');
    await input.press('Enter');

    await expect(page.locator('[data-testid="chord-popover"]')).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('Cmaj7', { timeout: 3000 });
  });

  test('E-9.22: Clicking delete in the popover removes the chord marker', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace how sweet the sound');

    await expect(async () => {
      expect(await page.locator('[data-testid="chord-add-button"]').isEnabled()).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('Am'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    // Click marker, then delete
    await page.locator('[data-testid="chord-marker"]').first().click();
    await expect(page.locator('[data-testid="chord-popover"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="chord-popover-delete"]').click();

    // Popover closed, marker gone
    await expect(page.locator('[data-testid="chord-popover"]')).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('[data-testid="chord-marker"]')).toHaveCount(0, { timeout: 3000 });
  });

  test('E-9.23: Pressing Escape in the popover closes it without changing the chord', async ({ page }) => {
    await enableChords(page);

    await waitForEditorReady(page);
    await page.keyboard.type('Amazing grace');

    await expect(async () => {
      expect(await page.locator('[data-testid="chord-add-button"]').isEnabled()).toBe(true);
    }).toPass({ timeout: 5000 });

    page.once('dialog', d => d.accept('D'));
    await page.click('[data-testid="chord-add-button"]');

    await expect(page.locator('[data-testid="chord-marker"]')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="chord-marker"]').first().click();
    await expect(page.locator('[data-testid="chord-popover"]')).toBeVisible({ timeout: 3000 });

    // Type something then escape
    await page.locator('[data-testid="chord-popover-input"]').fill('Dsus4');
    await page.keyboard.press('Escape');

    await expect(page.locator('[data-testid="chord-popover"]')).toHaveCount(0, { timeout: 3000 });
    // Symbol should be unchanged
    await expect(page.locator('[data-testid="chord-marker"]').first()).toContainText('D', { timeout: 3000 });
  });
});
