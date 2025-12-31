/**
 * Edit Feature E2E Test
 *
 * Happy path: Edit an existing feature's description and verify changes persist
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  createTempDirPath,
  cleanupTempDir,
  setupRealProject,
  waitForNetworkIdle,
  clickAddFeature,
  fillAddFeatureDialog,
  confirmAddFeature,
  clickElement,
} from '../utils';

const TEST_TEMP_DIR = createTempDirPath('edit-feature-test');

test.describe('Edit Feature', () => {
  let projectPath: string;
  const projectName = `test-project-${Date.now()}`;

  test.beforeAll(async () => {
    if (!fs.existsSync(TEST_TEMP_DIR)) {
      fs.mkdirSync(TEST_TEMP_DIR, { recursive: true });
    }

    projectPath = path.join(TEST_TEMP_DIR, projectName);
    fs.mkdirSync(projectPath, { recursive: true });

    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify({ name: projectName, version: '1.0.0' }, null, 2)
    );

    const automakerDir = path.join(projectPath, '.automaker');
    fs.mkdirSync(automakerDir, { recursive: true });
    fs.mkdirSync(path.join(automakerDir, 'features'), { recursive: true });
    fs.mkdirSync(path.join(automakerDir, 'context'), { recursive: true });

    fs.writeFileSync(
      path.join(automakerDir, 'categories.json'),
      JSON.stringify({ categories: [] }, null, 2)
    );

    fs.writeFileSync(
      path.join(automakerDir, 'app_spec.txt'),
      `# ${projectName}\n\nA test project for e2e testing.`
    );
  });

  test.afterAll(async () => {
    cleanupTempDir(TEST_TEMP_DIR);
  });

  test('should edit an existing feature description', async ({ page }) => {
    const originalDescription = `Original feature ${Date.now()}`;
    const updatedDescription = `Updated feature ${Date.now()}`;

    await setupRealProject(page, projectPath, projectName, { setAsCurrent: true });

    await page.goto('/board');
    await waitForNetworkIdle(page);

    await expect(page.locator('[data-testid="board-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="kanban-column-backlog"]')).toBeVisible({
      timeout: 5000,
    });

    // Create a feature first
    await clickAddFeature(page);
    await fillAddFeatureDialog(page, originalDescription);
    await confirmAddFeature(page);

    // Wait for the feature to appear in the backlog
    await expect(async () => {
      const backlogColumn = page.locator('[data-testid="kanban-column-backlog"]');
      const featureCard = backlogColumn.locator('[data-testid^="kanban-card-"]').filter({
        hasText: originalDescription,
      });
      expect(await featureCard.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Get the feature ID from the card
    const featureCard = page
      .locator('[data-testid="kanban-column-backlog"]')
      .locator('[data-testid^="kanban-card-"]')
      .filter({ hasText: originalDescription })
      .first();
    const cardTestId = await featureCard.getAttribute('data-testid');
    const featureId = cardTestId?.replace('kanban-card-', '');

    // Collapse the sidebar first to avoid it intercepting clicks
    const collapseSidebarButton = page.locator('button:has-text("Collapse sidebar")');
    if (await collapseSidebarButton.isVisible()) {
      await collapseSidebarButton.click();
      await page.waitForTimeout(300); // Wait for sidebar animation
    }

    // Click the edit button on the card using JavaScript click to bypass pointer interception
    const editButton = page.locator(`[data-testid="edit-backlog-${featureId}"]`);
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for edit dialog to appear
    await expect(page.locator('[data-testid="edit-feature-dialog"]')).toBeVisible({
      timeout: 10000,
    });

    // Update the description - the input is inside the DescriptionImageDropZone
    const descriptionInput = page
      .locator('[data-testid="edit-feature-dialog"]')
      .getByPlaceholder('Describe the feature...');
    await expect(descriptionInput).toBeVisible({ timeout: 5000 });
    await descriptionInput.fill(updatedDescription);

    // Save changes
    await clickElement(page, 'confirm-edit-feature');

    // Wait for dialog to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="edit-feature-dialog"]'),
      { timeout: 5000 }
    );

    // Verify the updated description appears in the card
    await expect(async () => {
      const backlogColumn = page.locator('[data-testid="kanban-column-backlog"]');
      const updatedCard = backlogColumn.locator('[data-testid^="kanban-card-"]').filter({
        hasText: updatedDescription,
      });
      expect(await updatedCard.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });
  });

  test('should allow selecting 5 agents in edit dialog (limit is 9)', async ({ page }) => {
    const featureDescription = `Multi-agent feature ${Date.now()}`;

    await setupRealProject(page, projectPath, projectName, { setAsCurrent: true });

    await page.goto('/board');
    await waitForNetworkIdle(page);

    await expect(page.locator('[data-testid="board-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="kanban-column-backlog"]')).toBeVisible({
      timeout: 5000,
    });

    // Create a feature first
    await clickAddFeature(page);
    await fillAddFeatureDialog(page, featureDescription);
    await confirmAddFeature(page);

    // Wait for the feature to appear in the backlog
    await expect(async () => {
      const backlogColumn = page.locator('[data-testid="kanban-column-backlog"]');
      const featureCard = backlogColumn.locator('[data-testid^="kanban-card-"]').filter({
        hasText: featureDescription,
      });
      expect(await featureCard.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Get the feature ID from the card
    const featureCard = page
      .locator('[data-testid="kanban-column-backlog"]')
      .locator('[data-testid^="kanban-card-"]')
      .filter({ hasText: featureDescription })
      .first();
    const cardTestId = await featureCard.getAttribute('data-testid');
    const featureId = cardTestId?.replace('kanban-card-', '');

    // Collapse the sidebar first to avoid it intercepting clicks
    const collapseSidebarButton = page.locator('button:has-text("Collapse sidebar")');
    if (await collapseSidebarButton.isVisible()) {
      await collapseSidebarButton.click();
      await page.waitForTimeout(300); // Wait for sidebar animation
    }

    // Click the edit button on the card using JavaScript click to bypass pointer interception
    const editButton = page.locator(`[data-testid="edit-backlog-${featureId}"]`);
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for edit dialog to appear
    const dialog = page.locator('[data-testid="edit-feature-dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // Click Model tab
    await clickElement(page, 'edit-tab-model');

    // Wait for the Model tab content to be visible
    await page.waitForTimeout(300);

    // Clear any default selection (Add Feature defaults to Party Mode / all agents selected)
    const clearAllButton = dialog.getByRole('button', { name: 'Clear All' });
    if (await clearAllButton.isVisible()) {
      await clearAllButton.click();
    }

    // Select 5 distinct executive agents
    await dialog.locator('[id="edit-agent-bmad:strategist-marketer"]').click();
    await dialog.locator('[id="edit-agent-bmad:technologist-architect"]').click();
    await dialog.locator('[id="edit-agent-bmad:fulfillization-manager"]').click();
    await dialog.locator('[id="edit-agent-bmad:security-guardian"]').click();
    await dialog.locator('[id="edit-agent-bmad:analyst-strategist"]').click();

    // Verify counter shows 5/10 max
    await expect(dialog.locator('text=/\\(5\\/10 max\\)/')).toBeVisible();
  });

  test('should enhance description with AI in edit dialog (mock mode)', async ({ page }) => {
    // This test relies on AUTOMAKER_MOCK_AGENT=true being set
    const originalDescription = `add user authentication`;

    await setupRealProject(page, projectPath, projectName, { setAsCurrent: true });

    await page.goto('/board');
    await waitForNetworkIdle(page);

    await expect(page.locator('[data-testid="board-view"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="kanban-column-backlog"]')).toBeVisible({
      timeout: 5000,
    });

    // Create a feature first
    await clickAddFeature(page);
    await fillAddFeatureDialog(page, originalDescription);
    await confirmAddFeature(page);

    // Wait for the feature to appear in the backlog
    await expect(async () => {
      const backlogColumn = page.locator('[data-testid="kanban-column-backlog"]');
      const featureCard = backlogColumn.locator('[data-testid^="kanban-card-"]').filter({
        hasText: originalDescription,
      });
      expect(await featureCard.count()).toBeGreaterThan(0);
    }).toPass({ timeout: 10000 });

    // Get the feature ID from the card
    const featureCard = page
      .locator('[data-testid="kanban-column-backlog"]')
      .locator('[data-testid^="kanban-card-"]')
      .filter({ hasText: originalDescription })
      .first();
    const cardTestId = await featureCard.getAttribute('data-testid');
    const featureId = cardTestId?.replace('kanban-card-', '');

    // Collapse the sidebar first to avoid it intercepting clicks
    const collapseSidebarButton = page.locator('button:has-text("Collapse sidebar")');
    if (await collapseSidebarButton.isVisible()) {
      await collapseSidebarButton.click();
      await page.waitForTimeout(300); // Wait for sidebar animation
    }

    // Click the edit button on the card using JavaScript click to bypass pointer interception
    const editButton = page.locator(`[data-testid="edit-backlog-${featureId}"]`);
    await expect(editButton).toBeVisible({ timeout: 5000 });
    await editButton.evaluate((el) => (el as HTMLElement).click());

    // Wait for edit dialog to appear
    await expect(page.locator('[data-testid="edit-feature-dialog"]')).toBeVisible({
      timeout: 10000,
    });

    // Clear and type a new description - the input is inside the DescriptionImageDropZone
    const descriptionInput = page
      .locator('[data-testid="edit-feature-dialog"]')
      .getByPlaceholder('Describe the feature...');
    await expect(descriptionInput).toBeVisible({ timeout: 5000 });
    await descriptionInput.clear();
    await descriptionInput.fill(originalDescription);

    // Click the Enhance with AI button
    await page.getByRole('button', { name: /Enhance with AI/i }).click();

    // Wait for enhancement to complete (mock mode should be fast)
    await page.waitForTimeout(500); // Brief wait for mock response

    // In mock mode, the description should be updated with enhancement markers
    const enhancedDescription = await descriptionInput.inputValue();

    // Mock mode returns text with [ENHANCED - ...] prefix
    expect(enhancedDescription).toContain('[ENHANCED');
    expect(enhancedDescription).toContain('add user authentication'); // Original text preserved
  });
});
