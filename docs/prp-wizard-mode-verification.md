# PRP: Wizard Planning Mode - Verification Protocol

**Status:** Executed — Issues Found
**Created:** 2025-12-28
**Executed:** 2025-12-29
**Team:** Codex Team (verifies Claude Team's implementation)
**Source:** Claude Team Implementation Report
**Reference:** `docs/prp-implement-step-by-step-wizard-mode.md`

---

## Context

Claude Dev Team reports wizard planning mode implementation complete with 12 parallel subagents.

**Claimed implementation:**

- 6 phases complete (Types, Backend, Frontend, Prompts, Testing, Docs)
- 15+ files modified/created
- 7 new unit tests passing
- Full build successful

**This PRP provides systematic verification of all claimed changes.**

---

## Claimed Changes Summary

### Phase 1: Type System (3 files)

| File                              | Claimed Change                                             |
| --------------------------------- | ---------------------------------------------------------- |
| `libs/types/src/settings.ts`      | Added `'wizard'` to PlanningMode                           |
| `libs/types/src/feature.ts`       | Added WizardOption, WizardQuestion, WizardState interfaces |
| `apps/ui/src/types/electron.d.ts` | Added wizard event types                                   |

### Phase 2: Backend (3 files)

| File                                                       | Claimed Change                                 |
| ---------------------------------------------------------- | ---------------------------------------------- |
| `apps/server/src/services/auto-mode-service.ts`            | Marker detection, state machine, wizard prompt |
| `apps/server/src/routes/auto-mode/routes/wizard-answer.ts` | NEW - wizard answer endpoint                   |
| `apps/server/src/routes/auto-mode/index.ts`                | Registered wizard-answer route                 |

### Phase 3: Frontend (6 files)

| File                                                                                       | Claimed Change              |
| ------------------------------------------------------------------------------------------ | --------------------------- |
| `apps/ui/src/components/views/board-view/shared/planning-mode-selector.tsx`                | Added Wizard card           |
| `apps/ui/src/components/dialogs/wizard-question-modal.tsx`                                 | NEW - Question modal        |
| `apps/ui/src/lib/http-api-client.ts`                                                       | Added wizardAnswer() method |
| `apps/ui/src/hooks/use-auto-mode.ts`                                                       | Wizard event handling       |
| `apps/ui/src/components/views/board-view.tsx`                                              | Wired WizardQuestionModal   |
| `apps/ui/src/components/views/settings-view/feature-defaults/feature-defaults-section.tsx` | Added wizard to defaults    |

### Phase 4-5: Tests (1 file)

| File                                                       | Claimed Change       |
| ---------------------------------------------------------- | -------------------- |
| `apps/server/tests/unit/services/auto-mode-wizard.test.ts` | NEW - 7 wizard tests |

---

## Phase 1: Type System Verification

### 1.1 PlanningMode Type Updated

```bash
rg -n "type PlanningMode|'wizard'" libs/types/src/settings.ts
```

**Checklist:**

- [x] PlanningMode type includes `'wizard'`
- [x] Type is exported properly

### 1.2 Wizard Interfaces Added

```bash
rg -n "WizardOption|WizardQuestion|WizardState" libs/types/src/feature.ts
```

**Checklist:**

- [x] WizardOption interface exists with label, description, value
- [x] WizardQuestion interface exists with id, question, header, options, multiSelect
- [x] WizardState interface exists with status, answers, questionsAsked
- [x] Feature type has `wizard?: WizardState` field

### 1.3 Wizard Events Added

```bash
rg -n "auto_mode_wizard|wizard_question|wizard_complete" apps/ui/src/types/electron.d.ts
```

**Checklist:**

- [x] `auto_mode_wizard_question` event type exists
- [x] `auto_mode_wizard_complete` event type exists
- [x] Event payload types defined

### 1.4 Types Build

```bash
npm run build --workspace=libs/types
```

**Checklist:**

- [x] Build completes without errors (`npm run build --workspace=libs/types`)
- [x] No TypeScript errors in types package

---

## Phase 2: Backend Verification

### 2.1 Marker Detection Logic

```bash
rg -n "\[WIZARD_QUESTION\]|\[WIZARD_COMPLETE\]|wizardMarker|detectWizard" \
  apps/server/src/services/auto-mode-service.ts
```

**Checklist:**

- [x] Marker detection code exists
- [x] Both `[WIZARD_QUESTION]` and `[WIZARD_COMPLETE]` handled
- [x] JSON parsing for question payload

### 2.2 Wizard State Machine

```bash
rg -n "wizard.*state|wizard.*status|WizardState" \
  apps/server/src/services/auto-mode-service.ts
```

**Checklist:**

- [x] Wizard state persisted to feature.json
- [x] Question queue managed (questions appended to `wizard.questionsAsked`)
- [ ] 2-5 question cap enforced (cap exists in prompt/tests, but not enforced in runtime code)
- [x] Answer collection logic exists (`submitWizardAnswer` updates `wizard.answers`)

**Issue:** Runtime does not continue after an answer (no next question, no `[WIZARD_COMPLETE]`, no plan generation). See Phase 6.

### 2.3 Wizard System Prompt

```bash
rg -n "WIZARD.*PROMPT|wizard mode.*prompt" \
  apps/server/src/services/auto-mode-service.ts -A 10
```

**Checklist:**

- [x] Wizard-specific system prompt defined (`WIZARD_SYSTEM_PROMPT`)
- [x] Prompt includes marker format instructions
- [x] Prompt includes 2-5 question cap rule
- [x] Prompt explains question format

### 2.4 Wizard Answer Endpoint

```bash
# Check file exists
ls -la apps/server/src/routes/auto-mode/routes/wizard-answer.ts

# Check route registration
rg -n "wizard-answer|wizardAnswer" apps/server/src/routes/auto-mode/index.ts
```

**Checklist:**

- [x] `wizard-answer.ts` file exists
- [x] Endpoint: `POST /api/auto-mode/wizard-answer`
- [x] Accepts: projectPath, featureId, questionId, answer
- [x] Route registered in index.ts

---

## Phase 3: Frontend Verification

### 3.1 Planning Mode Selector

```bash
rg -n "wizard|Wizard" \
  apps/ui/src/components/views/board-view/shared/planning-mode-selector.tsx
```

**Checklist:**

- [x] Wizard option card exists
- [x] Has icon (Wand2)
- [x] Has description about interactive Q&A
- [x] Styled with cyan/distinct theme

### 3.2 Wizard Question Modal

```bash
# Check file exists
ls -la apps/ui/src/components/dialogs/wizard-question-modal.tsx

# Check exports
rg -n "WizardQuestionModal|export.*Wizard" \
  apps/ui/src/components/dialogs/wizard-question-modal.tsx
```

**Checklist:**

- [x] Modal component exists
- [x] Renders question and options
- [x] Handles single-select (radio buttons)
- [x] Handles multi-select (checkboxes)
- [x] Submit button calls API
- [ ] Loading/error states handled (loading handled; no user-visible error state)

### 3.3 API Client Method

```bash
rg -n "wizardAnswer|wizard-answer" apps/ui/src/lib/http-api-client.ts
```

**Checklist:**

- [x] `wizardAnswer()` method exists
- [x] Calls `POST /api/auto-mode/wizard-answer`
- [x] Passes correct parameters

### 3.4 Event Handling

```bash
rg -n "auto_mode_wizard|wizard.*event" apps/ui/src/hooks/use-auto-mode.ts
```

**Checklist:**

- [x] Subscribes to wizard events
- [x] Opens modal when question event received
- [x] Handles wizard complete event

### 3.5 Modal Wiring

```bash
rg -n "WizardQuestionModal" apps/ui/src/components/views/board-view.tsx
```

**Checklist:**

- [x] Modal imported and rendered in board view
- [x] State connected properly

### 3.6 Feature Defaults

```bash
rg -n "wizard" \
  apps/ui/src/components/views/settings-view/feature-defaults/feature-defaults-section.tsx
```

**Checklist:**

- [x] Wizard mode available in defaults selector

---

## Phase 4: Testing Verification

### 4.1 Test File Exists

```bash
ls -la apps/server/tests/unit/services/auto-mode-wizard.test.ts
```

**Checklist:**

- [x] Test file exists

### 4.2 Run Wizard Tests

```bash
npm run test:run --workspace=apps/server -- tests/unit/services/auto-mode-wizard.test.ts --reporter=verbose
```

**Expected:** 7/7 tests passing

**Checklist:**

- [x] Marker detection tests pass
- [x] State persistence tests pass (structure-level)
- [x] Question cap tests pass (prompt-level; no runtime enforcement)
- [x] Answer validation tests pass (structure-level)
- [x] All 7 tests pass

### 4.3 Full Test Suite

```bash
npm run test:run --workspace=apps/server
```

**Checklist:**

- [ ] All server tests pass
- [ ] No regressions introduced

**Result:** ❌ `npm run test:run --workspace=apps/server` failed in this repo state (`3 failed` test files / `27 failed` tests). Failures are in npm security/terminal defaults, not wizard-specific.

---

## Phase 5: Build Verification

### 5.1 Full Build

```bash
npm run build
```

**Checklist:**

- [x] Types package builds
- [ ] Server builds (`npm run build --workspace=apps/server` fails in this repo state)
- [x] UI builds
- [ ] No TypeScript errors (server `tsc` errors)
- [ ] No build warnings (UI emits chunk-size warning)

**Result:**

- ✅ `npm run build` (packages + UI)
- ❌ `npm run build --workspace=apps/server` (`apps/server/src/lib/npm-security-policy.ts` TypeScript errors)

### 5.2 Bundle Size Check

```bash
ls -lh apps/ui/dist/assets/board-*.js | tail -1
```

**Expected:** ~596KB (includes WizardQuestionModal)

**Checklist:**

- [x] Board bundle includes wizard modal code
- [x] Size is reasonable (<700KB) — observed `596.86 kB`

---

## Phase 6: Runtime End-to-End Verification

### Prerequisites

- [x] AutoMaker server running (`npm run dev --workspace=apps/server`)
- [ ] AutoMaker UI running (`npm run dev:electron:debug`) (not executed in this verification)

### 6.1 UI Shows Wizard Option

**Manual test:**

1. Open AutoMaker UI
2. Create new feature or edit existing
3. Click on planning mode selector

**Verify:**

- [ ] "Wizard" option appears
- [ ] Has Wand2 icon (🪄)
- [ ] Description mentions "Interactive Q&A"
- [ ] Cyan/distinct styling

### 6.2 Wizard Mode Execution Flow

**Create test feature:**

```bash
curl -X POST http://localhost:3008/api/features/create \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/automaker",
    "feature": {
      "title": "Wizard Mode Test",
      "description": "Create a simple README file",
      "category": "Test",
      "model": "opus",
      "planningMode": "wizard",
      "requirePlanApproval": true,
      "skipTests": true,
      "agentIds": []
    }
  }' | jq -r '.feature.id'
```

**Run feature:**

```bash
# Note the feature ID from above
curl -X POST http://localhost:3008/api/auto-mode/run-feature \
  -H "Content-Type: application/json" \
  -d '{
    "projectPath": "/home/aip0rt/Desktop/automaker",
    "featureId": "<FEATURE_ID>",
    "useWorktrees": false
  }'
```

**Verify flow:**

- [x] Agent starts execution
- [ ] `auto_mode_wizard_question` event emitted (not directly observed; marker + persisted wizard state confirms server hit the handler)
- [ ] UI modal appears with question and options
- [ ] User can select option(s)
- [x] Submit sends answer to `/api/auto-mode/wizard-answer` (via curl)
- [ ] Agent asks next question (or completes) — execution ends immediately after answer
- [ ] After 2-5 questions, `[WIZARD_COMPLETE]` marker appears
- [ ] Agent generates plan incorporating answers
- [ ] Plan includes "Based on your selections..." text
- [ ] Standard plan approval works
- [ ] Execution proceeds normally

**Observed run:** `feature-1766970825382-17qlt3kpu` on `/home/aip0rt/Desktop/automaker` produced one question (`Q1`) then ended after submitting the answer; no plan/spec was generated (`planSpec: null`).

### 6.3 Feature Metadata Verification

```bash
# Check wizard state persisted
cat <PROJECT>/.automaker/features/<FEATURE_ID>/feature.json | jq '.wizard'
```

**Expected:**

```json
{
  "status": "complete",
  "questionsAsked": [...],
  "answers": {
    "Q1": "selected_value",
    "Q2": ["option1", "option2"]
  },
  "startedAt": "...",
  "completedAt": "..."
}
```

**Checklist:**

- [x] wizard state exists in feature.json
- [x] questionsAsked array populated
- [x] answers object contains user selections
- [ ] timestamps recorded (no `completedAt`; wizard status remains `asking`)

**Feature JSON Sample (Actual):**

- Feature: `feature-1766970825382-17qlt3kpu` (project: `/home/aip0rt/Desktop/automaker`)
- Marker written to: `/home/aip0rt/Desktop/automaker/.automaker/features/feature-1766970825382-17qlt3kpu/agent-output.md`

```json
{
  "wizard": {
    "status": "asking",
    "currentQuestionId": "Q1",
    "questionsAsked": [
      {
        "id": "Q1",
        "header": "README Style",
        "multiSelect": false
      }
    ],
    "answers": { "Q1": "standard" },
    "startedAt": "2025-12-29T01:14:11.925Z"
  },
  "planSpec": null
}
```

---

## Phase 7: Edge Cases & Error Handling

### 7.1 Question Cap Enforcement

**Test:**

- Modify test to try asking 10 questions
- Verify agent stops at 5 questions max

### 7.2 Malformed Question JSON

**Test:**

- Send invalid JSON in `[WIZARD_QUESTION]` marker
- Verify graceful error handling

### 7.3 Modal Recovery on Reload

**Test:**

- Start wizard mode
- Answer first question
- Reload browser
- Verify modal re-opens with current question

### 7.4 Cancel/Abort Wizard

**Test:**

- Start wizard mode
- Close modal without answering
- Verify feature returns to appropriate state

---

## Acceptance Criteria

### Type System

- [x] `'wizard'` exists in all PlanningMode type definitions (types/server/UI selector/defaults)
- [x] WizardState, WizardQuestion, WizardOption interfaces exist
- [x] Wizard event types defined
- [x] Types package builds successfully

### Backend

- [x] Marker detection works (`[WIZARD_QUESTION]`, `[WIZARD_COMPLETE]`)
- [x] Wizard state machine implemented
- [ ] Question cap enforced (2-5 max)
- [x] `/api/auto-mode/wizard-answer` endpoint exists and works
- [x] Wizard system prompt exists
- [ ] Events emitted correctly end-to-end (no wizard complete event due to flow ending early)

### Frontend

- [x] Wizard option appears in planning mode selector (code present)
- [x] WizardQuestionModal renders questions (code present)
- [x] Single-select and multi-select work (code present)
- [x] API client method exists
- [x] Event handling wired correctly (code present)

### Tests

- [x] 7 wizard tests exist
- [x] All wizard tests pass
- [ ] Full test suite passes (no regressions)

### End-to-End

- [x] Can create feature with wizard mode
- [ ] Questions appear in UI modal (UI not launched)
- [x] Answers submitted successfully
- [ ] Multiple questions flow works
- [ ] Plan generated with answers incorporated
- [ ] Standard execution completes

---

## Deliverables

Upon completion, provide:

1. **Completed Checklist** - All boxes checked with pass/fail
2. **Test Results** - 7/7 wizard tests + full suite results
3. **Build Output** - Confirmation builds succeed
4. **Screenshots** - Wizard modal with questions
5. **End-to-End Recording** - Full wizard flow from start to execution
6. **Feature JSON Sample** - Showing wizard state structure
7. **Discrepancies** - Any differences from claimed implementation
8. **Issues Found** - Any bugs or gaps discovered

---

## Sign-Off

| Phase                | Completed By | Date       | Status                            |
| -------------------- | ------------ | ---------- | --------------------------------- |
| Phase 1: Types       | Codex        | 2025-12-29 | ✅                                |
| Phase 2: Backend     | Codex        | 2025-12-29 | ⚠️ (issues found)                 |
| Phase 3: Frontend    | Codex        | 2025-12-29 | ⚠️ (modal error UX)               |
| Phase 4: Tests       | Codex        | 2025-12-29 | ⚠️ (full suite failing)           |
| Phase 5: Build       | Codex        | 2025-12-29 | ⚠️ (server build failing)         |
| Phase 6: Runtime E2E | Codex        | 2025-12-29 | ❌ (flow ends after first answer) |
| Phase 7: Edge Cases  | Codex        | 2025-12-29 | ⏸️ (blocked by E2E failure)       |

**Final Verdict:** [ ] VERIFIED / [x] ISSUES FOUND / [ ] BLOCKED

**Notes:**

```
- Wizard asks the first question and persists the marker/state, but does not resume to ask subsequent questions or generate a plan after the answer is submitted.
- `requirePlanApproval` is ignored for wizard mode in backend logs (`requiresApproval: false`).
- Question cap is specified in prompt/tests but not enforced by runtime logic.
- Full server test suite and server `tsc` build are failing in this repo state due to npm-security defaults/type issues (not wizard-specific).
```

---

_Generated by BMAD Party Mode_
