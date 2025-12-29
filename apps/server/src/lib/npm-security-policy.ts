/**
 * NPM Security Policy Engine - Policy enforcement for secure npm guardrails
 *
 * Provides policy-based command interception and enforcement:
 * - Enforces dependency install policies (strict/prompt/allow)
 * - Controls install script execution
 * - Manages approval workflows for high-risk commands
 * - Generates audit logs for security events
 *
 * Integrates with ClaudeProvider via hooks to intercept bash commands.
 */

import { classifyCommand } from './npm-command-classifier.js';
import { createLogger } from '@automaker/utils';
import type {
  NpmSecuritySettings,
  ClassifiedCommand,
  NpmSecurityApprovalOption,
  NpmSecurityApprovalRequest,
  NpmSecurityAuditEntry,
} from '@automaker/types';

const logger = createLogger('NpmSecurityPolicy');

/**
 * Validates npm security settings and auto-corrects contradictory configurations.
 *
 * SECURITY: Strict mode MUST NOT allow install scripts - that's the whole point.
 * If contradictory settings are detected, we auto-correct to the secure default
 * and log a warning.
 *
 * @param settings - The npm security settings to validate
 * @returns Corrected settings (may be the same object if no corrections needed)
 */
export function validateAndCorrectNpmSecuritySettings(
  settings: NpmSecuritySettings
): NpmSecuritySettings {
  // Check for contradictory configuration
  if (settings.dependencyInstallPolicy === 'strict' && settings.allowInstallScripts === true) {
    logger.warn(
      '[npm-security] Invalid config detected: strict mode with allowInstallScripts=true. ' +
        'Auto-correcting to allowInstallScripts=false. ' +
        'Strict mode always blocks install scripts for security.'
    );

    return {
      ...settings,
      allowInstallScripts: false,
    };
  }

  return settings;
}

/**
 * Result of policy enforcement on a command
 */
export interface PolicyEnforcementResult {
  /** Whether the command is allowed to proceed */
  allowed: boolean;

  /** Rewritten version of the command (if modified for safety) */
  rewrittenCommand?: string;

  /** Whether user approval is required */
  requiresApproval: boolean;

  /** Approval request details (if approval needed) */
  approvalRequest?: {
    id: string;
    command: ClassifiedCommand;
    options: NpmSecurityApprovalOption[];
  };

  /** Reason why command was blocked (if blocked) */
  blockedReason?: string;

  /** Audit entry for this enforcement action */
  auditEntry: Omit<NpmSecurityAuditEntry, 'id' | 'projectPath'>;
}

/**
 * Callbacks for policy enforcer to interact with the system
 */
export interface PolicyEnforcerCallbacks {
  /** Called when user approval is required */
  onApprovalRequired: (
    request: PolicyEnforcementResult['approvalRequest']
  ) => Promise<NpmSecurityApprovalOption['action']>;

  /** Called to log audit events */
  onAuditLog: (entry: Omit<NpmSecurityAuditEntry, 'id' | 'projectPath'>) => void;
}

/**
 * Creates an npm security policy enforcer for use with Claude SDK
 *
 * @param policy - The security policy to enforce
 * @param projectPath - Absolute path to the project
 * @param callbacks - Callbacks for approval and audit logging
 * @returns Object with hooks for SDK integration
 */
export function createNpmSecurityEnforcer(
  policy: NpmSecuritySettings,
  projectPath: string,
  callbacks: PolicyEnforcerCallbacks
) {
  // Validate and correct settings at initialization
  const correctedPolicy = validateAndCorrectNpmSecuritySettings(policy);

  return {
    /**
     * Hook to be called before Bash tool execution
     * Returns modified command or throws to block
     */
    async beforeBashExecution(command: string): Promise<string> {
      const result = await enforcePolicy(command, correctedPolicy, projectPath, callbacks);

      if (!result.allowed) {
        throw new Error(`Command blocked by npm security policy: ${result.blockedReason}`);
      }

      return result.rewrittenCommand || command;
    },

    /**
     * For use with Claude SDK's canUseTool option
     * Returns whether the Bash tool can be used with given input
     */
    async canUseBashTool(input: {
      command: string;
    }): Promise<boolean | { allowed: boolean; message?: string }> {
      const classified = classifyCommand(input.command);

      // If policy is 'allow', everything passes
      if (correctedPolicy.dependencyInstallPolicy === 'allow') {
        return true;
      }

      // Block high-risk execute commands in strict mode
      if (classified.isHighRiskExecute && correctedPolicy.dependencyInstallPolicy === 'strict') {
        return {
          allowed: false,
          message: `High-risk command "${input.command}" requires explicit approval. Use npx/npm exec commands carefully as they can execute arbitrary remote code.`,
        };
      }

      // Install commands get rewritten, not blocked
      return true;
    },
  };
}

