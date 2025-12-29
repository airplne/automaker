# PRP: Fix Test Failures and Wizard Marker Protocol

**Status:** 🚨 URGENT - BLOCKS RELEASE
**Created:** 2025-12-28
**Team:** Claude Dev Team
**Priority:** P0 - Critical Blockers

---

## Context

**Build Status:** ✅ Passes
**Wizard Tests:** ✅ 14/14 passing
**Full Server Tests:** ❌ 27 tests failing
**Wizard Markers:** ⚠️ Not reliable under default settings

**Cannot release until both issues fixed.**

---

## Issue 1: 27 Failing Tests (npm-security Related)

### Root Cause

Earlier in this session, we disabled npm-security firewall for development:

1. Changed `DEFAULT_NPM_SECURITY_SETTINGS` to `allow` mode
2. Modified `enforcePolicy()` to always return `allowed: true`
3. Disabled enforcement logic

**Result:** Tests expecting strict security now fail.

### Failing Tests

**File:** `apps/server/tests/unit/lib/npm-security-policy.test.ts`

- Many assertions expect real policy enforcement (block/rewrite/approval/audit)
- Current `enforcePolicy()` short-circuits to `allowed: true` for all commands

**File:** `apps/server/tests/unit/services/npm-security-settings.test.ts`

- Tests expect `dependencyInstallPolicy: 'strict'`
- Tests expect `allowInstallScripts: false`
- Actual defaults are now `'allow'` and `true`

**File:** `apps/server/tests/unit/services/terminal-service.test.ts`

- Tests expect secure npm environment variables injected
- `getSecureNpmEnvironment()` currently returns `{}` so env vars are never injected

### Fix Strategy

**Option A: Revert npm-security to Production Defaults** (Recommended)

Re-enable the firewall with secure defaults, and add an explicit env-var bypass for local dev/debug:

- Defaults stay **strict** (so tests + prod are secure by default)
- Local dev can bypass with `AUTOMAKER_DISABLE_NPM_SECURITY=true` when needed

**Option B: Update Tests to Match New Defaults**

Update all failing tests to expect `'allow'` mode instead of `'strict'`:

```typescript
// Change tests from:
expect(settings.dependencyInstallPolicy).toBe('strict');

// To:
expect(settings.dependencyInstallPolicy).toBe('allow');
```

**Recommended: Option A** - Keep production secure, add dev bypass flag.

### Implementation (Option A)

**Step 1: Restore secure defaults (tests/prod)**

```typescript
// libs/types/src/npm-security.ts
export const DEFAULT_NPM_SECURITY_SETTINGS: NpmSecuritySettings = {
  dependencyInstallPolicy: 'strict',
  allowInstallScripts: false,
  allowedPackagesForRebuild: [],
  enableAuditLog: true,
  auditLogRetentionDays: 30,
};
```

**Step 2: Add dev bypass env var in policy enforcement**

```typescript
// apps/server/src/lib/npm-security-policy.ts
export async function enforcePolicy(
  command: string,
  policy: NpmSecuritySettings,
  projectPath: string,
  callbacks: PolicyEnforcerCallbacks
): Promise<PolicyEnforcementResult> {
  const classified = classifyCommand(command);

  // DEV MODE BYPASS
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

  // Restore original enforcement logic below (remove the current short-circuit).
```

**Step 3: Restore real enforcement logic**

In `apps/server/src/lib/npm-security-policy.ts`, delete the unconditional “FIREWALL DISABLED” return block and re-enable the original policy logic so `npm-security-policy` unit tests can pass again.

**Step 4: Restore terminal secure npm env defaults**

`apps/server/src/services/terminal-service.ts` currently stubs `getSecureNpmEnvironment()` to return `{}`. Restore the secure defaults so terminal tests pass, and optionally gate with the same bypass env var:

- If `AUTOMAKER_DISABLE_NPM_SECURITY === 'true'` → return `{}`
- Else → return the secure env map (ignore scripts, enable audit, strict SSL, etc.)

