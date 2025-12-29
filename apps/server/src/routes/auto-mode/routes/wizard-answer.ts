/**
 * POST /wizard-answer endpoint - Submit wizard question answer and continue
 */

import type { Request, Response } from 'express';
import type { AutoModeService } from '../../../services/auto-mode-service.js';
import { createLogger } from '@automaker/utils';
import { getErrorMessage, logError } from '../common.js';

const logger = createLogger('AutoMode');

export function createWizardAnswerHandler(autoModeService: AutoModeService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { projectPath, featureId, questionId, answer } = req.body as {
        projectPath: string;
        featureId: string;
        questionId: string;
        answer: string | string[];
      };

      if (!projectPath || !featureId || !questionId) {
        res.status(400).json({
          success: false,
          error: 'projectPath, featureId, and questionId are required',
        });
        return;
      }

      if (answer === undefined || answer === null) {
        res.status(400).json({
          success: false,
          error: 'answer is required',
        });
        return;
      }

      logger.info(
        `[AutoMode] Wizard answer received for feature ${featureId}, question ${questionId}: ${JSON.stringify(answer)}`
      );

      // Submit the wizard answer to the service
      const result = await autoModeService.submitWizardAnswer(
        projectPath,
        featureId,
        questionId,
        answer
      );

      if (!result.success) {
        res.status(500).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Wizard answer submitted',
        questionsRemaining: result.questionsRemaining,
        wizardComplete: result.wizardComplete,
      });
    } catch (error) {
      logError(error, 'Wizard answer submission failed');
      res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
  };
}