/**
 * Core policy enforcement logic
 *
 * @param command - The bash command to enforce policy on
 * @param policy - The security policy
 * @param projectPath - Absolute path to the project
 * @param callbacks - Callbacks for approval and audit logging
 * @returns Enforcement result with decision and metadata
 */
export async function enforcePolicy(
  command: string,
  policy: NpmSecuritySettings,
  projectPath: string,
  callbacks: PolicyEnforcerCallbacks
): Promise<PolicyEnforcementResult> {
  const classified = classifyCommand(command);

  // DEV MODE BYPASS - check first before any other logic
  if (process.env.AUTOMAKER_DISABLE_NPM_SECURITY === 'true') {
    logger.warn('[npm-security] ⚠️ FIREWALL DISABLED FOR DEVELOPMENT');
    const auditEntry = {
      timestamp: Date.now(),
      eventType: 'command-allowed' as const,
      command: classified,
    };
    callbacks.onAuditLog(auditEntry);
    return {
      allowed: true,
      requiresApproval: false,
      auditEntry,
    };
  }

  // If policy is 'allow', let everything through but still audit
  if (policy.dependencyInstallPolicy === 'allow') {
    const auditEntry = {
      timestamp: Date.now(),
      eventType: 'command-rewritten' as const,
      command: classified,
    };

    callbacks.onAuditLog(auditEntry);

    return {
      allowed: true,
      requiresApproval: false,
      auditEntry,
    };
  }

  // Handle high-risk execute commands (npx, etc.)
  if (classified.isHighRiskExecute) {
    if (policy.dependencyInstallPolicy === 'strict') {
      // Block and require approval
      const approvalRequest = createApprovalRequest(classified, projectPath);
      if (!approvalRequest) {
        return {
          allowed: false,
          requiresApproval: true,
          blockedReason: 'Failed to create approval request',
          auditEntry: { timestamp: Date.now(), eventType: 'command-blocked', command: classified },
        };
      }
      let decision = await callbacks.onApprovalRequired(approvalRequest);
      decision = normalizeApprovalDecision(approvalRequest!, decision);

      callbacks.onAuditLog({
        timestamp: Date.now(),
        eventType: decision === 'cancel' ? 'approval-denied' : 'approval-granted',
        command: classified,
        decision,
      });

      if (decision === 'cancel') {
        return {
          allowed: false,
          requiresApproval: true,
          blockedReason: 'User cancelled high-risk command execution',
          auditEntry: {
            timestamp: Date.now(),
            eventType: 'command-blocked',
            command: classified,
          },
        };
      }

      return {
        allowed: true,
        requiresApproval: false,
        auditEntry: {
          timestamp: Date.now(),
          eventType: 'approval-granted',
          command: classified,
          decision,
        },
      };
    }

    // Prompt mode - also require approval for high-risk execute
    if (policy.dependencyInstallPolicy === 'prompt') {
      const approvalRequest = createApprovalRequest(classified, projectPath);
      if (!approvalRequest) {
        return {
          allowed: false,
          requiresApproval: true,
          blockedReason: 'Failed to create approval request',
          auditEntry: { timestamp: Date.now(), eventType: 'command-blocked', command: classified },
        };
      }
      let decision = await callbacks.onApprovalRequired(approvalRequest);
      decision = normalizeApprovalDecision(approvalRequest!, decision);

      callbacks.onAuditLog({
        timestamp: Date.now(),
        eventType: decision === 'cancel' ? 'approval-denied' : 'approval-granted',
        command: classified,
        decision,
      });

      if (decision === 'cancel') {
        return {
          allowed: false,
          requiresApproval: true,
          blockedReason: 'User cancelled high-risk execute command in prompt mode',
          auditEntry: {
            timestamp: Date.now(),
            eventType: 'approval-denied' as const,
            command: classified,
            decision: 'cancel',
          },
        };
      }

      // User approved - allow the command
      return {
        allowed: true,
        requiresApproval: true,
        auditEntry: {
          timestamp: Date.now(),
          eventType: 'approval-granted' as const,
          command: classified,
          decision,
        },
      };
    }
  }

  // Handle rebuild commands with allowedPackagesForRebuild policy
  if (classified.packageManager === 'npm' && /\bnpm\s+rebuild\b/.test(command)) {
    const allowedPackages = policy.allowedPackagesForRebuild || [];

    // Extract package name from rebuild command
    const rebuildMatch = command.match(/\bnpm\s+rebuild\s+(\S+)/);
    const packageName = rebuildMatch?.[1] ?? '';

    // If package is whitelisted, allow it
    if (packageName && allowedPackages.includes(packageName)) {
      return {
        allowed: true,
        requiresApproval: false,
        auditEntry: {
          timestamp: Date.now(),
          eventType: 'command-rewritten',
          command: classified,
        },
      };
    }

    // Otherwise, require approval for rebuild
    const approvalRequest = createApprovalRequest(classified, projectPath);
    if (!approvalRequest) {
      return {
        allowed: false,
        requiresApproval: true,
        blockedReason: 'Failed to create approval request',
        auditEntry: { timestamp: Date.now(), eventType: 'command-blocked', command: classified },
      };
    }
    let decision = await callbacks.onApprovalRequired(approvalRequest);
    decision = normalizeApprovalDecision(approvalRequest!, decision);

    callbacks.onAuditLog({
      timestamp: Date.now(),
      eventType: decision === 'cancel' ? 'approval-denied' : 'approval-granted',
      command: classified,
      decision,
    });

    if (decision === 'cancel') {
      return {
        allowed: false,
        requiresApproval: true,
        blockedReason: 'User cancelled rebuild command execution',
        auditEntry: {
          timestamp: Date.now(),
          eventType: 'command-blocked',
          command: classified,
        },
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
      auditEntry: {
        timestamp: Date.now(),
        eventType: 'approval-granted',
        command: classified,
        decision,
      },
    };
  }

  // Handle install commands
  if (classified.isInstallCommand) {
    // Prompt policy requires approval for install commands
    if (policy.dependencyInstallPolicy === 'prompt') {
      const approvalRequest = createApprovalRequest(classified, projectPath);
      if (!approvalRequest) {
        return {
          allowed: false,
          requiresApproval: true,
          blockedReason: 'Failed to create approval request',
          auditEntry: { timestamp: Date.now(), eventType: 'command-blocked', command: classified },
        };
      }
      let decision = await callbacks.onApprovalRequired(approvalRequest);
      decision = normalizeApprovalDecision(approvalRequest!, decision);

      callbacks.onAuditLog({
        timestamp: Date.now(),
        eventType: decision === 'cancel' ? 'approval-denied' : 'approval-granted',
        command: classified,
        decision,
      });

      if (decision === 'cancel') {
        return {
          allowed: false,
          requiresApproval: true,
          blockedReason: 'User cancelled install command',
          auditEntry: {
            timestamp: Date.now(),
            eventType: 'command-blocked',
            command: classified,
          },
        };
      }

      // User approved - determine final command based on decision
      let finalCommand = command;
      if (decision === 'proceed-safe') {
        finalCommand = classified.rewrittenCommand || command;
      }

      return {
        allowed: true,
        rewrittenCommand: decision === 'proceed-safe' ? finalCommand : undefined,
        requiresApproval: false,
        auditEntry: {
          timestamp: Date.now(),
          eventType: 'approval-granted',
          command: classified,
          decision,
        },
      };
    }

    if (policy.allowInstallScripts) {
      // Scripts allowed, pass through unchanged
      return {
        allowed: true,
        requiresApproval: false,
        auditEntry: {
          timestamp: Date.now(),
          eventType: 'command-rewritten',
          command: classified,
        },
      };
    }

    // Rewrite to add --ignore-scripts
    const rewritten = classified.rewrittenCommand || command;

    callbacks.onAuditLog({
      timestamp: Date.now(),
      eventType: 'command-rewritten',
      command: { ...classified, rewrittenCommand: rewritten },
    });

    return {
      allowed: true,
      rewrittenCommand: rewritten,
      requiresApproval: false,
      auditEntry: {
        timestamp: Date.now(),
        eventType: 'command-rewritten',
        command: classified,
      },
    };
  }

  // Everything else passes through
  return {
    allowed: true,
    requiresApproval: false,
    auditEntry: {
      timestamp: Date.now(),
      eventType: 'command-rewritten',
      command: classified,
    },
  };
}

/**
 * Validates an approval decision against the options that were offered.
 * Returns 'cancel' for any invalid decision (security: deny-by-default).
 */
function normalizeApprovalDecision(
  approvalRequest: { options: NpmSecurityApprovalOption[] },
  decision: NpmSecurityApprovalOption['action']
): NpmSecurityApprovalOption['action'] {
  const allowedActions = new Set(approvalRequest.options.map((o) => o.action));
  if (allowedActions.has(decision)) {
    return decision;
  }
  // Security: Invalid decision defaults to cancel (deny)
  return 'cancel';
}

/**
 * Creates an approval request for high-risk commands
 */
function createApprovalRequest(
  classified: ClassifiedCommand,
  projectPath: string
): PolicyEnforcementResult['approvalRequest'] {
  // Differentiate options based on command type
  const isHighRiskExecute = classified.isHighRiskExecute;

  const options: NpmSecurityApprovalOption[] = isHighRiskExecute
    ? [
        // High-risk execute commands (npx, dlx, etc.) - no --ignore-scripts option
        {
          id: 'cancel',
          label: 'Cancel',
          description: 'Do not run this command',
          action: 'cancel' as const,
          isDefault: true,
          isRecommended: true,
        },
        {
          id: 'allow-once',
          label: 'Allow once',
          description: 'Run this command once (use with caution)',
          action: 'allow-once' as const,
        },
        {
          id: 'allow-project',
          label: 'Trust for this project',
          description: 'Remember this choice for all future high-risk commands in this project',
          action: 'allow-project' as const,
        },
      ]
    : [
        // Install commands - include --ignore-scripts option
        {
          id: 'proceed-safe',
          label: 'Proceed with scripts disabled',
          description: 'Run the command with --ignore-scripts flag added',
          action: 'proceed-safe' as const,
          isDefault: true,
          isRecommended: true,
        },
        {
          id: 'allow-once',
          label: 'Allow scripts once',
          description: 'Run the command as-is this one time only',
          action: 'allow-once' as const,
        },
        {
          id: 'allow-project',
          label: 'Allow scripts for this project',
          description: 'Remember this choice for all future commands in this project',
          action: 'allow-project' as const,
        },
        {
          id: 'cancel',
          label: 'Cancel',
          description: 'Do not run the command',
          action: 'cancel' as const,
        },
      ];

  return {
    id: `npm-security-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    command: classified,
    options,
  };
}

/**
 * Default secure environment variables for terminal sessions
 *
 * These environment variables configure npm to be more secure by default:
 * - npm_config_ignore_scripts: Disable install scripts
 * - npm_config_audit: Enable security audits
 * - npm_config_audit_level: Report moderate+ vulnerabilities
 * - npm_config_strict_ssl: Enforce SSL certificate validation
 *
 * @returns Environment variables for secure npm configuration
 */
export function getSecureNpmEnvironment(): Record<string, string> {
  return {
    npm_config_ignore_scripts: 'true',
    npm_config_audit: 'true',
    npm_config_audit_level: 'moderate',
    npm_config_strict_ssl: 'true',
  };
}

/**
 * Sanitizes commands to remove sensitive environment variables before logging.
 * Matches patterns like API_KEY=value, TOKEN=value, SECRET=value, PASSWORD=value, AUTH=value
 *
 * @param command - The raw command string
 * @returns The command with sensitive values redacted
 */
export function sanitizeCommandForLogging(command: string): string {
  // Match env vars that likely contain secrets
  // Pattern: WORD_KEY=value, WORD_TOKEN=value, WORD_SECRET=value, WORD_PASSWORD=value, WORD_AUTH=value, WORD_CREDENTIAL=value
  return command.replace(
    /\b([A-Z_][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL)[A-Z0-9_]*)=\S+/gi,
    '$1=***REDACTED***'
  );
}
