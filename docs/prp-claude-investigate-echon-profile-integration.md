# PRP: Claude Team - Investigate & Verify Echon Profile Integration

## Executive Summary

**Mission:** Deploy 12 Opus subagents to investigate whether Echon is properly integrated into the AI Profile section, identify any gaps, and remediate if needed.

**Assigned Team:** Claude Team (12 Opus subagents)
**Target Project:** `/home/aip0rt/Desktop/automaker`
**Investigation Scope:** Full data flow from agent file → server → frontend → UI

**Hypothesis:** Echon integration should already be complete based on prior work, but needs verification and potential debugging if not visible in UI.

---

## Background Context

### What Was Already Done

| Component              | Status      | Details                                                            |
| ---------------------- | ----------- | ------------------------------------------------------------------ |
| **Backend Agent File** | ✅ Complete | `_bmad/bmm-executive/agents/echon.md` created                      |
| **Backend Manifests**  | ✅ Complete | agent-manifest.csv & files-manifest.csv updated                    |
| **Server Service**     | ✅ Complete | `bmad-persona-service.ts` has `'bmad:echon'` in PUBLIC_PERSONA_IDS |
| **Frontend Config**    | ✅ Complete | `bmad-agents.ts` has `'bmad:echon'` in ALL_EXECUTIVE_AGENT_IDS     |
| **UI Text**            | ✅ Complete | Settings page says "10-agent Executive Suite"                      |

### Expected Behavior

Based on code analysis:

1. **Profile Form** (`apps/ui/src/components/views/profiles-view/components/profile-form.tsx`):
   - Imports `ALL_EXECUTIVE_AGENT_IDS` from `@/config/bmad-agents`
   - Uses `useBmadPersonas()` hook to fetch agents from server
   - Maps over `ALL_EXECUTIVE_AGENT_IDS` to display checkboxes
   - **Expected:** Echon should appear automatically

2. **Data Flow:**
   ```
   Agent File → Server Manifest → Server API → Frontend Hook → Profile Form UI
   ```

### Investigation Question

**Is Echon appearing in the AI Profile section agent selector?**

If NO → Investigate why and remediate
If YES → Document and verify functionality

---

## 12-Subagent Team Structure

### Phase 1: Discovery & Analysis (Agents 1-4)

**Agent 1: Data Flow Analyst**

- Trace complete data flow from echon.md → UI
- Identify all integration points
- Map dependencies between components

**Agent 2: Frontend UI Inspector**

- Analyze profile-form.tsx rendering logic
- Check ALL_EXECUTIVE_AGENT_IDS usage
- Verify persona filtering logic

**Agent 3: Backend Service Investigator**

- Verify bmad-persona-service.ts returns echon
- Check PUBLIC_PERSONA_IDS array
- Validate listPersonas() endpoint response

**Agent 4: Hook & API Analyst**

- Investigate useBmadPersonas() hook
- Trace api.bmad.listPersonas() call chain
- Verify Electron IPC bridge

---

### Phase 2: Verification & Testing (Agents 5-7)

**Agent 5: Static Analysis Verifier**

- Grep for 'bmad:echon' across codebase
- Verify it exists in all expected files
- Check for any filtering/exclusion logic

**Agent 6: Runtime State Investigator**

- Examine if dev server needs restart
- Check for caching issues
- Verify build/compilation state

**Agent 7: Integration Test Designer**

- Design test cases for Echon in profiles
- Verify selection limits (0-10 agents)
- Test save/load functionality

---

### Phase 3: Remediation (if needed) (Agents 8-10)

**Agent 8: Gap Identifier**

- Identify missing integration points
- Determine root cause if Echon missing
- Propose specific fixes

**Agent 9: Fix Implementer**

- Apply any necessary code changes
- Update configurations if needed
- Handle edge cases

**Agent 10: Regression Tester**

- Verify 9 original agents still work
- Test existing profiles aren't broken
- Validate backward compatibility

---

### Phase 4: Documentation & Synthesis (Agents 11-12)

**Agent 11: Documentation Specialist**

- Document complete integration
- Create troubleshooting guide
- Write verification checklist

**Agent 12: Synthesis Coordinator**

