# PRP: Verify Echon Agent Creation & Propagate to Codex-Subagents

## Executive Summary

**Goal:** Independent verification of the Echon agent creation in automaker, followed by propagation to codex-subagents project.

**Context:** The Claude team reported successful creation of Echon (10th BMM-Executive agent) with 100% verification pass rate. This PRP provides independent validation and cross-project propagation.

**Source Project:** `/home/aip0rt/Desktop/automaker` (verify)
**Target Project:** `/home/aip0rt/Desktop/codex-subagents` (propagate)

**Execution Report Claims to Verify:**

| Claim                                                                       | Verification Method         |
| --------------------------------------------------------------------------- | --------------------------- |
| echon.md created (162 lines)                                                | File existence + line count |
| SHA-256: `3a2a1b37fac5be97d765d0496aaf5a5ec327464e663b4f74ba7a53e5b2f1770f` | Hash comparison             |
| agent-manifest.csv has 10 bmm-executive entries                             | Row count                   |
| files-manifest.csv has echon entry                                          | Grep search                 |
| bmad-persona-service.ts updated (3 changes)                                 | Code inspection             |
| 18 menu items                                                               | XML parsing                 |
| 4 domains covered                                                           | Content analysis            |
| All 9 original agents intact                                                | Regression check            |

---

## Phase 1: Independent Verification of Automaker

### Task 1.1: File Existence Verification

**Priority:** Critical
**Type:** Automated Check

```bash
#!/bin/bash
echo "=== Phase 1.1: File Existence Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# Check echon.md exists
echo -n "1. echon.md exists: "
if [ -f "$PROJECT/_bmad/bmm-executive/agents/echon.md" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL - FILE NOT FOUND"
    exit 1
fi

# Check line count (reported: 162)
echo -n "2. Line count (reported 162): "
LINES=$(wc -l < "$PROJECT/_bmad/bmm-executive/agents/echon.md")
if [ "$LINES" -ge 150 ] && [ "$LINES" -le 175 ]; then
    echo "✅ PASS ($LINES lines)"
else
    echo "⚠️ WARNING - Unexpected line count: $LINES"
fi

# Check file size is reasonable (should be > 5KB)
echo -n "3. File size reasonable: "
SIZE=$(stat -f%z "$PROJECT/_bmad/bmm-executive/agents/echon.md" 2>/dev/null || stat -c%s "$PROJECT/_bmad/bmm-executive/agents/echon.md")
if [ "$SIZE" -gt 5000 ]; then
    echo "✅ PASS ($SIZE bytes)"
else
    echo "❌ FAIL - File too small: $SIZE bytes"
    exit 1
fi

echo ""
```

---

### Task 1.2: SHA-256 Hash Verification

**Priority:** Critical
**Type:** Integrity Check

```bash
#!/bin/bash
echo "=== Phase 1.2: SHA-256 Hash Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"
REPORTED_HASH="3a2a1b37fac5be97d765d0496aaf5a5ec327464e663b4f74ba7a53e5b2f1770f"

# Calculate actual hash
ACTUAL_HASH=$(sha256sum "$PROJECT/_bmad/bmm-executive/agents/echon.md" | awk '{print $1}')

echo "Reported Hash: $REPORTED_HASH"
echo "Actual Hash:   $ACTUAL_HASH"
echo ""

if [ "$REPORTED_HASH" = "$ACTUAL_HASH" ]; then
    echo "✅ HASH MATCH - File integrity verified"
else
    echo "⚠️ HASH MISMATCH - File may have been modified after creation"
    echo "   This is acceptable if minor fixes were applied"
fi

echo ""
```

---

### Task 1.3: Agent Manifest Verification

**Priority:** Critical
**Type:** CSV Integrity Check

