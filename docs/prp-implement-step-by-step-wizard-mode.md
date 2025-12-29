# PRP: Implement Step-by-Step Wizard Planning Mode

**Status:** Ready for Execution (Spec Complete)
**Created:** 2025-12-28
**Team:** Dev Team
**Priority:** P2 - Enhancement

---

## Problem Statement

Current AutoMaker planning modes are all-or-nothing:

- **Skip mode:** Execute immediately, no questions
- **Lite/Spec/Full mode:** Write complete plan, single approval gate, execute

**Gap:** No interactive mode where agent asks clarifying questions BEFORE writing the plan, guiding users through decision points step-by-step.

---

## Proposed Solution: "Wizard" Planning Mode

### What It Is

A new planning mode that uses **interactive questioning** to refine requirements before execution.

**Flow:**

```
1. User submits task
2. Agent analyzes task, identifies decision points
3. Agent asks Question 1 (presents 2-4 options)
4. User selects option(s)
5. Agent asks Question 2 based on previous answer
6. User selects option(s)
7. Repeat for N decision points (typically 2-5 questions)
8. Agent generates final plan with all selections
9. User approves plan (or goes back to revise answers)
10. Agent executes
```

### Difference from Planning Mode

| Feature                   | Planning Mode                | Wizard Mode              |
| ------------------------- | ---------------------------- | ------------------------ |
| Questions before planning | ❌ No                        | ✅ Yes (2-5 questions)   |
| User guides plan creation | ❌ No                        | ✅ Yes                   |
| Single approval gate      | ✅ Yes                       | ✅ Yes (after questions) |
| Speed                     | Fast                         | Slower (interactive)     |
| Alignment quality         | Depends on agent assumptions | High (user-guided)       |

**Key insight:** Wizard mode is Planning Mode WITH a questionnaire phase before the plan is written.

---

## Technical Specification

### New Planning Mode Value

Add to `PlanningMode` type (source of truth: `libs/types/src/settings.ts`):

```typescript
export type PlanningMode =
  | 'skip' // Execute immediately
  | 'lite' // Quick plan → execute
  | 'spec' // Tech spec → approve → execute
  | 'full' // Comprehensive plan → approve → execute
  | 'wizard'; // ✨ NEW: Interactive questions → plan → approve → execute
```

### Wizard Mode Execution Flow

Wizard mode is implemented as a **server-orchestrated, multi-turn flow** using the existing plan approval gating pattern.

**Key constraint:** There is currently no `AskUserQuestion` tool in AutoMaker/Claude SDK integration. Wizard mode must use a **marker protocol** (like `[SPEC_GENERATED]`) + a **UI modal** + a **server resume endpoint**.

---

### Marker Protocol (Required)

The assistant must output **exactly one** wizard marker per turn (then stop), so the server can pause execution and wait for the user.

**Markers:**

- `"[WIZARD_QUESTION]"` followed by a single-line JSON payload describing the question
- `"[WIZARD_COMPLETE]"` to indicate no more questions; server should proceed to plan generation/approval

**Example output (single line):**

```text
[WIZARD_QUESTION]{"id":"Q1","header":"Template Type","question":"What type of PR template?","multiSelect":false,"options":[{"label":"Minimal","description":"Basic sections only","value":"minimal"},{"label":"Standard","description":"Testing + review","value":"standard"},{"label":"Comprehensive","description":"Full deployment notes","value":"comprehensive"}]}
```

---

### Data Model

```typescript
interface WizardQuestion {
  id: string; // "Q1"
  question: string; // "What type of PR template?"
  header: string; // "Template Type"
  options: WizardOption[]; // 2-4 choices
  multiSelect: boolean; // Can user pick multiple?
}

interface WizardOption {
  label: string; // "Comprehensive"
  description: string; // "Includes deployment notes, security..."
  value: string; // "comprehensive"
}

interface WizardState {
  status: 'pending' | 'asking' | 'complete';
  currentQuestionId?: string;
  questionsAsked: WizardQuestion[];
  answers: Record<string, string | string[]>;
  startedAt?: string;
  completedAt?: string;
}
```

---

