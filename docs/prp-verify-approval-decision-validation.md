# PRP: Verify Approval Decision Validation Fix

## Context

The Claude team reports fixing the critical security gap where invalid approval decisions (like `proceed-safe`) could silently auto-approve high-risk execute commands. This PRP verifies all claimed fixes.

**Claude Team Claims:**

| Item                                     | Claimed Status |
| ---------------------------------------- | -------------- |
| `normalizeApprovalDecision` helper added | YES            |
| Validation at 4 approval paths           | YES            |
| Null checks with proper returns          | YES            |
| Type signature fixed                     | YES            |
| Tests: 853/853 pass                      | YES            |
| Lint: 0 errors                           | YES            |

**Validation Locations Claimed:**

- Line ~197-198: Strict mode high-risk execute
- Line ~248-249: Prompt mode high-risk execute
- Line ~317-318: Rebuild commands
- Line ~365-366: Install commands (prompt mode)

---

## Phase 1: Build/Test/Lint Verification (Agents 1-3)

### Agent 1: Full Build

```bash
npm run build --workspace=libs/types 2>&1 | tail -5
echo "Exit: $?"

npm run build --workspace=apps/server 2>&1 | tail -5
echo "Exit: $?"

npm run build --workspace=apps/ui 2>&1 | tail -5
echo "Exit: $?"
```

**Expected:** All exit 0

---

### Agent 2: Full Test Suite

```bash
npm run test:run --workspace=apps/server 2>&1 | tail -40
```

**Expected:** 853/853 pass (was 822, then 852, now 853)

Run npm security specific:

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts 2>&1 | tail -30
```

**Expected:** 52/52 pass

---

### Agent 3: Lint Check

```bash
npm run lint --workspace=apps/server 2>&1 | tail -10
npm run lint --workspace=apps/ui 2>&1 | tail -10
```

**Expected:** 0 errors for both

---

## Phase 2: Verify normalizeApprovalDecision Helper (Agents 4-5)

### Agent 4: Verify Helper Exists

```bash
# Find the helper function
rg -A 10 "function normalizeApprovalDecision" apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] Function exists
- [ ] Takes `approvalRequest` and `decision` parameters
- [ ] Returns `cancel` if decision not in allowed options
- [ ] Uses `Set` for O(1) lookup
- [ ] Type signature is correct

---

### Agent 5: Verify Helper Logic

```bash
# Read the full function implementation
rg -B 2 -A 15 "normalizeApprovalDecision" apps/server/src/lib/npm-security-policy.ts | head -25
```

**Verify:**

- [ ] Extracts allowed actions from `approvalRequest.options`
- [ ] Checks if `decision` is in allowed set
- [ ] Returns original decision if valid
- [ ] Returns `'cancel'` if invalid
- [ ] No bypass conditions

---

## Phase 3: Verify Validation at All 4 Approval Paths (Agents 6-9)

### Agent 6: Verify Strict Mode High-Risk (Line ~197-198)

```bash
sed -n '190,210p' apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] `normalizeApprovalDecision` called after `onApprovalRequired`
- [ ] Decision is reassigned with validated value
- [ ] Blocking logic uses validated decision

---

### Agent 7: Verify Prompt Mode High-Risk (Line ~248-249)

```bash
sed -n '240,260p' apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] `normalizeApprovalDecision` called after `onApprovalRequired`
- [ ] Decision is reassigned with validated value
- [ ] Blocking logic uses validated decision

---

### Agent 8: Verify Rebuild Commands (Line ~317-318)

```bash
sed -n '310,330p' apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] `normalizeApprovalDecision` called after `onApprovalRequired`
- [ ] Decision is reassigned with validated value
- [ ] Blocking logic uses validated decision

---

### Agent 9: Verify Install Commands Prompt Mode (Line ~365-366)

```bash
sed -n '358,380p' apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] `normalizeApprovalDecision` called after `onApprovalRequired`
- [ ] Decision is reassigned with validated value
- [ ] Blocking logic uses validated decision

---

## Phase 4: Verify Null Checks (Agents 10-11)

### Agent 10: Find Null Check Pattern

```bash
rg -B 2 -A 8 "if.*!approvalRequest" apps/server/src/lib/npm-security-policy.ts
```

**Verify:**

- [ ] Null check exists before using `approvalRequest`
- [ ] Returns `allowed: false` when `approvalRequest` is null
- [ ] Returns `requiresApproval: true`
- [ ] Returns appropriate `blockedReason`
- [ ] Returns valid `auditEntry`

---

### Agent 11: Count Null Checks

```bash
rg -c "if.*!approvalRequest" apps/server/src/lib/npm-security-policy.ts
```

**Expected:** At least 4 null checks (one per approval path)

---

## Phase 5: Verify Security Regression Tests (Agents 12-14)

### Agent 12: Find Invalid Decision Tests

```bash
rg -B 3 -A 20 "proceed-safe" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Verify tests exist for:**

- [ ] `proceed-safe` (invalid) blocks in strict mode
- [ ] `proceed-safe` (invalid) blocks in prompt mode
- [ ] Result is `allowed: false`
- [ ] Audit log has `eventType: 'approval-denied'`

---

### Agent 13: Verify Strict Mode Invalid Decision Test

```bash
rg -B 5 -A 25 "strict.*invalid.*decision\|invalid.*decision.*strict" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Verify:**

- [ ] Test uses `dependencyInstallPolicy: 'strict'`
- [ ] Mocks `onApprovalRequired` to return `'proceed-safe'`
- [ ] Asserts `result.allowed === false`
- [ ] Asserts audit log recorded