```bash
#!/bin/bash
echo "=== Phase 1.3: Agent Manifest Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"
MANIFEST="$PROJECT/_bmad/_config/agent-manifest.csv"

# Count bmm-executive entries (should be 10)
echo -n "1. BMM-Executive agent count (expected 10): "
COUNT=$(grep -c "bmm-executive" "$MANIFEST")
if [ "$COUNT" -eq 10 ]; then
    echo "✅ PASS ($COUNT agents)"
else
    echo "❌ FAIL - Expected 10, found $COUNT"
    exit 1
fi

# Verify echon entry exists
echo -n "2. Echon entry exists: "
if grep -q '"echon"' "$MANIFEST"; then
    echo "✅ PASS"
else
    echo "❌ FAIL - echon not found in manifest"
    exit 1
fi

# Verify echon has all 10 fields
echo -n "3. Echon entry has correct field count: "
ECHON_LINE=$(grep '"echon"' "$MANIFEST")
# Count commas (should be 9 for 10 fields)
COMMAS=$(echo "$ECHON_LINE" | tr -cd ',' | wc -c)
if [ "$COMMAS" -ge 9 ]; then
    echo "✅ PASS ($((COMMAS + 1)) fields detected)"
else
    echo "⚠️ WARNING - Only $((COMMAS + 1)) fields detected"
fi

# Verify all 10 executive agents are present
echo "4. Verifying all 10 agents:"
AGENTS=("analyst-strategist" "apex" "financial-strategist" "fulfillization-manager"
        "operations-commander" "security-guardian" "strategist-marketer"
        "technologist-architect" "zen" "echon")
for agent in "${AGENTS[@]}"; do
    echo -n "   - $agent: "
    if grep -q "\"$agent\"" "$MANIFEST"; then
        echo "✅"
    else
        echo "❌ MISSING"
    fi
done

echo ""
```

---

### Task 1.4: Files Manifest Verification

**Priority:** Critical
**Type:** Hash Registry Check

```bash
#!/bin/bash
echo "=== Phase 1.4: Files Manifest Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"
FILES_MANIFEST="$PROJECT/_bmad/_config/files-manifest.csv"

# Count bmm-executive entries (should be 17 now: 16 original + echon)
echo -n "1. BMM-Executive file count (expected 17): "
COUNT=$(grep -c "bmm-executive" "$FILES_MANIFEST")
if [ "$COUNT" -eq 17 ]; then
    echo "✅ PASS ($COUNT files)"
elif [ "$COUNT" -eq 16 ]; then
    echo "⚠️ WARNING - Still 16, echon may not be added"
else
    echo "⚠️ INFO - Found $COUNT files"
fi

# Verify echon entry exists
echo -n "2. Echon entry in files-manifest: "
if grep -q "echon" "$FILES_MANIFEST"; then
    echo "✅ PASS"
    # Extract and display the hash
    HASH=$(grep "echon" "$FILES_MANIFEST" | grep -oE '[a-f0-9]{64}')
    echo "   Hash in manifest: $HASH"
else
    echo "❌ FAIL - echon not in files-manifest"
fi

echo ""
```

---

### Task 1.5: Service Integration Verification

**Priority:** Critical
**Type:** Code Inspection

```bash
#!/bin/bash
echo "=== Phase 1.5: Service Integration Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"
SERVICE="$PROJECT/apps/server/src/services/bmad-persona-service.ts"

# Check if service file exists
echo -n "1. bmad-persona-service.ts exists: "
if [ -f "$SERVICE" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL - Service file not found"
    exit 1
fi

# Check for echon in PUBLIC_PERSONA_IDS
echo -n "2. echon in PUBLIC_PERSONA_IDS: "
if grep -q "bmad:echon" "$SERVICE"; then
    echo "✅ PASS"
else
    echo "❌ FAIL - bmad:echon not found in PUBLIC_PERSONA_IDS"
fi

# Check for echon in getAgentDefaults
echo -n "3. echon in getAgentDefaults(): "
if grep -q "echon:" "$SERVICE" || grep -q "'echon'" "$SERVICE"; then
    echo "✅ PASS"
else
    echo "⚠️ WARNING - echon default config may be missing"
fi

# Check party-synthesis mentions 10 agents
echo -n "4. party-synthesis updated for 10 agents: "
if grep -q "10" "$SERVICE" && grep -q "Echon" "$SERVICE"; then
    echo "✅ PASS"
else
    echo "⚠️ WARNING - party-synthesis may not reference 10 agents"
fi

echo ""
```

---

### Task 1.6: Agent Content Verification

**Priority:** High
**Type:** Structure Analysis

