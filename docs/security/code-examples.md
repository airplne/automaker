# npm Security Code Examples

This document provides ready-to-use code snippets for implementing npm security features. All examples follow the JSDoc patterns documented in `jsdoc-patterns.md`.

## Enhanced JSDoc for Existing Functions

### For `apps/server/src/lib/npm-command-classifier.ts`

#### classifyCommand() - Enhanced Documentation

Replace the existing JSDoc comment with:

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
 * @example Safe command (already has --ignore-scripts)
 * ```ts
 * const result = classifyCommand('npm install --ignore-scripts');
 * // {
 * //   original: 'npm install --ignore-scripts',
 * //   type: 'install',
 * //   packageManager: 'npm',
 * //   isInstallCommand: true,
 * //   isHighRiskExecute: false,
 * //   rewrittenCommand: undefined, // No rewrite needed
 * //   requiresApproval: false,
 * //   riskLevel: 'low'
 * // }
 * ```
 *
 * @see {@link detectPackageManager} for package manager detection logic
 * @see {@link rewriteInstallCommand} for command rewriting implementation
 */
export function classifyCommand(command: string): ClassifiedCommand {
  // Existing implementation
}
````

#### detectPackageManager() - Enhanced Documentation

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
 * detectPackageManager('NODE_ENV=production npm install') // 'npm'
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
 * detectPackageManager('ls -la npm') // 'unknown' (file operation, not package manager)
 * ```
 */
export function detectPackageManager(command: string): 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown' {
  // Existing implementation
}
````

#### rewriteInstallCommand() - Enhanced Documentation

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
 *
 * rewriteInstallCommand('pnpm add lodash express')
 * // 'pnpm add lodash express --ignore-scripts'
 * ```
 *
 * @example Preserving shell operators
 * ```ts
 * rewriteInstallCommand('npm install && npm test')
 * // 'npm install --ignore-scripts && npm test'
 *
 * rewriteInstallCommand('npm install || echo failed')
 * // 'npm install --ignore-scripts || echo failed'
 * ```
 *
 * @example Idempotent behavior
 * ```ts
 * const cmd = 'npm install --ignore-scripts';
 * rewriteInstallCommand(cmd) === cmd // true (no change)
 * ```
 *
 * @example Subshells
 * ```ts
 * rewriteInstallCommand('(npm install)')
 * // '(npm install --ignore-scripts)'
 * ```
 *
 * @see {@link hasIgnoreScriptsFlag} for flag detection logic
 */
export function rewriteInstallCommand(command: string): string {
  // Existing implementation
}
````

### For `libs/types/src/npm-security.ts`

#### ClassifiedCommand Interface - Enhanced Documentation

Add before the interface definition:

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
 * Used by:
 * - Policy enforcement to determine if approval is required
 * - UI to display appropriate approval dialogs
 * - Audit logging to record security events
 *
 * @example Install command classification
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
 *
 * @example High-risk command classification
 * ```ts
 * {
 *   original: 'npx suspicious-package',
 *   type: 'high-risk-execute',
 *   packageManager: 'npm',
 *   isInstallCommand: false,
 *   isHighRiskExecute: true,
 *   rewrittenCommand: undefined,
 *   requiresApproval: true,
 *   riskLevel: 'high'
 * }
 * ```
 */
export interface ClassifiedCommand {
  // Existing fields
}
````

#### NpmSecuritySettings Interface - Enhanced Documentation

````typescript
/**
 * Per-project npm security configuration.
 *
 * Stored in project settings (`.automaker/settings.json`) to define security
 * policy for package management operations. Controls whether lifecycle scripts
 * are allowed and which packages are trusted.
 *
 * Settings can be configured:
 * - Through the UI (Settings > npm Security)
 * - By editing settings.json directly
 * - Via approval dialogs ("Remember for this project")
 *
 * @example Strict mode (default, maximum security)
 * ```ts
 * {
 *   dependencyInstallPolicy: 'strict',
 *   allowInstallScripts: false,
 *   allowedPackagesForRebuild: []
 * }
 * ```
 *
 * @example Prompt mode (trusted project)
 * ```ts
 * {
 *   dependencyInstallPolicy: 'prompt',
 *   allowInstallScripts: false,
 *   allowedPackagesForRebuild: ['node-pty', 'esbuild']
 * }
 * ```
 *
 * @example Allow mode (fully trusted)
 * ```ts
 * {
 *   dependencyInstallPolicy: 'allow',
 *   allowInstallScripts: true,
 *   allowedPackagesForRebuild: []
 * }
 * ```
 *
 * @see {@link DEFAULT_NPM_SECURITY_SETTINGS} for default values
 */
export interface NpmSecuritySettings {
  // Existing fields
}
````

