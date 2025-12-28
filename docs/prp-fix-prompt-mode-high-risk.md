# PRP: Fix High-Risk Execute Approval Decision Validation (Prompt Mode)

## CRITICAL: Security Gap

**Bug:** High-risk execute commands (`npx`, `npm exec`, `pnpm dlx`, `yarn dlx`, `bunx`) can be **silently auto-approved** in `prompt` (and `strict`) mode if the approval callback returns an **invalid** action (e.g. `proceed-safe`).

**Why this matters now:** `ClaudeProvider` currently has a placeholder approval callback that returns `proceed-safe` for all approvals. `proceed-safe` is **not a valid option** for high-risk execute approvals, but the policy engine treats any decision other than `cancel` as approved — effectively bypassing user consent for high‑risk remote code execution.

| Mode   | High-Risk Example   | Current Risk                             | Expected                                      |
| ------ | ------------------- | ---------------------------------------- | --------------------------------------------- |
| strict | `npx malicious-pkg` | Can be auto-approved by invalid decision | Must be blocked unless user explicitly allows |
| prompt | `npx malicious-pkg` | Can be auto-approved by invalid decision | Must be blocked unless user explicitly allows |
| allow  | `npx malicious-pkg` | Auto-allowed                             | Auto-allowed (with audit log)                 |

**Definition of “invalid decision”:** any `decision` not present in the server-generated `approvalRequest.options[].action` for that request.

---

## Root Cause

**Primary file:** `apps/server/src/lib/npm-security-policy.ts`

In `enforcePolicy()`, high-risk execute commands request approval via `callbacks.onApprovalRequired(approvalRequest)`, but the returned `decision` is not validated against `approvalRequest.options`. The code only blocks when `decision === 'cancel'`.

This permits bypass when the callback returns **any non-cancel string**, even if that option was never offered (example: `proceed-safe`).

---

## Fix Strategy (Minimal + Security-First)

1. **Validate approval decisions** against the request’s allowed options.
2. **Treat invalid decisions as `cancel`** (deny-by-default).
3. **Do not change allow-mode behavior.**
4. **Do not change the existing strict/prompt control flow beyond decision validation.**

This is a “stop-the-line” security fix: the system must not accept approvals it didn’t offer.

---

## Implementation Steps

### Step 1: Inspect Current High-Risk Approval Flow

```bash
# View enforcePolicy high-risk section
rg -n "Handle high-risk execute commands" -n apps/server/src/lib/npm-security-policy.ts
sed -n '160,280p' apps/server/src/lib/npm-security-policy.ts

# View approval request option generation
rg -n "function createApprovalRequest\\(" apps/server/src/lib/npm-security-policy.ts
sed -n '416,520p' apps/server/src/lib/npm-security-policy.ts
```

Confirm:

- High-risk execute options DO NOT include `proceed-safe`
- Enforcement blocks only on `decision === 'cancel'`

---

### Step 2: Add Decision Validation Helper

**File:** `apps/server/src/lib/npm-security-policy.ts`

Add a small helper near `createApprovalRequest()` (or near the approval call sites):

**Requirements:**

- Input: `approvalRequest`, `decision`
- Output: a decision that is guaranteed to be one of `approvalRequest.options[].action`
- If invalid: return `'cancel'`

Suggested implementation outline:

```ts
function normalizeApprovalDecision(
  approvalRequest: PolicyEnforcementResult['approvalRequest'],
  decision: NpmSecurityApprovalOption['action']
): NpmSecurityApprovalOption['action'] {
  const allowed = new Set(approvalRequest.options.map((o) => o.action));
  return allowed.has(decision) ? decision : 'cancel';
}
```

---

### Step 3: Apply Validation to High-Risk Execute Approvals

**File:** `apps/server/src/lib/npm-security-policy.ts`

In BOTH branches:

- strict high-risk execute approval
- prompt high-risk execute approval

After:

```ts
const decision = await callbacks.onApprovalRequired(approvalRequest);
```

Update to:

```ts
let decision = await callbacks.onApprovalRequired(approvalRequest);
decision = normalizeApprovalDecision(approvalRequest, decision);
```

**Behavioral expectation:**

- If callback returns `proceed-safe` (invalid for high-risk execute), it is normalized to `cancel` and the command is blocked.

**Constraint:** Keep existing audit logging patterns; you may update `blockedReason` to make it obvious that an invalid decision was rejected (optional, but recommended).

---

### Step 4: Unit Tests (Security Regression)

**File:** `apps/server/tests/unit/lib/npm-security-policy.test.ts`

Add tests proving invalid decisions cannot bypass high-risk approvals.

Add to the existing describe block:
`describe('enforcePolicy - prompt mode with high-risk commands', ...)`

Required test cases:

1. **Prompt mode + invalid approval decision blocks**

- `mockCallbacks.onApprovalRequired.mockResolvedValue('proceed-safe')`
- `await enforcePolicy('npx some-package', promptPolicy, '/test/project', mockCallbacks)`
- Expect:
  - `result.allowed === false`
  - `mockCallbacks.onAuditLog` includes `eventType: 'approval-denied'`

2. **Strict mode + invalid approval decision blocks**

- Use strict policy (existing section already present in tests)
- Same pattern as above but with `dependencyInstallPolicy: 'strict'`

---

### Step 5: Verification

```bash
# Focused policy tests
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-security-policy.test.ts

# Full server suite
npm run test:run --workspace=apps/server

# Build + lint
npm run build --workspace=apps/server
npm run lint --workspace=apps/server
```

**Expected:** 0 failing tests, build passes, lint has 0 errors.

---

## Agent Allocation (7 Agents, Parallel Where Safe)

| Agent | Task                                                   |
| ----- | ------------------------------------------------------ |
| 1     | Inspect enforcePolicy + createApprovalRequest behavior |
| 2     | Implement normalizeApprovalDecision helper             |
| 3     | Apply validation to strict high-risk branch            |
| 4     | Apply validation to prompt high-risk branch            |
| 5     | Add prompt-mode invalid-decision unit test             |
| 6     | Add strict-mode invalid-decision unit test             |
| 7     | Run tests/build/lint and produce report                |

---

## Security Checklist

- [ ] High-risk execute approvals accept **only** offered options
- [ ] Invalid decision values normalize to `cancel`
- [ ] strict mode behavior unchanged aside from decision validation
- [ ] prompt mode behavior unchanged aside from decision validation
- [ ] allow mode behavior unchanged
- [ ] Audit log records approval-denied for invalid decisions
- [ ] Tests cover the bypass case (`proceed-safe` returned for `npx`)

---

## Report Format

```
High-Risk Approval Decision Validation Report

=== FIX APPLIED ===
File: apps/server/src/lib/npm-security-policy.ts
Decision validation added: [YES/NO]
Validation scope: [high-risk strict, high-risk prompt]

=== TESTS ===
New tests added: [X]
Policy tests: [PASS/FAIL]
Full server tests: [PASS/FAIL]

=== VERIFICATION ===
Build: [PASS/FAIL]
Lint errors: [0/X]

=== SECURITY VERDICT ===
Invalid decision bypass blocked: [YES/NO]
Ready for final verification: [YES/NO]
```

---

## Success Criteria

ALL must pass:

1. High-risk execute approvals validate decision against allowed options
2. `proceed-safe` (invalid for high-risk) results in block in prompt mode
3. `proceed-safe` (invalid for high-risk) results in block in strict mode
4. Existing tests continue to pass (no regressions)
5. Server build + lint pass
