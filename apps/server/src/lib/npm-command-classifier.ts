/**
 * npm Command Classifier for Secure npm Guardrails
 *
 * This module provides command classification and rewriting capabilities
 * for enforcing npm security policies in Automaker.
 */

export interface ClassifiedCommand {
  original: string;
  type: 'install' | 'high-risk-execute' | 'script-run' | 'other';
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';
  isInstallCommand: boolean;
  isHighRiskExecute: boolean;
  rewrittenCommand?: string;
  requiresApproval: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Detects the package manager being used in a command
 *
 * @param command - The shell command to analyze
 * @returns The detected package manager or 'unknown'
 *
 * @example
 * detectPackageManager('npm install') // 'npm'
 * detectPackageManager('pnpm add lodash') // 'pnpm'
 */
export function detectPackageManager(command: string): 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown' {
  // Normalize command by removing environment variables and extracting the base command
  const normalized = normalizeCommand(command);

  // Check for each package manager in order of specificity
  // Use word boundaries to avoid false matches in paths or other contexts
  if (/\b(npx|npm)\b/.test(normalized)) {
    return 'npm';
  }
  if (/\bpnpm\b/.test(normalized)) {
    return 'pnpm';
  }
  if (/\byarn\b/.test(normalized)) {
    return 'yarn';
  }
  if (/\b(bunx|bun)\b/.test(normalized)) {
    return 'bun';
  }

  return 'unknown';
}

/**
 * Checks if a command already has the --ignore-scripts flag
 *
 * @param command - The command to check
 * @returns True if --ignore-scripts is present
 *
 * @example
 * hasIgnoreScriptsFlag('npm install --ignore-scripts') // true
 * hasIgnoreScriptsFlag('npm install') // false
 */
export function hasIgnoreScriptsFlag(command: string): boolean {
  // Match --ignore-scripts with word boundaries
  // Also check for the short form if applicable
  return /--ignore-scripts\b/.test(command);
}

/**
 * Rewrites an install command to add --ignore-scripts if not present
 *
 * @param command - The install command to rewrite
 * @returns The rewritten command with --ignore-scripts added
 *
 * @example
 * rewriteInstallCommand('npm install') // 'npm install --ignore-scripts'
 * rewriteInstallCommand('npm ci --production') // 'npm ci --production --ignore-scripts'
 */
export function rewriteInstallCommand(command: string): string {
  // Don't rewrite if already has the flag
  if (hasIgnoreScriptsFlag(command)) {
    return command;
  }

  // Find the install command and add --ignore-scripts after it
  const packageManager = detectPackageManager(command);

  if (packageManager === 'unknown') {
    return command;
  }

  // Strategy: Add --ignore-scripts at the end of the command
  // but before any shell operators like &&, ||, |, ;, etc.

  // Split on common shell operators while preserving them
  const operatorPattern = /(\s*(?:&&|\|\||;|\|)\s*)/;
  const parts = command.split(operatorPattern);

  // Process the first part (the actual install command)
  if (parts.length > 0) {
    const firstPart = parts[0];

    // Handle subshells - add flag inside the subshell
    const subshellMatch = firstPart.match(/^(\(.*?)(\))$/);
    if (subshellMatch) {
      parts[0] = subshellMatch[1] + ' --ignore-scripts' + subshellMatch[2];
    } else {
      // Simple case: just append the flag
      parts[0] = firstPart.trim() + ' --ignore-scripts';
    }
  }

  return parts.join('');
}

/**
 * Normalizes a command by removing environment variables and extra whitespace
 *
 * @param command - The command to normalize
 * @returns Normalized command string
 */
function normalizeCommand(command: string): string {
  // Remove leading environment variables (KEY=value format)
  let normalized = command.replace(/^(\s*[A-Z_][A-Z0-9_]*=\S+\s+)+/g, '');

  // Remove subshell wrappers
  normalized = normalized.replace(/^\s*\(/, '').replace(/\)\s*$/, '');

  // Normalize whitespace
  normalized = normalized.trim().replace(/\s+/g, ' ');

  return normalized;
}

/**
 * Determines the command type based on the package manager action
 *
 * @param command - The command to classify
 * @param packageManager - The detected package manager
 * @returns The command type
 */
function classifyCommandType(
  command: string,
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown'
): 'install' | 'high-risk-execute' | 'script-run' | 'other' {
  const normalized = normalizeCommand(command);

  if (packageManager === 'unknown') {
    return 'other';
  }

  // Check for high-risk execute commands first (most specific)
  if (isHighRiskExecute(normalized, packageManager)) {
    return 'high-risk-execute';
  }

  // Check for install commands
  if (isInstallCommand(normalized, packageManager)) {
    return 'install';
  }

  // Check for script-run commands
  if (isScriptRunCommand(normalized, packageManager)) {
    return 'script-run';
  }

  return 'other';
}

