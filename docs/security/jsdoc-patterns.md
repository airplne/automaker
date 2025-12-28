# JSDoc Documentation Patterns for npm Security

This document provides JSDoc comment patterns for the main functions in Automaker's npm security implementation. Use these patterns when documenting security-related code.

## Command Classification Functions

### classifyCommand()

````typescript
/**
 * Classifies a shell command for npm security policy enforcement.
 *
 * This is the main entry point for command classification. It analyzes the command
 * to determine which package manager is being used, what type of operation is being
 * performed, the risk level, and whether the command should be rewritten for safety.
 *
 * The classification drives security policy decisions:
 * - Install commands may be rewritten to add `--ignore-scripts`
 * - High-risk execute commands require user approval
 * - Risk levels inform UI warnings and audit logging
 *
 * @param command - The shell command to classify (e.g., "npm install lodash")
 * @returns Classification result including command type, risk level, and optional rewritten command
 *
 * @example Basic install command
 * ```ts
 * const result = classifyCommand('npm install lodash');
 * // {
 * //   original: 'npm install lodash',
 * //   type: 'install',
 * //   packageManager: 'npm',
 * //   isInstallCommand: true,
 * //   isHighRiskExecute: false,
 * //   rewrittenCommand: 'npm install lodash --ignore-scripts',
 * //   requiresApproval: false,
 * //   riskLevel: 'medium'
 * // }
 * ```
 *
 * @example High-risk execute command
 * ```ts
 * const result = classifyCommand('npx create-react-app my-app');
 * // {
 * //   original: 'npx create-react-app my-app',
 * //   type: 'high-risk-execute',
 * //   packageManager: 'npm',
 * //   isInstallCommand: false,
 * //   isHighRiskExecute: true,
 * //   requiresApproval: true,
 * //   riskLevel: 'high'
 * // }
 * ```
 *
 * @see {@link detectPackageManager} for package manager detection logic
 * @see {@link rewriteInstallCommand} for command rewriting implementation
 */
export function classifyCommand(command: string): ClassifiedCommand {
  // Implementation
}
````

### detectPackageManager()

````typescript
/**
 * Detects the package manager being used in a shell command.
 *
 * Analyzes the command string to identify which package manager (npm, pnpm, yarn, or bun)
 * is being invoked. This detection is used to determine command syntax and available flags
 * for security policy enforcement.
 *
 * The function normalizes the command by removing environment variables and extracts
 * the base command, then checks for package manager-specific patterns using word
 * boundaries to avoid false matches in file paths or other contexts.
 *
 * @param command - The shell command to analyze
 * @returns The detected package manager, or 'unknown' if none is detected
 *
 * @example npm detection
 * ```ts
 * detectPackageManager('npm install lodash') // 'npm'
 * detectPackageManager('npx create-react-app') // 'npm'
 * ```
 *
 * @example Other package managers
 * ```ts
 * detectPackageManager('pnpm add lodash') // 'pnpm'
 * detectPackageManager('yarn install') // 'yarn'
 * detectPackageManager('bunx vitest') // 'bun'
 * ```
 *
 * @example Edge cases
 * ```ts
 * detectPackageManager('echo npm install') // 'npm' (still detects npm keyword)
 * detectPackageManager('cd node_modules') // 'unknown'
 * ```
 */
export function detectPackageManager(command: string): 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown' {
  // Implementation
}
````

### rewriteInstallCommand()

