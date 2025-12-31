# PRP: Claude Team - Complete Echon Frontend Integration

## Executive Summary

**Mission:** Complete the Echon agent frontend integration by fixing 2 files that still reference the 9-agent Executive Suite.

**Assigned Team:** Claude Team (Opus subagents)
**Target Project:** `/home/aip0rt/Desktop/automaker`
**Estimated Effort:** 5-10 minutes
**Risk Level:** Low (additive changes only)

**Current State:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ECHON INTEGRATION STATUS                                        │
├─────────────────────────────────────────────────────────────────┤
│ ✅ Agent file created         (_bmad/bmm-executive/agents/)     │
│ ✅ Agent manifest updated     (_bmad/_config/agent-manifest.csv)│
│ ✅ Files manifest updated     (_bmad/_config/files-manifest.csv)│
│ ✅ Server service updated     (bmad-persona-service.ts)         │
│ ❌ Frontend config MISSING    (bmad-agents.ts)          ← FIX   │
│ ❌ UI text outdated           (bmad-section.tsx)        ← FIX   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pre-Execution Checklist

Before starting, verify you're operating on the correct project:

```bash
#!/bin/bash
echo "=== Pre-Execution Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# 1. Confirm project path
echo -n "1. Project exists: "
[ -d "$PROJECT/apps/ui" ] && echo "✅ PASS" || { echo "❌ FAIL"; exit 1; }

# 2. Confirm echon exists in server (prerequisite)
echo -n "2. Server has echon: "
grep -q "bmad:echon" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" && echo "✅ PASS" || { echo "❌ FAIL - Run server integration first"; exit 1; }

# 3. Confirm frontend is missing echon (the gap)
echo -n "3. Frontend missing echon: "
grep -q "bmad:echon" "$PROJECT/apps/ui/src/config/bmad-agents.ts" && echo "❌ Already fixed" || echo "✅ NEEDS FIX"

# 4. Confirm UI text is outdated
echo -n "4. UI text says 9-agent: "
grep -q "9-agent" "$PROJECT/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx" && echo "✅ NEEDS FIX" || echo "❌ Already fixed"

echo ""
echo "Ready to proceed with fixes."
```

---

## Task 1: Update bmad-agents.ts

### File Location

```
/home/aip0rt/Desktop/automaker/apps/ui/src/config/bmad-agents.ts
```

### Current Content (BEFORE)

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

### Required Content (AFTER)

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

### Exact Changes (3 edits)

**Edit 1:** Update comment - Line 2

```diff
- * All executive agent IDs for the BMAD Executive Suite (9 agents)
+ * All executive agent IDs for the BMAD Executive Suite (10 agents)
```

**Edit 2:** Add echon to array - After line 14 (`'bmad:zen',`)

```diff
  'bmad:zen',
+ 'bmad:echon',
] as const;
```

**Edit 3:** Update inline comment - Line 21

```diff
- export const MAX_EXECUTIVE_AGENTS = ALL_EXECUTIVE_AGENT_IDS.length; // 9
+ export const MAX_EXECUTIVE_AGENTS = ALL_EXECUTIVE_AGENT_IDS.length; // 10
```

### Task 1 Verification

```bash
#!/bin/bash
FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/config/bmad-agents.ts"

echo "=== Task 1 Verification ==="

# Check 1: echon in array
echo -n "1. 'bmad:echon' in array: "
grep -q "'bmad:echon'" "$FILE" && echo "✅ PASS" || echo "❌ FAIL"

# Check 2: Comment says 10 agents
echo -n "2. Comment says '10 agents': "
grep -q "10 agents" "$FILE" && echo "✅ PASS" || echo "❌ FAIL"

# Check 3: Inline comment says 10
echo -n "3. Inline comment says '// 10': "
grep -q "// 10" "$FILE" && echo "✅ PASS" || echo "❌ FAIL"

# Check 4: Count agent entries (should be 10)
echo -n "4. Agent count in array: "
COUNT=$(grep -c "'bmad:" "$FILE")
[ "$COUNT" -eq 10 ] && echo "✅ PASS ($COUNT)" || echo "❌ FAIL (expected 10, got $COUNT)"

# Check 5: No 9-agent references remain
echo -n "5. No '9 agents' references: "
grep -q "9 agents" "$FILE" && echo "❌ FAIL" || echo "✅ PASS"
```

