# PRP: Verify BMAD Agent Collaboration Rename

## Context

The Claude team has implemented the BMAD Agent Collaboration rename changes. This PRP is for the Codex team to verify all reported changes are correct.

---

## Reported Changes

**File:** `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`

| Line    | Change                                                                                                                            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 511     | Comment: `{/* BMAD Persona Selection */}` → `{/* BMAD Agent Collaboration Selection */}`                                          |
| 514     | Label: `BMAD Persona (optional)` → `Add BMAD Agents to Task`                                                                      |
| 531     | Test ID: `feature-persona-select` → `feature-agent-select`                                                                        |
| 532     | Placeholder: `Loading personas…` → `Loading agents…`                                                                              |
| 543-545 | Helper: `Adds specialized agent persona as system prompt prefix.` → `Assign specialized BMAD agents to collaborate on this task.` |

---

## Verification Tasks

### Agent 1: Verify Line 511 Comment

```bash
sed -n '511p' apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** Line contains `{/* BMAD Agent Collaboration Selection */}`

**NOT:** `{/* BMAD Persona Selection */}`

---

### Agent 2: Verify Line 514 Label

```bash
sed -n '514p' apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** Line contains `Add BMAD Agents to Task`

**NOT:** `BMAD Persona (optional)`

---

### Agent 3: Verify Line 531 Test ID

```bash
sed -n '531p' apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** Line contains `data-testid="feature-agent-select"`

**NOT:** `data-testid="feature-persona-select"`

---

### Agent 4: Verify Line 532 Placeholder

```bash
sed -n '532p' apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** Line contains `Loading agents…`

**NOT:** `Loading personas…`

---

### Agent 5: Verify Lines 543-545 Helper Text

```bash
sed -n '543,545p' apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** Contains `Assign specialized BMAD agents to collaborate on this task.`

**NOT:** `Adds specialized agent persona as system prompt prefix.`

---

### Agent 6: Build Verification

```bash
npm run build --workspace=apps/ui
```

**Expected:** Build completes with exit code 0

---

### Agent 7: TypeScript Verification

```bash
npx tsc --noEmit -p apps/ui/tsconfig.json
```

**Expected:** No output (clean compile)

---

### Agent 8: Verify No Stale References

```bash
grep -n "feature-persona-select" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** No matches (the old test ID should be gone from this file)

```bash
grep -n "BMAD Persona" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** No matches (old label should be gone)

---

### Agent 9: Verify edit-feature-dialog.tsx (Follow-up Check)

The Claude team noted `edit-feature-dialog.tsx` also has `feature-persona-select`. Verify this file exists and note if it needs a follow-up rename:

```bash
grep -n "feature-persona-select" apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx
```

**Expected:** Returns matches (this was noted as out-of-scope, just confirm it exists for follow-up)

---

## Report Format

```
BMAD Agent Collaboration Rename - Verification Report

Line 511 (Comment):
- Expected: {/* BMAD Agent Collaboration Selection */}
- Actual: [paste line]
- Status: [PASS/FAIL]

Line 514 (Label):
- Expected: Add BMAD Agents to Task
- Actual: [paste line]
- Status: [PASS/FAIL]

Line 531 (Test ID):
- Expected: feature-agent-select
- Actual: [paste line]
- Status: [PASS/FAIL]

Line 532 (Placeholder):
- Expected: Loading agents…
- Actual: [paste line]
- Status: [PASS/FAIL]

Lines 543-545 (Helper):
- Expected: Assign specialized BMAD agents to collaborate on this task.
- Actual: [paste lines]
- Status: [PASS/FAIL]

Build Status: [PASS/FAIL]
TypeScript Status: [PASS/FAIL]

Stale Reference Check:
- "feature-persona-select" in add-feature-dialog.tsx: [NONE FOUND / FOUND AT LINE X]
- "BMAD Persona" in add-feature-dialog.tsx: [NONE FOUND / FOUND AT LINE X]

Follow-up Needed:
- edit-feature-dialog.tsx: [YES - has feature-persona-select / NO]

Overall Verification: [PASS/FAIL]
```
