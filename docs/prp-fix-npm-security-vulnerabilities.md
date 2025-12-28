# PRP: Fix npm Security Vulnerabilities

## CRITICAL: Security Fixes

**Audit Status:** CLEAN WITH CONCERNS — No malicious code, but 4 design issues require remediation.

**WARNING:** These fixes modify security-critical code. Follow these rules:

1. Make MINIMAL changes — fix only the identified issues
2. Add unit tests for each fix
3. Do NOT introduce new bypass paths
4. Verify strict mode still works after changes
5. Test all three modes (strict/prompt/allow) after fixes

---

## Issues to Fix

| Priority        | Issue                                         | Location                                                       | Effort  |
| --------------- | --------------------------------------------- | -------------------------------------------------------------- | ------- |
| **P0 CRITICAL** | Audit logs leak credentials                   | `settings-service.ts:700`, `libs/types/src/npm-security.ts:59` | ~30 min |
| **P1 HIGH**     | Strict mode bypassed by `allowInstallScripts` | `npm-security-policy.ts:298-308`                               | ~15 min |
| **P2 MEDIUM**   | High-risk commands not handled in prompt mode | `npm-security-policy.ts:156-193`                               | ~30 min |
| **P3 LOW**      | Console.log exposes full commands             | `use-npm-security-events.ts:27`                                | ~10 min |

---

## P0 CRITICAL: Credential Sanitization in Audit Logs

### Problem

Commands like `API_KEY=sk-xxx npm install` are logged verbatim to `.automaker/npm-security-audit.jsonl`, persisting secrets for 30 days.

### Affected Files

- `apps/server/src/services/settings-service.ts` (~line 700)
- `libs/types/src/npm-security.ts` (line 59 — audit entry type)

### Investigation

```bash
# Find where audit entries are created
rg -n "logNpmSecurityAudit|NpmSecurityAuditEntry" apps/server/src/services/settings-service.ts

# Check the audit entry structure
sed -n '55,70p' libs/types/src/npm-security.ts
```

### Fix Implementation

**Step 1:** Create sanitization utility in `npm-security-policy.ts` or a new utils file:

```typescript
/**
 * Sanitizes commands to remove sensitive environment variables before logging.
 * Matches patterns like API_KEY=value, TOKEN=value, SECRET=value, PASSWORD=value, AUTH=value
 */
export function sanitizeCommandForLogging(command: string): string {
  // Match env vars that likely contain secrets
  // Pattern: WORD_KEY=value, WORD_TOKEN=value, WORD_SECRET=value, etc.
  return command.replace(
    /\b([A-Z_][A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD|AUTH|CREDENTIAL)[A-Z0-9_]*)=\S+/gi,
    '$1=***REDACTED***'
  );
}
```

**Step 2:** Apply sanitization before logging in `settings-service.ts`:

```typescript
// BEFORE (vulnerable)
const entry: NpmSecurityAuditEntry = {
  command: command,
  // ...
};

// AFTER (safe)
import { sanitizeCommandForLogging } from '../lib/npm-security-policy.js';

const entry: NpmSecurityAuditEntry = {
  command: sanitizeCommandForLogging(command),
  // ...
};
```

**Step 3:** Add unit tests:

```typescript
describe('sanitizeCommandForLogging', () => {
  it('redacts API keys', () => {
    expect(sanitizeCommandForLogging('API_KEY=sk-1234 npm install')).toBe(
      'API_KEY=***REDACTED*** npm install'
    );
  });

  it('redacts multiple secrets', () => {
    expect(sanitizeCommandForLogging('API_KEY=abc SECRET_TOKEN=xyz npm run')).toBe(
      'API_KEY=***REDACTED*** SECRET_TOKEN=***REDACTED*** npm run'
    );
  });

  it('preserves normal commands', () => {
    expect(sanitizeCommandForLogging('npm install lodash')).toBe('npm install lodash');
  });

  it('handles ANTHROPIC_API_KEY', () => {
    expect(sanitizeCommandForLogging('ANTHROPIC_API_KEY=sk-ant-xxx npm test')).toBe(
      'ANTHROPIC_API_KEY=***REDACTED*** npm test'
    );
  });
});
```

### Verification

```bash
# After fix, test that secrets are redacted
npm run test:run --workspace=apps/server -- -t "sanitizeCommandForLogging"
```

---

## P1 HIGH: Strict Mode Policy Validation

### Problem

Setting `dependencyInstallPolicy: 'strict'` with `allowInstallScripts: true` allows scripts to run, contradicting strict semantics.

### Affected File

- `apps/server/src/lib/npm-security-policy.ts` (lines 298-308)

### Investigation

```bash
sed -n '290,320p' apps/server/src/lib/npm-security-policy.ts
```

### Fix Implementation

**Add validation when policy is created or updated:**

