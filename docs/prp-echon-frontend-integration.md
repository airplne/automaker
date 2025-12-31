# PRP: Complete Echon Frontend Integration

## Executive Summary

**Goal:** Complete the Echon agent integration by updating frontend configuration files that still reference the 9-agent Executive Suite.

**Context:** The verification team confirmed Echon was successfully created and integrated into:

- ✅ `_bmad/bmm-executive/agents/echon.md` (agent file)
- ✅ `_bmad/_config/agent-manifest.csv` (manifest)
- ✅ `_bmad/_config/files-manifest.csv` (file registry)
- ✅ `apps/server/src/services/bmad-persona-service.ts` (server-side)

**Gap Discovered:** Frontend configuration still references 9 agents:

- ❌ `apps/ui/src/config/bmad-agents.ts` - Missing `bmad:echon`
- ❌ `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx` - Says "9-agent"

**Impact:** Without this fix:

- Echon won't appear in agent selection dropdowns
- Profile forms won't allow selecting Echon
- UI text will be inaccurate

---

## Pre-Execution Verification

```bash
#!/bin/bash
echo "=== Pre-Execution Check ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# Verify Echon exists in server service (should be there)
echo -n "1. Server has echon: "
grep -q "bmad:echon" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" && echo "✅" || echo "❌"

# Verify frontend config is missing echon (the gap we're fixing)
echo -n "2. Frontend missing echon: "
grep -q "bmad:echon" "$PROJECT/apps/ui/src/config/bmad-agents.ts" && echo "❌ Already present" || echo "✅ Needs fix"

# Verify UI text says 9-agent
echo -n "3. UI text says 9-agent: "
grep -q "9-agent" "$PROJECT/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx" && echo "✅ Needs fix" || echo "❌ Already fixed"

echo ""
```

---

## Task Breakdown

### Task 1: Update bmad-agents.ts

**Priority:** Critical
**File:** `apps/ui/src/config/bmad-agents.ts`

**Current Content:**

```typescript
/**
 * All executive agent IDs for the BMAD Executive Suite (9 agents)
 * Single source of truth for agent limits across the application
 */
export const ALL_EXECUTIVE_AGENT_IDS = [
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
] as const;

/**
 * Maximum number of executive agents that can be selected
 * Derived from array length to prevent hardcoding errors
 */
export const MAX_EXECUTIVE_AGENTS = ALL_EXECUTIVE_AGENT_IDS.length; // 9

export type ExecutiveAgentId = (typeof ALL_EXECUTIVE_AGENT_IDS)[number];
```

**Required Changes:**

1. Update comment from "9 agents" to "10 agents"
2. Add `'bmad:echon'` to the array
3. Update inline comment from `// 9` to `// 10`

**New Content:**

```typescript
/**
 * All executive agent IDs for the BMAD Executive Suite (10 agents)
 * Single source of truth for agent limits across the application
 */
export const ALL_EXECUTIVE_AGENT_IDS = [
  'bmad:strategist-marketer',
  'bmad:technologist-architect',
  'bmad:fulfillization-manager',
  'bmad:security-guardian',
  'bmad:analyst-strategist',
  'bmad:financial-strategist',
  'bmad:operations-commander',
  'bmad:apex',
  'bmad:zen',
  'bmad:echon',
] as const;

/**
 * Maximum number of executive agents that can be selected
 * Derived from array length to prevent hardcoding errors
 */
export const MAX_EXECUTIVE_AGENTS = ALL_EXECUTIVE_AGENT_IDS.length; // 10

export type ExecutiveAgentId = (typeof ALL_EXECUTIVE_AGENT_IDS)[number];
```

**Verification:**

```bash
# Verify echon is in the array
grep -q "bmad:echon" apps/ui/src/config/bmad-agents.ts && echo "✅ echon added" || echo "❌ echon missing"

# Verify comment updated
grep -q "10 agents" apps/ui/src/config/bmad-agents.ts && echo "✅ comment updated" || echo "❌ comment not updated"

# Verify array has 10 entries
AGENT_COUNT=$(grep -c "bmad:" apps/ui/src/config/bmad-agents.ts)
[ "$AGENT_COUNT" -eq 10 ] && echo "✅ 10 agents in array" || echo "❌ Expected 10, found $AGENT_COUNT"
```

---

### Task 2: Update bmad-section.tsx

**Priority:** High
**File:** `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx`

**Current Content (Line ~145):**

```tsx
<p className="text-sm text-muted-foreground/80 ml-12">
  Install BMAD to <code>_bmad/</code> (includes the 9-agent Executive Suite) and configure
  git-friendly artifacts.
</p>
```

