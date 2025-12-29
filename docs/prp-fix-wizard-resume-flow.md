# PRP: Fix Wizard Mode - Resume Flow After Answer

**Status:** 🚨 URGENT - BLOCKS WIZARD MODE RELEASE
**Created:** 2025-12-28
**Team:** Claude Dev Team
**Priority:** P0 - Critical Bug
**Parent:** `docs/prp-wizard-mode-verification.md`

---

## Problem

Wizard mode asks the first question successfully, but after the user submits an answer via `/api/auto-mode/wizard-answer`, the execution **ends immediately** instead of resuming to ask the next question or complete the wizard.

**Expected flow:**

```
Q1 → Answer → Q2 → Answer → Q3 → Answer → [WIZARD_COMPLETE] → Plan → Execute
```

**Actual flow:**

```
Q1 → Answer → [END] ❌
```

**Impact:** Wizard mode is non-functional. Cannot ask multiple questions or generate plans.

---

## Root Cause Analysis (Confirmed)

### Issue 1: Wizard flow is single-turn (no real resume)

Wizard questions are generated in a single LLM call. When the model outputs a `[WIZARD_QUESTION]...` marker, the provider stream typically ends (the prompt instructs “output exactly one marker line”). The server then waits for the user’s answer, but **does not start a new LLM turn** with that answer, so there is no way to ask Q2 or emit `[WIZARD_COMPLETE]`.

**Files:**

- `apps/server/src/services/auto-mode-service.ts` (wizard marker handling inside `runAgent`)

**File:** `apps/server/src/routes/auto-mode/routes/wizard-answer.ts`

**Current behavior (actual):**

```typescript
// Calls autoModeService.submitWizardAnswer(...)
// submitWizardAnswer updates feature.wizard.answers and resolves waitForWizardAnswer
// No new agent turn is started after the answer arrives ❌
```

**Why the current approach fails:**

- `waitForWizardAnswer()` unblocks, but the original model stream is already finished, so there is nothing left to “continue”.

### Issue 2: Wizard never enters the spec/approval pipeline

`planningModeRequiresApproval` currently excludes `'wizard'`, so `[SPEC_GENERATED]` parsing and `planSpec` persistence never run for wizard mode. This also makes logs show `requiresApproval: false` even when `requirePlanApproval: true`.

**Files:**

- `apps/server/src/services/auto-mode-service.ts` (planning-mode gating)

### Issue 3: Missing runtime enforcement + counter accuracy (secondary)

- The 2–5 question rule is only in prompts/tests; server-side enforcement is missing.
- `questionIndex` emitted to the UI is off-by-one due to `|| 1` + `- 1`.
- `POST /api/auto-mode/wizard-answer` returns `questionsRemaining` / `wizardComplete`, but `submitWizardAnswer()` never sets them (currently returns only `{ success: true }`).

---

## Fix Specification

### Fix 1 (Recommended): Drive wizard as a multi-turn loop inside `AutoModeService`

Do **not** try to “resume” by having the HTTP endpoint start a second run in parallel. Keep the endpoint as “answer submission only”, and let the already-running `runAgent()` drive the wizard lifecycle by starting a **new LLM call per question**.

**File:** `apps/server/src/services/auto-mode-service.ts`

Implementation outline:

1. When `planningMode === 'wizard'`, run a loop:
   - Call provider with a wizard prompt built from:
     - feature title/description/spec
     - wizard questions asked so far + answers so far
     - strict instruction: output exactly one marker (`[WIZARD_QUESTION]...` OR `[WIZARD_COMPLETE]`)
   - Parse the first marker in the response.

2. If marker is `[WIZARD_QUESTION]{...}`:
   - Append to `feature.wizard.questionsAsked`
   - Set `wizard.status = 'asking'`, `wizard.currentQuestionId`
   - Emit `auto_mode_wizard_question`
   - `await waitForWizardAnswer(...)`
   - Persist answer to `feature.wizard.answers`
   - Continue loop (start the next LLM call)

3. If marker is `[WIZARD_COMPLETE]`:
   - Enforce **minimum 2 questions**: if `< 2`, re-prompt for another question instead of completing.
   - Set `wizard.status = 'complete'` and `wizard.completedAt`
   - Emit `auto_mode_wizard_complete`
   - Break the loop and proceed to plan generation (Fix 2).

4. Enforce **maximum 5 questions** in code:
   - If `questionsAsked.length >= 5`, stop asking and force completion + plan generation.

### Fix 1b: Keep `wizard-answer` as “submit only” (no execution trigger)

**File:** `apps/server/src/routes/auto-mode/routes/wizard-answer.ts`

Endpoint should continue to call `submitWizardAnswer()` only. Optional: enhance response fields by returning `questionsRemaining` / `wizardComplete` based on persisted wizard state.

### Fix 2: Route wizard completion into the existing spec + approval pipeline

Wizard mode must ultimately generate a normal plan/spec so existing plan persistence + approval + task execution can run.

**File:** `apps/server/src/services/auto-mode-service.ts`

Required changes:

- Treat `'wizard'` as a planning mode that **generates a spec** (so `[SPEC_GENERATED]` parsing runs).
- Respect `requirePlanApproval` the same way as other planning modes:
  - If `requirePlanApproval: true` → wait for plan approval event before implementation.
  - If `requirePlanApproval: false` → proceed directly after plan generation.

Implementation hint: rename/refactor `planningModeRequiresApproval` into two booleans:

- `planningModeGeneratesSpec` (includes `'wizard'`)
- `requiresApproval` (true only when `requirePlanApproval === true`)

### Fix 3: Enforce 2–5 question bounds at runtime

**File:** `apps/server/src/services/auto-mode-service.ts`

Must enforce both:

- **Max**: 5 questions (force completion)
- **Min**: 2 questions (reject early completion)

---

## Implementation Checklist

### Backend Fixes

- [ ] Refactor wizard handling into a multi-turn loop (new helper recommended)
- [ ] Start a new LLM turn after each wizard answer (Q1 → Q2 → …)
- [ ] Enforce min 2 / max 5 questions in code
- [ ] Fix `questionIndex` emission (0-based, increments correctly)
- [ ] When wizard completes, generate a normal spec (`[SPEC_GENERATED]`) and persist `planSpec`
- [ ] Ensure `requirePlanApproval` gates implementation for wizard mode (same as spec/full)
- [ ] (Optional) Return `questionsRemaining` / `wizardComplete` from `submitWizardAnswer()` and the route

### State Flow Fixes

- [ ] After answer submitted → Resume agent execution
- [ ] Agent receives updated `wizard.answers`
- [ ] Agent generates next question OR `[WIZARD_COMPLETE]`
- [ ] After `[WIZARD_COMPLETE]` → Generate plan
- [ ] After plan generated → Follow approval flow
- [ ] After approval → Execute

### Testing

- [ ] Add unit test: multi-turn wizard continues after `submitWizardAnswer()`
- [ ] Add unit test: early `[WIZARD_COMPLETE]` (<2 Qs) is rejected and next Q is asked
- [ ] Add unit test: cap at 5 forces completion + plan generation
- [ ] Add unit test: wizard mode respects `requirePlanApproval`
- [ ] Run an E2E smoke test via HTTP (`/run-feature` + `/wizard-answer`)

---

## Verification

After fixes applied:

### Test Multi-Question Flow

```bash
# Create wizard feature
curl -X POST http://localhost:3008/api/features/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/automaker",
    "feature": {
      "title": "Wizard Multi-Question Test",
      "description": "Create a complex configuration file with multiple options",
      "planningMode": "wizard",
      "requirePlanApproval": true,
      "model": "opus"
    }
  }' | jq -r '.feature.id'

# Run it
FEATURE_ID="<from above>"
curl -X POST http://localhost:3008/api/auto-mode/run-feature \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\":\"/home/aip0rt/Desktop/automaker\",\"featureId\":\"$FEATURE_ID\",\"useWorktrees\":false}"

# Wait for first question, then answer
curl -X POST http://localhost:3008/api/auto-mode/wizard-answer \
  -H "Content-Type: application/json" \
  -d "{\"projectPath\":\"/home/aip0rt/Desktop/automaker\",\"featureId\":\"$FEATURE_ID\",\"questionId\":\"Q1\",\"answer\":\"option1\"}"

# VERIFY: Second question appears (check logs or agent-output.md)
# Answer Q2, Q3, etc.

# VERIFY: After questions complete, plan is generated
cat /home/aip0rt/Desktop/automaker/.automaker/features/$FEATURE_ID/feature.json | jq '.planSpec'

# VERIFY: planSpec is NOT null
```

**Success Criteria:**

- [ ] Agent asks 2+ questions
- [ ] Flow continues after each answer
- [ ] `[WIZARD_COMPLETE]` appears after questions
- [ ] Plan generated incorporating answers
- [ ] Plan text references user selections
- [ ] Approval flow works
- [ ] Execution completes

---

## Acceptance Criteria

### Flow Continuity

- [ ] After wizard-answer, agent execution resumes
- [ ] Agent can ask multiple questions (tested up to 5)
- [ ] Agent emits `[WIZARD_COMPLETE]` after questions done
- [ ] Plan generated after wizard complete

### State Correctness

- [ ] `wizard.status` changes: `pending` → `asking` → `complete`
- [ ] `wizard.questionsAsked` accumulates all questions
- [ ] `wizard.answers` contains all user selections
- [ ] `wizard.completedAt` timestamp set when complete

### Integration

- [ ] Plan approval respects `requirePlanApproval` setting
- [ ] Generated plan includes wizard answers
- [ ] Execution proceeds after plan approved
- [ ] No hanging/stuck states

---

## Sign-Off

| Fix                             | Applied By | Date | Status |
| ------------------------------- | ---------- | ---- | ------ |
| Resume execution after answer   |            |      |        |
| Respect requirePlanApproval     |            |      |        |
| Enforce question cap at runtime |            |      |        |

**Final Status:** [ ] ALL FIXED / [ ] PARTIAL / [ ] BLOCKED

---

_Generated by BMAD Party Mode - Urgent Fix Response_