---

## Task 2: Update bmad-section.tsx

### File Location

```
/home/aip0rt/Desktop/automaker/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx
```

### Target Line (~145)

**Current Content (BEFORE):**

```tsx
<p className="text-sm text-muted-foreground/80 ml-12">
  Install BMAD to <code>_bmad/</code> (includes the 9-agent Executive Suite) and configure
  git-friendly artifacts.
</p>
```

**Required Content (AFTER):**

```tsx
<p className="text-sm text-muted-foreground/80 ml-12">
  Install BMAD to <code>_bmad/</code> (includes the 10-agent Executive Suite) and configure
  git-friendly artifacts.
</p>
```

### Exact Change (1 edit)

```diff
- (includes the 9-agent Executive Suite)
+ (includes the 10-agent Executive Suite)
```

### Task 2 Verification

```bash
#!/bin/bash
FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx"

echo "=== Task 2 Verification ==="

# Check 1: Has 10-agent text
echo -n "1. Says '10-agent Executive Suite': "
grep -q "10-agent Executive Suite" "$FILE" && echo "✅ PASS" || echo "❌ FAIL"

# Check 2: No 9-agent references
echo -n "2. No '9-agent' references: "
grep -q "9-agent" "$FILE" && echo "❌ FAIL" || echo "✅ PASS"
```

---

## Task 3: TypeScript Compilation Check

After making changes, verify TypeScript compiles without errors:

```bash
#!/bin/bash
echo "=== Task 3: TypeScript Compilation ==="

cd /home/aip0rt/Desktop/automaker

# Option A: Quick type check (faster)
echo "Running type check..."
cd apps/ui && npx tsc --noEmit 2>&1 | head -20

# Check exit code
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation: PASS"
else
    echo "❌ TypeScript compilation: FAIL"
    echo "Review errors above"
fi
```

---

## Task 4: Downstream Verification

Verify that components importing `ALL_EXECUTIVE_AGENT_IDS` will work correctly:

```bash
#!/bin/bash
echo "=== Task 4: Downstream Component Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# These files import from bmad-agents.ts and will auto-get echon
FILES=(
    "apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx"
    "apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx"
    "apps/ui/src/components/views/profiles-view/components/profile-form.tsx"
)

echo "Checking downstream imports:"
for file in "${FILES[@]}"; do
    BASENAME=$(basename "$file")
    echo -n "  $BASENAME: "

    if grep -q "ALL_EXECUTIVE_AGENT_IDS\|MAX_EXECUTIVE_AGENTS\|bmad-agents" "$PROJECT/$file"; then
        echo "✅ Imports config (will auto-update)"
    else
        echo "⚠️ May need manual verification"
    fi
done

echo ""
echo "No changes needed to downstream files - they import from config."
```

---

## Task 5: Full Stack Alignment Check

Verify frontend and server are now aligned:

```bash
#!/bin/bash
echo "=== Task 5: Full Stack Alignment ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# Count agents in server
echo -n "Server PUBLIC_PERSONA_IDS (executive only): "
SERVER_COUNT=$(grep "'bmad:" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" | grep -v "party-synthesis" | wc -l)
echo "$SERVER_COUNT"

# Count agents in frontend
echo -n "Frontend ALL_EXECUTIVE_AGENT_IDS: "
FRONTEND_COUNT=$(grep -c "'bmad:" "$PROJECT/apps/ui/src/config/bmad-agents.ts")
echo "$FRONTEND_COUNT"

# Compare
if [ "$SERVER_COUNT" -eq "$FRONTEND_COUNT" ]; then
    echo "✅ ALIGNED: Both have $SERVER_COUNT executive agents"
else
    echo "❌ MISALIGNED: Server=$SERVER_COUNT, Frontend=$FRONTEND_COUNT"
fi

# Verify echon specifically
echo ""
echo "Echon presence:"
echo -n "  Server: "
grep -q "bmad:echon" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" && echo "✅" || echo "❌"
echo -n "  Frontend: "
grep -q "bmad:echon" "$PROJECT/apps/ui/src/config/bmad-agents.ts" && echo "✅" || echo "❌"
```

