import { test, expect } from '@playwright/test';

test.describe('Stage 3: Workspaces and Drafts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('T-3.10: Workspace/draft flow passes in UI', async ({ page }) => {
    // Start by creating a new project
    await page.getByText('Create Project').click();
    
    // Check initial state
    await expect(page.getByText('Untitled Song')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Draft 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Draft: Draft 1' })).toBeVisible();
    
    // 1. Test Workspaces
    await page.getByRole('button', { name: 'Brief' }).click();
    await expect(page.getByRole('heading', { name: 'Brief' })).toBeVisible(); // Header
    
    // Type in Brief workspace
    const editor = page.getByRole('textbox');
    await editor.click();
    await editor.fill('This is the brief.');
    
    // Switch to Structure
    await page.getByRole('button', { name: 'Structure' }).click();
    
    // Ensure Brief text is NOT here
    await expect(page.getByText('This is the brief.')).not.toBeVisible();
    
    // Type in Structure workspace
    await editor.click();
    await editor.fill('This is the structure.');
    
    // Switch back to Brief, ensure content persisted
    await page.getByRole('button', { name: 'Brief' }).click();
    await expect(page.getByText('This is the brief.')).toBeVisible();

    // 2. Test Draft Creation (Duplicate text only)
    // First put some content in Draft 1
    await page.getByRole('button', { name: 'Draft 1' }).click();
    await editor.click();
    await editor.fill('Verse 1: Hello World');
    
    // Create new draft
    await page.getByText('+ New Draft').click();
    
    // Dialog appears
    await expect(page.getByText('New Draft', { exact: true })).toBeVisible();
    
    // Fill name (should default to Draft 2, let's keep it)
    
    // Select duplicate text only
    await page.getByLabel('Duplicate text only').check();
    
    // Submit
    await page.getByRole('button', { name: 'Create' }).click();
    
    // Should now be on Draft 2 with the duplicated text
    await expect(page.getByRole('heading', { name: 'Draft: Draft 2' })).toBeVisible();
    await expect(page.getByText('Verse 1: Hello World')).toBeVisible();
    
    // Modify Draft 2
    await editor.click();
    // In Tiptap we can just keep typing
    await editor.press('End');
    await editor.type(' - Modified');
    
    // Switch back to Draft 1, ensure it's UNMODIFIED
    await page.getByRole('button', { name: 'Draft 1' }).click();
    await expect(page.getByText('Verse 1: Hello World - Modified')).not.toBeVisible();
    await expect(page.getByText('Verse 1: Hello World')).toBeVisible();
  });
});