## Inline Security Comments

### Security Reasoning Comments

Add these inline comments to explain security decisions:

#### In `detectPackageManager()`

```typescript
export function detectPackageManager(command: string): 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown' {
  const normalized = normalizeCommand(command);

  // Check for each package manager in order of specificity
  // Use word boundaries (\b) to avoid false matches in paths or variable names
  // For example, "/path/to/npm-cache" should not match as npm usage
  if (/\b(npx|npm)\b/.test(normalized)) {
    return 'npm';
  }
  // ... rest of implementation
}
```

#### In `rewriteInstallCommand()`

```typescript
export function rewriteInstallCommand(command: string): string {
  // Idempotent: don't rewrite if already has the flag
  // This prevents commands like "npm install --ignore-scripts" from becoming
  // "npm install --ignore-scripts --ignore-scripts"
  if (hasIgnoreScriptsFlag(command)) {
    return command;
  }

  // ... rest of implementation

  // Strategy: Add --ignore-scripts at the end of the install command
  // but before any shell operators like &&, ||, |, ;
  // This ensures the flag applies to the install, not subsequent commands
  const operatorPattern = /(\s*(?:&&|\|\||;|\|)\s*)/;
  // ... rest of implementation
}
```

#### In `calculateRiskLevel()`

```typescript
function calculateRiskLevel(
  type: 'install' | 'high-risk-execute' | 'script-run' | 'other',
  hasIgnoreScripts: boolean
): 'low' | 'medium' | 'high' {
  // High-risk execute commands (npx, bunx, etc.) are always high risk
  // They download and execute code immediately with no review opportunity
  if (type === 'high-risk-execute') {
    return 'high';
  }

  // Install commands without --ignore-scripts are medium risk
  // They can run lifecycle scripts which may contain malicious code
  if (type === 'install' && !hasIgnoreScripts) {
    return 'medium';
  }

  // All other commands (including installs with --ignore-scripts) are low risk
  return 'low';
}
```

## Test Documentation Examples

### Test File Header

Add to the top of `npm-command-classifier.test.ts`:

```typescript
/**
 * Test suite for npm command classification security features.
 *
 * This test suite verifies the security of npm command classification and rewriting.
 * All tests are designed to ensure malicious or unsafe commands are properly detected
 * and handled.
 *
 * Test Coverage:
 * - Package manager detection (npm, pnpm, yarn, bun)
 * - Command type classification (install, high-risk-execute, script-run, other)
 * - Risk level assessment (low, medium, high)
 * - Command rewriting (adding --ignore-scripts)
 * - Edge cases (subshells, shell operators, environment variables)
 *
 * Security Coverage:
 * - Malicious command patterns
 * - Shell injection attempts in package names
 * - Commands attempting to bypass --ignore-scripts
 * - Typosquatting patterns (similar package names)
 * - Unicode and encoding tricks
 *
 * @see {@link classifyCommand} for main classification function
 */
describe('npm-command-classifier', () => {
  // Tests
});
```

### Test Group Documentation

```typescript
describe('detectPackageManager', () => {
  /**
   * Security test: Verify that package manager detection cannot be fooled
   * by malicious commands that try to hide the actual package manager.
   */
  describe('security edge cases', () => {
    it('should detect npm even with environment variables', () => {
      expect(detectPackageManager('NODE_ENV=production npm install')).toBe('npm');
    });

    it('should not be fooled by npm in file paths', () => {
      expect(detectPackageManager('ls /path/to/npm')).toBe('unknown');
    });

    it('should detect npm in subshells', () => {
      expect(detectPackageManager('(npm install)')).toBe('npm');
    });
  });
});

describe('rewriteInstallCommand', () => {
  /**
   * Security test: Verify that command rewriting preserves safety
   * even with complex shell constructs.
   */
  describe('shell operator handling', () => {
    it('should add flag before && operator', () => {
      const result = rewriteInstallCommand('npm install && npm test');
      expect(result).toBe('npm install --ignore-scripts && npm test');
    });

    it('should handle multiple operators correctly', () => {
      const result = rewriteInstallCommand('npm install || echo failed; echo done');
      expect(result).toBe('npm install --ignore-scripts || echo failed; echo done');
    });
  });
});
```

## UI Component Documentation Examples

### Approval Dialog Component