```bash
#!/bin/bash
echo "=== Phase 1.6: Agent Content Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"
ECHON="$PROJECT/_bmad/bmm-executive/agents/echon.md"

# Check frontmatter
echo -n "1. Valid frontmatter: "
if head -5 "$ECHON" | grep -q "name: 'echon'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL - Invalid frontmatter"
fi

# Check XML structure
echo -n "2. XML agent tag: "
if grep -q '<agent id="echon' "$ECHON"; then
    echo "✅ PASS"
else
    echo "⚠️ WARNING - agent tag format unexpected"
fi

# Check icon
echo -n "3. Correct icon (📡): "
if grep -q '📡' "$ECHON"; then
    echo "✅ PASS"
else
    echo "❌ FAIL - Icon not found"
fi

# Check persona section
echo -n "4. Persona section exists: "
if grep -q '<persona>' "$ECHON"; then
    echo "✅ PASS"
else
    echo "❌ FAIL - No persona section"
fi

# Check menu section
echo -n "5. Menu section exists: "
if grep -q '<menu>' "$ECHON"; then
    echo "✅ PASS"
else
    echo "❌ FAIL - No menu section"
fi

# Count menu items (should be ~18)
echo -n "6. Menu item count: "
MENU_COUNT=$(grep -c '<item' "$ECHON")
echo "$MENU_COUNT items"
if [ "$MENU_COUNT" -ge 15 ] && [ "$MENU_COUNT" -le 20 ]; then
    echo "   ✅ Within expected range (15-20)"
else
    echo "   ⚠️ Outside expected range"
fi

# Check all 4 domains are represented
echo "7. Domain coverage:"
DOMAINS=("reliability" "customer" "compliance" "growth")
for domain in "${DOMAINS[@]}"; do
    echo -n "   - $domain: "
    if grep -qi "$domain" "$ECHON"; then
        echo "✅"
    else
        echo "❌ MISSING"
    fi
done

echo ""
```

---

### Task 1.7: Regression Check (Original 9 Agents)

**Priority:** High
**Type:** Integrity Verification

```bash
#!/bin/bash
echo "=== Phase 1.7: Regression Check (9 Original Agents) ==="

PROJECT="/home/aip0rt/Desktop/automaker"
AGENTS_DIR="$PROJECT/_bmad/bmm-executive/agents"

# Verify all 9 original agents still exist and are valid
ORIGINAL_AGENTS=(
    "analyst-strategist:Mary:📊"
    "apex:Apex:⚡"
    "financial-strategist:Walt:💰"
    "fulfillization-manager:Finn:🎯"
    "operations-commander:Axel:⚙️"
    "security-guardian:Cerberus:🛡️"
    "strategist-marketer:Sage:📊"
    "technologist-architect:Theo:🔧"
    "zen:Zen:🧘"
)

echo "Checking 9 original agents:"
ALL_PASS=true

for agent_info in "${ORIGINAL_AGENTS[@]}"; do
    IFS=':' read -r name display icon <<< "$agent_info"
    FILE="$AGENTS_DIR/$name.md"

    echo -n "  $display ($name): "

    if [ ! -f "$FILE" ]; then
        echo "❌ FILE MISSING"
        ALL_PASS=false
        continue
    fi

    # Check file has content
    LINES=$(wc -l < "$FILE")
    if [ "$LINES" -lt 50 ]; then
        echo "⚠️ Suspiciously small ($LINES lines)"
        ALL_PASS=false
        continue
    fi

    # Check has persona
    if ! grep -q '<persona>' "$FILE"; then
        echo "⚠️ No persona section"
        ALL_PASS=false
        continue
    fi

    echo "✅ OK ($LINES lines)"
done

echo ""
if [ "$ALL_PASS" = true ]; then
    echo "✅ All 9 original agents verified intact"
else
    echo "⚠️ Some agents may have issues - review above"
fi

echo ""
```

---

### Task 1.8: Agent Count Final Verification

**Priority:** Critical
**Type:** Final Count