````typescript
/**
 * Rewrites an install command to add the --ignore-scripts flag if not already present.
 *
 * This function implements the core security hardening for npm install commands by
 * automatically appending `--ignore-scripts` to prevent lifecycle scripts from executing.
 * The flag is added in a way that preserves the command structure and handles shell
 * operators (&&, ||, ;, |) correctly.
 *
 * The function is idempotent - running it multiple times on the same command will not
 * add duplicate flags. Commands that already include `--ignore-scripts` are returned
 * unchanged.
 *
 * @param command - The install command to rewrite
 * @returns The rewritten command with --ignore-scripts added, or original if not applicable
 *
 * @example Basic rewriting
 * ```ts
 * rewriteInstallCommand('npm install')
 * // 'npm install --ignore-scripts'
 *
 * rewriteInstallCommand('npm ci --production')
 * // 'npm ci --production --ignore-scripts'
 * ```
 *
 * @example Preserving shell operators
 * ```ts
 * rewriteInstallCommand('npm install && npm test')
 * // 'npm install --ignore-scripts && npm test'
 * ```
 *
 * @example Idempotent behavior
 * ```ts
 * rewriteInstallCommand('npm install --ignore-scripts')
 * // 'npm install --ignore-scripts' (no change)
 * ```
 *
 * @see {@link hasIgnoreScriptsFlag} for flag detection logic
 */
export function rewriteInstallCommand(command: string): string {
  // Implementation
}
````

## Policy Enforcement Functions

### enforceNpmSecurityPolicy()

````typescript
/**
 * Enforces npm security policy for a command in the context of a project.
 *
 * This is the main policy enforcement function that decides whether a command should be:
 * 1. Allowed to run as-is
 * 2. Rewritten to be safer (adding --ignore-scripts)
 * 3. Blocked pending user approval
 *
 * The function considers:
 * - Project security settings (strict/prompt/allow mode)
 * - Command classification and risk level
 * - Previous user decisions for this project/worktree
 * - Per-package whitelist settings (future feature)
 *
 * When approval is required, the function creates an approval request that is sent
 * to the UI and waits for the user's decision before proceeding.
 *
 * @param command - The shell command to evaluate
 * @param projectPath - Absolute path to the project directory
 * @param settings - Project's npm security settings
 * @param featureId - ID of the feature executing the command (for audit logging)
 * @param worktreeId - Optional worktree ID (for worktree-scoped approvals)
 * @returns Promise resolving to the command to execute (rewritten or original) or null if blocked
 *
 * @throws {NpmSecurityError} If approval is required but cannot be obtained (e.g., headless mode)
 *
 * @example Strict mode - install command rewritten
 * ```ts
 * const settings = { dependencyInstallPolicy: 'strict', allowInstallScripts: false };
 * const result = await enforceNpmSecurityPolicy(
 *   'npm install lodash',
 *   '/path/to/project',
 *   settings,
 *   'feature-123'
 * );
 * // Returns: 'npm install lodash --ignore-scripts'
 * ```
 *
 * @example High-risk command requires approval
 * ```ts
 * const result = await enforceNpmSecurityPolicy(
 *   'npx create-react-app my-app',
 *   '/path/to/project',
 *   settings,
 *   'feature-123'
 * );
 * // Shows approval dialog to user
 * // Returns: original command if approved, null if denied
 * ```
 *
 * @see {@link classifyCommand} for command analysis
 * @see {@link createApprovalRequest} for approval dialog generation
 */
export async function enforceNpmSecurityPolicy(
  command: string,
  projectPath: string,
  settings: NpmSecuritySettings,
  featureId: string,
  worktreeId?: string
): Promise<string | null> {
  // Implementation
}
````

### createApprovalRequest()

````typescript
/**
 * Creates an approval request for a command that requires user consent.
 *
 * Generates a structured approval request with contextual information and available
 * options based on the command type and risk level. The request is sent to the UI
 * to display an approval dialog.
 *
 * The options presented to the user depend on:
 * - Command type (install vs high-risk-execute)
 * - Risk level (low/medium/high)
 * - Context (project-level vs worktree-level execution)
 *
 * @param command - Classified command requiring approval
 * @param projectPath - Absolute path to project
 * @param featureId - Feature ID for audit trail
 * @param worktreeId - Optional worktree ID for scoped approvals
 * @returns Approval request ready to send to UI
 *
 * @example Install command approval
 * ```ts
 * const classified = classifyCommand('npm install suspicious-package');
 * const request = createApprovalRequest(
 *   classified,
 *   '/path/to/project',
 *   'feature-123',
 *   'worktree-abc'
 * );
 * // request.options will include:
 * // - "Proceed with scripts disabled" (recommended)
 * // - "Allow scripts once"
 * // - "Allow scripts for this worktree"
 * // - "Allow scripts for this project"
 * // - "Cancel"
 * ```
 *
 * @see {@link NpmSecurityApprovalRequest} for request structure
 * @see {@link NpmSecurityApprovalOption} for option structure
 */