### Phase 1: Question Generation (Model)

The server prompts the model to emit `[WIZARD_QUESTION]…` for the next best question given:

- `feature.description`
- prior `wizard.answers`
- a hard cap of 2–5 questions total

### Phase 2: User Interaction (UI + API)

1. Server detects `[WIZARD_QUESTION]` marker during streaming.
2. Server persists `feature.wizard` state and sets feature to a “waiting for user” state.
3. UI shows a modal with 2–4 options (single or multi-select).
4. UI submits answer via an API endpoint and the server resumes wizard execution.

**API:**

- `POST /api/auto-mode/wizard-answer`
  - Body: `{ projectPath, featureId, questionId, answer }`
  - Server updates `feature.wizard.answers[questionId] = answer`
  - Server re-runs the model to produce the next `[WIZARD_QUESTION]` or `[WIZARD_COMPLETE]`

### Phase 3: Plan Generation (Model → planSpec)

After `[WIZARD_COMPLETE]`, the server prompts the model to generate the plan/spec in the same formats as existing modes:

- `wizard + requirePlanApproval=false` → generate a lite plan and execute immediately
- `wizard + requirePlanApproval=true` → generate a spec/full-style plan and use the existing `/approve-plan` gate

### Phase 4: Approval & Execution

Reuse existing plan approval flow (`planSpec` + `/api/auto-mode/approve-plan`) and existing execution logic.

---

## Implementation Checklist

### Backend (Server)

**Files to modify:**

- [ ] **`libs/types/src/settings.ts`**
  - Add `'wizard'` to `PlanningMode` type

- [ ] **`libs/types/src/feature.ts`**
  - Add `wizard?: WizardState` to `Feature` type

- [ ] **`apps/server/src/services/auto-mode-service.ts`**
  - Add `'wizard'` to the local `PlanningMode` union (or refactor to import shared type)
  - Add wizard state machine:
    - Detect `[WIZARD_QUESTION]` / `[WIZARD_COMPLETE]` markers in assistant text
    - Persist `feature.wizard` state into `{projectPath}/.automaker/features/{featureId}/feature.json`
    - Pause execution until `/wizard-answer` arrives (similar to `pendingApprovals`)
    - After `[WIZARD_COMPLETE]`, generate plan/spec and reuse plan approval + execution paths

- [ ] **`apps/server/src/routes/auto-mode/`**
  - Add `POST /wizard-answer` route
  - Emit a new event type (e.g. `auto_mode_wizard_question`) with the question payload for the UI

### Frontend (UI)

**Files to modify:**

- [ ] **`apps/ui/src/components/views/board-view/shared/planning-mode-selector.tsx`**
  - Add `'wizard'` to `PlanningMode`
  - Add a “Wizard” card with description: “Interactive Q&A before planning”

- [ ] **`apps/ui/src/components/views/settings-view/feature-defaults/feature-defaults-section.tsx`**
  - Add `'wizard'` to the local PlanningMode union
  - Add UI label/description for default planning mode

- [ ] **`apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`**
  - Allow selecting wizard mode (via the shared selector)

- [ ] **`apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`**
  - Add wizard mode option

- [ ] **`apps/ui/src/lib/http-api-client.ts`**
  - Add `autoMode.wizardAnswer(...)` helper to call `/api/auto-mode/wizard-answer`

- [ ] **Wizard Question Modal**
  - Add a modal/dialog that renders `WizardQuestion` and captures single/multi-select answers
  - Subscribe to `auto_mode_wizard_question` events and open the modal when received
  - Update `apps/ui/src/types/electron.d.ts` to include the new event type in `AutoModeEvent`
  - Update existing event payload unions in `apps/ui/src/types/electron.d.ts` that reference planning mode (`planning_started`, `plan_approval_required`, etc.) to include `'wizard'`
  - Handle the event in `apps/ui/src/hooks/use-auto-mode.ts` (or the existing event consumer) to trigger the modal

### Workflow Logic (Server-Orchestrated)

**New wizard execution sequence (high-level):**

