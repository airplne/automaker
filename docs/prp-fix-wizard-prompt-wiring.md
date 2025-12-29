# PRP: Fix Wizard Mode - Prompt Wiring Bug

**Status:** 🚨 URGENT - BLOCKS WIZARD FUNCTIONALITY
**Created:** 2025-12-28
**Team:** Claude Dev Team
**Priority:** P0 - Critical Bug
**Parent:** `docs/prp-fix-wizard-resume-flow.md`

---

## Problem

Wizard mode loop exists and executes, but the final plan generation uses the WRONG prompt variable.

**Bug Location:** `apps/server/src/services/auto-mode-service.ts`

**Lines involved:**

- Line 3035: `wizardPlanPrompt` is assigned (CORRECT)
- Line 3044: `executeQuery()` uses `planningPrompt` (WRONG) ❌

**Impact:** Wizard answers are not incorporated into the generated plan/spec.

---

## Root Cause

After wizard completes and collects all answers, the code builds `wizardPlanPrompt` which includes:

- All wizard questions asked
- All user answers
- Instruction to generate spec using those answers

But the actual LLM call uses `planningPrompt` instead, which was computed BEFORE the wizard loop and doesn't include wizard context.

**Simple variable name bug.**

---

## Fix

### File: `apps/server/src/services/auto-mode-service.ts`

**Line 3044 (approximately):**

**BEFORE (BROKEN):**

```typescript
const response = await provider.executeQuery(planningPrompt, tools, options);
```

**AFTER (FIXED):**

```typescript
const response = await provider.executeQuery(
  wizardComplete ? wizardPlanPrompt : planningPrompt,
  tools,
  options
);
```

**Explanation:**

- If wizard completed (`wizardComplete === true`), use `wizardPlanPrompt`
- Otherwise, use `planningPrompt` (for non-wizard planning modes)

---

## Alternative Fix (If Different Structure)

If the code structure is different, the principle is:

**Use the prompt that includes wizard answers when generating the plan after wizard completion.**

Find where the plan/spec generation LLM call happens after wizard completes, and ensure it uses the wizard-context prompt, not the generic planning prompt.

---

## Verification

### Before Fix

```bash
# Create wizard feature, answer questions
# Check generated plan
cat <PROJECT>/.automaker/features/<FEATURE_ID>/feature.json | jq '.planSpec'
```

**Current behavior:**

- Plan might not reference wizard answers
- Plan might be generic, ignoring user selections

### After Fix

```bash
# Create wizard feature
curl -X POST http://localhost:3008/api/features/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/automaker",
    "feature": {
      "title": "Wizard Prompt Test",
      "description": "Create a config file with wizard guidance",
      "planningMode": "wizard",
      "requirePlanApproval": true,
      "model": "opus"
    }
  }' | jq -r '.feature.id'

# Run and answer Q1, Q2, Q3 via wizard-answer endpoint

# After wizard completes, check plan
cat /home/aip0rt/Desktop/automaker/.automaker/features/<FEATURE_ID>/feature.json | jq '.planSpec'
```

**Expected after fix:**

- Plan explicitly references wizard answers
- Plan text includes "Based on your selections..." or similar
- Plan incorporates user choices

---

## Additional Fixes (Secondary)

### Fix 2: Include 'wizard' in planningModeRequiresApproval

**Codex team reports this is already done.** ✅

Verify:

```bash
rg "planningModeRequiresApproval.*wizard" apps/server/src/services/auto-mode-service.ts
```

### Fix 3: Runtime Question Cap Enforcement

**File:** `apps/server/src/services/auto-mode-service.ts`

In wizard loop (inside `runWizardLoop` or wherever questions are processed):

```typescript
// Before asking next question
if (wizard.questionsAsked.length >= 5) {
  logger.info('[Wizard] Question cap (5) reached, forcing completion');
  // Treat as [WIZARD_COMPLETE]
  wizard.status = 'complete';
  wizard.completedAt = new Date().toISOString();
  break; // Exit loop, proceed to plan generation
}

// Check minimum when agent tries to complete
if (wizardCompleteDetected && wizard.questionsAsked.length < 2) {
  logger.warn('[Wizard] Minimum 2 questions required, forcing another question');
  // Continue loop, don't accept completion yet
  continue;
}
```

### Fix 4: Fix questionIndex Off-By-One

**Current:**

```typescript
questionIndex: (wizard.questionsAsked?.length || 1) - 1;
```

**Problem:** When questionsAsked is empty, this returns `0`. When it has 1 question, this returns `0` again.

**Fix:**

```typescript
questionIndex: wizard.questionsAsked?.length || 0;
```

Or simply:

```typescript
questionIndex: wizard.questionsAsked.length;
```

### Fix 5: Return questionsRemaining from submitWizardAnswer

**Codex reports this might not be wired.** Check and fix if needed.

---

## Implementation Checklist

- [ ] Fix main bug: Use `wizardPlanPrompt` after wizard completes
- [ ] Verify 'wizard' in planningModeRequiresApproval (already done per Codex)
- [ ] Add runtime question cap enforcement (2 min, 5 max)
- [ ] Fix questionIndex calculation
- [ ] Ensure submitWizardAnswer returns questionsRemaining/wizardComplete
- [ ] Add test: Verify plan contains wizard answers
- [ ] Run E2E test with multi-question wizard

---

## Acceptance Criteria

### Primary Fix (Prompt Wiring)

- [ ] Plan generation after wizard uses `wizardPlanPrompt`
- [ ] Generated plan explicitly references wizard answers
- [ ] Plan text includes user selections

### Secondary Fixes

- [ ] Question cap enforced at runtime (2-5)
- [ ] questionIndex calculates correctly
- [ ] submitWizardAnswer returns complete state info

### End-to-End Flow

- [ ] Wizard asks 2-5 questions
- [ ] Plan generated after completion
- [ ] Plan incorporates all answers
- [ ] Approval flow works
- [ ] Execution proceeds

---

## Estimated Time

- Primary fix: **5-10 minutes** (one line change + test)
- Secondary fixes: **20-30 minutes**
- Testing: **15 minutes**
- **Total: 40-60 minutes**

---

## Success Criteria

**Before fix:**

```json
{
  "wizard": { "answers": { "Q1": "option1", "Q2": "option2" } },
  "planSpec": "Create a config file..." // Generic, no answer reference ❌
}
```

**After fix:**

```json
{
  "wizard": { "answers": {"Q1": "option1", "Q2": "option2"} },
  "planSpec": "Based on your selections (option1, option2), create a config file..." ✅
}
```

---

_Generated by BMAD Party Mode - Urgent Bug Fix_
