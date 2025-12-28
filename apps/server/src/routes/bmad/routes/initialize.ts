import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { BmadService } from '../../../services/bmad-service.js';
import { getErrorMessage, logError } from '../common.js';

export function createInitializeHandler(settingsService: SettingsService) {
  const bmadService = new BmadService(settingsService);

  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath, artifactsDir, scaffoldMethodology } = req.body as {
        projectPath?: string;
        artifactsDir?: string;
        scaffoldMethodology?: boolean;
      };

      if (!projectPath || typeof projectPath !== 'string') {
        res.status(400).json({ success: false, error: 'projectPath is required' });
        return;
      }

      const result = await bmadService.initializeProjectBmad(projectPath, {
        artifactsDir,
        scaffoldMethodology: Boolean(scaffoldMethodology),
      });

      res.json({ success: true, status: result, createdFeatures: result.createdFeatures });
    } catch (error) {
      logError(error, 'Initialize BMAD failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