---

## Complete Execution Script

**Copy and run this entire script for automated execution:**

```bash
#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  CLAUDE TEAM: ECHON FRONTEND INTEGRATION FIX                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT="/home/aip0rt/Desktop/automaker"
TASKS_PASSED=0
TASKS_FAILED=0

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TASK 1: Update bmad-agents.ts
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ TASK 1: Update bmad-agents.ts ━━━"

CONFIG="$PROJECT/apps/ui/src/config/bmad-agents.ts"

# Check if already fixed
if grep -q "'bmad:echon'" "$CONFIG"; then
    echo "⚠️  echon already present - checking other updates..."
else
    # Add echon after zen
    sed -i "s/'bmad:zen',/'bmad:zen',\n  'bmad:echon',/" "$CONFIG"
    echo "✅ Added 'bmad:echon' to array"
fi

# Update comment (9 agents -> 10 agents)
if grep -q "9 agents" "$CONFIG"; then
    sed -i 's/(9 agents)/(10 agents)/' "$CONFIG"
    echo "✅ Updated comment: 9 agents → 10 agents"
else
    echo "⚠️  Comment already updated or different format"
fi

# Update inline comment (// 9 -> // 10)
if grep -q "// 9$" "$CONFIG"; then
    sed -i 's/\/\/ 9$/\/\/ 10/' "$CONFIG"
    echo "✅ Updated inline comment: // 9 → // 10"
else
    echo "⚠️  Inline comment already updated or different format"
fi

# Verify Task 1
if grep -q "'bmad:echon'" "$CONFIG" && grep -q "10 agents" "$CONFIG"; then
    echo "✅ TASK 1: PASSED"
    ((TASKS_PASSED++))
else
    echo "❌ TASK 1: FAILED"
    ((TASKS_FAILED++))
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TASK 2: Update bmad-section.tsx
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ TASK 2: Update bmad-section.tsx ━━━"

SECTION="$PROJECT/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx"

# Update 9-agent to 10-agent
if grep -q "9-agent" "$SECTION"; then
    sed -i 's/9-agent Executive Suite/10-agent Executive Suite/g' "$SECTION"
    echo "✅ Updated text: 9-agent → 10-agent"
else
    echo "⚠️  Text already updated or different format"
fi

# Verify Task 2
if grep -q "10-agent Executive Suite" "$SECTION" && ! grep -q "9-agent" "$SECTION"; then
    echo "✅ TASK 2: PASSED"
    ((TASKS_PASSED++))
else
    echo "❌ TASK 2: FAILED"
    ((TASKS_FAILED++))
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TASK 3: Verification Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ TASK 3: Final Verification ━━━"

# Agent count check
AGENT_COUNT=$(grep -c "'bmad:" "$CONFIG")
echo "Agent count in config: $AGENT_COUNT"

# Full alignment check
SERVER_HAS_ECHON=$(grep -q "bmad:echon" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" && echo "yes" || echo "no")
FRONTEND_HAS_ECHON=$(grep -q "bmad:echon" "$CONFIG" && echo "yes" || echo "no")

echo "Server has echon: $SERVER_HAS_ECHON"
echo "Frontend has echon: $FRONTEND_HAS_ECHON"

if [ "$SERVER_HAS_ECHON" = "yes" ] && [ "$FRONTEND_HAS_ECHON" = "yes" ] && [ "$AGENT_COUNT" -eq 10 ]; then
    echo "✅ TASK 3: PASSED (Full stack aligned)"
    ((TASKS_PASSED++))
else
    echo "❌ TASK 3: FAILED"
    ((TASKS_FAILED++))
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SUMMARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    EXECUTION SUMMARY                         ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  ✅ Tasks Passed: %-3d                                        ║\n" $TASKS_PASSED
printf "║  ❌ Tasks Failed: %-3d                                        ║\n" $TASKS_FAILED
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

if [ "$TASKS_FAILED" -eq 0 ]; then
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  🎉 ECHON FRONTEND INTEGRATION COMPLETE                      ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║                                                              ║"
    echo "║  Files Modified:                                             ║"
    echo "║    • apps/ui/src/config/bmad-agents.ts                       ║"
    echo "║    • apps/ui/src/components/views/settings-view/bmad/        ║"
    echo "║      bmad-section.tsx                                        ║"
    echo "║                                                              ║"
    echo "║  BMM-Executive Suite: 10 Agents                              ║"
    echo "║    1. Mary (Analyst-Strategist)                              ║"
    echo "║    2. Sage (Strategist-Marketer)                             ║"
    echo "║    3. Theo (Technologist-Architect)                          ║"
    echo "║    4. Finn (Fulfillization-Manager)                          ║"
    echo "║    5. Walt (Financial-Strategist)                            ║"
    echo "║    6. Axel (Operations-Commander)                            ║"
    echo "║    7. Cerberus (Security-Guardian)                           ║"
    echo "║    8. Apex (Peak Performance Engineer)                       ║"
    echo "║    9. Zen (Clean Architecture Engineer)                      ║"
    echo "║   10. Echon (Post-Launch Lifecycle Architect) 📡 ← NEW!      ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Next Steps:"
    echo "  1. Run: npm run build (verify compilation)"
    echo "  2. Run: npm run dev:web (visual verification)"
    echo "  3. Verify Echon appears in agent selection dropdowns"
    exit 0
else
    echo "🚨 SOME TASKS FAILED - Review output above"
    exit 1
fi
```