---

### Agent 14: Verify Prompt Mode Invalid Decision Test

```bash
rg -B 5 -A 25 "prompt.*invalid.*decision\|invalid.*decision.*prompt" apps/server/tests/unit/lib/npm-security-policy.test.ts
```

**Verify:**

- [ ] Test uses `dependencyInstallPolicy: 'prompt'`
- [ ] Mocks `onApprovalRequired` to return `'proceed-safe'`
- [ ] Asserts `result.allowed === false`
- [ ] Asserts audit log recorded

---

## Phase 6: Security Regression Verification (Agents 15-17)

### Agent 15: Verify Strict Mode Still Works

```bash
# Run strict mode tests
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts -t "strict" 2>&1 | tail -20
```

**Expected:** All strict mode tests pass

---

### Agent 16: Verify Prompt Mode Still Works

```bash
# Run prompt mode tests
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts -t "prompt" 2>&1 | tail -20
```

**Expected:** All prompt mode tests pass

---

### Agent 17: Verify No Bypass Conditions

```bash
# Check for bypass flags
rg -n "BYPASS\|SKIP_SECURITY\|DEBUG.*true" apps/server/src/lib/npm-security-policy.ts

# Check for always-true conditions in validation
rg -n "return.*true\s*;" apps/server/src/lib/npm-security-policy.ts | head -10
```

**Expected:** No bypass conditions, only legitimate returns

---

## Phase 7: Full Security Scan (Agents 18-20)

### Agent 18: Verify All Approval Paths Use Validation

```bash
# Count calls to onApprovalRequired
rg -c "onApprovalRequired" apps/server/src/lib/npm-security-policy.ts

# Count calls to normalizeApprovalDecision
rg -c "normalizeApprovalDecision" apps/server/src/lib/npm-security-policy.ts
```

**Expected:** Both counts should be equal (every approval path uses validation)

---

### Agent 19: Verify No Raw Decision Usage

```bash
# Look for decision usage that might bypass validation
rg -B 5 -A 5 "decision.*===.*'allow'\|decision.*===.*'proceed'" apps/server/src/lib/npm-security-policy.ts | head -30
```

**Verify:**

- [ ] All decision comparisons use the validated decision
- [ ] No raw callback result used directly for allow checks

---

### Agent 20: Final Security Checklist

```bash
# Verify the createApprovalRequest options
rg -A 20 "function createApprovalRequest" apps/server/src/lib/npm-security-policy.ts | head -30

# Verify high-risk options don't include proceed-safe
rg -A 40 "createApprovalRequest.*execute\|high.*risk.*options" apps/server/src/lib/npm-security-policy.ts | head -50
```

**Verify:**

- [ ] High-risk execute requests do NOT include `proceed-safe` as an option
- [ ] Only valid options are `allow`, `allow-once`, `deny`, `cancel`

---

## Report Format

```
Approval Decision Validation Fix - Codex Verification Report

=== BUILD/TEST/LINT ===
Build (types): [PASS/FAIL]
Build (server): [PASS/FAIL]
Build (UI): [PASS/FAIL]
Tests: [X/853 pass]
Lint (server): [0 errors / X errors]
Lint (UI): [0 errors / X errors]

=== normalizeApprovalDecision HELPER ===
Function exists: [YES/NO]
Correct type signature: [YES/NO]
Returns cancel for invalid: [YES/NO]
Uses Set lookup: [YES/NO]

=== VALIDATION AT ALL 4 PATHS ===
Strict high-risk (~197): [APPLIED/MISSING]
Prompt high-risk (~248): [APPLIED/MISSING]
Rebuild commands (~317): [APPLIED/MISSING]
Install prompt (~365): [APPLIED/MISSING]

=== NULL CHECKS ===
Null checks present: [YES/NO]
Count: [X/4 expected]
Returns allowed:false on null: [YES/NO]

=== SECURITY REGRESSION TESTS ===
Strict invalid decision test: [EXISTS/MISSING]
Prompt invalid decision test: [EXISTS/MISSING]
Tests verify allowed:false: [YES/NO]
Tests verify audit log: [YES/NO]

=== MODE VERIFICATION ===
Strict mode tests: [PASS/FAIL]
Prompt mode tests: [PASS/FAIL]
Allow mode unchanged: [YES/NO]

=== SECURITY SCAN ===
Approval calls = Validation calls: [YES/NO]
No bypass conditions: [VERIFIED/FOUND]
No raw decision usage: [VERIFIED/FOUND]

=== VERDICT ===
All fixes verified: [YES/NO]
Security gap closed: [YES/NO]
Ready for PR: [YES/NO]

Outstanding Issues:
[NONE or list]
```

---

## Success Criteria

ALL must pass:

- [ ] All builds pass
- [ ] 853/853 tests pass
- [ ] 0 lint errors
- [ ] `normalizeApprovalDecision` helper exists with correct logic
- [ ] Validation applied at all 4 approval paths
- [ ] Null checks present at all 4 paths
- [ ] Security regression tests exist for both modes
- [ ] `proceed-safe` blocks in strict mode (test verified)
- [ ] `proceed-safe` blocks in prompt mode (test verified)
- [ ] Every `onApprovalRequired` call has matching validation
- [ ] No bypass conditions added
- [ ] No raw decision usage that could bypass validation

---

## Escalation

If ANY of these are found, **STOP and report immediately:**

1. `normalizeApprovalDecision` missing or broken
2. Any approval path missing validation
3. Tests failing
4. Bypass conditions found
5. Raw decision usage that bypasses validation
6. `proceed-safe` still allows execution
