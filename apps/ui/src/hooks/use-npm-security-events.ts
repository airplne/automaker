import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { getElectronAPI } from '@/lib/electron';
import type { AutoModeEvent } from '@/types/electron';

/**
 * Hook for listening to npm security approval events via AutoMode event stream
 *
 * Listens for 'npm_security_approval_required' events emitted by the auto-mode service
 * and triggers the npm security approval dialog via the app store.
 */
export function useNpmSecurityEvents() {
  const { setPendingNpmSecurityApproval } = useAppStore();

  useEffect(() => {
    const api = getElectronAPI();
    if (!api?.autoMode?.onEvent) {
      console.warn('[useNpmSecurityEvents] Auto mode API not available');
      return;
    }

    console.log('[useNpmSecurityEvents] Subscribing to npm security events');

    const handleEvent = (event: AutoModeEvent) => {
      // Check if this is an npm security approval event
      if (event.type === 'npm_security_approval_required' && 'command' in event) {
        if (import.meta.env.DEV) {
          console.log('[useNpmSecurityEvents] Npm security approval required:', {
            id: event.id,
            featureId: event.featureId,
            commandType: event.command?.type,
            riskLevel: event.command?.riskLevel,
            // Intentionally omitting event.command.original to prevent secret leakage even in dev
          });
        }

        setPendingNpmSecurityApproval({
          id: event.id || `approval-${Date.now()}`,
          featureId: event.featureId || '',
          worktreeId: event.worktreeId,
          projectPath: event.projectPath || '',
          command: {
            original: event.command?.original || '',
            type: event.command?.type || 'other',
            packageManager: event.command?.packageManager || 'unknown',
            riskLevel: event.command?.riskLevel || 'medium',
          },
          timestamp: event.timestamp || Date.now(),
          options: event.options || [],
        });
      }
    };

    // Subscribe to auto-mode events
    const unsubscribe = api.autoMode.onEvent(handleEvent);

    return () => {
      console.log('[useNpmSecurityEvents] Unsubscribing from npm security events');
      unsubscribe();
    };
  }, [setPendingNpmSecurityApproval]);
}