export function createApprovalRequest(
  command: ClassifiedCommand,
  projectPath: string,
  featureId: string,
  worktreeId?: string
): NpmSecurityApprovalRequest {
  // Implementation
}
````

## Audit Logging Functions

### logNpmSecurityEvent()

````typescript
/**
 * Logs an npm security event to the project's audit log.
 *
 * Writes a structured log entry to `.automaker/npm-security-audit.jsonl` in JSON Lines
 * format. Each event includes timestamp, context (project/worktree/feature), event type,
 * command details, and user decision (if applicable).
 *
 * The audit log provides:
 * - Compliance trail for security reviews
 * - Debugging information for policy issues
 * - Historical record of security decisions
 * - Detection of potential security incidents
 *
 * Events are appended atomically to prevent concurrent write conflicts when multiple
 * agents are running.
 *
 * @param projectPath - Absolute path to project directory
 * @param eventType - Type of security event being logged
 * @param command - Classified command (if applicable)
 * @param decision - User's approval decision (if applicable)
 * @param featureId - Feature ID associated with event
 * @param worktreeId - Optional worktree ID
 * @returns Promise resolving when log entry is written
 *
 * @throws {Error} If audit log directory cannot be created or write fails
 *
 * @example Logging a blocked command
 * ```ts
 * await logNpmSecurityEvent(
 *   '/path/to/project',
 *   'command-blocked',
 *   classifiedCommand,
 *   undefined,
 *   'feature-123'
 * );
 * ```
 *
 * @example Logging an approval decision
 * ```ts
 * await logNpmSecurityEvent(
 *   '/path/to/project',
 *   'approval-granted',
 *   classifiedCommand,
 *   'allow-once',
 *   'feature-123',
 *   'worktree-abc'
 * );
 * ```
 *
 * @see {@link NpmSecurityAuditEntry} for log entry structure
 */
export async function logNpmSecurityEvent(
  projectPath: string,
  eventType: NpmSecurityAuditEntry['eventType'],
  command?: ClassifiedCommand,
  decision?: NpmSecurityApprovalOption['action'],
  featureId?: string,
  worktreeId?: string
): Promise<void> {
  // Implementation
}
````

## Settings Management Functions

### getNpmSecuritySettings()

````typescript
/**
 * Retrieves npm security settings for a project.
 *
 * Loads the project's settings file and extracts npm security configuration.
 * If no custom settings exist, returns secure defaults (strict mode with
 * scripts blocked).
 *
 * Settings are cached per project to avoid repeated file I/O, with cache
 * invalidation when settings are updated via the settings service.
 *
 * @param projectPath - Absolute path to project directory
 * @returns Promise resolving to npm security settings
 *
 * @throws {Error} If settings file cannot be read or is corrupted
 *
 * @example
 * ```ts
 * const settings = await getNpmSecuritySettings('/path/to/project');
 * console.log(settings.dependencyInstallPolicy); // 'strict'
 * console.log(settings.allowInstallScripts); // false
 * ```
 *
 * @see {@link DEFAULT_NPM_SECURITY_SETTINGS} for default values
 * @see {@link updateNpmSecuritySettings} for updating settings
 */
export async function getNpmSecuritySettings(projectPath: string): Promise<NpmSecuritySettings> {
  // Implementation
}
````

### updateNpmSecuritySettings()

