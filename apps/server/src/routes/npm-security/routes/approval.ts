/**
 * GET /approval/pending endpoint - Get pending approval requests
 * POST /approval/:requestId endpoint - Submit approval decision
 * GET /approval/stream endpoint - SSE stream for real-time approval requests
 */

import type { Request, Response } from 'express';
import type { SettingsService } from '../../../services/settings-service.js';
import { EventEmitter } from 'events';
import { getErrorMessage, logError } from '../common.js';

// In-memory store for pending approvals (would be better with Redis in production)
const pendingApprovals = new Map<
  string,
  {
    resolve: (decision: string) => void;
    request: any;
    timeout: NodeJS.Timeout;
  }
>();

// Emitter for SSE
export const approvalEmitter = new EventEmitter();

export function createGetPendingHandler() {
  return (_req: Request, res: Response): void => {
    const pending = Array.from(pendingApprovals.entries()).map(([id, data]) => ({
      id,
      ...data.request,
    }));
    res.json({ success: true, data: pending });
  };
}

export function createSubmitDecisionHandler(settingsService: SettingsService) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { decision, rememberChoice } = req.body;

      const pending = pendingApprovals.get(requestId);
      if (!pending) {
        res.status(404).json({
          success: false,
          error: 'Approval request not found or expired',
        });
        return;
      }

      // Clear timeout and resolve the promise
      clearTimeout(pending.timeout);
      pending.resolve(decision);
      pendingApprovals.delete(requestId);

      // If rememberChoice is true, update project settings
      if (rememberChoice && decision === 'allow-project' && pending.request.projectPath) {
        await settingsService.setAllowInstallScripts(pending.request.projectPath, true);
      }

      res.json({ success: true });
    } catch (error) {
      logError(error, 'Submit approval decision failed');
      res.status(500).json({
        success: false,
        error: getErrorMessage(error),
      });
    }
  };
}

export function createStreamHandler() {
  return (req: Request, res: Response): void => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const onApprovalRequest = (request: any) => {
      res.write(`event: approval-request\ndata: ${JSON.stringify(request)}\n\n`);
    };

    approvalEmitter.on('approval-request', onApprovalRequest);

    req.on('close', () => {
      approvalEmitter.off('approval-request', onApprovalRequest);
    });
  };
}

/**
 * Request approval from the UI (called by policy engine)
 */
export async function requestApproval(request: any): Promise<string> {
  return new Promise((resolve) => {
    const timeout = setTimeout(
      () => {
        pendingApprovals.delete(request.id);
        resolve('cancel'); // Auto-cancel after timeout
      },
      5 * 60 * 1000
    ); // 5 minute timeout

    pendingApprovals.set(request.id, { resolve, request, timeout });
    approvalEmitter.emit('approval-request', request);
  });
}