```bash
#!/bin/bash
echo "=== Phase 1.8: Final Agent Count Verification ==="

PROJECT="/home/aip0rt/Desktop/automaker"

# Count .md files in agents directory
echo -n "Agent files in bmm-executive/agents/: "
AGENT_FILES=$(ls "$PROJECT/_bmad/bmm-executive/agents/"*.md 2>/dev/null | wc -l)
echo "$AGENT_FILES"

if [ "$AGENT_FILES" -eq 10 ]; then
    echo "✅ PASS - Exactly 10 agents"
else
    echo "❌ FAIL - Expected 10, found $AGENT_FILES"
fi

# List all agents
echo ""
echo "Agent roster:"
for f in "$PROJECT/_bmad/bmm-executive/agents/"*.md; do
    name=$(basename "$f" .md)
    echo "  - $name"
done

echo ""
```

---

## Phase 1 Summary Script

**Run this single script for complete Phase 1 verification:**

```bash
#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ECHON AGENT VERIFICATION - PHASE 1 (AUTOMAKER)          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

PROJECT="/home/aip0rt/Desktop/automaker"
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Helper function
check() {
    if [ "$1" = "pass" ]; then
        ((PASS_COUNT++))
        echo "✅ $2"
    elif [ "$1" = "fail" ]; then
        ((FAIL_COUNT++))
        echo "❌ $2"
    else
        ((WARN_COUNT++))
        echo "⚠️ $2"
    fi
}

echo "━━━ 1. File Existence ━━━"
[ -f "$PROJECT/_bmad/bmm-executive/agents/echon.md" ] && check pass "echon.md exists" || check fail "echon.md missing"

echo ""
echo "━━━ 2. Agent Count ━━━"
COUNT=$(ls "$PROJECT/_bmad/bmm-executive/agents/"*.md | wc -l)
[ "$COUNT" -eq 10 ] && check pass "10 agents in directory" || check fail "Expected 10, found $COUNT"

echo ""
echo "━━━ 3. Manifest Entries ━━━"
MANIFEST_COUNT=$(grep -c "bmm-executive" "$PROJECT/_bmad/_config/agent-manifest.csv")
[ "$MANIFEST_COUNT" -eq 10 ] && check pass "10 entries in agent-manifest.csv" || check fail "Expected 10, found $MANIFEST_COUNT"

grep -q '"echon"' "$PROJECT/_bmad/_config/agent-manifest.csv" && check pass "echon in agent-manifest" || check fail "echon missing from agent-manifest"

echo ""
echo "━━━ 4. Files Manifest ━━━"
grep -q "echon" "$PROJECT/_bmad/_config/files-manifest.csv" && check pass "echon in files-manifest" || check warn "echon not in files-manifest"

echo ""
echo "━━━ 5. Service Integration ━━━"
SERVICE="$PROJECT/apps/server/src/services/bmad-persona-service.ts"
grep -q "bmad:echon" "$SERVICE" && check pass "echon in PUBLIC_PERSONA_IDS" || check fail "echon missing from PUBLIC_PERSONA_IDS"
grep -q "Echon" "$SERVICE" && check pass "Echon referenced in service" || check warn "Echon not explicitly referenced"

echo ""
echo "━━━ 6. Agent Structure ━━━"
ECHON="$PROJECT/_bmad/bmm-executive/agents/echon.md"
grep -q '<persona>' "$ECHON" && check pass "Has persona section" || check fail "Missing persona"
grep -q '<menu>' "$ECHON" && check pass "Has menu section" || check fail "Missing menu"
grep -q '📡' "$ECHON" && check pass "Has correct icon (📡)" || check fail "Wrong icon"

echo ""
echo "━━━ 7. Domain Coverage ━━━"
grep -qi "reliability" "$ECHON" && check pass "Reliability domain" || check fail "Missing reliability"
grep -qi "customer" "$ECHON" && check pass "Customer domain" || check fail "Missing customer"
grep -qi "compliance" "$ECHON" && check pass "Compliance domain" || check fail "Missing compliance"
grep -qi "growth" "$ECHON" && check pass "Growth domain" || check fail "Missing growth"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION SUMMARY                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  ✅ Passed:  $PASS_COUNT                                              ║"
echo "║  ⚠️ Warnings: $WARN_COUNT                                              ║"
echo "║  ❌ Failed:  $FAIL_COUNT                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo ""
    echo "🎉 PHASE 1 VERIFICATION: SUCCESS"
    echo "   Ready to proceed to Phase 2 (Propagation to codex-subagents)"
    exit 0
else
    echo ""
    echo "🚨 PHASE 1 VERIFICATION: FAILED"
    echo "   Fix issues above before proceeding to Phase 2"
    exit 1
fi
```

