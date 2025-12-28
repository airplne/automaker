/**
 * GET /settings/:projectPath endpoint - Get npm security settings
 * PUT /settings/:projectPath endpoint - Update npm security settings
 * POST /settings/:projectPath/allow-scripts endpoint - Toggle allow install scripts
 */

import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { getErrorMessage, logError } from '../common.js';
import { validateAndCorrectNpmSecuritySettings } from '../../../lib/npm-security-policy.js';

export function createGetSettingsHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const projectPath = decodeURIComponent(req.params.projectPath);
      const settings = await settingsService.getNpmSecuritySettings(projectPath);
      res.json({ success: true, data: settings });
    } catch (error) {
      logError(error, 'Get npm security settings failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}

export function createUpdateSettingsHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const projectPath = decodeURIComponent(req.params.projectPath);
      const updates = req.body;

      // Validate updates
      if (
        updates.dependencyInstallPolicy &&
        !['strict', 'prompt', 'allow'].includes(updates.dependencyInstallPolicy)
      ) {
        res.status(400).json({
          success: false,
          error: 'Invalid dependencyInstallPolicy. Must be: strict, prompt, or allow',
        });
        return;
      }

      // Get current settings to create a complete settings object
      const currentSettings = await settingsService.getNpmSecuritySettings(projectPath);

      // Merge updates with current settings
      const mergedSettings = { ...currentSettings, ...updates };

      // Validate and correct settings before saving
      const correctedSettings = validateAndCorrectNpmSecuritySettings(mergedSettings);

      const settings = await settingsService.updateNpmSecuritySettings(
        projectPath,
        correctedSettings
      );
      res.json({ success: true, data: settings });
    } catch (error) {
      logError(error, 'Update npm security settings failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}

export function createAllowScriptsHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const projectPath = decodeURIComponent(req.params.projectPath);
      const { allow } = req.body;
      await settingsService.setAllowInstallScripts(projectPath, allow === true);
      res.json({ success: true });
    } catch (error) {
      logError(error, 'Set allow install scripts failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}