````typescript
/**
 * Updates npm security settings for a project.
 *
 * Modifies the project's settings file to update npm security configuration.
 * The update is applied atomically with file locking to prevent corruption
 * from concurrent modifications.
 *
 * After successful update:
 * - Settings cache is invalidated
 * - A policy-changed event is logged to the audit log
 * - All active agents for this project are notified
 *
 * @param projectPath - Absolute path to project directory
 * @param settings - Partial settings to update (only specified fields are changed)
 * @returns Promise resolving when settings are saved
 *
 * @throws {Error} If settings file cannot be written
 *
 * @example Changing to prompt mode
 * ```ts
 * await updateNpmSecuritySettings('/path/to/project', {
 *   dependencyInstallPolicy: 'prompt'
 * });
 * ```
 *
 * @example Allowing install scripts
 * ```ts
 * await updateNpmSecuritySettings('/path/to/project', {
 *   allowInstallScripts: true
 * });
 * ```
 *
 * @see {@link getNpmSecuritySettings} for retrieving settings
 */
export async function updateNpmSecuritySettings(
  projectPath: string,
  settings: Partial<NpmSecuritySettings>
): Promise<void> {
  // Implementation
}
````

## Utility Functions

### hasIgnoreScriptsFlag()

````typescript
/**
 * Checks if a command already includes the --ignore-scripts flag.
 *
 * Used by command rewriting logic to avoid adding duplicate flags and to
 * assess risk level (commands with the flag are lower risk).
 *
 * @param command - Command to check
 * @returns True if --ignore-scripts is present
 *
 * @example
 * ```ts
 * hasIgnoreScriptsFlag('npm install --ignore-scripts') // true
 * hasIgnoreScriptsFlag('npm install') // false
 * hasIgnoreScriptsFlag('npm install --save-dev --ignore-scripts lodash') // true
 * ```
 */
export function hasIgnoreScriptsFlag(command: string): boolean {
  // Implementation
}
````

## Type Documentation

### ClassifiedCommand

````typescript
/**
 * Result of analyzing and classifying a shell command for security enforcement.
 *
 * Contains all information needed to make policy decisions:
 * - Original command for audit logging
 * - Classification metadata (type, package manager)
 * - Risk assessment for UI warnings
 * - Optional rewritten safe version
 * - Approval requirement flag
 *
 * @example Install command
 * ```ts
 * {
 *   original: 'npm install lodash',
 *   type: 'install',
 *   packageManager: 'npm',
 *   isInstallCommand: true,
 *   isHighRiskExecute: false,
 *   rewrittenCommand: 'npm install lodash --ignore-scripts',
 *   requiresApproval: false,
 *   riskLevel: 'medium'
 * }
 * ```
 */
export interface ClassifiedCommand {
  /** Original command string as entered */
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
  /** Risk level for UI presentation and logging */
  riskLevel: 'low' | 'medium' | 'high';
}
````

## Documentation Standards

When documenting npm security functions:

1. **Start with a clear one-line summary** - What does the function do?

2. **Explain the security context** - Why is this function necessary? What threat does it address?

3. **Document all parameters thoroughly** - Include types, constraints, and examples

4. **Provide multiple examples** - Cover common cases and edge cases

5. **Link related functions** - Use @see tags to connect related documentation

6. **Explain error cases** - What can go wrong? When does it throw?

7. **Include security implications** - What happens if this function is bypassed?

8. **Keep it practical** - Focus on how developers will use the function

## Testing Documentation

When documenting tests for security functions:

```typescript
/**
 * Test suite for npm command classification security features.
 *
 * Tests verify that:
 * - All package managers are correctly detected
 * - High-risk commands are properly flagged
 * - Command rewriting preserves shell syntax
 * - Edge cases (subshells, operators) are handled
 * - Malicious patterns are caught
 *
 * Security coverage includes:
 * - Typosquatting detection patterns
 * - Shell injection attempts in package names
 * - Commands that try to bypass --ignore-scripts
 * - Unicode and encoding tricks
 */
describe('npm-command-classifier', () => {
  // Tests
});
```