- Aggregate all findings
- Produce final report
- Make go/no-go recommendation

---

## Investigation Tasks

### Task 1: Verify Server Returns Echon

**Owner:** Agent 3

```bash
#!/bin/bash
echo "=== Task 1: Server Persona Service Check ==="

SERVICE="/home/aip0rt/Desktop/automaker/apps/server/src/services/bmad-persona-service.ts"

# Check 1: PUBLIC_PERSONA_IDS has echon
echo -n "1.1 SERVER: PUBLIC_PERSONA_IDS has 'bmad:echon': "
grep -q "'bmad:echon'" "$SERVICE" && echo "✅" || echo "❌"

# Check 2: Count personas in PUBLIC_PERSONA_IDS
echo -n "1.2 SERVER: Count of PUBLIC_PERSONA_IDS: "
grep "'bmad:" "$SERVICE" | wc -l

# Check 3: Verify echon is in correct position (should be after zen)
echo -n "1.3 SERVER: Echon after zen in array: "
grep -A1 "'bmad:zen'" "$SERVICE" | grep -q "'bmad:echon'" && echo "✅" || echo "⚠️"
```

**Expected Result:** All checks ✅

---

### Task 2: Verify Frontend Config Has Echon

**Owner:** Agent 2

```bash
#!/bin/bash
echo "=== Task 2: Frontend Config Check ==="

CONFIG="/home/aip0rt/Desktop/automaker/apps/ui/src/config/bmad-agents.ts"

# Check 1: ALL_EXECUTIVE_AGENT_IDS has echon
echo -n "2.1 FRONTEND: ALL_EXECUTIVE_AGENT_IDS has 'bmad:echon': "
grep -q "'bmad:echon'" "$CONFIG" && echo "✅" || echo "❌"

# Check 2: Count agents in array
echo -n "2.2 FRONTEND: Agent count: "
grep -c "'bmad:" "$CONFIG"

# Check 3: MAX_EXECUTIVE_AGENTS value
echo -n "2.3 FRONTEND: MAX_EXECUTIVE_AGENTS = 10: "
grep -q "// 10$" "$CONFIG" && echo "✅" || echo "❌"
```

**Expected Result:** All checks ✅, count = 10

---

### Task 3: Verify Profile Form Uses Correct Config

**Owner:** Agent 2

```bash
#!/bin/bash
echo "=== Task 3: Profile Form Integration Check ==="

FORM="/home/aip0rt/Desktop/automaker/apps/ui/src/components/views/profiles-view/components/profile-form.tsx"

# Check 1: Imports ALL_EXECUTIVE_AGENT_IDS
echo -n "3.1 FORM: Imports ALL_EXECUTIVE_AGENT_IDS: "
grep -q "import.*ALL_EXECUTIVE_AGENT_IDS" "$FORM" && echo "✅" || echo "❌"

# Check 2: Imports MAX_EXECUTIVE_AGENTS
echo -n "3.2 FORM: Imports MAX_EXECUTIVE_AGENTS: "
grep -q "import.*MAX_EXECUTIVE_AGENTS" "$FORM" && echo "✅" || echo "❌"

# Check 3: Maps over ALL_EXECUTIVE_AGENT_IDS
echo -n "3.3 FORM: Maps over ALL_EXECUTIVE_AGENT_IDS: "
grep -q "ALL_EXECUTIVE_AGENT_IDS.map" "$FORM" && echo "✅" || echo "❌"

# Check 4: Uses useBmadPersonas hook
echo -n "3.4 FORM: Uses useBmadPersonas hook: "
grep -q "useBmadPersonas" "$FORM" && echo "✅" || echo "❌"
```

**Expected Result:** All checks ✅

---

### Task 4: Trace API Call Chain

**Owner:** Agent 4

**Investigation Steps:**

1. **Profile Form** calls `useBmadPersonas()` hook
   - File: `apps/ui/src/hooks/use-bmad-personas.ts`
   - Line 25: `const result = await api.bmad.listPersonas();`

2. **Hook** calls Electron API
   - File: `apps/ui/src/lib/electron.ts`
   - Verify: `bmad.listPersonas()` method exists

3. **Electron IPC** bridges to server
   - Need to verify IPC handler registration

