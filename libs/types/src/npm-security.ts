/**
 * NPM Security Types - Types for secure npm guardrails feature
 *
 * Defines the structure for npm command classification, security policies,
 * approval workflows, and audit logging. These types are used by both the server
 * (for policy enforcement and command rewriting) and the UI (for approval dialogs).
 */

/**
 * NpmCommandType - Classification of npm/package manager commands
 *
 * Commands are categorized by risk level:
 * - install: Standard dependency installation (npm install, npm ci, pnpm install, yarn install)
 * - high-risk-execute: Direct code execution tools (npx, npm exec, pnpm dlx, yarn dlx, bunx)
 * - script-run: Package script execution (npm run, yarn run, pnpm run)
 * - other: All other package manager commands
 */
export type NpmCommandType =
  | 'install' // npm install, npm ci, pnpm install, yarn install
  | 'high-risk-execute' // npx, npm exec, pnpm dlx, yarn dlx, bunx
  | 'script-run' // npm run, yarn run, pnpm run
  | 'other'; // everything else

/**
 * DependencyInstallPolicy - Policy mode for handling dependency installations
 *
 * - strict: Block install scripts by default, require approval for installs
 * - prompt: Ask user before running any install with lifecycle scripts
 * - allow: Permit installations with lifecycle scripts (legacy behavior)
 */
export type DependencyInstallPolicy = 'strict' | 'prompt' | 'allow';

/**
 * NpmSecuritySettings - Per-project npm security configuration
 *
 * Stored in project settings to define security policy for package management.
 * Controls whether lifecycle scripts are allowed and which packages are trusted.
 */
export interface NpmSecuritySettings {
  /** Policy mode for dependency installations */
  dependencyInstallPolicy: DependencyInstallPolicy;
  /** Whether to allow lifecycle scripts (install, postinstall, etc.) to run */
  allowInstallScripts: boolean;
  /** Allowlist of package names permitted to run rebuild scripts (future feature) */
  allowedPackagesForRebuild: string[];
  /** Enable audit logging for security events */
  enableAuditLog: boolean;
  /** How many days to retain audit log entries */
  auditLogRetentionDays: number;
}

/**
 * ClassifiedCommand - Result of analyzing and classifying an npm command
 *
 * Contains original command, classification metadata, risk assessment,
 * and optionally a rewritten safe version with --ignore-scripts flag.
 */
export interface ClassifiedCommand {
  /** Original command string as entered/requested */
  original: string;
  /** Classification category */
  type: NpmCommandType;
  /** Detected package manager */
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';
  /** True if this is an install-type command */
  isInstallCommand: boolean;
  /** True if this is a high-risk execute command (npx/bunx/etc) */
  isHighRiskExecute: boolean;
  /** Command rewritten with --ignore-scripts added (if applicable) */
  rewrittenCommand?: string;
  /** Whether user approval is required before execution */
  requiresApproval: boolean;
  /** Risk level assessment */
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * NpmSecurityApprovalRequest - Request sent to UI for user approval
 *
 * When a command requires approval, this payload is sent to the frontend
 * to display an approval dialog with contextual information and options.
 */
export interface NpmSecurityApprovalRequest {
  /** Unique identifier for this approval request */
  id: string;
  /** Feature ID that triggered the command (if applicable) */
  featureId: string;
  /** Worktree ID where command will run (if applicable) */
  worktreeId?: string;
  /** Absolute path to project directory */
  projectPath: string;
  /** Classified command details */
  command: ClassifiedCommand;
  /** Unix timestamp when request was created */
  timestamp: number;
  /** Available approval options to present to user */
  options: NpmSecurityApprovalOption[];
}

/**
 * NpmSecurityApprovalOption - Single approval choice in the UI dialog
 *
 * Represents one action the user can take (e.g., "Run safely", "Allow once", "Cancel").
 * Options include metadata for UI presentation (labels, descriptions, defaults).
 */
export interface NpmSecurityApprovalOption {
  /** Unique identifier for this option */
  id: string;
  /** Short label for button/menu item */
  label: string;
  /** Longer explanation of what this option does */
  description: string;
  /** Action to take if user selects this option */
  action: 'proceed-safe' | 'allow-once' | 'allow-worktree' | 'allow-project' | 'cancel';
  /** Whether this option is pre-selected (default choice) */
  isDefault?: boolean;
  /** Whether this option is marked as recommended (security badge/highlight) */
  isRecommended?: boolean;
}

/**
 * NpmSecurityApprovalResponse - User's approval decision sent back to server
 *
 * After user makes a choice in the approval dialog, this response is sent
 * to the server to proceed with the command or cancel.
 */
export interface NpmSecurityApprovalResponse {
  /** ID of the original approval request */
  requestId: string;
  /** Action selected by the user */
  selectedOption: NpmSecurityApprovalOption['action'];
  /** Whether to persist this choice for future similar commands */
  rememberChoice: boolean;
}

/**
 * NpmSecurityAuditEntry - Single entry in the security audit log
 *
 * Records all security-relevant events (blocked commands, approvals, policy changes)
 * for compliance, debugging, and security review purposes.
 */
export interface NpmSecurityAuditEntry {
  /** Unique identifier for this log entry */
  id: string;
  /** Unix timestamp when event occurred */
  timestamp: number;
  /** Absolute path to project directory */
  projectPath: string;
  /** Worktree ID where event occurred (if applicable) */
  worktreeId?: string;
  /** Feature ID associated with event (if applicable) */
  featureId?: string;
  /** Type of security event */
  eventType:
    | 'command-allowed'
    | 'command-blocked'
    | 'command-rewritten'
    | 'approval-requested'
    | 'approval-granted'
    | 'approval-denied'
    | 'policy-changed';
  /** Command details (for command-related events) */
  command?: ClassifiedCommand;
  /** User's decision (for approval events) */
  decision?: NpmSecurityApprovalOption['action'];
  /** User ID who triggered event (if available) */
  userId?: string;
}

/**
 * Default npm security settings used when no project-specific config exists
 *
 * Uses strict mode with lifecycle scripts blocked to maximize security by default.
 */
export const DEFAULT_NPM_SECURITY_SETTINGS: NpmSecuritySettings = {
  dependencyInstallPolicy: 'strict',
  allowInstallScripts: false,
  allowedPackagesForRebuild: [],
  enableAuditLog: true,
  auditLogRetentionDays: 30,
};
