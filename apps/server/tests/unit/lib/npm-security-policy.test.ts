import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  enforcePolicy,
  createNpmSecurityEnforcer,
  getSecureNpmEnvironment,
  sanitizeCommandForLogging,
  validateAndCorrectNpmSecuritySettings,
} from '../../../src/lib/npm-security-policy';
import type { NpmSecuritySettings } from '@automaker/types';

describe('npm-security-policy', () => {
  describe('getSecureNpmEnvironment', () => {
    it('returns secure environment variables', () => {
      const env = getSecureNpmEnvironment();
      expect(env.npm_config_ignore_scripts).toBe('true');
      expect(env.npm_config_audit).toBe('true');
      expect(env.npm_config_strict_ssl).toBe('true');
    });
  });

  describe('enforcePolicy', () => {
    const mockCallbacks = {
      onApprovalRequired: vi.fn().mockResolvedValue('allow-once'),
      onAuditLog: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('with strict policy', () => {
      const strictPolicy = {
        dependencyInstallPolicy: 'strict' as const,
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
      };

      it('rewrites install commands to add --ignore-scripts', async () => {
        const result = await enforcePolicy(
          'npm install',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(true);
        expect(result.rewrittenCommand).toContain('--ignore-scripts');
      });

      it('requires approval for high-risk commands', async () => {
        const result = await enforcePolicy(
          'npx jest',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
      });

      it('blocks command when approval is cancelled', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValueOnce('cancel');

        const result = await enforcePolicy(
          'npx jest',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(false);
        expect(result.blockedReason).toContain('cancelled');
      });

      it('allows command when approval is granted', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValueOnce('allow-once');

        const result = await enforcePolicy(
          'npx jest',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(true);
      });

      it('blocks high-risk commands when approval returns invalid decision', async () => {
        // Return an invalid decision that's not offered for high-risk execute
        mockCallbacks.onApprovalRequired.mockResolvedValueOnce('proceed-safe');

        const result = await enforcePolicy(
          'npx some-malicious-package',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(false);
        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(mockCallbacks.onAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'approval-denied',
            decision: 'cancel',
          })
        );
      });

      it('logs all security events', async () => {
        await enforcePolicy('npm install', strictPolicy, '/test/project', mockCallbacks);

        expect(mockCallbacks.onAuditLog).toHaveBeenCalled();
      });

      it('preserves existing flags when rewriting', async () => {
        const result = await enforcePolicy(
          'npm install --production',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.rewrittenCommand).toContain('--production');
        expect(result.rewrittenCommand).toContain('--ignore-scripts');
      });

      it('does not rewrite if --ignore-scripts already present', async () => {
        const result = await enforcePolicy(
          'npm install --ignore-scripts',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(true);
        // Should not have duplicate --ignore-scripts
        const count = (result.rewrittenCommand?.match(/--ignore-scripts/g) || []).length;
        expect(count).toBeLessThanOrEqual(1);
      });
    });

    describe('with allow policy', () => {
      const allowPolicy = {
        dependencyInstallPolicy: 'allow' as const,
        allowInstallScripts: true,
        allowedPackagesForRebuild: [],
      };

      it('allows all commands without modification', async () => {
        const result = await enforcePolicy(
          'npm install',
          allowPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(true);
        expect(result.rewrittenCommand).toBeUndefined();
      });

      it('does not require approval for high-risk commands', async () => {
        await enforcePolicy('npx jest', allowPolicy, '/test/project', mockCallbacks);

        expect(mockCallbacks.onApprovalRequired).not.toHaveBeenCalled();
      });

      it('still logs security events', async () => {
        await enforcePolicy('npm install', allowPolicy, '/test/project', mockCallbacks);

        expect(mockCallbacks.onAuditLog).toHaveBeenCalled();
      });
    });

    describe('with prompt policy', () => {
      const promptPolicy = {
        dependencyInstallPolicy: 'prompt' as const,
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
      };

      it('requires approval before allowing commands', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValueOnce('allow-once');

        const result = await enforcePolicy(
          'npm install',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(true);
        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(mockCallbacks.onAuditLog).toHaveBeenCalled();
      });

      it('blocks commands when user cancels', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValueOnce('cancel');

        const result = await enforcePolicy(
          'npm install',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(false);
        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
      });
    });

    describe('enforcePolicy - prompt mode with high-risk commands', () => {
      const promptPolicy: NpmSecuritySettings = {
        dependencyInstallPolicy: 'prompt',
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };

      const mockCallbacks = {
        onApprovalRequired: vi.fn(),
        onAuditLog: vi.fn(),
      };

      beforeEach(() => {
        vi.clearAllMocks();
      });

      it('requests approval for npx commands in prompt mode', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValue('allow-once');

        const result = await enforcePolicy(
          'npx some-package',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(result.allowed).toBe(true);
        expect(result.requiresApproval).toBe(true);
      });

      it('blocks npx when user cancels in prompt mode', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValue('cancel');

        const result = await enforcePolicy(
          'npx malicious-package',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(result.allowed).toBe(false);
        expect(result.blockedReason).toContain('cancelled');
      });

      it('requests approval for pnpm dlx in prompt mode', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValue('allow-once');

        const result = await enforcePolicy(
          'pnpm dlx create-react-app my-app',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(result.allowed).toBe(true);
      });

      it('requests approval for yarn dlx in prompt mode', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValue('allow-once');

        const result = await enforcePolicy(
          'yarn dlx @angular/cli new my-app',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(result.allowed).toBe(true);
      });

      it('requests approval for bunx in prompt mode', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValue('allow-once');

        const result = await enforcePolicy(
          'bunx create-next-app',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(result.allowed).toBe(true);
      });

      it('logs audit entry when high-risk command is approved', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValue('allow-once');

        await enforcePolicy('npx degit user/repo', promptPolicy, '/test/project', mockCallbacks);

        expect(mockCallbacks.onAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'approval-granted',
          })
        );
      });

      it('logs audit entry when high-risk command is denied', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValue('cancel');

        await enforcePolicy('npx suspicious-package', promptPolicy, '/test/project', mockCallbacks);

        expect(mockCallbacks.onAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'approval-denied',
          })
        );
      });

      it('allows high-risk commands without approval in allow mode', async () => {
        const allowPolicy = { ...promptPolicy, dependencyInstallPolicy: 'allow' as const };

        const result = await enforcePolicy(
          'npx anything',
          allowPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).not.toHaveBeenCalled();
        expect(result.allowed).toBe(true);
      });

      it('blocks high-risk commands when approval returns invalid decision', async () => {
        const promptPolicy: NpmSecuritySettings = {
          dependencyInstallPolicy: 'prompt',
          allowInstallScripts: false,
          allowedPackagesForRebuild: [],
          enableAuditLog: true,
          auditLogRetentionDays: 30,
        };

        // Return an invalid decision that's not offered for high-risk execute
        mockCallbacks.onApprovalRequired.mockResolvedValue('proceed-safe');

        const result = await enforcePolicy(
          'npx some-malicious-package',
          promptPolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(false);
        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
        expect(mockCallbacks.onAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'approval-denied',
            decision: 'cancel',
          })
        );
      });
    });

    describe('with allowedPackagesForRebuild', () => {
      const selectivePolicy = {
        dependencyInstallPolicy: 'strict' as const,
        allowInstallScripts: false,
        allowedPackagesForRebuild: ['bcrypt', 'node-sass'],
      };

      it('allows rebuild for whitelisted packages', async () => {
        const result = await enforcePolicy(
          'npm rebuild bcrypt',
          selectivePolicy,
          '/test/project',
          mockCallbacks
        );

        expect(result.allowed).toBe(true);
      });

      it('blocks rebuild for non-whitelisted packages', async () => {
        mockCallbacks.onApprovalRequired.mockResolvedValueOnce('cancel');

        const result = await enforcePolicy(
          'npm rebuild suspicious-package',
          selectivePolicy,
          '/test/project',
          mockCallbacks
        );

        expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      const strictPolicy = {
        dependencyInstallPolicy: 'strict' as const,
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
      };

      it('handles non-npm commands safely', async () => {
        const result = await enforcePolicy('ls -la', strictPolicy, '/test/project', mockCallbacks);

        expect(result.allowed).toBe(true);
        expect(result.rewrittenCommand).toBeUndefined();
      });

      it('handles commands with pipes', async () => {
        const result = await enforcePolicy(
          'npm install && npm test',
          strictPolicy,
          '/test/project',
          mockCallbacks
        );

        // Should handle first command
        expect(result.allowed).toBe(true);
      });

      it('handles empty commands', async () => {
        const result = await enforcePolicy('', strictPolicy, '/test/project', mockCallbacks);

        expect(result.allowed).toBe(true);
      });
    });
  });

  describe('createNpmSecurityEnforcer', () => {
    it('creates an enforcer with beforeBashExecution hook', () => {
      const enforcer = createNpmSecurityEnforcer(
        {
          dependencyInstallPolicy: 'strict',
          allowInstallScripts: false,
          allowedPackagesForRebuild: [],
        },
        '/test/project',
        {
          onApprovalRequired: vi.fn().mockResolvedValue('allow-once'),
          onAuditLog: vi.fn(),
        }
      );

      expect(enforcer.beforeBashExecution).toBeDefined();
      expect(typeof enforcer.beforeBashExecution).toBe('function');
    });

    it('creates an enforcer with canUseBashTool hook', () => {
      const enforcer = createNpmSecurityEnforcer(
        {
          dependencyInstallPolicy: 'strict',
          allowInstallScripts: false,
          allowedPackagesForRebuild: [],
        },
        '/test/project',
        {
          onApprovalRequired: vi.fn().mockResolvedValue('allow-once'),
          onAuditLog: vi.fn(),
        }
      );

      expect(enforcer.canUseBashTool).toBeDefined();
      expect(typeof enforcer.canUseBashTool).toBe('function');
    });

    it('integrates with SDK options structure', () => {
      const enforcer = createNpmSecurityEnforcer(
        {
          dependencyInstallPolicy: 'strict',
          allowInstallScripts: false,
          allowedPackagesForRebuild: [],
        },
        '/test/project',
        {
          onApprovalRequired: vi.fn().mockResolvedValue('allow-once'),
          onAuditLog: vi.fn(),
        }
      );

      // Should be compatible with SDK's bash tool configuration
      expect(enforcer).toHaveProperty('beforeBashExecution');
      expect(enforcer).toHaveProperty('canUseBashTool');
    });
  });

  describe('sanitizeCommandForLogging', () => {
    it('redacts API_KEY environment variable', () => {
      const input = 'API_KEY=sk-1234567890abcdef npm install';
      const expected = 'API_KEY=***REDACTED*** npm install';
      expect(sanitizeCommandForLogging(input)).toBe(expected);
    });

    it('redacts ANTHROPIC_API_KEY', () => {
      const input = 'ANTHROPIC_API_KEY=sk-ant-api03-xxx npm test';
      const expected = 'ANTHROPIC_API_KEY=***REDACTED*** npm test';
      expect(sanitizeCommandForLogging(input)).toBe(expected);
    });

    it('redacts OPENAI_API_KEY', () => {
      const input = 'OPENAI_API_KEY=sk-proj-abc123 npm run build';
      const expected = 'OPENAI_API_KEY=***REDACTED*** npm run build';
      expect(sanitizeCommandForLogging(input)).toBe(expected);
    });

    it('redacts multiple secrets in one command', () => {
      const input = 'API_KEY=abc SECRET_TOKEN=xyz npm run script';
      const expected = 'API_KEY=***REDACTED*** SECRET_TOKEN=***REDACTED*** npm run script';
      expect(sanitizeCommandForLogging(input)).toBe(expected);
    });

    it('redacts PASSWORD variables', () => {
      const input = 'DB_PASSWORD=supersecret123 npm start';
      const expected = 'DB_PASSWORD=***REDACTED*** npm start';
      expect(sanitizeCommandForLogging(input)).toBe(expected);
    });

    it('redacts AUTH variables', () => {
      const input = 'NPM_AUTH_TOKEN=npm_xyz123 npm publish';
      const expected = 'NPM_AUTH_TOKEN=***REDACTED*** npm publish';
      expect(sanitizeCommandForLogging(input)).toBe(expected);
    });

    it('redacts CREDENTIAL variables', () => {
      const input = 'GIT_CREDENTIAL=ghp_abc123 git push';
      const expected = 'GIT_CREDENTIAL=***REDACTED*** git push';
      expect(sanitizeCommandForLogging(input)).toBe(expected);
    });

    it('preserves normal commands without secrets', () => {
      const input = 'npm install lodash';
      expect(sanitizeCommandForLogging(input)).toBe(input);
    });

    it('preserves normal env vars that are not secrets', () => {
      const input = 'NODE_ENV=production npm start';
      expect(sanitizeCommandForLogging(input)).toBe(input);
    });

    it('handles empty string', () => {
      expect(sanitizeCommandForLogging('')).toBe('');
    });

    it('handles command with = in arguments', () => {
      const input = 'npm run build -- --config=webpack.config.js';
      expect(sanitizeCommandForLogging(input)).toBe(input);
    });
  });

  describe('validateAndCorrectNpmSecuritySettings', () => {
    it('auto-corrects strict mode with allowInstallScripts enabled', () => {
      const invalidSettings: NpmSecuritySettings = {
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: true,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };

      const result = validateAndCorrectNpmSecuritySettings(invalidSettings);

      expect(result.dependencyInstallPolicy).toBe('strict');
      expect(result.allowInstallScripts).toBe(false); // Auto-corrected!
    });

    it('does not modify valid strict mode settings', () => {
      const validSettings: NpmSecuritySettings = {
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: false,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };

      const result = validateAndCorrectNpmSecuritySettings(validSettings);

      expect(result.dependencyInstallPolicy).toBe('strict');
      expect(result.allowInstallScripts).toBe(false);
      expect(result).toEqual(validSettings); // Unchanged
    });

    it('allows prompt mode with allowInstallScripts enabled', () => {
      const settings: NpmSecuritySettings = {
        dependencyInstallPolicy: 'prompt',
        allowInstallScripts: true,
        allowedPackagesForRebuild: [],
        enableAuditLog: true,
        auditLogRetentionDays: 30,
      };

      const result = validateAndCorrectNpmSecuritySettings(settings);

      expect(result.dependencyInstallPolicy).toBe('prompt');
      expect(result.allowInstallScripts).toBe(true); // Not corrected - valid for prompt
      expect(result).toEqual(settings);
    });

    it('allows allow mode with any settings', () => {
      const settings: NpmSecuritySettings = {
        dependencyInstallPolicy: 'allow',
        allowInstallScripts: true,
        allowedPackagesForRebuild: ['node-gyp'],
        enableAuditLog: false,
        auditLogRetentionDays: 7,
      };

      const result = validateAndCorrectNpmSecuritySettings(settings);

      expect(result).toEqual(settings); // Unchanged
    });

    it('preserves other settings when correcting', () => {
      const settings: NpmSecuritySettings = {
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: true, // Will be corrected
        allowedPackagesForRebuild: ['bcrypt', 'sharp'],
        enableAuditLog: true,
        auditLogRetentionDays: 14,
      };

      const result = validateAndCorrectNpmSecuritySettings(settings);

      expect(result.allowInstallScripts).toBe(false); // Corrected
      expect(result.allowedPackagesForRebuild).toEqual(['bcrypt', 'sharp']); // Preserved
      expect(result.enableAuditLog).toBe(true); // Preserved
      expect(result.auditLogRetentionDays).toBe(14); // Preserved
    });
  });

  describe('approval request options for different command types', () => {
    const strictPolicy: NpmSecuritySettings = {
      dependencyInstallPolicy: 'strict',
      allowInstallScripts: false,
      allowedPackagesForRebuild: [],
      enableAuditLog: true,
      auditLogRetentionDays: 30,
    };

    const mockCallbacks = {
      onApprovalRequired: vi.fn(),
      onAuditLog: vi.fn(),
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('provides correct options for high-risk execute commands (npx)', async () => {
      mockCallbacks.onApprovalRequired.mockImplementation(async (request) => {
        // Verify the approval request structure for high-risk commands
        expect(request).toBeDefined();
        expect(request.command.isHighRiskExecute).toBe(true);
        expect(request.options).toBeDefined();

        // For high-risk execute, should NOT have 'proceed-safe' option
        const proceedSafeOption = request.options.find((opt: any) => opt.action === 'proceed-safe');
        expect(proceedSafeOption).toBeUndefined();

        // Should have 'allow-once' option
        const allowOnceOption = request.options.find((opt: any) => opt.action === 'allow-once');
        expect(allowOnceOption).toBeDefined();
        expect(allowOnceOption.label).toBe('Allow once');

        // Should have 'cancel' option and it should be default
        const cancelOption = request.options.find((opt: any) => opt.action === 'cancel');
        expect(cancelOption).toBeDefined();
        expect(cancelOption.isDefault).toBe(true);
        expect(cancelOption.isRecommended).toBe(true);

        // Should have 'allow-project' option
        const allowProjectOption = request.options.find(
          (opt: any) => opt.action === 'allow-project'
        );
        expect(allowProjectOption).toBeDefined();

        return 'allow-once';
      });

      await enforcePolicy(
        'npx create-react-app my-app',
        strictPolicy,
        '/test/project',
        mockCallbacks
      );

      expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
    });

    it('provides correct options for install commands', async () => {
      const promptPolicy: NpmSecuritySettings = {
        ...strictPolicy,
        dependencyInstallPolicy: 'prompt',
      };

      mockCallbacks.onApprovalRequired.mockImplementation(async (request) => {
        // Verify the approval request structure for install commands
        expect(request).toBeDefined();
        expect(request.command.isInstallCommand).toBe(true);
        expect(request.options).toBeDefined();

        // For install commands, should have 'proceed-safe' option
        const proceedSafeOption = request.options.find((opt: any) => opt.action === 'proceed-safe');
        expect(proceedSafeOption).toBeDefined();
        expect(proceedSafeOption.label).toBe('Proceed with scripts disabled');
        expect(proceedSafeOption.isDefault).toBe(true);
        expect(proceedSafeOption.isRecommended).toBe(true);

        // Should have 'allow-once' option
        const allowOnceOption = request.options.find((opt: any) => opt.action === 'allow-once');
        expect(allowOnceOption).toBeDefined();
        expect(allowOnceOption.label).toBe('Allow scripts once');

        // Should have 'cancel' option
        const cancelOption = request.options.find((opt: any) => opt.action === 'cancel');
        expect(cancelOption).toBeDefined();

        // Should have 'allow-project' option
        const allowProjectOption = request.options.find(
          (opt: any) => opt.action === 'allow-project'
        );
        expect(allowProjectOption).toBeDefined();

        return 'proceed-safe';
      });

      await enforcePolicy('npm install lodash', promptPolicy, '/test/project', mockCallbacks);

      expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
    });

    it('provides correct options for pnpm dlx commands', async () => {
      mockCallbacks.onApprovalRequired.mockImplementation(async (request) => {
        expect(request.command.isHighRiskExecute).toBe(true);

        // Should NOT have proceed-safe for high-risk execute
        const proceedSafeOption = request.options.find((opt: any) => opt.action === 'proceed-safe');
        expect(proceedSafeOption).toBeUndefined();

        return 'allow-once';
      });

      await enforcePolicy(
        'pnpm dlx create-vite@latest my-app',
        strictPolicy,
        '/test/project',
        mockCallbacks
      );

      expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
    });

    it('provides correct options for yarn dlx commands', async () => {
      mockCallbacks.onApprovalRequired.mockImplementation(async (request) => {
        expect(request.command.isHighRiskExecute).toBe(true);

        // Should NOT have proceed-safe for high-risk execute
        const proceedSafeOption = request.options.find((opt: any) => opt.action === 'proceed-safe');
        expect(proceedSafeOption).toBeUndefined();

        // Cancel should be default for high-risk
        const cancelOption = request.options.find((opt: any) => opt.action === 'cancel');
        expect(cancelOption.isDefault).toBe(true);

        return 'cancel';
      });

      const result = await enforcePolicy(
        'yarn dlx @angular/cli new my-app',
        strictPolicy,
        '/test/project',
        mockCallbacks
      );

      expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
      expect(result.allowed).toBe(false);
    });

    it('provides correct options for bunx commands', async () => {
      mockCallbacks.onApprovalRequired.mockImplementation(async (request) => {
        expect(request.command.isHighRiskExecute).toBe(true);

        // Verify options are appropriate for high-risk
        const options = request.options.map((opt: any) => opt.action);
        expect(options).toContain('cancel');
        expect(options).toContain('allow-once');
        expect(options).toContain('allow-project');
        expect(options).not.toContain('proceed-safe');

        return 'allow-once';
      });

      await enforcePolicy('bunx create-next-app', strictPolicy, '/test/project', mockCallbacks);

      expect(mockCallbacks.onApprovalRequired).toHaveBeenCalled();
    });
  });
});
