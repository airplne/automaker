# PRP: BMAD Agent Collaboration Rename

## Context

The BMAD integration in the Add Feature Dialog currently uses "persona" terminology, which implies a single agent personality. The user wants this rebranded to emphasize **multi-agent collaboration** — the idea that BMAD agents work together on tasks, not just as individual personas.

## Current State

**File:** `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`

**Current UI (Lines 511-546):**

```tsx
{/* BMAD Persona Selection */}
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label>BMAD Persona (optional)</Label>
    {selectedPersonaId && (
      <Button ... onClick={() => setSelectedPersonaId(null)}>
        Clear
      </Button>
    )}
  </div>
  <Select ...>
    <SelectTrigger data-testid="feature-persona-select">
      <SelectValue placeholder={isLoadingPersonas ? 'Loading personas…' : 'None'} />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">None</SelectItem>
      {bmadPersonas.map((p) => (
        <SelectItem key={p.id} value={p.id}>
          {p.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  <p className="text-xs text-muted-foreground">
    Adds specialized agent persona as system prompt prefix.
  </p>
</div>
```

**Current terminology:**

- "BMAD Persona (optional)"
- "Loading personas…"
- "Adds specialized agent persona as system prompt prefix."

---

## Required Changes

### 1. Rename Label and Helper Text

**Change the label** from:

```
BMAD Persona (optional)
```

to:

```
Add BMAD Agents to Task
```

**Change the placeholder** from:

```
Loading personas…
```

to:

```
Loading agents…
```

**Change the helper text** from:

```
Adds specialized agent persona as system prompt prefix.
```

to:

```
Assign specialized BMAD agents to collaborate on this task.
```

### 2. Update Comment

**Change the comment** from:

```tsx
{
  /* BMAD Persona Selection */
}
```

to:

```tsx
{
  /* BMAD Agent Collaboration Selection */
}
```

### 3. Consider Variable Naming (Optional Investigation)

The variable names still use "persona" terminology:

- `selectedPersonaId` (state)
- `bmadPersonas` (from hook)
- `isLoadingPersonas` (from hook)

**Investigation needed:** Should these be renamed to `selectedAgentId`, `bmadAgents`, `isLoadingAgents` for consistency? This would require:

- Changes in this file
- Changes in `use-bmad-personas.ts` hook
- Changes in related server-side code

**Recommendation:** For this PRP, focus on UI-facing text changes only. Variable renaming can be a follow-up task to avoid scope creep.

---

## Implementation Steps

### Step 1: Update UI Labels

**File:** `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`

**Line 511 — Update comment:**

```tsx
// BEFORE
{
  /* BMAD Persona Selection */
}

// AFTER
{
  /* BMAD Agent Collaboration Selection */
}
```

**Line 514 — Update label:**

```tsx
// BEFORE
<Label>BMAD Persona (optional)</Label>

// AFTER
<Label>Add BMAD Agents to Task</Label>
```

**Line 532 — Update placeholder:**

```tsx
// BEFORE
<SelectValue placeholder={isLoadingPersonas ? 'Loading personas…' : 'None'} />

// AFTER
<SelectValue placeholder={isLoadingPersonas ? 'Loading agents…' : 'None'} />
```

**Lines 543-545 — Update helper text:**

```tsx
// BEFORE
<p className="text-xs text-muted-foreground">
  Adds specialized agent persona as system prompt prefix.
</p>

// AFTER
<p className="text-xs text-muted-foreground">
  Assign specialized BMAD agents to collaborate on this task.
</p>
```

### Step 2: Verify Related Components

Check if similar terminology exists in other BMAD-related UI components:

1. **Board Header BMAD dropdown** — `apps/ui/src/components/views/board-view/board-header.tsx`
2. **Settings BMAD section** — `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx`
3. **AI Profiles store** — `apps/ui/src/store/app-store.ts` (lines 861-1114)

If these use "persona" terminology, note them for follow-up but don't change in this PRP.

### Step 3: Update Test ID (Optional)

The test ID uses "persona":

```tsx
<SelectTrigger data-testid="feature-persona-select">
```

**Consideration:** Changing test IDs may break existing tests. Investigate if any tests reference `feature-persona-select` before changing.

**Command to check:**

```bash
grep -rn "feature-persona-select" apps/ui/src/
```

If no tests reference it, update to:

```tsx
<SelectTrigger data-testid="feature-agent-select">
```

---

## Expected Result

After implementation:

**UI will show:**

- Label: "Add BMAD Agents to Task"
- Placeholder: "Loading agents…" (while loading) or "None" (after loaded)
- Helper: "Assign specialized BMAD agents to collaborate on this task."

**Visual appearance:** Same dropdown with updated wording that emphasizes collaboration over persona.

---

## Verification Checklist

- [ ] Line 511: Comment changed to `{/* BMAD Agent Collaboration Selection */}`
- [ ] Line 514: Label changed to "Add BMAD Agents to Task"
- [ ] Line 532: Placeholder uses "Loading agents…" instead of "Loading personas…"
- [ ] Lines 543-545: Helper text updated to collaboration message
- [ ] Build passes: `npm run build --workspace=apps/ui`
- [ ] TypeScript passes: `npx tsc --noEmit -p apps/ui/tsconfig.json`
- [ ] Manual test: Open Add Feature dialog, go to Prompt tab, verify new wording

---

## Out of Scope (Future PRPs)

1. **Variable renaming** (`selectedPersonaId` → `selectedAgentId`, etc.)
2. **Hook renaming** (`useBmadPersonas` → `useBmadAgents`)
3. **Multi-select support** (allowing multiple agents to be selected)
4. **Agent Runner integration** (covered in separate PRP: `docs/prp-bmad-agent-runner.md`)

---

## Report Format

After implementation, report:

```
BMAD Agent Collaboration Rename - Implementation Report

Files Modified:
- apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx

Changes Made:
1. Line XXX: [change description]
2. Line XXX: [change description]
...

Build Status: [PASS/FAIL]
TypeScript Status: [PASS/FAIL]
Manual Verification: [PASS/FAIL]

Related Files Checked (no changes needed):
- [file]: [reason]

Test ID Status:
- Changed: [yes/no]
- Tests affected: [list or none]

Notes:
[Any additional observations]
```