4. **Server** implements listPersonas
   - Should use bmad-persona-service.ts
   - Should return PUBLIC_PERSONA_IDS

**Deliverable:** Complete call chain diagram with verification at each step.

---

### Task 5: Check for Exclusion Logic

**Owner:** Agent 5

```bash
#!/bin/bash
echo "=== Task 5: Exclusion Logic Check ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# Search for any code that might filter out echon
echo "Searching for potential exclusion patterns:"

# Pattern 1: Hardcoded agent lists excluding echon
grep -r "bmad:apex.*bmad:zen" "$PROJECT/apps/ui/src" | grep -v "echon" | head -5

# Pattern 2: Filters that might exclude new agents
grep -r "filter.*agent" "$PROJECT/apps/ui/src/components/views/profiles-view" | head -5

# Pattern 3: Any conditional logic on agent IDs
grep -r "if.*bmad:" "$PROJECT/apps/ui/src/components/views/profiles-view" | head -5
```

**Expected Result:** No exclusion logic found

---

### Task 6: Runtime State Check

**Owner:** Agent 6

**Check List:**

- [ ] Is dev server running?
- [ ] When was server last restarted?
- [ ] Is there cached persona data?
- [ ] Was frontend rebuilt after config changes?
- [ ] Are there any console errors in browser?

**Commands:**

```bash
# Check if TypeScript compiled successfully
cd /home/aip0rt/Desktop/automaker
npx tsc --noEmit 2>&1 | grep -i error | head -10

# Check if server is running
ps aux | grep -i "node.*server" | grep -v grep

# Build frontend to ensure latest changes
cd apps/ui && npm run build 2>&1 | tail -20
```

---

### Task 7: Visual Verification (If Server Running)

**Owner:** Agent 5

**Manual Steps:**

If dev server is running (`npm run dev:web`):

1. Navigate to `http://localhost:3007`
2. Go to Profiles view
3. Click "New Profile" or edit existing profile
4. Scroll to "Default BMAD Agents" section
5. **Verify:** Echon 📡 appears in the list
6. **Verify:** Can select/deselect Echon
7. **Verify:** Counter shows (X/10 max)
8. **Verify:** Can save profile with Echon selected

**Screenshot Evidence Required**

---

## Remediation Scenarios

### Scenario A: Echon Not Appearing (Server Issue)

**Symptoms:**

- Frontend config has echon ✅
- Server service missing echon ❌
- API doesn't return echon

**Fix:**

- Verify server service PUBLIC_PERSONA_IDS
- Restart server to reload service
- Clear any server-side caching

### Scenario B: Echon Not Appearing (Frontend Issue)

**Symptoms:**

- Server returns echon ✅
- Frontend config missing echon ❌
- Profile form doesn't show echon

**Fix:**

- Update bmad-agents.ts (already done)
- Rebuild frontend
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

### Scenario C: Echon Not Appearing (Hook Issue)

**Symptoms:**

- Server returns echon ✅
- Frontend config has echon ✅
- useBmadPersonas hook not fetching ❌

**Fix:**

- Debug hook implementation
- Check Electron IPC bridge
- Verify API call succeeds
- Check for hook caching

### Scenario D: Echon Appearing But Broken

**Symptoms:**

- Echon shows in list ✅
- Can't select echon ❌
- Selection limit incorrect ❌

**Fix:**

- Verify MAX_EXECUTIVE_AGENTS = 10
- Check selection logic in profile-form.tsx
- Test checkbox state management

---

## Complete Investigation Script

