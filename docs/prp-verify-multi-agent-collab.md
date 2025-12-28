# PRP: Verify BMAD Multi-Agent Collaboration Implementation

## Context

The Claude team has implemented the BMAD Multi-Agent Collaboration feature. This PRP is for the Codex team to verify all reported changes are correct and complete.

---

## Reported Changes Summary

| Phase      | File                                                 | Changes                                                     |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| Data Model | `libs/types/src/feature.ts`                          | Added `agentIds?: string[]`, deprecated `personaId`         |
| Data Model | `libs/types/src/settings.ts`                         | Added `agentIds?: string[]` to AIProfile                    |
| Data Model | `libs/types/src/bmad.ts`                             | Added `ResolvedAgentCollab` interface                       |
| Server     | `apps/server/src/services/bmad-persona-service.ts`   | Added `resolveAgentCollab()` + `buildCollaborativePrompt()` |
| Server     | `apps/server/src/services/auto-mode-service.ts`      | Updated persona resolution with backward compat             |
| UI         | `apps/ui/.../add-feature-dialog.tsx`                 | Multi-select checkboxes (5 agent groups, max 4)             |
| UI         | `apps/ui/.../edit-feature-dialog.tsx`                | Multi-select with backward compat loading                   |
| UI         | `apps/ui/.../profile-form.tsx`                       | Default agents selection for profiles                       |
| Tests      | `apps/server/tests/.../bmad-persona-service.test.ts` | 44 tests (15 new for resolveAgentCollab)                    |

---

## Verification Tasks

### Agent 1: Verify Feature Type Changes

**File:** `libs/types/src/feature.ts`

```bash
grep -n "agentIds\|personaId\|@deprecated" libs/types/src/feature.ts
```

**Expected:**

- `agentIds?: string[]` field exists
- `personaId` has `@deprecated` JSDoc comment
- Both fields present (backward compat)

---

### Agent 2: Verify AIProfile Type Changes

**File:** `libs/types/src/settings.ts`

```bash
grep -n "agentIds\|personaId" libs/types/src/settings.ts
```

**Expected:**

- AIProfile interface has `agentIds?: string[]`
- `personaId` still exists (deprecated)

---

### Agent 3: Verify ResolvedAgentCollab Interface

**File:** `libs/types/src/bmad.ts`

```bash
grep -n "ResolvedAgentCollab\|interface.*Collab" libs/types/src/bmad.ts
```

**Expected:**

- `ResolvedAgentCollab` interface exists
- Has `agents: Array<{id, name, icon, systemPrompt}>`
- Has `combinedSystemPrompt: string`
- Has `collaborationMode` field

Read full interface:

```bash
sed -n '/interface ResolvedAgentCollab/,/^}/p' libs/types/src/bmad.ts
```

---

### Agent 4: Verify BmadPersonaService — resolveAgentCollab

**File:** `apps/server/src/services/bmad-persona-service.ts`

```bash
grep -n "resolveAgentCollab\|buildCollaborativePrompt" apps/server/src/services/bmad-persona-service.ts
```

**Expected:**

- `resolveAgentCollab()` method exists
- `buildCollaborativePrompt()` private method exists
- Both are async or return appropriate types

Verify method signature:

```bash
grep -A 5 "async resolveAgentCollab" apps/server/src/services/bmad-persona-service.ts
```

---

### Agent 5: Verify Auto Mode Service Updates

**File:** `apps/server/src/services/auto-mode-service.ts`

```bash
grep -n "agentIds\|resolveAgentCollab\|effectiveAgentIds" apps/server/src/services/auto-mode-service.ts
```

**Expected:**

- `effectiveAgentIds` variable (backward compat logic)
- Call to `resolveAgentCollab()` when multiple agents
- Fallback to `resolvePersona()` for single agent
- Backward compat: converts `personaId` to `[personaId]`

---

### Agent 6: Verify Add Feature Dialog — Multi-Select UI

**File:** `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`

```bash
grep -n "selectedAgentIds\|agentIds\|Checkbox\|max.*4" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:**

- `selectedAgentIds` state (Set<string>)
- Checkbox components for agent selection
- Max 4 agents enforcement
- 5 agent groups (Strategy, Implementation, Design, Builders, Innovation)

Verify agent grouping exists:

```bash
grep -n "Strategy\|Implementation\|Design\|Builders\|Innovation" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

---

### Agent 7: Verify Edit Feature Dialog — Multi-Select + Backward Compat

