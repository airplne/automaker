# EXECUTE: Wizard Mode Bug Fixes

**Status:** 🚨 APPROVED FOR IMMEDIATE EXECUTION
**Created:** 2025-12-28
**Team:** Claude Dev Team
**Reference:** `docs/prp-fix-wizard-prompt-wiring.md`
**Priority:** P0 - Critical
**Estimated Time:** 40-60 minutes

---

## DIRECTIVE

**Claude Dev Team: Fix wizard mode bugs immediately.**

Wizard mode is 70% functional but has critical bugs preventing release. Execute all fixes below.

---

## Critical Bugs to Fix

### Bug 1: Wrong Prompt Used for Plan Generation (P0)

**Location:** `apps/server/src/services/auto-mode-service.ts:3044`

**Problem:** Plan generation uses `planningPrompt` instead of `wizardPlanPrompt`

**Fix:**

```typescript
// Line ~3044
// BEFORE:
const response = await provider.executeQuery(planningPrompt, tools, options);

// AFTER:
const response = await provider.executeQuery(
  wizardComplete ? wizardPlanPrompt : planningPrompt,
  tools,
  options
);
```

**Impact:** Wizard answers will now be incorporated into generated plans

---

### Bug 2: Question Cap Not Enforced at Runtime (P1)

**Location:** `apps/server/src/services/auto-mode-service.ts` (in wizard loop)

**Problem:** 2-5 question rule only in prompt, not enforced by code

**Fix:** Add enforcement in `runWizardLoop()` or wherever wizard questions are processed:

```typescript
// Before processing next question
if (wizard.questionsAsked.length >= 5) {
  logger.info('[Wizard] Maximum 5 questions reached, forcing completion');
  wizard.status = 'complete';
  wizard.completedAt = new Date().toISOString();
  emit({ type: 'auto_mode_wizard_complete', ... });
  break; // Exit loop
}

// When agent emits [WIZARD_COMPLETE]
if (wizardCompleteMarker && wizard.questionsAsked.length < 2) {
  logger.warn('[Wizard] Minimum 2 questions required, asking another');
  // Force agent to ask another question instead of completing
  continue;
}
```

---

### Bug 3: questionIndex Off-By-One (P2)

**Location:** `apps/server/src/services/auto-mode-service.ts` (wizard event emission)

**Problem:**

```typescript
questionIndex: (wizard.questionsAsked?.length || 1) - 1;
```

When empty: `(0 || 1) - 1 = 0` ✅
When 1 question: `(1 || 1) - 1 = 0` ❌ (should be 1)

**Fix:**

```typescript
questionIndex: wizard.questionsAsked.length;
```

---

### Bug 4: npm-security TypeScript Errors (Blocking Build)

**Location:** `apps/server/src/lib/npm-security-policy.ts`

**Problem:** Earlier firewall disable changes created TypeScript errors

**Fix:** Clean up the commented-out code or fix type errors

```typescript
// Remove the commented block or ensure types are correct
```

---

## Implementation Order

1. **Fix Bug 4 first** - Unblock server build
2. **Fix Bug 1** - Critical prompt wiring
3. **Fix Bug 2** - Question cap enforcement
4. **Fix Bug 3** - questionIndex calculation

---

## Verification After Fixes

### Step 1: Build

```bash
npm run build
npm run build --workspace=apps/server
```

**Expected:** All build clean with no errors

---

### Step 2: Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/services/auto-mode-wizard.test.ts
npm run test:run --workspace=apps/server
```

**Expected:** All tests pass

---

### Step 3: End-to-End Wizard Test

```bash
# 1. Create wizard feature
curl -X POST http://localhost:3008/api/features/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/automaker",
    "feature": {
      "title": "E2E Wizard Test",
      "description": "Create a comprehensive testing guide document",
      "planningMode": "wizard",
      "requirePlanApproval": true,
      "model": "opus",
      "skipTests": true
    }
  }' | jq -r '.feature.id'

# Save feature ID
FEATURE_ID="<from above>"

# 2. Run feature
curl -X POST http://localhost:3008/api/auto-mode/run-feature \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\":\"/home/aip0rt/Desktop/automaker\",\"featureId\":\"$FEATURE_ID\",\"useWorktrees\":false}"

# 3. Wait for Q1, then answer
sleep 5
curl -X POST http://localhost:3008/api/auto-mode/wizard-answer \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\":\"/home/aip0rt/Desktop/automaker\",\"featureId\":\"$FEATURE_ID\",\"questionId\":\"Q1\",\"answer\":\"comprehensive\"}"

# 4. Wait for Q2, then answer
sleep 5
curl -X POST http://localhost:3008/api/auto-mode/wizard-answer \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\":\"/home/aip0rt/Desktop/automaker\",\"featureId\":\"$FEATURE_ID\",\"questionId\":\"Q2\",\"answer\":[\"testing\",\"examples\"]}"

# 5. Wait for wizard complete and plan generation
sleep 10

# 6. Verify plan was generated with wizard answers
cat /home/aip0rt/Desktop/automaker/.automaker/features/$FEATURE_ID/feature.json | jq '.planSpec'
```

**Success Criteria:**

- [ ] Q1 appears
- [ ] Answer Q1 → Q2 appears
- [ ] Answer Q2 → Q3 appears OR wizard completes
- [ ] After 2+ questions, wizard completes
- [ ] Plan generated (planSpec not null)
- [ ] **Plan text mentions wizard answers** ("comprehensive", "testing", "examples")
- [ ] Approval required (if requirePlanApproval: true)

---

## Checklist

### Bug Fixes

- [ ] Bug 1: Use wizardPlanPrompt instead of planningPrompt
- [ ] Bug 2: Add runtime min 2 / max 5 enforcement
- [ ] Bug 3: Fix questionIndex calculation
- [ ] Bug 4: Fix npm-security TypeScript errors

### Verification

- [ ] Server builds cleanly
- [ ] All tests pass
- [ ] Multi-question wizard works E2E
- [ ] Plan incorporates wizard answers
- [ ] Approval flow works

---

## Expected Timeline

- **Bug fixes:** 30-40 minutes
- **Testing:** 15-20 minutes
- **Total:** 45-60 minutes

---

## EXECUTE NOW

**Claude Dev Team:**

1. Fix all 4 bugs in order (4 → 1 → 2 → 3)
2. Run verification commands
3. Report back with:
   - All bugs fixed confirmation
   - Build status
   - Test results
   - E2E wizard test output showing multi-question flow

**DO NOT WAIT. BEGIN FIXES IMMEDIATELY.**

---

_Approved by: BMAD Party Mode (BMad Master, Theo, Murat, Finn)_