```typescript
/**
 * Validates npm security settings for contradictory configurations.
 * Throws if settings are invalid.
 */
export function validateNpmSecuritySettings(settings: NpmSecuritySettings): void {
  // Strict mode MUST NOT allow install scripts — that's the whole point
  if (settings.dependencyInstallPolicy === 'strict' && settings.allowInstallScripts === true) {
    throw new Error(
      'Invalid npm security configuration: strict mode cannot have allowInstallScripts enabled. ' +
        'Strict mode always blocks install scripts.'
    );
  }
}
```

**Apply validation in:**

1. `createNpmSecurityEnforcer()` — on initialization
2. Settings update endpoint — when user changes settings
3. `enforcePolicy()` — as a runtime safety check

```typescript
// In createNpmSecurityEnforcer or enforcePolicy:
export function createNpmSecurityEnforcer(options: NpmSecurityEnforcerOptions) {
  // Validate on creation
  validateNpmSecuritySettings(options.settings);

  // ... rest of implementation
}
```

**Add unit tests:**

```typescript
describe('validateNpmSecuritySettings', () => {
  it('throws when strict mode has allowInstallScripts enabled', () => {
    expect(() =>
      validateNpmSecuritySettings({
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: true,
        // ... other required fields
      })
    ).toThrow('strict mode cannot have allowInstallScripts');
  });

  it('allows strict mode with allowInstallScripts disabled', () => {
    expect(() =>
      validateNpmSecuritySettings({
        dependencyInstallPolicy: 'strict',
        allowInstallScripts: false,
      })
    ).not.toThrow();
  });

  it('allows prompt mode with allowInstallScripts enabled', () => {
    expect(() =>
      validateNpmSecuritySettings({
        dependencyInstallPolicy: 'prompt',
        allowInstallScripts: true,
      })
    ).not.toThrow();
  });
});
```

### Verification

```bash
npm run test:run --workspace=apps/server -- -t "validateNpmSecuritySettings"
```

---

## P2 MEDIUM: Handle High-Risk Commands in Prompt Mode

### Problem

`npx malicious-package` is only blocked in strict mode. In prompt mode, it falls through without requesting approval.

### Affected File

- `apps/server/src/lib/npm-security-policy.ts` (lines 156-193)

### Investigation

```bash
sed -n '150,200p' apps/server/src/lib/npm-security-policy.ts
```

### Fix Implementation

The `enforcePolicy` function should handle prompt mode for high-risk execute commands:

```typescript
// In enforcePolicy, add handling for prompt mode with high-risk commands:

async function enforcePolicy(
  command: ClassifiedCommand,
  settings: NpmSecuritySettings,
  callbacks: PolicyCallbacks
): Promise<PolicyResult> {
  // ... existing strict mode handling ...

  // Handle prompt mode for high-risk commands (npx, pnpm dlx, yarn dlx, bunx)
  if (settings.dependencyInstallPolicy === 'prompt') {
    if (command.riskLevel === 'high' && command.isExecuteCommand) {
      // Request user approval for high-risk execute commands
      const approved = await callbacks.onApprovalRequired?.({
        command: command.original,
        reason: `High-risk execute command detected: ${command.packageManager} ${command.subCommand}`,
        riskLevel: 'high',
      });

      if (!approved) {
        callbacks.onAuditLog?.({
          command: command.original,
          decision: 'blocked',
          reason: 'User denied high-risk execute command in prompt mode',
          mode: 'prompt',
        });
        return { allowed: false, reason: 'User denied approval' };
      }

      callbacks.onAuditLog?.({
        command: command.original,
        decision: 'allowed',
        reason: 'User approved high-risk execute command',
        mode: 'prompt',
      });
      return { allowed: true };
    }
  }

  // ... rest of implementation ...
}
```

**Add unit tests:**

```typescript
describe('prompt mode with high-risk commands', () => {
  it('requests approval for npx commands', async () => {
    const onApprovalRequired = vi.fn().mockResolvedValue(true);

    const result = await enforcePolicy(
      { original: 'npx some-package', riskLevel: 'high', isExecuteCommand: true, ... },
      { dependencyInstallPolicy: 'prompt', ... },
      { onApprovalRequired }
    );

    expect(onApprovalRequired).toHaveBeenCalled();
    expect(result.allowed).toBe(true);
  });

  it('blocks npx when user denies', async () => {
    const onApprovalRequired = vi.fn().mockResolvedValue(false);

    const result = await enforcePolicy(
      { original: 'npx malicious', riskLevel: 'high', isExecuteCommand: true, ... },
      { dependencyInstallPolicy: 'prompt', ... },
      { onApprovalRequired }
    );

    expect(result.allowed).toBe(false);
  });
});
```

### Verification

```bash
npm run test:run --workspace=apps/server -- -t "prompt mode"
```

---

## P3 LOW: Redact Commands from Console.log

### Problem