````typescript
/**
 * npm Security Approval Dialog Component
 *
 * Displays a security approval dialog when an AI agent attempts to run a command
 * that requires user consent (e.g., npx, install without --ignore-scripts).
 *
 * The dialog presents:
 * - Command details and risk assessment
 * - Explanation of security implications
 * - Multiple approval options (safe, once, project, cancel)
 * - Option to remember choice for future commands
 *
 * Security Considerations:
 * - Default option is always the safest choice
 * - Risk level is prominently displayed
 * - "Allow" options clearly explain scope (once, worktree, project)
 * - Cancel is always available and explained
 *
 * @example
 * ```tsx
 * <NpmSecurityApprovalDialog
 *   request={approvalRequest}
 *   onApprove={(decision) => handleApproval(decision)}
 *   onCancel={() => handleCancel()}
 * />
 * ```
 */
export function NpmSecurityApprovalDialog(props: NpmSecurityApprovalDialogProps) {
  // Implementation
}
````

### Settings Component

````typescript
/**
 * npm Security Settings Component
 *
 * Allows users to configure per-project npm security policy:
 * - Dependency install policy (strict/prompt/allow)
 * - Install scripts toggle
 * - Package rebuild allowlist
 *
 * Each setting includes:
 * - Clear explanation of security implications
 * - Recommended value indicator
 * - Link to detailed documentation
 *
 * @example
 * ```tsx
 * <NpmSecuritySettings
 *   projectPath="/path/to/project"
 *   settings={currentSettings}
 *   onChange={(newSettings) => updateSettings(newSettings)}
 * />
 * ```
 */
export function NpmSecuritySettings(props: NpmSecuritySettingsProps) {
  // Implementation
}
````

## Configuration File Examples

### Project Settings JSON Schema

````typescript
/**
 * Project settings file schema (.automaker/settings.json)
 *
 * Example with npm security configuration:
 *
 * ```json
 * {
 *   "npmSecurity": {
 *     "dependencyInstallPolicy": "strict",
 *     "allowInstallScripts": false,
 *     "allowedPackagesForRebuild": []
 *   }
 * }
 * ```
 *
 * Security Modes:
 *
 * Strict (recommended):
 * ```json
 * {
 *   "dependencyInstallPolicy": "strict",
 *   "allowInstallScripts": false,
 *   "allowedPackagesForRebuild": []
 * }
 * ```
 *
 * Prompt (trusted projects):
 * ```json
 * {
 *   "dependencyInstallPolicy": "prompt",
 *   "allowInstallScripts": false,
 *   "allowedPackagesForRebuild": ["node-pty", "esbuild"]
 * }
 * ```
 *
 * Allow (fully trusted only):
 * ```json
 * {
 *   "dependencyInstallPolicy": "allow",
 *   "allowInstallScripts": true,
 *   "allowedPackagesForRebuild": []
 * }
 * ```
 */
````

## Error Message Examples

### Security Error Messages

```typescript
/**
 * Error messages for npm security violations
 *
 * Messages should be:
 * - Clear about what was blocked and why
 * - Actionable (explain how to proceed safely)
 * - Link to documentation for details
 */
export const NPM_SECURITY_ERRORS = {
  HIGH_RISK_BLOCKED: `
High-risk npm command blocked for security.

Command: {command}
Risk: {riskLevel}

This command would execute code immediately without review.

Options:
1. Review the package on npm registry
2. Use approval dialog to allow once
3. Change security mode in Settings > npm Security

See: docs/security/npm-supply-chain.md
  `.trim(),

  INSTALL_SCRIPTS_BLOCKED: `
Install command rewritten to block lifecycle scripts.

Original: {original}
Rewritten: {rewritten}

Lifecycle scripts can execute arbitrary code during installation.

If needed, you can:
1. Approve scripts in the security dialog
2. Manually rebuild specific packages after install
3. Change security mode in Settings > npm Security

See: docs/security/npm-supply-chain.md
  `.trim(),
};
```

## Documentation Metadata

Add to the top of each major security file:

```typescript
/**
 * @fileoverview npm Command Classifier for Secure npm Guardrails
 *
 * This module provides command classification and rewriting capabilities
 * for enforcing npm security policies in Automaker. It protects against
 * npm supply chain attacks by:
 *
 * 1. Detecting package manager commands (npm, pnpm, yarn, bun)
 * 2. Classifying command types and risk levels
 * 3. Rewriting install commands to add --ignore-scripts
 * 4. Flagging high-risk execute commands for approval
 *
 * Security Context:
 * - Lifecycle scripts can execute arbitrary code during installation
 * - npx/bunx/dlx commands download and run code immediately
 * - Supply chain attacks are a major threat in npm ecosystem
 *
 * @module npm-command-classifier
 * @see {@link https://docs.automaker.dev/security/npm-supply-chain.md} for detailed docs
 *
 * @author Automaker Security Team
 * @since 1.0.0
 */
```

---

**Usage:**

Copy the relevant sections from this file directly into your code, adapting as needed for your specific implementation. All examples follow TypeScript and JSDoc best practices.
