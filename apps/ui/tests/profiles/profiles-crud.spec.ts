/**
 * AI Profiles E2E Test
 *
 * Happy path: Create a new profile
 */

import { test, expect } from '@playwright/test';
import {
  setupMockProjectWithProfiles,
  waitForNetworkIdle,
  navigateToProfiles,
  clickNewProfileButton,
  fillProfileForm,
  saveProfile,
  waitForSuccessToast,
  countCustomProfiles,
  authenticateForTests,
  handleLoginScreenIfPresent,
} from '../utils';

test.describe('AI Profiles', () => {
  test('should create a new profile', async ({ page }) => {
    await setupMockProjectWithProfiles(page, { customProfilesCount: 0 });
    await authenticateForTests(page);
    await page.goto('/');
    await page.waitForLoadState('load');
    await handleLoginScreenIfPresent(page);
    await waitForNetworkIdle(page);
    await navigateToProfiles(page);

    await clickNewProfileButton(page);

    await fillProfileForm(page, {
      name: 'Test Profile',
      description: 'A test profile',
      icon: 'Brain',
      model: 'sonnet',
      thinkingLevel: 'medium',
    });

    await saveProfile(page);

    await waitForSuccessToast(page, 'Profile created');

    const customCount = await countCustomProfiles(page);
    expect(customCount).toBe(1);
  });

  test('should allow selecting 5 agents (limit is 9)', async ({ page }) => {
    // Setup and navigate to profiles
    await setupMockProjectWithProfiles(page, { customProfilesCount: 0 });
    await page.goto('/');
    await waitForNetworkIdle(page);
    await navigateToProfiles(page);
    await clickNewProfileButton(page);

    const dialog = page.locator('[data-testid="add-profile-dialog"]');
    await expect(dialog).toBeVisible();

    // Select 5 distinct executive agents by their checkbox IDs
    await dialog.locator('[id="agent-bmad:strategist-marketer"]').click();
    await dialog.locator('[id="agent-bmad:technologist-architect"]').click();
    await dialog.locator('[id="agent-bmad:fulfillization-manager"]').click();
    await dialog.locator('[id="agent-bmad:security-guardian"]').click();
    await dialog.locator('[id="agent-bmad:analyst"]').click();

    // Verify counter shows 5/10 max
    await expect(dialog.locator('text=/\\(5\\/10 max\\)/')).toBeVisible();
  });
});
