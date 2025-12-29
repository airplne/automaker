# EXECUTE: Wizard Planning Mode Implementation

**Status:** 🚀 APPROVED FOR IMMEDIATE EXECUTION
**Created:** 2025-12-28
**Team:** Claude Dev Team
**Reference:** `docs/prp-implement-step-by-step-wizard-mode.md`
**Estimated Time:** 10-15 hours
**Priority:** P2 - Enhancement

---

## DIRECTIVE

**Claude Dev Team: Implement wizard planning mode immediately.**

Follow the specification in `docs/prp-implement-step-by-step-wizard-mode.md` exactly.

---

## Quick Reference

### What You're Building

**Wizard Mode:** Interactive Q&A planning mode where agent asks 2-5 clarifying questions BEFORE writing a plan.

**Flow:**

```
Task → Q1 → User picks → Q2 → User picks → [WIZARD_COMPLETE] → Plan → Approve → Execute
```

**Implementation:** Marker protocol (`[WIZARD_QUESTION]` / `[WIZARD_COMPLETE]`) + modal UI + resume endpoint.

---

## Implementation Phases

### Phase 1: Type System (1 hour)

**Files to modify:**

- `libs/types/src/settings.ts` - Add `'wizard'` to PlanningMode
- `libs/types/src/feature.ts` - Add WizardState, WizardQuestion, WizardOption interfaces
- `apps/ui/src/types/electron.d.ts` - Add wizard event types

**Verification:**

```bash
npm run build --workspace=libs/types
```

---

### Phase 2: Backend Wizard State Machine (4-6 hours)

**Files to modify:**

- `apps/server/src/services/auto-mode-service.ts`
  - Add wizard marker detection (`[WIZARD_QUESTION]`, `[WIZARD_COMPLETE]`)
  - Add wizard state persistence to `feature.wizard`
  - Add question queue management
  - Implement 2-5 question hard cap
  - Add system prompt for wizard mode

**New API endpoint:**

- `apps/server/src/routes/auto-mode/routes/wizard.ts` (create new)
  - `POST /api/auto-mode/wizard-answer`
  - Body: `{ projectPath, featureId, questionId, answer }`
  - Resume wizard execution after answer

**Verification:**

```bash
npm run test:run --workspace=apps/server
```

---

### Phase 3: Frontend UI (3-5 hours)

**Files to modify:**

**Wizard Mode Selector:**

- `apps/ui/src/components/views/board-view/shared/planning-mode-selector.tsx`
  - Add "Wizard" option card
  - Icon: 🧙 or 🎯
  - Description: "Interactive Q&A before planning"

**Wizard Question Modal (create new):**

- `apps/ui/src/components/dialogs/wizard-question-modal.tsx`
  - Render WizardQuestion
  - Show 2-4 options as radio buttons (single) or checkboxes (multi)
  - Submit answer via API
  - Handle loading/error states

**Event Handling:**

- `apps/ui/src/hooks/use-auto-mode.ts` (or event consumer)
  - Subscribe to `auto_mode_wizard_question` event
  - Open wizard modal when event received
  - Pass question payload to modal

**API Client:**

- `apps/ui/src/lib/http-api-client.ts`
  - Add `autoMode.submitWizardAnswer(...)` method

**Verification:**

```bash
npm run build --workspace=apps/ui
```

---

### Phase 4: System Prompt Engineering (1 hour)

**Add wizard mode instructions to model:**

In `auto-mode-service.ts`, when `planningMode === 'wizard'`:

```typescript
const wizardSystemPrompt = `
You are in WIZARD MODE. Your job is to ask 2-5 clarifying questions before planning.

OUTPUT FORMAT:
1. For each question, output EXACTLY one line:
   [WIZARD_QUESTION]{"id":"Q1","header":"Short Label","question":"Full question?","multiSelect":false,"options":[...]}

2. When you have enough information (after 2-5 questions), output:
   [WIZARD_COMPLETE]

RULES:
- Ask 2-5 questions total (no more)
- Each question must have 2-4 options
- Use answers from previous questions to inform next questions
- Questions should clarify: scope, approach, quality vs speed, specific features
- After [WIZARD_COMPLETE], you will write the plan using all answers

CURRENT TASK: ${feature.description}

ANSWERS SO FAR: ${JSON.stringify(feature.wizard?.answers || {})}

Generate the next question or emit [WIZARD_COMPLETE] if ready.
`;
```

---

### Phase 5: Testing (2-3 hours)

**Test Cases:**

**Unit Tests:**

- [ ] Wizard marker detection (`[WIZARD_QUESTION]` parsing)
- [ ] Wizard state persistence to feature.json
- [ ] Question count enforcement (2-5 cap)
- [ ] Answer validation (single vs multi-select)

**Integration Tests:**

- [ ] Full wizard flow: question → answer → question → complete → plan
- [ ] Recovery: reload feature with pending wizard question
- [ ] Error handling: malformed question JSON

**E2E Test:**

- [ ] Create feature with wizard mode
- [ ] Answer 3 questions
- [ ] Verify plan includes selections
- [ ] Execute and verify result

**Test Files:**

```bash
# Add tests to
apps/server/tests/unit/services/auto-mode-wizard.test.ts
apps/server/tests/integration/wizard-flow.test.ts
```

---

### Phase 6: Documentation (1 hour)

**Update docs:**

- [ ] Add wizard mode to AutoMaker user guide
- [ ] Document marker protocol
- [ ] Add examples of good wizard questions
- [ ] Update planning mode comparison table

---

## Execution Strategy

**Parallel workstreams:**

1. **Types team** - Phase 1 (blocks everything)
2. **Backend team** - Phase 2 (after types)
3. **Frontend team** - Phase 3 (after types, parallel with backend)
4. **Prompt team** - Phase 4 (parallel with backend)
5. **QA team** - Phase 5 (after all code complete)
6. **Docs team** - Phase 6 (parallel with QA)

**Critical path:** Types → Backend state machine → Frontend modal

---

## Verification Commands

After implementation:

```bash
# 1. Build all packages
npm run build

# 2. Run tests
npm run test

# 3. Start AutoMaker
npm run dev:electron:debug

# 4. Create test feature with wizard mode
# - Select "Wizard" planning mode
# - Verify questions appear in modal
# - Answer questions
# - Verify plan incorporates answers
# - Execute and verify result
```

---

## Success Criteria

✅ User can select "Wizard" planning mode in UI
✅ Agent asks 2-5 questions before planning
✅ Questions appear in modal with clear options
✅ User selections stored in feature.wizard.answers
✅ Generated plan references user choices
✅ Standard approval/execution flow works
✅ All tests pass
✅ Feature works end-to-end without errors

---

## Rollback Plan

If issues found:

```bash
git checkout -- libs/types/src/settings.ts libs/types/src/feature.ts
git checkout -- apps/server/src/services/auto-mode-service.ts
git checkout -- apps/ui/src/components/views/board-view/shared/planning-mode-selector.tsx
```

---

## EXECUTE NOW

**Claude Dev Team:**

1. Read the full PRP: `docs/prp-implement-step-by-step-wizard-mode.md`
2. Follow the implementation checklist exactly
3. Use 12+ parallel subagents if needed for speed
4. Report back with completion status

**DO NOT WAIT FOR FURTHER APPROVAL. BEGIN IMPLEMENTATION.**

---

_Approved by: BMAD Party Mode (BMad Master, Theo, Finn, Sage, Murat, John, Victor)_