**File:** `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`

```bash
grep -n "selectedAgentIds\|agentIds\|personaId" apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx
```

**Expected:**

- `selectedAgentIds` state
- Loading logic that handles both `agentIds` and legacy `personaId`
- Same multi-select UI as add-feature-dialog

---

### Agent 8: Verify Profile Form — Default Agents

**File:** `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`

```bash
grep -n "agentIds\|selectedAgentIds\|BMAD\|Checkbox" apps/ui/src/components/views/profiles-view/components/profile-form.tsx
```

**Expected:**

- Agent selection UI in profile form
- Can set default agents for a profile

---

### Agent 9: Verify Tests — Count and Coverage

**File:** `apps/server/tests/unit/services/bmad-persona-service.test.ts`

```bash
grep -c "it\|test" apps/server/tests/unit/services/bmad-persona-service.test.ts
```

**Expected:** ~44 tests (or count matches report)

Check for new test sections:

```bash
grep -n "resolveAgentCollab\|backward.*compat\|multi.*agent" apps/server/tests/unit/services/bmad-persona-service.test.ts
```

**Expected:**

- Tests for `resolveAgentCollab()`
- Tests for backward compatibility
- Tests for collaborative prompt building

---

### Agent 10: Build Verification

```bash
npm run build:packages && npm run build:server && npm run build --workspace=apps/ui
```

**Expected:** All builds pass with exit code 0

---

### Agent 11: TypeScript Verification

```bash
npx tsc --noEmit -p apps/ui/tsconfig.json
npx tsc --noEmit -p apps/server/tsconfig.json
```

**Expected:** No errors (clean compile)

---

### Agent 12: Lint Verification

```bash
npm run lint
```

**Expected:** 0 errors (warnings acceptable)

---

### Agent 13: Test Execution

```bash
npm run test:server -- --testPathPattern="bmad-persona-service"
```

**Expected:** All tests pass (44/44 or reported count)

---

### Agent 14: Verify No Stale Single-Select

Check old single-select UI is removed from add-feature-dialog:

```bash
grep -n "feature-persona-select\|SelectItem.*bmad:" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** No matches for old Select-based persona picker

---

### Agent 15: Verify Selection Order Display

Check that selection order (#1, #2, #3, #4) is shown in UI:

```bash
grep -n "#1\|#2\|#3\|#4\|selection.*order\|indexOf" apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx
```

**Expected:** Logic exists to show agent order/position

---

## Report Format

```
BMAD Multi-Agent Collaboration - Verification Report

=== DATA MODEL ===
Feature Type (libs/types/src/feature.ts):
- agentIds field: [FOUND/NOT FOUND]
- personaId deprecated: [YES/NO]
- Status: [PASS/FAIL]

AIProfile Type (libs/types/src/settings.ts):
- agentIds field: [FOUND/NOT FOUND]
- Status: [PASS/FAIL]

ResolvedAgentCollab (libs/types/src/bmad.ts):
- Interface exists: [YES/NO]
- Has required fields: [YES/NO]
- Status: [PASS/FAIL]

=== SERVER ===
BmadPersonaService:
- resolveAgentCollab() exists: [YES/NO]
- buildCollaborativePrompt() exists: [YES/NO]
- Status: [PASS/FAIL]

AutoModeService:
- effectiveAgentIds logic: [FOUND/NOT FOUND]
- Backward compat: [YES/NO]
- Status: [PASS/FAIL]

=== UI ===
Add Feature Dialog:
- Multi-select checkboxes: [YES/NO]
- 5 agent groups: [YES/NO]
- Max 4 enforcement: [YES/NO]
- Selection order display: [YES/NO]
- Status: [PASS/FAIL]

Edit Feature Dialog:
- Multi-select: [YES/NO]
- Backward compat loading: [YES/NO]
- Status: [PASS/FAIL]

Profile Form:
- Agent selection UI: [YES/NO]
- Status: [PASS/FAIL]

=== TESTS ===
Test Count: [X] tests
resolveAgentCollab tests: [FOUND/NOT FOUND]
Backward compat tests: [FOUND/NOT FOUND]
Status: [PASS/FAIL]

=== BUILD/LINT/TEST ===
Build: [PASS/FAIL]
TypeScript: [PASS/FAIL]
Lint: [X errors, Y warnings]
Tests: [X/Y pass]

=== OVERALL ===
Verification Status: [PASS/FAIL]
Issues Found: [list any issues]
```
