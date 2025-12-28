# PRP: Fix npm Security Guardrails Blockers

## CRITICAL: Security-Sensitive Code

**WARNING:** This PRP modifies security enforcement code. All changes must be:

1. Minimal and targeted — fix only what's broken
2. Reviewed for security implications
3. Tested before and after
4. Documented with reasoning

**DO NOT:**

- Add new features
- Refactor working code
- Remove security checks
- Add bypass conditions
- Introduce new dependencies

---

## Issues to Fix (6 Blockers)

| #   | Issue                            | File(s)                         | Severity |
| --- | -------------------------------- | ------------------------------- | -------- |
| 1   | TypeScript build error           | `claude-provider.ts:88`         | BLOCKER  |
| 2   | Policy tests failing (4)         | `npm-security-policy.ts`        | BLOCKER  |
| 3   | Approval/audit wiring incomplete | `claude-provider.ts`            | BLOCKER  |
| 4   | UI↔Server contract mismatch      | `app-store.ts`, `approval.ts`   | BLOCKER  |
| 5   | Lint errors                      | `index.tsx:13`, ESLint config   | BLOCKER  |
| 6   | Test regression (2 tests)        | `provider-factory.ts` signature | BLOCKER  |

---

## Issue 1: TypeScript Build Error

### Problem

```
apps/server/src/providers/claude-provider.ts(88,78): 'entry.command' is possibly 'undefined'
```

### Investigation

```bash
# Read the problematic line
sed -n '85,95p' apps/server/src/providers/claude-provider.ts
```

### Fix Strategy

Add optional chaining or nullish check. **DO NOT** use `!` assertion without understanding why it could be undefined.

```typescript
// SAFE FIX (example):
entry.command?.toString() ?? ''
// OR
if (entry.command) { ... }
```

### Verification

```bash
npm run build --workspace=apps/server
```

**Expected:** Build passes

---

## Issue 2: Policy Tests Failing (4 Tests)

### Problem

```
1. with allow policy > still logs security events (onAuditLog not called)
2. with prompt policy > requires approval before allowing commands (onApprovalRequired not called)
3. with prompt policy > blocks commands when user cancels (allowed === true, expected false)
4. with allowedPackagesForRebuild > blocks rebuild for non-whitelisted (onApprovalRequired not called)
```

### Investigation

```bash
# Read the policy enforcement logic
cat apps/server/src/lib/npm-security-policy.ts

# Read the failing tests to understand expectations
rg -A 20 "still logs security events" apps/server/tests/unit/lib/npm-security-policy.test.ts
rg -A 20 "requires approval before allowing" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

### Fix Strategy

The tests expect:

1. **allow mode**: Still calls `onAuditLog` (for logging, not blocking)
2. **prompt mode**: Calls `onApprovalRequired` for high-risk commands
3. **prompt mode**: Returns `allowed: false` when approval denied
4. **allowedPackagesForRebuild**: Calls `onApprovalRequired` for non-whitelisted

**SECURITY CONSTRAINT:** Do NOT weaken the strict mode behavior while fixing prompt/allow modes.

### Verification

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts
```

**Expected:** 21/21 pass

---

## Issue 3: Approval/Audit Wiring Incomplete

### Problem

- `ClaudeProvider` has TODO placeholders for approval/audit
- `logNpmSecurityAudit` not called from policy enforcement
- `requestApproval` not used anywhere

### Investigation

```bash
# Find the TODOs
rg -n "TODO.*approval|TODO.*audit" apps/server/src/providers/claude-provider.ts

# Check what's implemented vs unused
rg -n "logNpmSecurityAudit" apps/server/src/
rg -n "requestApproval" apps/server/src/
```

### Fix Strategy

Wire the callbacks in `createNpmSecurityEnforcer` to:

1. Call `settingsService.logNpmSecurityAudit()` in `onAuditLog`
2. Implement proper approval flow in `onApprovalRequired`

**SECURITY CONSTRAINT:**

- Audit log must capture ALL security decisions (allow, block, prompt)
- Approval must BLOCK execution until user responds
- Default to DENY if approval mechanism fails

### Verification

```bash
# After fix, verify no TODOs remain for core functionality
rg -n "TODO" apps/server/src/providers/claude-provider.ts | grep -i "approval\|audit"
```

**Expected:** No critical TODOs remaining

---

## Issue 4: UI↔Server Contract Mismatch

### Problem

| Component | Endpoint                                     | Payload                                         |
| --------- | -------------------------------------------- | ----------------------------------------------- |
| UI        | `POST /api/npm-security/approval/resolve`    | `{ requestId, selectedOption, rememberChoice }` |
| Server    | `POST /api/npm-security/approval/:requestId` | `{ decision, rememberChoice }`                  |

### Investigation

```bash
# Check UI call
rg -n "approval/resolve\|approval.*resolve" apps/ui/src/store/app-store.ts

# Check server route
rg -n "approval/:requestId\|approval/:" apps/server/src/routes/npm-security/
```

### Fix Strategy

**Option A (Preferred):** Update UI to match server

- Change UI to `POST /api/npm-security/approval/${requestId}`
- Change payload from `selectedOption` to `decision`

**Option B:** Update server to match UI

- Add `/approval/resolve` route that extracts `requestId` from body

**SECURITY CONSTRAINT:** Whichever option, ensure:

- Request ID is validated
- Only valid decisions accepted (allow/deny)
- Cannot approve arbitrary requests without proper authentication

### Verification