---

## Post-Execution Verification

### Manual UI Verification (Optional)

After execution, optionally verify in the UI:

```bash
# Start the dev server
cd /home/aip0rt/Desktop/automaker
npm run dev:web

# Then in browser at http://localhost:3007:
# 1. Go to Settings → BMAD section
#    - Should say "10-agent Executive Suite"
#
# 2. Create/Edit a Feature
#    - Agent dropdown should include "Echon" with 📡 icon
#
# 3. Go to Profiles
#    - Agent selection should include Echon
```

### Automated Post-Verification Script

```bash
#!/bin/bash
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  POST-EXECUTION VERIFICATION                                 ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT="/home/aip0rt/Desktop/automaker"
ALL_PASS=true

echo "1. bmad-agents.ts checks:"
CONFIG="$PROJECT/apps/ui/src/config/bmad-agents.ts"

echo -n "   • Has 'bmad:echon': "
grep -q "'bmad:echon'" "$CONFIG" && echo "✅" || { echo "❌"; ALL_PASS=false; }

echo -n "   • Says '10 agents': "
grep -q "10 agents" "$CONFIG" && echo "✅" || { echo "❌"; ALL_PASS=false; }

echo -n "   • No '9 agents' refs: "
grep -q "9 agents" "$CONFIG" && { echo "❌"; ALL_PASS=false; } || echo "✅"

echo -n "   • Agent count = 10: "
COUNT=$(grep -c "'bmad:" "$CONFIG")
[ "$COUNT" -eq 10 ] && echo "✅ ($COUNT)" || { echo "❌ ($COUNT)"; ALL_PASS=false; }

echo ""
echo "2. bmad-section.tsx checks:"
SECTION="$PROJECT/apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx"

echo -n "   • Says '10-agent': "
grep -q "10-agent" "$SECTION" && echo "✅" || { echo "❌"; ALL_PASS=false; }

echo -n "   • No '9-agent' refs: "
grep -q "9-agent" "$SECTION" && { echo "❌"; ALL_PASS=false; } || echo "✅"

echo ""
echo "3. Full stack alignment:"
echo -n "   • Server has echon: "
grep -q "bmad:echon" "$PROJECT/apps/server/src/services/bmad-persona-service.ts" && echo "✅" || { echo "❌"; ALL_PASS=false; }

echo -n "   • Frontend has echon: "
grep -q "bmad:echon" "$CONFIG" && echo "✅" || { echo "❌"; ALL_PASS=false; }

echo ""
if [ "$ALL_PASS" = true ]; then
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  ✅ ALL VERIFICATIONS PASSED                                 ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
else
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  ❌ SOME VERIFICATIONS FAILED                                ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
fi
```