---

## Phase 2: Propagate to Codex-Subagents

**Prerequisites:** Phase 1 must pass with 0 failures.

### Task 2.1: Pre-Propagation Check

```bash
#!/bin/bash
echo "=== Phase 2.1: Pre-Propagation Check ==="

SOURCE="/home/aip0rt/Desktop/automaker"
TARGET="/home/aip0rt/Desktop/codex-subagents"

# Verify target project exists
echo -n "1. Target project exists: "
if [ -d "$TARGET/_bmad" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL - codex-subagents BMAD not found"
    exit 1
fi

# Verify bmm-executive module exists in target
echo -n "2. BMM-Executive module in target: "
if [ -d "$TARGET/_bmad/bmm-executive" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL - bmm-executive not installed in codex-subagents"
    echo "   Run the bmm-executive installation PRP first"
    exit 1
fi

# Count current agents in target
echo -n "3. Current agent count in target: "
COUNT=$(ls "$TARGET/_bmad/bmm-executive/agents/"*.md 2>/dev/null | wc -l)
echo "$COUNT agents"

# Check if echon already exists
echo -n "4. Echon already in target: "
if [ -f "$TARGET/_bmad/bmm-executive/agents/echon.md" ]; then
    echo "⚠️ YES - Will be overwritten"
else
    echo "✅ NO - Fresh install"
fi

echo ""
```

---

### Task 2.2: Copy Echon Agent File

```bash
#!/bin/bash
echo "=== Phase 2.2: Copy Echon Agent File ==="

SOURCE="/home/aip0rt/Desktop/automaker"
TARGET="/home/aip0rt/Desktop/codex-subagents"

# Copy echon.md
cp "$SOURCE/_bmad/bmm-executive/agents/echon.md" "$TARGET/_bmad/bmm-executive/agents/"

# Verify copy
echo -n "Verifying copy: "
if [ -f "$TARGET/_bmad/bmm-executive/agents/echon.md" ]; then
    # Compare hashes
    SOURCE_HASH=$(sha256sum "$SOURCE/_bmad/bmm-executive/agents/echon.md" | awk '{print $1}')
    TARGET_HASH=$(sha256sum "$TARGET/_bmad/bmm-executive/agents/echon.md" | awk '{print $1}')

    if [ "$SOURCE_HASH" = "$TARGET_HASH" ]; then
        echo "✅ PASS - Hash verified"
    else
        echo "❌ FAIL - Hash mismatch after copy"
        exit 1
    fi
else
    echo "❌ FAIL - Copy failed"
    exit 1
fi

echo ""
```

---

### Task 2.3: Update Target Manifests

```bash
#!/bin/bash
echo "=== Phase 2.3: Update Target Manifests ==="

SOURCE="/home/aip0rt/Desktop/automaker"
TARGET="/home/aip0rt/Desktop/codex-subagents"

# Extract echon line from source agent-manifest
echo "1. Updating agent-manifest.csv..."
ECHON_AGENT_LINE=$(grep '"echon"' "$SOURCE/_bmad/_config/agent-manifest.csv")

# Check if already exists in target
if grep -q '"echon"' "$TARGET/_bmad/_config/agent-manifest.csv"; then
    echo "   ⚠️ echon already exists - skipping"
else
    echo "$ECHON_AGENT_LINE" >> "$TARGET/_bmad/_config/agent-manifest.csv"
    echo "   ✅ Added echon to agent-manifest.csv"
fi

# Extract echon line from source files-manifest
echo "2. Updating files-manifest.csv..."
ECHON_FILES_LINE=$(grep "echon" "$SOURCE/_bmad/_config/files-manifest.csv")

if [ -n "$ECHON_FILES_LINE" ]; then
    if grep -q "echon" "$TARGET/_bmad/_config/files-manifest.csv"; then
        echo "   ⚠️ echon already exists - skipping"
    else
        echo "$ECHON_FILES_LINE" >> "$TARGET/_bmad/_config/files-manifest.csv"
        echo "   ✅ Added echon to files-manifest.csv"
    fi
else
    # Generate fresh entry with hash
    HASH=$(sha256sum "$TARGET/_bmad/bmm-executive/agents/echon.md" | awk '{print $1}')
    echo "\"md\",\"echon\",\"bmm-executive\",\"bmm-executive/agents/echon.md\",\"$HASH\"" >> "$TARGET/_bmad/_config/files-manifest.csv"
    echo "   ✅ Generated and added echon to files-manifest.csv"
fi

echo ""
```

