/**
 * Shared Playwright fixtures and helpers.
 *
 * Import `test` and `expect` from here instead of from `@playwright/test`, so every
 * spec gains the console-error guard below for free.
 *
 * Why this exists: on 2026-08-29 the suite had 115 passing e2e tests while the app
 * shipped an export that produced an empty document, a save race that clobbered work,
 * and an Enter key that was swallowed in the speaker field. Nothing failed a test when
 * the page logged an error. See `docs/engineering/DEFECTS.md`.
 */
import { test as base, expect, type Page } from '@playwright/test';

/**
 * Console noise that is not a product fault. Keep this list SHORT and justified —
 * every entry is a class of bug the suite can no longer see.
 */
const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /favicon\.ico/i, // the dev server has no favicon route
  /Download the React DevTools/i, // React's own dev-mode advert
  /\[vite\] connect/i, // Vite HMR chatter
];

const isIgnored = (text: string) => IGNORED_CONSOLE_PATTERNS.some((re) => re.test(text));

type CyrilFixtures = {
  /**
   * Set to true in a spec that *deliberately* triggers an error — an error-boundary
   * test, or an offline/provider-failure path. Prefer asserting the specific expected
   * error over disabling the guard wholesale.
   *
   *   test.use({ allowConsoleErrors: true });
   */
  allowConsoleErrors: boolean;
};

export const test = base.extend<CyrilFixtures>({
  allowConsoleErrors: [false, { option: true }],

  page: async ({ page, allowConsoleErrors }, use) => {
    const errors: string[] = [];

    page.on('pageerror', (err) => {
      const text = `pageerror: ${err.message}`;
      if (!isIgnored(text)) errors.push(text);
    });
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = `console.error: ${msg.text()}`;
      if (!isIgnored(text)) errors.push(text);
    });

    await use(page);

    if (!allowConsoleErrors && errors.length > 0) {
      throw new Error(
        `The page logged ${errors.length} error(s) during this test:\n  ` +
          errors.join('\n  ') +
          `\n\nIf this is deliberate, set \`test.use({ allowConsoleErrors: true })\` in the spec ` +
          `and say why.`,
      );
    }
  },
});

export { expect };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Type at something close to human speed.
 *
 * Playwright's default types faster than ProseMirror input rules can respond: a
 * `<<` or `[[` fires mid-string and moves focus, and the remaining characters land
 * somewhere unintended. That produces failures which look exactly like real bugs and
 * are not. Always use this for text that contains an input-rule trigger.
 */
export async function typeSlowly(page: Page, text: string, delay = 40): Promise<void> {
  await page.keyboard.type(text, { delay });
}

/** Create a fresh project and wait for the editor to be ready. */
export async function createProject(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('create-project-button').click();
  await page.locator('.ProseMirror').first().waitFor({ state: 'visible' });
}

/** Click into the draft editor. */
export async function focusEditor(page: Page): Promise<void> {
  await page.locator('.ProseMirror').first().click();
}

/**
 * Write a section heading via the `<<` input rule.
 *
 * The rule fires on `<<`, creates the block and moves focus into the section-label
 * input; the label text is then typed there and Enter commits it and returns focus to
 * the document. The pause between the two is load-bearing — see `typeSlowly`.
 */
export async function writeSection(page: Page, label: string): Promise<void> {
  await typeSlowly(page, '<<');
  await page.locator('input.section-label-input').waitFor({ state: 'visible' });
  await typeSlowly(page, label);
  await page.keyboard.press('Enter');
  await page.locator('input.section-label-input').waitFor({ state: 'detached' });
}

/** Write a speaker line via the `[[NAME]]` input rule, closing brackets included. */
export async function writeSpeaker(page: Page, name: string): Promise<void> {
  await typeSlowly(page, `[[${name}]]`);
  await page.keyboard.press('Enter');
}

/** Toggle one of the View switches in the left rail by its visible label. */
export async function toggleView(page: Page, label: string): Promise<void> {
  await page.getByText(label, { exact: true }).first().click();
}