---

## Rollback Plan

If changes need to be reverted:

```bash
cd /home/aip0rt/Desktop/automaker

# Revert specific files
git checkout -- apps/ui/src/config/bmad-agents.ts
git checkout -- apps/ui/src/components/views/settings-view/bmad/bmad-section.tsx

# Verify rollback
git status
```

---

## Subagent Deployment Strategy

**Recommended: 3-Agent Parallel Execution**

| Agent                 | Task                              | Est. Time |
| --------------------- | --------------------------------- | --------- |
| **Agent 1: Editor**   | Execute Task 1 (bmad-agents.ts)   | 2 min     |
| **Agent 2: Editor**   | Execute Task 2 (bmad-section.tsx) | 1 min     |
| **Agent 3: Verifier** | Run all verification scripts      | 2 min     |

**Execution Flow:**

```
┌─────────────────┐  ┌─────────────────┐
│ Agent 1: Edit   │  │ Agent 2: Edit   │
│ bmad-agents.ts  │  │ bmad-section.tsx│
└────────┬────────┘  └────────┬────────┘
         │                    │
         └──────────┬─────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │ Agent 3: Verify All │
         │ Post-Verification   │
         └─────────────────────┘
```

---

## Success Criteria

| Criterion                | Expected        | Verification                         |
| ------------------------ | --------------- | ------------------------------------ |
| `bmad:echon` in array    | Present         | `grep "'bmad:echon'" bmad-agents.ts` |
| Comment says "10 agents" | Yes             | `grep "10 agents" bmad-agents.ts`    |
| No "9 agents" in config  | None            | `! grep "9 agents" bmad-agents.ts`   |
| Agent count = 10         | Exactly 10      | `grep -c "'bmad:" bmad-agents.ts`    |
| UI says "10-agent"       | Yes             | `grep "10-agent" bmad-section.tsx`   |
| No "9-agent" in UI       | None            | `! grep "9-agent" bmad-section.tsx`  |
| TypeScript compiles      | No errors       | `npx tsc --noEmit`                   |
| Server/Frontend aligned  | Both have echon | Compare grep results                 |

---

## Final Checklist

Before marking complete:

- [ ] Task 1: `bmad-agents.ts` updated (3 edits)
- [ ] Task 2: `bmad-section.tsx` updated (1 edit)
- [ ] Task 3: All verification checks pass
- [ ] Task 4: Downstream imports verified (auto-update)
- [ ] Task 5: Full stack alignment confirmed
- [ ] TypeScript compilation passes
- [ ] No "9-agent" or "9 agents" references remain in UI code

---

## Summary

**This PRP completes the Echon integration story:**

```
BEFORE:
  Server:   10 agents (including echon) ✅
  Frontend: 9 agents (missing echon)   ❌

AFTER:
  Server:   10 agents (including echon) ✅
  Frontend: 10 agents (including echon) ✅
```

**Files to modify:** 2
**Lines to change:** ~5
**Estimated time:** 5 minutes
**Risk:** Low

**Execute with confidence.** 🚀