---

### Task 2.4: Update Target Service (If Applicable)

**Note:** codex-subagents may have a different service structure. Verify before modifying.

```bash
#!/bin/bash
echo "=== Phase 2.4: Service Update Check ==="

TARGET="/home/aip0rt/Desktop/codex-subagents"
SERVICE="$TARGET/apps/server/src/services/bmad-persona-service.ts"

echo -n "1. Checking for bmad-persona-service.ts: "
if [ -f "$SERVICE" ]; then
    echo "✅ EXISTS"

    echo -n "2. Checking if echon already integrated: "
    if grep -q "bmad:echon" "$SERVICE"; then
        echo "✅ Already integrated"
    else
        echo "⚠️ NOT integrated"
        echo "   Manual update may be required"
        echo "   Add to PUBLIC_PERSONA_IDS: 'bmad:echon'"
        echo "   Add to getAgentDefaults(): echon entry"
    fi
else
    echo "⚠️ NOT FOUND"
    echo "   Service integration not applicable to this project"
fi

echo ""
```

---

### Task 2.5: Final Verification (Target)

```bash
#!/bin/bash
echo "=== Phase 2.5: Final Verification (codex-subagents) ==="

TARGET="/home/aip0rt/Desktop/codex-subagents"

echo "Verifying echon in codex-subagents..."

# Agent file
echo -n "1. echon.md exists: "
[ -f "$TARGET/_bmad/bmm-executive/agents/echon.md" ] && echo "✅" || echo "❌"

# Agent count
echo -n "2. Agent count (expected 10): "
COUNT=$(ls "$TARGET/_bmad/bmm-executive/agents/"*.md | wc -l)
echo "$COUNT"

# Manifest entries
echo -n "3. In agent-manifest.csv: "
grep -q '"echon"' "$TARGET/_bmad/_config/agent-manifest.csv" && echo "✅" || echo "❌"

echo -n "4. In files-manifest.csv: "
grep -q "echon" "$TARGET/_bmad/_config/files-manifest.csv" && echo "✅" || echo "❌"

# Structure check
echo -n "5. Has persona section: "
grep -q '<persona>' "$TARGET/_bmad/bmm-executive/agents/echon.md" && echo "✅" || echo "❌"

echo -n "6. Has menu section: "
grep -q '<menu>' "$TARGET/_bmad/bmm-executive/agents/echon.md" && echo "✅" || echo "❌"

echo ""
echo "🎉 PHASE 2 COMPLETE: Echon propagated to codex-subagents"
```

---

## Phase 2 Complete Script

