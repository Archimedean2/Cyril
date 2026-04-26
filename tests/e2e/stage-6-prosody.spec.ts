import { test, expect } from '@playwright/test';

test.describe('Stage 6: Prosody and Syllable Counts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Project');
    await page.click('text=Draft 1');
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();
  });

  // ─── Toggle ──────────────────────────────────────────────────────────────────

  test('T-6.08: Syllable toggle exists, is enabled, and is unchecked by default', async ({ page }) => {
    const toggle = page.locator('[data-testid="toggle-show-syllables"]');
    await expect(toggle).toBeAttached();
    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toBeChecked();
  });

  test('T-6.08a: Checking syllable toggle marks it as checked', async ({ page }) => {
    const toggle = page.locator('[data-testid="toggle-show-syllables"]');
    await toggle.check();
    await expect(toggle).toBeChecked();
  });

  test('T-6.08b: Unchecking syllable toggle marks it as unchecked', async ({ page }) => {
    const toggle = page.locator('[data-testid="toggle-show-syllables"]');
    await toggle.check();
    await toggle.uncheck();
    await expect(toggle).not.toBeChecked();
  });

  // ─── Badge rendering ─────────────────────────────────────────────────────────

  test('T-6.08c: No syllable badges visible when toggle is off', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace how sweet the sound');

    // Toggle is off by default — no badges
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(0);
  });

  test('T-6.08d: Syllable badge appears on a lyric line after enabling toggle', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace how sweet the sound');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible();
  });

  test('T-6.08e: Syllable badge shows a number for non-empty lyric lines', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Hello world');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    const badge = page.locator('[data-testid="syllable-count"]').first();
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/^\d+$/);
    expect(parseInt(text ?? '0')).toBeGreaterThan(0);
  });

  test('T-6.08f: Syllable count updates when lyric line content changes', async ({ page }) => {
    const lyricLine = page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first();
    await lyricLine.click();
    await page.keyboard.type('Hi');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    const badge = page.locator('[data-testid="syllable-count"]').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
    const countBefore = parseInt((await badge.textContent()) ?? '0');

    // Add more words — count should increase
    await lyricLine.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' there beautiful friend');

    const countAfter = parseInt((await badge.textContent()) ?? '0');
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test('T-6.08g: Disabling syllable toggle removes badges', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace');

    const toggle = page.locator('[data-testid="toggle-show-syllables"]');
    await toggle.check();
    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible();

    await toggle.uncheck();
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(0);
  });

  test('T-6.08h: Multiple lyric lines each get their own syllable badge', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace how sweet the sound');
    await page.keyboard.press('Enter');
    await page.keyboard.type('That saved a wretch like me');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(2);
  });

  test('T-6.08i: Syllable badge is visible in the DOM and shows a positive integer (breaks if extension not working)', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Hello world');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    const badge = page.locator('[data-testid="syllable-count"]').first();

    // Must be attached and visible — fails if the extension crashed or never mounted
    await expect(badge).toBeAttached();
    await expect(badge).toBeVisible();

    // Must contain a plain positive integer — fails if badge renders '–' or empty
    const text = (await badge.textContent()) ?? '';
    expect(text).toMatch(/^\d+$/);
    expect(parseInt(text, 10)).toBeGreaterThan(0);

    // Empty lines must NOT get a badge (the spurious '–' bug)
    await page.keyboard.press('Enter');
    // New empty line is present — badge count must stay at 1 (only the Hello world line)
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(1);
  });

  test('T-6.08j: Speaker and stage direction lines never get a syllable badge', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();

    // Type a lyric line, then convert to speaker, then add a stage direction
    await page.keyboard.type('Hello world');
    await page.click('[data-testid="toolbar-speaker"]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('Stage business here');
    await page.click('[data-testid="toolbar-stage-dir"]');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    // Neither speaker nor stage direction lines should have a badge
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(0);
  });
});

// ─── Syllable counter — full workflow ────────────────────────────────────────

test.describe('Stage 6: Syllable counter workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Project');
    await page.click('text=Draft 1');
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();
  });

  test('T-6.SYL.01: Type text → enable syllables → badge shows a positive integer', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace how sweet the sound');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    const badge = page.locator('[data-testid="syllable-count"]').first();
    await expect(badge).toBeVisible({ timeout: 5000 });

    const text = (await badge.textContent()) ?? '';
    expect(text).toMatch(/^\d+$/);
    expect(parseInt(text, 10)).toBeGreaterThan(0);
  });

  test('T-6.SYL.02: Badge updates when more words are typed', async ({ page }) => {
    const lyricLine = page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first();
    await lyricLine.click();
    await page.keyboard.type('Hi');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    const badge = page.locator('[data-testid="syllable-count"]').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
    const before = parseInt((await badge.textContent()) ?? '0', 10);

    await lyricLine.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' there beautiful world');

    await expect(async () => {
      const after = parseInt((await badge.textContent()) ?? '0', 10);
      expect(after).toBeGreaterThan(before);
    }).toPass({ timeout: 5000 });
  });

  test('T-6.SYL.03: Disabling syllable toggle removes badge from DOM', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace');

    const toggle = page.locator('[data-testid="toggle-show-syllables"]');
    await toggle.check();
    await expect(page.locator('[data-testid="syllable-count"]')).toBeVisible({ timeout: 5000 });

    await toggle.uncheck();
    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('T-6.SYL.04: Each lyric line gets its own badge', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace');
    await page.keyboard.press('Enter');
    await page.keyboard.type('How sweet the sound');

    await page.locator('[data-testid="toggle-show-syllables"]').check();

    await expect(page.locator('[data-testid="syllable-count"]')).toHaveCount(2, { timeout: 5000 });
  });
});

