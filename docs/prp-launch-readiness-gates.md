# PRP: AutoMaker Launch Readiness Gates

**Status**: PENDING EXECUTION
**Priority**: P0 - Blocking Launch
**Created**: 2025-12-29
**Target**: Claude Code Team Execution

---

## Executive Summary

AutoMaker fork is code-complete but requires validation of three launch gates in a **clean environment**. The current dev environment has corrupted `node_modules` preventing gate execution.

### Current Code State (Verified)

| Component             | Status                 | Evidence                                                            |
| --------------------- | ---------------------- | ------------------------------------------------------------------- |
| npm-security firewall | DISABLED (intentional) | `libs/types/src/npm-security.ts:175-182` defaults to `allow` policy |
| Wizard marker fix     | PRESENT                | `auto-mode-service.ts:2315` uses `filter(Boolean).join()` pattern   |
| UI Build              | PASSING                | Vite build completed successfully                                   |
| Server Tests          | BLOCKED                | `vitest: not found` (node_modules corruption)                       |

---

## Required Actions

### Phase 1: Environment Setup (Clean Machine or CI)

```bash
# Clone fresh or use clean CI runner
git clone https://github.com/[fork-owner]/automaker.git
cd automaker
git checkout main

# Verify commit hash matches expected state
git log -1 --oneline
# Should show: 5f30057 docs: Add comprehensive PR documentation...

# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules libs/*/node_modules
npm install
```

### Phase 2: Execute Launch Gates

#### Gate 1: Build Verification

```bash
npm run build:packages && npm run build
```

**Expected**: Exit code 0, no errors

#### Gate 2: Test Suite

```bash
npm run test:all
```

**Expected**: All tests passing (14/14 wizard unit tests + server tests + package tests)

#### Gate 3: Wizard E2E Visual Verification

```bash
npm run dev:electron:debug
```

**Manual Test Steps**:

1. Open AutoMaker Electron app
2. Create a new feature in **Wizard Mode** (not Standard)
3. Verify the agent asks 2-5 clarifying questions
4. Answer all questions
5. Verify the plan includes your answers (multi-question resume works)
6. Approve the plan
7. Confirm execution begins normally

**Pass Criteria**: Questions appear with `<<WIZARD_QUESTION>>` markers, plan incorporates all answers

---

## Verification Checklist

```
[ ] Gate 1: npm run build - passes
[ ] Gate 2: npm run test:all - all tests green
[ ] Gate 3: Wizard E2E - visual confirmation complete
[ ] Branch: main is at expected commit (5f30057)
[ ] Branch: No untracked artifacts in PR submission
```

---

## Code State Verification Points

### 1. npm-security Disabled (MUST remain disabled)

**File**: `libs/types/src/npm-security.ts:175-182`

```typescript
export const DEFAULT_NPM_SECURITY_SETTINGS: NpmSecuritySettings = {
  // NPM security firewall is intentionally DISABLED in this repo by default.
  dependencyInstallPolicy: 'allow',
  allowInstallScripts: true,
  // ...
};
```

**File**: `apps/server/src/lib/npm-security-policy.ts:154-167`

```typescript
export async function enforcePolicy(...): Promise<PolicyEnforcementResult> {
  const classified = classifyCommand(command);

  // Firewall intentionally disabled: always allow and only audit.
  const auditEntry = {
    timestamp: Date.now(),
    eventType: 'command-allowed' as const,
    command: classified,
  };
  callbacks.onAuditLog(auditEntry);
  return {
    allowed: true,  // <-- Always allows
    requiresApproval: false,
    auditEntry,
  };
  // ... rest of enforcement code is unreachable (intentional)
}
```

### 2. Wizard Marker Fix (MUST be present)

**File**: `apps/server/src/services/auto-mode-service.ts:2314-2315`

```typescript
// WIZARD_SYSTEM_PROMPT must ALWAYS be included for wizard turns to emit markers
const wizardSystemPrompt = [systemPrompt, WIZARD_SYSTEM_PROMPT].filter(Boolean).join('\n\n');
```

---

## Post-Gate Actions

### If All Gates Pass:

1. Push any documentation updates
2. Create upstream PR with:
   - BMAD Executive Suite feature (7 personas)
   - Wizard Planning Mode feature
   - Bug fixes (UI hydration, Play icon, routing)
3. Request GPT-5 Pro code review (optional)
4. Submit to upstream maintainers

### If Any Gate Fails:

1. Document specific failure with logs
2. Create issue with reproduction steps
3. DO NOT proceed to PR submission

---

## Known Issues (Non-Blocking)

1. **Vite chunk size warnings**: `board-BIM9Ut53.js` (592KB) and `index-DTfB3JmZ.js` (711KB) exceed 500KB limit. Consider code-splitting in future iteration.

2. **Untracked file**: `docs/prp-codex-verification-upstream-pr.md` - ensure this is either committed or removed before PR submission.

---

## Contact

For questions about this PRP, reference the Codex team analysis from 2025-12-29 (Theo/Murat/Finn verification session).