```bash
# Check endpoints match after fix
rg -n "approval" apps/ui/src/store/app-store.ts | head -10
rg -n "router\.(post|get).*approval" apps/server/src/routes/npm-security/
```

---

## Issue 5: Lint Errors

### Problem 5a: ESLint v9 Config Missing (Server)

```bash
# Check if config exists
ls apps/server/eslint.config.*
```

### Fix Strategy 5a

If config missing, check if other workspaces have it and copy pattern. Or add minimal config.

### Problem 5b: no-redeclare Error (UI)

```
apps/ui/src/components/views/settings-view/npm-security/index.tsx:13
```

### Investigation 5b

```bash
sed -n '10,20p' apps/ui/src/components/views/settings-view/npm-security/index.tsx
```

### Fix Strategy 5b

Likely a duplicate import/declaration. Remove the duplicate or rename.

### Verification

```bash
npm run lint --workspace=apps/ui 2>&1 | grep -i error
```

**Expected:** 0 errors

---

## Issue 6: Test Regression (Provider Factory)

### Problem

```
- auto-mode-service.integration.test.ts > should use feature-specific model
- agent-service.test.ts > should use custom model if provided
```

Tests expect 1-arg call, but signature changed to 2-arg.

### Investigation

```bash
# Check the new signature
rg -n "getProviderForModel" apps/server/src/providers/provider-factory.ts | head -5

# Check the test expectations
rg -B 5 -A 10 "getProviderForModel" apps/server/tests/unit/services/agent-service.test.ts | head -30
rg -B 5 -A 10 "getProviderForModel" apps/server/tests/integration/services/auto-mode-service.integration.test.ts | head -30
```

### Fix Strategy

**Option A:** Make second parameter optional with default

```typescript
getProviderForModel(modelId: string, settingsService?: SettingsService)
```

**Option B:** Update tests to pass the required argument

**SECURITY CONSTRAINT:** If making optional, ensure npm security STILL WORKS when settingsService is not provided (fail-safe to strict mode).

### Verification

```bash
npm run test:run --workspace=apps/server
```

**Expected:** 822/822 pass (0 failures)

---

## Execution Order

1. **Fix Issue 1** (TypeScript error) — unblocks build
2. **Fix Issue 6** (test regression) — unblocks test suite
3. **Fix Issue 2** (policy tests) — fixes core security logic
4. **Fix Issue 3** (wiring) — connects the pieces
5. **Fix Issue 4** (contract mismatch) — fixes UI↔server communication
6. **Fix Issue 5** (lint) — cleanup

---

## Agent Allocation

| Agent | Task                             | Files                          |
| ----- | -------------------------------- | ------------------------------ |
| 1     | Fix TypeScript error (Issue 1)   | `claude-provider.ts`           |
| 2     | Fix test regression (Issue 6)    | `provider-factory.ts` or tests |
| 3-4   | Fix policy enforcement (Issue 2) | `npm-security-policy.ts`       |
| 5-6   | Wire approval/audit (Issue 3)    | `claude-provider.ts`           |
| 7     | Fix UI contract (Issue 4)        | `app-store.ts`                 |
| 8     | Fix lint errors (Issue 5)        | `index.tsx`, eslint config     |
| 9     | Run full verification            | All                            |
| 10    | Security review of all changes   | All modified files             |

---

## Final Verification Checklist

After all fixes:

```bash
# 1. Build
npm run build --workspace=libs/types
npm run build --workspace=apps/server
npm run build --workspace=apps/ui

# 2. Tests
npm run test:run --workspace=apps/server

# 3. Lint
npm run lint --workspace=apps/ui

# 4. Security spot check
rg -n "TODO.*approval\|TODO.*audit" apps/server/src/providers/claude-provider.ts
rg -n "bypass\|skip\|disable" apps/server/src/lib/npm-security-policy.ts
```

---

## Report Format

```
npm Security Blockers Fix Report

=== ISSUE 1: TypeScript Error ===
File: apps/server/src/providers/claude-provider.ts
Line: 88
Fix Applied: [description]
Build Status: [PASS/FAIL]

=== ISSUE 2: Policy Tests ===
Tests Fixed: [4/4]
Fix Applied: [description]
Security Impact: [NONE/description]

=== ISSUE 3: Approval/Audit Wiring ===
TODOs Resolved: [YES/NO]
Audit Logging: [WIRED/NOT WIRED]
Approval Flow: [WIRED/NOT WIRED]

=== ISSUE 4: UI↔Server Contract ===
Approach: [UI updated / Server updated]
Endpoint Match: [YES/NO]
Payload Match: [YES/NO]

=== ISSUE 5: Lint Errors ===
Server ESLint: [FIXED/SKIPPED]
UI no-redeclare: [FIXED]
Lint Status: [0 errors]

=== ISSUE 6: Test Regression ===
Approach: [Optional param / Tests updated]
Tests Passing: [822/822]

=== FINAL VERIFICATION ===
Build (all): [PASS/FAIL]
Tests (all): [X/822]
Lint: [0 errors]
Security Review: [CLEAN/CONCERNS]

Security Review Notes:
- [any changes that affect security posture]
```

---

## Security Review Requirements

Before marking complete, Agent 10 must verify:

1. **Strict mode unchanged** — still blocks all install scripts
2. **No new bypass paths** — no conditions that skip security
3. **Audit captures all decisions** — allow, block, and prompt all logged
4. **Approval blocks execution** — high-risk commands wait for user
5. **Fail-safe defaults** — if anything fails, default to DENY
6. **No credential access** — changes don't read API keys
7. **No network calls added** — no new external communication