```bash
#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ECHON PROFILE INTEGRATION - FULL INVESTIGATION             ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT="/home/aip0rt/Desktop/automaker"
PASS=0
FAIL=0
WARN=0

check() {
    case $1 in
        pass) ((PASS++)); echo "✅ $2" ;;
        fail) ((FAIL++)); echo "❌ $2" ;;
        warn) ((WARN++)); echo "⚠️ $2" ;;
    esac
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 1: Backend Verification
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ PHASE 1: Backend (Agent File + Manifests + Service) ━━━"

SERVICE="$PROJECT/apps/server/src/services/bmad-persona-service.ts"
AGENT_FILE="$PROJECT/_bmad/bmm-executive/agents/echon.md"
MANIFEST="$PROJECT/_bmad/_config/agent-manifest.csv"

[ -f "$AGENT_FILE" ] && check pass "echon.md exists" || check fail "echon.md missing"
grep -q '"echon"' "$MANIFEST" && check pass "agent-manifest has echon" || check fail "agent-manifest missing echon"
grep -q "'bmad:echon'" "$SERVICE" && check pass "server service has echon" || check fail "server service missing echon"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 2: Frontend Config Verification
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ PHASE 2: Frontend Config (bmad-agents.ts) ━━━"

CONFIG="$PROJECT/apps/ui/src/config/bmad-agents.ts"

grep -q "'bmad:echon'" "$CONFIG" && check pass "config has 'bmad:echon'" || check fail "config missing echon"

COUNT=$(grep -c "'bmad:" "$CONFIG")
[ "$COUNT" -eq 10 ] && check pass "config has 10 agents" || check fail "config has $COUNT agents (expected 10)"

grep -q "// 10$" "$CONFIG" && check pass "MAX_EXECUTIVE_AGENTS = 10" || check fail "MAX_EXECUTIVE_AGENTS ≠ 10"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 3: Profile Form Integration
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ PHASE 3: Profile Form (Component Integration) ━━━"

FORM="$PROJECT/apps/ui/src/components/views/profiles-view/components/profile-form.tsx"

grep -q "import.*ALL_EXECUTIVE_AGENT_IDS" "$FORM" && check pass "imports ALL_EXECUTIVE_AGENT_IDS" || check fail "missing import"
grep -q "import.*MAX_EXECUTIVE_AGENTS" "$FORM" && check pass "imports MAX_EXECUTIVE_AGENTS" || check fail "missing import"
grep -q "ALL_EXECUTIVE_AGENT_IDS.map" "$FORM" && check pass "maps over ALL_EXECUTIVE_AGENT_IDS" || check fail "doesn't map over config"
grep -q "useBmadPersonas" "$FORM" && check pass "uses useBmadPersonas hook" || check fail "doesn't use hook"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 4: Hook Implementation
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ PHASE 4: useBmadPersonas Hook ━━━"

HOOK="$PROJECT/apps/ui/src/hooks/use-bmad-personas.ts"

[ -f "$HOOK" ] && check pass "hook file exists" || check fail "hook missing"
grep -q "api.bmad.listPersonas" "$HOOK" && check pass "calls api.bmad.listPersonas()" || check warn "API call not found"

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PHASE 5: No Exclusion Logic
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "━━━ PHASE 5: Exclusion Logic Check ━━━"

# Search for hardcoded agent arrays that might exclude echon
EXCLUSIONS=$(grep -r "bmad:zen" "$PROJECT/apps/ui/src/components/views/profiles-view" | grep -v "bmad:echon" | grep -v "node_modules" | wc -l)

if [ "$EXCLUSIONS" -eq 0 ]; then
    check pass "no exclusion logic found"
else
    check warn "$EXCLUSIONS potential exclusion patterns"
fi

echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SUMMARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                 INVESTIGATION SUMMARY                        ║"
echo "╠══════════════════════════════════════════════════════════════╣"
printf "║  ✅ Passed:   %-3d                                           ║\n" $PASS
printf "║  ❌ Failed:   %-3d                                           ║\n" $FAIL
printf "║  ⚠️ Warnings: %-3d                                           ║\n" $WARN
echo "╚══════════════════════════════════════════════════════════════╝"

if [ "$FAIL" -eq 0 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  ✅ STATIC ANALYSIS: ALL CHECKS PASSED                      ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  Echon integration appears complete in code.                 ║"
    echo "║                                                              ║"
    echo "║  Next: Visual verification (start dev server)                ║"
    echo "║    1. npm run dev:web                                        ║"
    echo "║    2. Navigate to Profiles                                   ║"
    echo "║    3. Create/Edit profile                                    ║"
    echo "║    4. Verify Echon 📡 appears in agent list                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
else
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  ⚠️ ISSUES FOUND - REMEDIATION REQUIRED                     ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  Review failed checks above.                                 ║"
    echo "║  Subagents 8-10 should investigate and fix.                  ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
fi
```

