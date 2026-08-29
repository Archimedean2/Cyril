/**
 * T-15.11: Visual regression baselines (C-34).
 *
 * Playwright's own `toHaveScreenshot()` — no external service. Run explicitly with
 * `npm run test:visual`; this file is excluded from the default `npm run test:e2e`
 * project (see `playwright.config.ts`) so a font-rendering diff never blocks an
 * unrelated PR.
 *
 * Baselines are keyed by `{platform}` via `snapshotPathTemplate` in
 * `playwright.config.ts`, because font rasterization genuinely differs between macOS
 * (dev) and Linux (CI) — a baseline from one will always fail on the other.
 *
 * Determinism measures applied (see the C-34 report for how each was verified):
 *  - The launch screen's pull-quote is a fixed fallback with no project open — no
 *    randomness to freeze (verified by reading `LaunchScreen.tsx`: it always renders
 *    `FALLBACK_QUOTE`; there is no "recent draft" quote source in this build).
 *  - The save-status text is masked (it changes from "Unsaved" to "Saved in
 *    browser…" over time).
 *  - The editor is blurred before every shot that has typed content, so the caret
 *    doesn't blink into the diff.
 *  - `animations: 'disabled'` on every screenshot call (panel-resize/focus-mode
 *    transitions).
 *  - `document.fonts.ready` is awaited before every shot.
 *  - The Tools-pane network call is mocked with a fixed payload (shot 6), using the
 *    same request shape as the journey test (read from
 *    `src/domain/tools/datamuse-provider.ts`).
 */
import { test, expect, focusEditor, writeSection, writeSpeaker, toggleView, typeSlowly } from './fixtures';
import type { Page, Locator } from '@playwright/test';

const SAVE_STATUS_MASK = (page: Page): Locator[] => {
  const el = page.getByTestId('save-status');
  return [el];
};

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
}

async function blurEditor(page: Page): Promise<void> {
  await page.locator('.ProseMirror').first().evaluate((el) => (el as HTMLElement).blur());
}

/** Create a project and write a section, a speaker line and two lyric lines. */
async function setUpEditorWithContent(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('create-project-button').click();
  await page.locator('.ProseMirror').first().waitFor({ state: 'visible' });
  await focusEditor(page);
  await writeSection(page, 'Verse 1');
  await writeSpeaker(page, 'ANNA');
  await typeSlowly(page, 'Sing me a song for the morning');
  await page.keyboard.press('Enter');
  await typeSlowly(page, 'Every word a little light');
  await blurEditor(page);
}

test.describe('Visual regression (C-34)', () => {
  test('shot 1: launch screen @1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByTestId('launch-screen')).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot('01-launch-screen.png', { animations: 'disabled' });
  });

  test('shot 2: editor with section, speaker, two lyric lines @1440x900', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setUpEditorWithContent(page);
    await settle(page);
    await expect(page).toHaveScreenshot('02-editor-with-content-1440.png', {
      animations: 'disabled',
      mask: SAVE_STATUS_MASK(page),
    });
  });

  test('shot 3: editor with content, narrow pane @1024 wide (D-17)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await setUpEditorWithContent(page);
    await settle(page);
    await expect(page).toHaveScreenshot('03-editor-with-content-1024.png', {
      animations: 'disabled',
      mask: SAVE_STATUS_MASK(page),
    });
  });

  test('shot 4: editor with Syllables + Stress marks on @1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setUpEditorWithContent(page);
    await toggleView(page, 'Syllables');
    await toggleView(page, 'Stress marks');
    await blurEditor(page);
    await settle(page);
    await expect(page).toHaveScreenshot('04-syllables-and-stress-marks.png', {
      animations: 'disabled',
      mask: SAVE_STATUS_MASK(page),
    });
  });

  test('shot 5: editor with Chords on @1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setUpEditorWithContent(page);
    await toggleView(page, 'Chords');
    await blurEditor(page);
    await settle(page);
    await expect(page).toHaveScreenshot('05-chords-on.png', {
      animations: 'disabled',
      mask: SAVE_STATUS_MASK(page),
    });
  });

  test('shot 6: right rail with Inventory chips and Tools results @1440', async ({ page }) => {
    // Fixed Datamuse payload — same shape as the journey test, read from
    // src/domain/tools/datamuse-provider.ts, not guessed.
    await page.route('**/api.datamuse.com/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { word: 'night', score: 300, numSyllables: 1 },
          { word: 'delight', score: 250, numSyllables: 2 },
          { word: 'twilight', score: 200, numSyllables: 2 },
        ]),
      }),
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await setUpEditorWithContent(page);

    await page.getByTestId('tools-search-input').fill('night');
    await page.getByTestId('tools-search-button').click();
    await expect(page.getByTestId('tools-result-item').first()).toBeVisible();
    await page.getByTestId('tools-collect-button').first().click();
    await expect(page.getByTestId('inventory-chip').first()).toBeVisible();
    await blurEditor(page);
    await settle(page);

    await expect(page.locator('.right-sidebar')).toHaveScreenshot('06-right-rail.png', {
      animations: 'disabled',
    });
  });

  test('shot 7: print preview, libretto profile @1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setUpEditorWithContent(page);

    await page.getByTestId('export-button').click();
    const exportDialog = page.getByTestId('export-dialog');
    await expect(exportDialog).toBeVisible();
    await page.getByTestId('export-print-button').click();
    await page.getByTestId('print-profile-libretto').click();
    await expect(page.getByTestId('print-profile-libretto')).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.frameLocator('[data-testid="print-preview-frame"]').locator('body'),
    ).toContainText('Sing me a song for the morning');
    await settle(page);

    await expect(exportDialog).toHaveScreenshot('07-print-preview-libretto.png', {
      animations: 'disabled',
    });
  });

  test('shot 8: focus mode @1440', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setUpEditorWithContent(page);
    await page.getByTestId('focus-mode-btn').click();
    await expect(page.getByTestId('focus-mode-btn')).toHaveAttribute('aria-pressed', 'true');
    await blurEditor(page);
    await settle(page);

    await expect(page).toHaveScreenshot('08-focus-mode.png', {
      animations: 'disabled',
      mask: SAVE_STATUS_MASK(page),
    });
  });
});