// ─── Stress marks — full workflow ────────────────────────────────────────────

test.describe('Stage 6: Stress marks workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create Project');
    await page.click('text=Draft 1');
    await expect(page.locator('[data-testid="draft-editor"]')).toBeVisible();
  });

  test('T-6.STR.01: Stress marks toggle exists and is unchecked by default', async ({ page }) => {
    const toggle = page.locator('[data-testid="toggle-show-stress-marks"]');
    await expect(toggle).toBeAttached();
    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toBeChecked();
  });

  test('T-6.STR.02: Type text → enable stress marks → .cyril-stress-mark spans appear', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace');

    // No marks before toggle
    await expect(page.locator('.cyril-stress-mark')).toHaveCount(0);

    await page.locator('[data-testid="toggle-show-stress-marks"]').check();

    // Every syllable of every word gets a mark — at least 1 per word
    await expect(page.locator('.cyril-stress-mark').first()).toBeVisible({ timeout: 5000 });
    const count = await page.locator('.cyril-stress-mark').count();
    expect(count).toBeGreaterThan(0);
    // Stressed syllables get / (blue), unstressed get ^ (grey)
    await expect(page.locator('.cyril-stress-mark--stressed').first()).toBeVisible({ timeout: 5000 });
  });

  test('T-6.STR.03: Stressed spans appear for each word, unstressed for multi-syllable words', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Hello world');

    await page.locator('[data-testid="toggle-show-stress-marks"]').check();

    // "Hello" = 2 syllables (1 stressed + 1 unstressed), "world" = 1 syllable (stressed)
    // Total marks = 3, stressed marks = 2
    await expect(page.locator('.cyril-stress-mark')).toHaveCount(3, { timeout: 5000 });
    await expect(page.locator('.cyril-stress-mark--stressed')).toHaveCount(2, { timeout: 5000 });
  });

  test('T-6.STR.04: Stress spans update when text changes', async ({ page }) => {
    const lyricLine = page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first();
    await lyricLine.click();
    await page.keyboard.type('Hi');

    await page.locator('[data-testid="toggle-show-stress-marks"]').check();
    await expect(page.locator('.cyril-stress-mark')).toHaveCount(1, { timeout: 5000 });

    // Add another word — total syllable mark count must increase
    await lyricLine.click();
    await page.keyboard.press('End');
    await page.keyboard.type(' there');

    // "Hi" (1) + "there" (1) = 2 marks minimum
    await expect(async () => {
      const n = await page.locator('.cyril-stress-mark').count();
      expect(n).toBeGreaterThanOrEqual(2);
    }).toPass({ timeout: 5000 });
  });

  test('T-6.STR.05: Disabling stress toggle removes all .cyril-stress-mark spans', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Hello world');

    const toggle = page.locator('[data-testid="toggle-show-stress-marks"]');
    await toggle.check();
    await expect(page.locator('.cyril-stress-mark').first()).toBeVisible({ timeout: 5000 });

    await toggle.uncheck();
    await expect(page.locator('.cyril-stress-mark')).toHaveCount(0, { timeout: 5000 });
  });

  test('T-6.STR.06: Syllables and stress marks work simultaneously', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('Amazing grace');

    await page.locator('[data-testid="toggle-show-syllables"]').check();
    await page.locator('[data-testid="toggle-show-stress-marks"]').check();

    await expect(page.locator('[data-testid="syllable-count"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.cyril-stress-mark').first()).toBeVisible({ timeout: 5000 });
  });

  test('T-6.STR.07: Speaker and stage direction lines get no stress marks', async ({ page }) => {
    await page.locator('[data-testid="editor-surface"] [data-type="lyricLine"]').first().click();
    await page.keyboard.type('ALICE');
    await page.click('[data-testid="toolbar-speaker"]');
    await page.keyboard.press('Enter');
    await page.keyboard.type('enters stage left');
    await page.click('[data-testid="toolbar-stage-dir"]');

    await page.locator('[data-testid="toggle-show-stress-marks"]').check();

    await expect(page.locator('.cyril-stress-mark')).toHaveCount(0, { timeout: 5000 });
  });
});