```typescript
// Pseudocode
if (feature.planningMode === 'wizard') {
  if (
    !feature.wizard ||
    feature.wizard.status === 'pending' ||
    feature.wizard.status === 'asking'
  ) {
    // Run model to emit next [WIZARD_QUESTION] or [WIZARD_COMPLETE]
    // If [WIZARD_QUESTION] -> persist question, emit event, pause until /wizard-answer
    // If [WIZARD_COMPLETE] -> mark wizard complete and continue to plan generation
  }
  // Then reuse existing planSpec + approval + execution paths
}
```

---

## User Experience Flow

### UI Changes

**Add-Feature Dialog:**

```
Planning Mode:
○ Skip (Execute immediately)
○ Lite (Quick plan)
○ Spec (Tech spec)
○ Full (Comprehensive)
● Wizard (Interactive Q&A) ← NEW
  └─ Description: "Agent asks questions to understand requirements before planning"
```

**During Execution:**

When wizard mode runs:

1. **Feature card shows:** "Asking clarifying questions..."
2. **Dialog appears:** Agent's question with 2-4 option buttons
3. **User picks option(s)**
4. **Next question appears** (or planning begins if done)
5. **Plan generated** with "Based on your selections: ..."
6. **Standard approval** flow continues

---

## Comparison to Planning Mode

### Visual Difference

**Planning Mode (spec):**

```
User: "Create PR template"
  ↓
Agent: [writes 500-line tech spec]
  ↓
User: [reviews entire spec, approves]
  ↓
Agent: [executes]
```

**Wizard Mode:**

```
User: "Create PR template"
  ↓
Agent: "Template type? A) Minimal B) Standard C) Comprehensive"
  ↓
User: "B"
  ↓
Agent: "Include these? □ Deployment □ Security □ Performance"
  ↓
User: [checks Deployment + Performance]
  ↓
Agent: [writes SHORT plan: "Create standard template with deployment and performance sections"]
  ↓
User: [approves]
  ↓
Agent: [executes]
```

**Key difference:** Questions BEFORE plan, not just approval AFTER plan.

---

## When to Use Wizard Mode

**Best for:**

- ✅ Ambiguous tasks ("improve the UI")
- ✅ Tasks with many valid approaches
- ✅ First-time users exploring capabilities
- ✅ High-stakes decisions (architecture choices)

**Not good for:**

- ❌ Clear, simple tasks ("add a button")
- ❌ When user already knows exactly what they want
- ❌ Time-sensitive tasks
- ❌ Repetitive tasks

---

## Acceptance Criteria

- [ ] New `wizard` planning mode available in UI
- [ ] Wizard question flow works without new Claude tools (uses `[WIZARD_QUESTION]` marker protocol)
- [ ] Agent asks 2-5 relevant questions (hard-capped) based on task + previous answers
- [ ] Each question has 2-4 clear options
- [ ] User can select single or multiple options
- [ ] Agent generates plan incorporating all selections
- [ ] Plan explicitly references user choices ("Based on your selection of...")
- [ ] Standard approval flow works after questions
- [ ] Wizard questions + answers stored in feature metadata (`feature.wizard`)

---

## Risk Assessment

| Risk                                   | Severity | Mitigation                                                                               |
| -------------------------------------- | -------- | ---------------------------------------------------------------------------------------- |
| Users find it too slow                 | Medium   | Make optional, not default                                                               |
| Agents ask bad questions               | High     | Provide question generation guidelines                                                   |
| Too many questions annoy users         | Medium   | Limit to 2-5 questions max                                                               |
| Agents don't use wizard mode correctly | High     | Clear system prompt instructions                                                         |
| UI gets stuck waiting                  | Medium   | Add recovery: store pending question in `feature.json` and allow re-open modal on reload |

---

## Effort Estimate

| Component                              | Effort          |
| -------------------------------------- | --------------- |
| Type updates                           | 1 hour          |
| Backend wizard logic                   | 4-6 hours       |
| Frontend UI changes (selector + modal) | 3-5 hours       |
| Testing                                | 2-3 hours       |
| Documentation                          | 1 hour          |
| **Total**                              | **10-15 hours** |

---

_Generated by BMAD Party Mode - Theo, John, Winston, Finn, Sage, Victor_