**Required Change:**
Update "9-agent" to "10-agent"

**New Content:**

```tsx
<p className="text-sm text-muted-foreground/80 ml-12">
  Install BMAD to <code>_bmad/</code> (includes the 10-agent Executive Suite) and configure
  git-friendly artifacts.
</p>
```

**Verification:**

```bash
# Verify text updated
grep -q "10-agent Executive Suite" apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx && echo "✅ text updated" || echo "❌ text not updated"

# Verify no 9-agent references remain
grep "9-agent" apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx && echo "⚠️ Still has 9-agent reference" || echo "✅ No 9-agent references"
```

---

### Task 3: Verify Downstream Effects

**Priority:** Medium
**Type:** Verification Only (No Changes Expected)

The following files import `ALL_EXECUTIVE_AGENT_IDS` and should automatically get the update:

1. `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`
2. `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`
3. `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`

**Verification:**

```bash
#!/bin/bash
echo "=== Verifying Downstream Imports ==="

PROJECT="/home/aip0rt/Desktop/automaker"

FILES=(
  "apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx"
  "apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx"
  "apps/ui/src/components/views/profiles-view/components/profile-form.tsx"
)

for file in "${FILES[@]}"; do
  echo -n "  $file: "
  if grep -q "ALL_EXECUTIVE_AGENT_IDS\|MAX_EXECUTIVE_AGENTS" "$PROJECT/$file"; then
    echo "✅ Uses config (will auto-update)"
  else
    echo "⚠️ May need manual check"
  fi
done
```

---

### Task 4: TypeScript Compilation Check

**Priority:** High
**Type:** Build Verification

After changes, verify TypeScript compiles without errors:

```bash
cd /home/aip0rt/Desktop/automaker
npm run build:packages  # Build shared packages first
cd apps/ui && npx tsc --noEmit  # Type check UI
```

**Expected Result:** No TypeScript errors related to agent types.

---

### Task 5: Documentation Update Scan

**Priority:** Low
**Type:** Informational

Scan for documentation that may need updating (not blocking):

```bash
#!/bin/bash
echo "=== Documentation mentioning 9 agents ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# Find docs mentioning 9 agents (informational only)
echo "Files mentioning '9 agent' or '9-agent':"
grep -rl "9.agent\|9-agent" "$PROJECT/docs" "$PROJECT/DOCUMENTATION.md" 2>/dev/null | head -20

echo ""
echo "Note: These are informational. PRPs and historical docs don't need updating."
```

---

## Complete Execution Script

```bash
#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ECHON FRONTEND INTEGRATION                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT="/home/aip0rt/Desktop/automaker"
PASS=0
FAIL=0

# Task 1: Update bmad-agents.ts
echo "━━━ Task 1: Update bmad-agents.ts ━━━"

CONFIG_FILE="$PROJECT/apps/ui/src/config/bmad-agents.ts"

# Check if already has echon
if grep -q "bmad:echon" "$CONFIG_FILE"; then
    echo "⚠️ echon already present - skipping"
else
    # Add echon to the array (before the closing bracket)
    sed -i "s/'bmad:zen',/'bmad:zen',\n  'bmad:echon',/" "$CONFIG_FILE"
    echo "✅ Added bmad:echon to array"
fi

# Update comment from 9 to 10
sed -i 's/Executive Suite (9 agents)/Executive Suite (10 agents)/' "$CONFIG_FILE"
sed -i 's/\.length; \/\/ 9/.length; \/\/ 10/' "$CONFIG_FILE"
echo "✅ Updated comments to 10 agents"

# Verify
if grep -q "bmad:echon" "$CONFIG_FILE" && grep -q "10 agents" "$CONFIG_FILE"; then
    ((PASS++))
    echo "✅ Task 1 PASSED"
else
    ((FAIL++))
    echo "❌ Task 1 FAILED"
fi

echo ""

# Task 2: Update bmad-section.tsx
echo "━━━ Task 2: Update bmad-section.tsx ━━━"

SECTION_FILE="$PROJECT/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx"

# Update 9-agent to 10-agent
sed -i 's/9-agent Executive Suite/10-agent Executive Suite/' "$SECTION_FILE"
echo "✅ Updated UI text to 10-agent"

# Verify
if grep -q "10-agent Executive Suite" "$SECTION_FILE"; then
    ((PASS++))
    echo "✅ Task 2 PASSED"
else
    ((FAIL++))
    echo "❌ Task 2 FAILED"
fi

echo ""

# Task 3: Verify downstream
echo "━━━ Task 3: Verify Downstream Imports ━━━"

DOWNSTREAM_OK=true
for file in \
    "apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx" \
    "apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx" \
    "apps/ui/src/components/views/profiles-view/components/profile-form.tsx"; do

    if grep -q "ALL_EXECUTIVE_AGENT_IDS\|MAX_EXECUTIVE_AGENTS" "$PROJECT/$file"; then
        echo "  ✅ $(basename $file)"
    else
        echo "  ⚠️ $(basename $file) - may need check"
        DOWNSTREAM_OK=false
    fi
done

if [ "$DOWNSTREAM_OK" = true ]; then
    ((PASS++))
    echo "✅ Task 3 PASSED"
else
    ((PASS++))  # Still pass, just informational
    echo "✅ Task 3 PASSED (with notes)"
fi

echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    EXECUTION SUMMARY                         ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  ✅ Passed: $PASS                                                     ║"
echo "║  ❌ Failed: $FAIL                                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"

if [ "$FAIL" -eq 0 ]; then
    echo ""
    echo "🎉 FRONTEND INTEGRATION COMPLETE"
    echo ""
    echo "Files modified:"
    echo "  - apps/ui/src/config/bmad-agents.ts"
    echo "  - apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx"
    echo ""
    echo "Next: Run 'npm run build' to verify compilation"
    exit 0
else
    echo ""
    echo "🚨 SOME TASKS FAILED - Review above"
    exit 1
fi
```