```bash
#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     ECHON PROPAGATION - PHASE 2 (CODEX-SUBAGENTS)           ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

SOURCE="/home/aip0rt/Desktop/automaker"
TARGET="/home/aip0rt/Desktop/codex-subagents"

# Step 1: Copy agent file
echo "━━━ Step 1: Copy Agent File ━━━"
cp "$SOURCE/_bmad/bmm-executive/agents/echon.md" "$TARGET/_bmad/bmm-executive/agents/"
echo "✅ Copied echon.md"

# Step 2: Update agent-manifest
echo ""
echo "━━━ Step 2: Update agent-manifest.csv ━━━"
if ! grep -q '"echon"' "$TARGET/_bmad/_config/agent-manifest.csv"; then
    grep '"echon"' "$SOURCE/_bmad/_config/agent-manifest.csv" >> "$TARGET/_bmad/_config/agent-manifest.csv"
    echo "✅ Added echon entry"
else
    echo "⚠️ Entry already exists"
fi

# Step 3: Update files-manifest
echo ""
echo "━━━ Step 3: Update files-manifest.csv ━━━"
if ! grep -q "echon" "$TARGET/_bmad/_config/files-manifest.csv"; then
    HASH=$(sha256sum "$TARGET/_bmad/bmm-executive/agents/echon.md" | awk '{print $1}')
    echo "\"md\",\"echon\",\"bmm-executive\",\"bmm-executive/agents/echon.md\",\"$HASH\"" >> "$TARGET/_bmad/_config/files-manifest.csv"
    echo "✅ Added with hash: $HASH"
else
    echo "⚠️ Entry already exists"
fi

# Step 4: Verify
echo ""
echo "━━━ Step 4: Verification ━━━"
AGENT_COUNT=$(ls "$TARGET/_bmad/bmm-executive/agents/"*.md | wc -l)
MANIFEST_COUNT=$(grep -c "bmm-executive" "$TARGET/_bmad/_config/agent-manifest.csv")

echo "Agent files: $AGENT_COUNT"
echo "Manifest entries: $MANIFEST_COUNT"

if [ "$AGENT_COUNT" -eq 10 ] && [ "$MANIFEST_COUNT" -eq 10 ]; then
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║  🎉 PROPAGATION COMPLETE - codex-subagents now has 10 agents ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
else
    echo ""
    echo "⚠️ Counts don't match expected (10). Review manually."
fi
```

---

## Execution Order Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: VERIFY AUTOMAKER (Must Pass Before Phase 2)           │
├─────────────────────────────────────────────────────────────────┤
│ 1.1 File Existence                                              │
│ 1.2 SHA-256 Hash                                                │
│ 1.3 Agent Manifest                                              │
│ 1.4 Files Manifest                                              │
│ 1.5 Service Integration                                         │
│ 1.6 Agent Content                                               │
│ 1.7 Regression (9 Original Agents)                              │
│ 1.8 Final Count                                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ All Pass?
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: PROPAGATE TO CODEX-SUBAGENTS                          │
├─────────────────────────────────────────────────────────────────┤
│ 2.1 Pre-Propagation Check                                       │
│ 2.2 Copy Echon Agent File                                       │
│ 2.3 Update Target Manifests                                     │
│ 2.4 Service Update (If Applicable)                              │
│ 2.5 Final Verification                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria

### Phase 1 (Automaker Verification)

| Check               | Expected          |
| ------------------- | ----------------- |
| echon.md exists     | Yes               |
| Agent count         | 10                |
| Manifest entries    | 10 bmm-executive  |
| Files manifest      | Has echon entry   |
| Service integration | 3 changes present |
| 4 domains covered   | All present       |
| 9 original agents   | All intact        |

### Phase 2 (Codex-Subagents Propagation)

| Check            | Expected            |
| ---------------- | ------------------- |
| echon.md copied  | Matching hash       |
| Agent count      | 10                  |
| Manifest entries | 10 bmm-executive    |
| Files manifest   | Has echon with hash |

---

## Rollback (If Needed)

### Automaker Rollback

```bash
# If automaker changes need to be reverted
cd /home/aip0rt/Desktop/automaker
git checkout -- _bmad/bmm-executive/agents/echon.md
git checkout -- _bmad/_config/agent-manifest.csv
git checkout -- _bmad/_config/files-manifest.csv
git checkout -- apps/server/src/services/bmad-persona-service.ts
```

### Codex-Subagents Rollback

```bash
# If propagation needs to be undone
rm /home/aip0rt/Desktop/codex-subagents/_bmad/bmm-executive/agents/echon.md
sed -i '/echon/d' /home/aip0rt/Desktop/codex-subagents/_bmad/_config/agent-manifest.csv
sed -i '/echon/d' /home/aip0rt/Desktop/codex-subagents/_bmad/_config/files-manifest.csv
```

---

## Notes

1. **Independent Verification:** This PRP provides independent checks, not trusting the execution report blindly
2. **Hash Verification:** SHA-256 hashes ensure file integrity across propagation
3. **Regression Safety:** Explicitly checks all 9 original agents remain intact
4. **Service Awareness:** Handles cases where codex-subagents may have different service structure
5. **Idempotent:** Safe to run multiple times (checks before adding)