`console.log('[useNpmSecurityEvents]', event)` logs full command to browser console.

### Affected File

- `apps/ui/src/hooks/use-npm-security-events.ts` (line 27)

### Investigation

```bash
sed -n '20,35p' apps/ui/src/hooks/use-npm-security-events.ts
```

### Fix Implementation

**Option A (Preferred):** Remove the console.log entirely in production:

```typescript
// BEFORE
console.log('[useNpmSecurityEvents]', event);

// AFTER — remove or gate behind dev mode
if (import.meta.env.DEV) {
  console.log('[useNpmSecurityEvents] Event received:', event.type);
}
```

**Option B:** Redact sensitive parts:

```typescript
// Create a safe log version
const safeEvent = {
  ...event,
  command: event.command ? '[REDACTED]' : undefined,
};
console.log('[useNpmSecurityEvents]', safeEvent);
```

### Verification

```bash
# Check no full commands logged
rg -n "console\.log.*event\)" apps/ui/src/hooks/use-npm-security-events.ts
```

---

## Agent Allocation

| Agent | Task                                       | Priority |
| ----- | ------------------------------------------ | -------- |
| 1-2   | P0: Credential sanitization + tests        | CRITICAL |
| 3-4   | P1: Policy validation + tests              | HIGH     |
| 5-6   | P2: Prompt mode high-risk handling + tests | MEDIUM   |
| 7     | P3: Console.log redaction                  | LOW      |
| 8     | Full test suite verification               | ALL      |
| 9     | Security regression check                  | ALL      |
| 10    | Final build/lint verification              | ALL      |

---

## Verification Checklist

After all fixes:

```bash
# 1. Build
npm run build --workspace=apps/server
npm run build --workspace=apps/ui

# 2. Run ALL npm security tests
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-command-classifier.test.ts

# 3. Full test suite
npm run test:run --workspace=apps/server

# 4. Lint
npm run lint --workspace=apps/server
npm run lint --workspace=apps/ui

# 5. Security regression checks
# Verify strict mode still blocks everything
rg -n "strict.*block|block.*strict" apps/server/src/lib/npm-security-policy.ts

# Verify no bypass conditions added
rg -n "BYPASS|SKIP|DEBUG.*=.*true" apps/server/src/lib/npm-security-policy.ts
```

---

## Report Format

```
npm Security Vulnerabilities Fix Report

=== P0 CRITICAL: Credential Sanitization ===
sanitizeCommandForLogging function: [ADDED/NOT ADDED]
Applied to audit logging: [YES/NO]
Unit tests: [X/X pass]
Test cases cover:
  - [ ] API_KEY redaction
  - [ ] Multiple secrets
  - [ ] Normal commands preserved
  - [ ] ANTHROPIC_API_KEY

=== P1 HIGH: Policy Validation ===
validateNpmSecuritySettings function: [ADDED/NOT ADDED]
Applied in createNpmSecurityEnforcer: [YES/NO]
Applied in settings update: [YES/NO]
Unit tests: [X/X pass]
Test cases cover:
  - [ ] Throws on strict + allowInstallScripts
  - [ ] Allows valid strict config
  - [ ] Allows valid prompt config

=== P2 MEDIUM: Prompt Mode High-Risk ===
High-risk execute handling added: [YES/NO]
Approval requested for npx/dlx: [YES/NO]
Audit logged on approve/deny: [YES/NO]
Unit tests: [X/X pass]
Test cases cover:
  - [ ] Approval requested for npx
  - [ ] Blocks on user deny
  - [ ] Allows on user approve

=== P3 LOW: Console.log Redaction ===
Console.log removed/redacted: [YES/NO]
No full commands in browser console: [VERIFIED]

=== REGRESSION CHECK ===
Strict mode still blocks: [YES/NO]
All existing tests pass: [X/X]
No bypass conditions added: [VERIFIED]

=== FINAL STATUS ===
Build: [PASS/FAIL]
Tests: [X/X pass]
Lint: [0 errors]

All vulnerabilities fixed: [YES/NO]
Ready for production: [YES/NO]
```

---

## Security Sign-Off Requirements

Before marking complete, verify:

1. **P0 Credential Sanitization**
   - [ ] Secrets redacted in audit logs
   - [ ] Test with real-looking API key pattern

2. **P1 Policy Validation**
   - [ ] Cannot create strict + allowInstallScripts config
   - [ ] UI prevents contradictory settings OR shows error

3. **P2 Prompt Mode**
   - [ ] `npx anything` requests approval in prompt mode
   - [ ] Denial blocks execution
   - [ ] Approval allows execution with audit

4. **P3 Console Redaction**
   - [ ] Browser DevTools doesn't show full commands

5. **No Regressions**
   - [ ] Strict mode still blocks all install scripts
   - [ ] Allow mode still allows everything (with logging)
   - [ ] Existing tests unchanged and passing