---

## Post-Execution Verification

### Final Verification Script

```bash
#!/bin/bash
echo "=== Final Echon Frontend Integration Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"

echo ""
echo "1. bmad-agents.ts:"
echo -n "   - Has bmad:echon: "
grep -q "bmad:echon" "$PROJECT/apps/ui/src/config/bmad-agents.ts" && echo "✅" || echo "❌"
echo -n "   - Says 10 agents: "
grep -q "10 agents" "$PROJECT/apps/ui/src/config/bmad-agents.ts" && echo "✅" || echo "❌"
echo -n "   - Agent count: "
grep -c "'bmad:" "$PROJECT/apps/ui/src/config/bmad-agents.ts"

echo ""
echo "2. bmad-section.tsx:"
echo -n "   - Says 10-agent: "
grep -q "10-agent" "$PROJECT/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx" && echo "✅" || echo "❌"
echo -n "   - No 9-agent refs: "
grep -q "9-agent" "$PROJECT/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx" && echo "❌" || echo "✅"

echo ""
echo "3. Server alignment:"
echo -n "   - Server has echon: "
grep -q "bmad:echon" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" && echo "✅" || echo "❌"

echo ""
echo "4. Full stack agent count:"
echo -n "   - Server PUBLIC_PERSONA_IDS: "
grep -c "'bmad:" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" | head -1
echo -n "   - UI ALL_EXECUTIVE_AGENT_IDS: "
grep -c "'bmad:" "$PROJECT/apps/ui/src/config/bmad-agents.ts"

echo ""
echo "=== Verification Complete ==="
```

---

## Execution Order Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ Task 1: Update bmad-agents.ts (Critical)                        │
│   - Add 'bmad:echon' to array                                   │
│   - Update comments (9→10)                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Task 2: Update bmad-section.tsx (High)                          │
│   - Change "9-agent" to "10-agent"                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Task 3: Verify Downstream (Medium)                              │
│   - Confirm dialogs use config imports                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Task 4: TypeScript Build (High)                                 │
│   - npm run build                                               │
│   - Verify no type errors                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Rollback

If changes need to be reverted:

```bash
cd /home/aip0rt/Desktop/automaker
git checkout -- apps/ui/src/config/bmad-agents.ts
git checkout -- apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx
```

---

## Success Criteria

| Criterion                                                   | Expected |
| ----------------------------------------------------------- | -------- |
| `bmad-agents.ts` has `bmad:echon`                           | Yes      |
| `bmad-agents.ts` says "10 agents"                           | Yes      |
| `bmad-section.tsx` says "10-agent"                          | Yes      |
| No "9-agent" references in UI components                    | Correct  |
| TypeScript compiles without errors                          | Yes      |
| Agent count matches server (10 executive + party-synthesis) | Yes      |

---

## Summary

This is a **minimal, surgical fix** to complete Echon's frontend integration:

| File                                                               | Change                              |
| ------------------------------------------------------------------ | ----------------------------------- |
| `apps/ui/src/config/bmad-agents.ts`                                | Add `'bmad:echon'`, update comments |
| `apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx` | "9-agent" → "10-agent"              |

**Estimated effort:** 5 minutes
**Risk level:** Low (additive changes only)
**Dependencies:** None (server already updated)