/**
 * Checks if a command is a high-risk execute command
 */
function isHighRiskExecute(normalized: string, packageManager: string): boolean {
  switch (packageManager) {
    case 'npm':
      return /\b(npx|npm\s+exec)\b/.test(normalized);
    case 'pnpm':
      return /\bpnpm\s+(dlx|exec)\b/.test(normalized);
    case 'yarn':
      return /\byarn\s+dlx\b/.test(normalized);
    case 'bun':
      return /\b(bunx|bun\s+x)\b/.test(normalized);
    default:
      return false;
  }
}

/**
 * Checks if a command is an install command
 */
function isInstallCommand(normalized: string, packageManager: string): boolean {
  switch (packageManager) {
    case 'npm':
      return /\bnpm\s+(install|i|ci|add)\b/.test(normalized);
    case 'pnpm':
      return /\bpnpm\s+(install|i|add)\b/.test(normalized);
    case 'yarn':
      // Bare 'yarn' is also an install command
      // But exclude 'yarn <script>' patterns which are script runs
      if (/\byarn\s+(install|add)\b/.test(normalized)) {
        return true;
      }
      // Check for bare 'yarn' (possibly with flags)
      // Match 'yarn' followed by optional flags (starting with -)
      if (/\byarn(\s+--?\w+)*\s*$/.test(normalized)) {
        return true;
      }
      return false;
    case 'bun':
      return /\bbun\s+(install|i|add)\b/.test(normalized);
    default:
      return false;
  }
}

/**
 * Checks if a command is a script-run command
 */
function isScriptRunCommand(normalized: string, packageManager: string): boolean {
  switch (packageManager) {
    case 'npm':
      return /\bnpm\s+(run|run-script)\b/.test(normalized);
    case 'pnpm':
      return /\bpnpm\s+run\b/.test(normalized);
    case 'yarn':
      // 'yarn run <script>' or 'yarn <script>' (when not install/add/dlx)
      if (/\byarn\s+run\b/.test(normalized)) {
        return true;
      }
      // Check for 'yarn <script>' pattern
      // This is a heuristic: if it's not install/add/dlx and has an argument
      if (/\byarn\s+(?!install|add|dlx|--)\w+/.test(normalized)) {
        return true;
      }
      return false;
    case 'bun':
      return /\bbun\s+run\b/.test(normalized);
    default:
      return false;
  }
}

/**
 * Calculates the risk level of a command
 *
 * @param type - The command type
 * @param hasIgnoreScripts - Whether --ignore-scripts is present
 * @returns The risk level
 */
function calculateRiskLevel(
  type: 'install' | 'high-risk-execute' | 'script-run' | 'other',
  hasIgnoreScripts: boolean
): 'low' | 'medium' | 'high' {
  if (type === 'high-risk-execute') {
    return 'high';
  }

  if (type === 'install' && !hasIgnoreScripts) {
    return 'medium';
  }

  return 'low';
}

/**
 * Classifies a shell command for npm security policy enforcement
 *
 * This is the main entry point for command classification. It analyzes
 * the command to determine:
 * - Which package manager is being used
 * - What type of operation is being performed
 * - The risk level of the command
 * - Whether the command should be rewritten for safety
 *
 * @param command - The shell command to classify
 * @returns Classification result with metadata and optional rewritten command
 *
 * @example
 * classifyCommand('npm install lodash')
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
 *
 * @example
 * classifyCommand('npx create-react-app my-app')
 * // {
 * //   original: 'npx create-react-app my-app',
 * //   type: 'high-risk-execute',
 * //   packageManager: 'npm',
 * //   isInstallCommand: false,
 * //   isHighRiskExecute: true,
 * //   requiresApproval: true,
 * //   riskLevel: 'high'
 * // }
 */
export function classifyCommand(command: string): ClassifiedCommand {
  const packageManager = detectPackageManager(command);
  const type = classifyCommandType(command, packageManager);
  const isInstallCommand = type === 'install';
  const isHighRiskExecute = type === 'high-risk-execute';
  const hasIgnoreScripts = hasIgnoreScriptsFlag(command);
  const riskLevel = calculateRiskLevel(type, hasIgnoreScripts);

  // Rewrite install commands to add --ignore-scripts
  let rewrittenCommand: string | undefined;
  if (isInstallCommand && !hasIgnoreScripts) {
    rewrittenCommand = rewriteInstallCommand(command);
  }

  // High-risk execute commands require approval
  const requiresApproval = isHighRiskExecute;

  return {
    original: command,
    type,
    packageManager,
    isInstallCommand,
    isHighRiskExecute,
    rewrittenCommand,
    requiresApproval,
    riskLevel,
  };
}