**Step 5: Clean up dead/commented code**

Remove large commented blocks that reflect the disabled firewall state so the file is readable/maintainable.

---

## Issue 2: Wizard Markers Not Reliable

### Root Cause

**Codex team reports:** When `autoLoadClaudeMd=false` (default), wizard turns use the generic system prompt instead of `WIZARD_SYSTEM_PROMPT`, so the model doesn't know to emit markers.

**Location:** `apps/server/src/services/auto-mode-service.ts` (wizard turn execution)

### Fix

**Ensure `WIZARD_SYSTEM_PROMPT` is ALWAYS used for wizard turns, regardless of `autoLoadClaudeMd` setting.**

**In `apps/server/src/services/auto-mode-service.ts` → `executeWizardTurn()`:**

```typescript
// Force wizard protocol even when the main runAgent() has a different system prompt.
// Keep the base/AutoMaker system prompt too (so constraints still apply).
const wizardSystemPrompt = [systemPrompt, WIZARD_SYSTEM_PROMPT].filter(Boolean).join('\n\n');

const sdkOptions = createCustomOptions({
  cwd: workDir,
  model,
  systemPrompt: wizardSystemPrompt,
  allowedTools: ['Read', 'Glob', 'Grep'],
  maxTurns: 3,
  autoLoadClaudeMd,
  abortController,
});
```

**Key:** Never allow wizard turns to run without the wizard marker protocol prompt.

---

## Implementation Checklist

### Fix npm-security Tests (Issue 1)

- [ ] Add `AUTOMAKER_DISABLE_NPM_SECURITY` env var bypass in enforcePolicy()
- [ ] Restore `DEFAULT_NPM_SECURITY_SETTINGS` to strict defaults
- [ ] Remove commented-out enforcement code
- [ ] Restore `getSecureNpmEnvironment()` in `terminal-service.ts` (gate with bypass env var if needed)
- [ ] Document the dev bypass in README or .env.example

### Fix Wizard Marker Protocol (Issue 2)

- [ ] Ensure `WIZARD_SYSTEM_PROMPT` is used for all wizard turns
- [ ] Do not rely on `autoLoadClaudeMd` for wizard marker behavior
- [ ] Test that markers appear reliably with default settings

### Verification

**Build:**

```bash
npm run build
npm run build --workspace=apps/server
```

Expected: All build clean

**Tests:**

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts
npm run test:run --workspace=apps/server -- tests/unit/services/npm-security-settings.test.ts
npm run test:run --workspace=apps/server -- tests/unit/services/terminal-service.test.ts
npm run test:run --workspace=apps/server
```

Expected: **0 failures, all tests pass**

**Wizard E2E:**

```bash
# Create wizard feature, run it
# Verify markers appear: [WIZARD_QUESTION]... [WIZARD_COMPLETE]
# Verify multi-turn flow works
```

Expected: Markers appear reliably

---

## Acceptance Criteria

### npm-security Tests

- [ ] All 27 previously failing tests now pass
- [ ] Defaults are production-secure (strict mode)
- [ ] Dev bypass available via env var
- [ ] No TypeScript errors
- [ ] Full test suite green

### Wizard Markers

- [ ] `[WIZARD_QUESTION]` appears reliably
- [ ] Works with default settings (autoLoadClaudeMd=false)
- [ ] Multi-turn flow completes successfully
- [ ] Plan generated with wizard answers

---

## Estimated Time

- npm-security fixes: 30-45 minutes
- Wizard marker fix: 15-20 minutes
- Testing: 15-20 minutes
- **Total: 60-90 minutes**

---

## EXECUTE NOW

**Claude Dev Team:**

1. Fix Issue 1 (npm-security tests)
2. Fix Issue 2 (wizard markers)
3. Verify all tests pass
4. Report back with green test suite

**DO NOT WAIT. BEGIN FIXES IMMEDIATELY.**

---

_BMAD Party Mode - Final Critical Fixes Before Launch_