---

## Expected Outcome

### If All Checks Pass (Most Likely)

```
✅ Echon integration is COMPLETE
✅ Profile form should show Echon automatically
✅ No code changes needed
⚠️ May need dev server restart
⚠️ May need browser cache clear
```

**Next Steps:**

1. Start dev server: `npm run dev:web`
2. Navigate to Profiles → New/Edit Profile
3. Scroll to "Default BMAD Agents"
4. **Verify:** Echon 📡 appears in list
5. **Test:** Select/deselect functionality
6. **Test:** Save profile with Echon

### If Checks Fail

**Remediation by Agents 8-10:**

- Identify specific failure point
- Apply targeted fix
- Re-run verification
- Document resolution

---

## Deliverables

### Agent 12 (Synthesis Coordinator) Final Report

```markdown
# ECHON PROFILE INTEGRATION - INVESTIGATION REPORT

## Investigation Results

Static Analysis: [X/Y checks passed]
Integration Points: [List verified points]
Data Flow: [Complete call chain]

## Findings

[Summary of what was discovered]

## Status

☐ Echon appears correctly in UI (verified visually)
☐ Echon selection works (tested)
☐ Profile save/load with Echon works (tested)
☐ All 10 agents visible (regression test passed)

## Recommendations

[Next steps or improvements]

## Evidence

- Screenshots: [Attach if visual verification done]
- Test Results: [Paste test output]
- Code References: [File:line numbers]
```

---

## Success Criteria

| Criterion                 | Expected                         |
| ------------------------- | -------------------------------- |
| Static analysis           | 15+ checks pass                  |
| Backend has echon         | ✅                               |
| Frontend config has echon | ✅                               |
| Profile form integration  | ✅                               |
| Visual verification       | Echon appears with 📡 icon       |
| Functional test           | Can select/save Echon in profile |
| Regression test           | All 9 original agents still work |

---

## Subagent Execution Strategy

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: DISCOVERY (Parallel - Agents 1-4)                 │
│   Agent 1: Data Flow Analysis                              │
│   Agent 2: Frontend UI Analysis                            │
│   Agent 3: Backend Service Analysis                        │
│   Agent 4: Hook & API Analysis                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: VERIFICATION (Parallel - Agents 5-7)              │
│   Agent 5: Static Analysis & Visual Check                  │
│   Agent 6: Runtime State Investigation                     │
│   Agent 7: Integration Test Design                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────┴───────────┐
         │                       │
    All Pass?                Some Fail?
         │                       │
         ▼                       ▼
┌────────────────────┐  ┌────────────────────────────┐
│ PHASE 3A: DOCUMENT │  │ PHASE 3B: REMEDIATE       │
│ Agents 11-12       │  │ Agents 8-10               │
└────────────────────┘  └─────────┬──────────────────┘
                                  │
                                  ▼
                        ┌──────────────────────────┐
                        │ Re-verify & Document     │
                        │ Agents 11-12             │
                        └──────────────────────────┘
```

---

## Timeline Estimate

| Phase                         | Duration      | Agents         |
| ----------------------------- | ------------- | -------------- |
| Phase 1: Discovery            | 5-10 min      | 1-4 (parallel) |
| Phase 2: Verification         | 5-10 min      | 5-7 (parallel) |
| Phase 3A: Document (if pass)  | 5 min         | 11-12          |
| Phase 3B: Remediate (if fail) | 10-15 min     | 8-10           |
| **Total**                     | **15-35 min** | **12 agents**  |

---

## Final Notes

**Most Likely Scenario:** All static checks will pass, Echon integration is already complete. The main task will be **visual verification** that Echon appears in the UI when the dev server runs.

**If Visual Verification Fails:** Debug hook, API, or Electron IPC bridge. Server restart usually resolves caching issues.

**If Everything Works:** Document the integration, create screenshots, mark as complete.

---

## Authorization

**PROCEED WITH 12-AGENT INVESTIGATION**

Execute phases sequentially:

1. Discovery (Agents 1-4)
2. Verification (Agents 5-7)
3. Remediation OR Documentation (Agents 8-12 based on findings)

**Report findings with evidence and recommendations.** 🚀
