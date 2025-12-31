# PRP: Claude Dev Team - Upgrade BMAD Agent Profiles to Opus

## Executive Summary

**Mission:** Upgrade all BMAD Executive Suite agent profiles from Sonnet to Opus model.

**Assigned Team:** Claude Dev Team (12 Opus Subagents)
**Target Project:** `/home/aip0rt/Desktop/automaker`
**Target File:** `apps/ui/src/store/app-store.ts`

**Scope:** Change `model: 'sonnet'` → `model: 'opus'` for 8 BMAD agent profiles.

---

## Current State Analysis

### Profiles Already Using Opus (No Change Needed)

| Profile                             | Model | Thinking   | Status  |
| ----------------------------------- | ----- | ---------- | ------- |
| Heavy Task                          | opus  | ultrathink | ✅ Keep |
| BMAD: Party Synthesis               | opus  | ultrathink | ✅ Keep |
| BMAD: Sage (Strategist-Marketer)    | opus  | high       | ✅ Keep |
| BMAD: Theo (Technologist-Architect) | opus  | high       | ✅ Keep |

### Profiles Requiring Upgrade (8 Total)

| Profile                                  | Current Model | Current Thinking | Target Model | Line |
| ---------------------------------------- | ------------- | ---------------- | ------------ | ---- |
| BMAD: Finn (Fulfillization-Manager)      | sonnet        | medium           | **opus**     | 999  |
| BMAD: Cerberus (Security-Guardian)       | sonnet        | high             | **opus**     | 1010 |
| BMAD: Mary (Analyst-Strategist)          | sonnet        | high             | **opus**     | 1021 |
| BMAD: Walt (Financial-Strategist)        | sonnet        | medium           | **opus**     | 1032 |
| BMAD: Axel (Operations-Commander)        | sonnet        | medium           | **opus**     | 1043 |
| BMAD: Apex (Peak Performance Developer)  | sonnet        | medium           | **opus**     | 1055 |
| BMAD: Zen (Clean Architecture Developer) | sonnet        | high             | **opus**     | 1067 |
| BMAD: Echon (Post-Launch Lifecycle)      | sonnet        | high             | **opus**     | 1079 |

### Non-BMAD Profiles (No Change)

| Profile    | Model  | Thinking | Status                         |
| ---------- | ------ | -------- | ------------------------------ |
| Balanced   | sonnet | medium   | ✅ Keep (intentionally sonnet) |
| Quick Edit | haiku  | -        | ✅ Keep (intentionally haiku)  |

---

## 12-Agent Deployment Structure

| Phase | Agents | Focus Area                      | Duration |
| ----- | ------ | ------------------------------- | -------- |
| 1     | 1-2    | Pre-flight Verification         | 2-3 min  |
| 2     | 3-6    | Execute Model Upgrades          | 5-7 min  |
| 3     | 7-9    | Post-Change Verification        | 3-5 min  |
| 4     | 10-11  | TypeScript & Consistency Checks | 3-5 min  |
| 5     | 12     | Synthesis & Final Report        | 2-3 min  |

**Total Estimated Time:** 15-23 minutes

---

## Phase 1: Pre-flight Verification (Agents 1-2)

### Task 1.1: Verify Current State

**Agent:** 1

```bash
#!/bin/bash
echo "=== Task 1.1: Pre-flight State Verification ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"
PASS=0
FAIL=0

# Check file exists
echo -n "1.1.1 File exists: "
if [ -f "$FILE" ]; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL - ABORT"
    exit 1
fi

# Count current sonnet profiles (should be 8 BMAD + 1 Balanced = 9)
echo -n "1.1.2 Count sonnet profiles: "
SONNET_COUNT=$(grep -c "model: 'sonnet'" "$FILE")
echo "$SONNET_COUNT found"
if [ "$SONNET_COUNT" -ge 8 ]; then
    echo "  ✅ PASS - At least 8 to upgrade"
    ((PASS++))
else
    echo "  ⚠️ WARN - Expected at least 8"
fi

# Count current opus profiles (should be 4: Heavy Task, Party Synthesis, Sage, Theo)
echo -n "1.1.3 Count opus profiles: "
OPUS_COUNT=$(grep -c "model: 'opus'" "$FILE")
echo "$OPUS_COUNT found"
if [ "$OPUS_COUNT" -eq 4 ]; then
    echo "  ✅ PASS - 4 opus profiles"
    ((PASS++))
else
    echo "  ⚠️ INFO - Expected 4, found $OPUS_COUNT"
fi

# Verify specific profiles exist
echo ""
echo "1.1.4 Verify target profiles exist:"
PROFILES=(
    "profile-bmad-finn"
    "profile-bmad-cerberus"
    "profile-bmad-mary"
    "profile-bmad-walt"
    "profile-bmad-axel"
    "profile-bmad-apex"
    "profile-bmad-zen"
    "profile-bmad-echon"
)

for PROFILE in "${PROFILES[@]}"; do
    echo -n "  $PROFILE: "
    if grep -q "id: '$PROFILE'" "$FILE"; then
        echo "✅"
        ((PASS++))
    else
        echo "❌ NOT FOUND"
        ((FAIL++))
    fi
done

echo ""
echo "Task 1.1 Results: $PASS passed, $FAIL failed"
```

**Expected Results:** 11/11 PASS

---

### Task 1.2: Backup Current State

**Agent:** 2

```bash
#!/bin/bash
echo "=== Task 1.2: Create Backup ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"
BACKUP="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts.backup-$(date +%Y%m%d-%H%M%S)"

echo -n "Creating backup at $BACKUP: "
cp "$FILE" "$BACKUP"
if [ -f "$BACKUP" ]; then
    echo "✅ PASS"
    echo "Backup size: $(wc -c < "$BACKUP") bytes"
else
    echo "❌ FAIL"
fi

# Extract current profile definitions for audit trail
echo ""
echo "Current BMAD profile model settings:"
grep -B2 "model: 'sonnet'" "$FILE" | grep -E "(id:|model:)" | head -20
```

---

## Phase 2: Execute Model Upgrades (Agents 3-6)

### Task 2.1: Upgrade Finn & Cerberus

**Agent:** 3

**File:** `apps/ui/src/store/app-store.ts`

**Changes:**

```typescript
// Line 999: Finn - Change sonnet → opus
// BEFORE:
    model: 'sonnet',
// AFTER:
    model: 'opus',

// Line 1010: Cerberus - Change sonnet → opus
// BEFORE:
    model: 'sonnet',
// AFTER:
    model: 'opus',
```

**Execution Script:**

```bash
#!/bin/bash
echo "=== Task 2.1: Upgrade Finn & Cerberus ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"

# Upgrade Finn (line ~999)
echo -n "Upgrading Finn: "
sed -i "/id: 'profile-bmad-finn'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-finn" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Upgrade Cerberus (line ~1010)
echo -n "Upgrading Cerberus: "
sed -i "/id: 'profile-bmad-cerberus'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-cerberus" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi
```

---

### Task 2.2: Upgrade Mary & Walt

**Agent:** 4

**Changes:**

```typescript
// Line 1021: Mary - Change sonnet → opus
// Line 1032: Walt - Change sonnet → opus
```

**Execution Script:**

```bash
#!/bin/bash
echo "=== Task 2.2: Upgrade Mary & Walt ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"

# Upgrade Mary (line ~1021)
echo -n "Upgrading Mary: "
sed -i "/id: 'profile-bmad-mary'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-mary" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Upgrade Walt (line ~1032)
echo -n "Upgrading Walt: "
sed -i "/id: 'profile-bmad-walt'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-walt" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi
```

---

### Task 2.3: Upgrade Axel & Apex

**Agent:** 5

**Changes:**

```typescript
// Line 1043: Axel - Change sonnet → opus
// Line 1055: Apex - Change sonnet → opus
```

**Execution Script:**

```bash
#!/bin/bash
echo "=== Task 2.3: Upgrade Axel & Apex ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"

# Upgrade Axel (line ~1043)
echo -n "Upgrading Axel: "
sed -i "/id: 'profile-bmad-axel'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-axel" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Upgrade Apex (line ~1055)
echo -n "Upgrading Apex: "
sed -i "/id: 'profile-bmad-apex'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-apex" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi
```

---

### Task 2.4: Upgrade Zen & Echon

**Agent:** 6

**Changes:**

```typescript
// Line 1067: Zen - Change sonnet → opus
// Line 1079: Echon - Change sonnet → opus
```

**Execution Script:**

```bash
#!/bin/bash
echo "=== Task 2.4: Upgrade Zen & Echon ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"

# Upgrade Zen (line ~1067)
echo -n "Upgrading Zen: "
sed -i "/id: 'profile-bmad-zen'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-zen" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Upgrade Echon (line ~1079)
echo -n "Upgrading Echon: "
sed -i "/id: 'profile-bmad-echon'/,/personaId:/ s/model: 'sonnet'/model: 'opus'/" "$FILE"
if grep -A5 "profile-bmad-echon" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi
```

---

## Phase 3: Post-Change Verification (Agents 7-9)

### Task 3.1: Verify All 8 Profiles Now Use Opus

**Agent:** 7

```bash
#!/bin/bash
echo "=== Task 3.1: Verify All 8 Upgrades ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"
PASS=0
FAIL=0

PROFILES=(
    "profile-bmad-finn"
    "profile-bmad-cerberus"
    "profile-bmad-mary"
    "profile-bmad-walt"
    "profile-bmad-axel"
    "profile-bmad-apex"
    "profile-bmad-zen"
    "profile-bmad-echon"
)

echo "Verifying each profile uses opus:"
for PROFILE in "${PROFILES[@]}"; do
    echo -n "  $PROFILE: "
    if grep -A10 "id: '$PROFILE'" "$FILE" | grep -q "model: 'opus'"; then
        echo "✅ opus"
        ((PASS++))
    else
        # Check what model it has
        MODEL=$(grep -A10 "id: '$PROFILE'" "$FILE" | grep "model:" | head -1)
        echo "❌ FAIL - $MODEL"
        ((FAIL++))
    fi
done

echo ""
echo "Task 3.1 Results: $PASS/8 upgraded to opus, $FAIL failed"
```

**Expected Results:** 8/8 PASS

---

### Task 3.2: Verify Non-Target Profiles Unchanged

**Agent:** 8

```bash
#!/bin/bash
echo "=== Task 3.2: Verify Non-Target Profiles Unchanged ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"
PASS=0
FAIL=0

# Balanced should still be sonnet
echo -n "Balanced still sonnet: "
if grep -A10 "id: 'profile-balanced'" "$FILE" | grep -q "model: 'sonnet'"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL - Was accidentally changed!"
    ((FAIL++))
fi

# Quick Edit should still be haiku
echo -n "Quick Edit still haiku: "
if grep -A10 "id: 'profile-quick-edit'" "$FILE" | grep -q "model: 'haiku'"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL - Was accidentally changed!"
    ((FAIL++))
fi

# Heavy Task should still be opus
echo -n "Heavy Task still opus: "
if grep -A10 "id: 'profile-heavy-task'" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# Party Synthesis should still be opus
echo -n "Party Synthesis still opus: "
if grep -A10 "id: 'profile-bmad-party-synthesis'" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# Sage should still be opus
echo -n "Sage still opus: "
if grep -A10 "id: 'profile-bmad-sage'" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

# Theo should still be opus
echo -n "Theo still opus: "
if grep -A10 "id: 'profile-bmad-theo'" "$FILE" | grep -q "model: 'opus'"; then
    echo "✅ PASS"
    ((PASS++))
else
    echo "❌ FAIL"
    ((FAIL++))
fi

echo ""
echo "Task 3.2 Results: $PASS/6 unchanged correctly, $FAIL accidentally modified"
```

**Expected Results:** 6/6 PASS

---

### Task 3.3: Count Final Model Distribution

**Agent:** 9

```bash
#!/bin/bash
echo "=== Task 3.3: Final Model Distribution ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"

echo "Model distribution in DEFAULT_AI_PROFILES:"
echo ""

OPUS=$(grep -c "model: 'opus'" "$FILE")
SONNET=$(grep -c "model: 'sonnet'" "$FILE")
HAIKU=$(grep -c "model: 'haiku'" "$FILE")

echo "  opus:   $OPUS profiles"
echo "  sonnet: $SONNET profiles"
echo "  haiku:  $HAIKU profiles"
echo "  ─────────────────"
echo "  total:  $((OPUS + SONNET + HAIKU)) profiles"

echo ""
echo "Expected distribution:"
echo "  opus:   12 (Heavy Task, Party Synthesis, Sage, Theo, Finn, Cerberus, Mary, Walt, Axel, Apex, Zen, Echon)"
echo "  sonnet: 1  (Balanced)"
echo "  haiku:  1  (Quick Edit)"
echo "  total:  14"

echo ""
if [ "$OPUS" -eq 12 ] && [ "$SONNET" -eq 1 ] && [ "$HAIKU" -eq 1 ]; then
    echo "✅ PASS - Distribution correct"
else
    echo "❌ FAIL - Distribution mismatch"
    echo "  Expected: opus=12, sonnet=1, haiku=1"
    echo "  Got:      opus=$OPUS, sonnet=$SONNET, haiku=$HAIKU"
fi
```

**Expected Results:** opus=12, sonnet=1, haiku=1

---

## Phase 4: TypeScript & Consistency Checks (Agents 10-11)

### Task 4.1: TypeScript Compilation Check

**Agent:** 10

```bash
#!/bin/bash
echo "=== Task 4.1: TypeScript Compilation Check ==="

cd /home/aip0rt/Desktop/automaker/apps/ui

echo "Running TypeScript compiler..."
npx tsc --noEmit 2>&1 | head -50

# Check for errors specifically in app-store.ts
echo ""
echo "Checking app-store.ts specifically:"
ERRORS=$(npx tsc --noEmit 2>&1 | grep -c "app-store.ts")
if [ "$ERRORS" -eq 0 ]; then
    echo "✅ PASS - No TypeScript errors in app-store.ts"
else
    echo "⚠️ WARN - $ERRORS references to app-store.ts in errors"
fi
```

---

### Task 4.2: Validate Profile Structure Integrity

**Agent:** 11

```bash
#!/bin/bash
echo "=== Task 4.2: Profile Structure Integrity ==="

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"
PASS=0
FAIL=0

# Verify all upgraded profiles still have required fields
PROFILES=(
    "profile-bmad-finn"
    "profile-bmad-cerberus"
    "profile-bmad-mary"
    "profile-bmad-walt"
    "profile-bmad-axel"
    "profile-bmad-apex"
    "profile-bmad-zen"
    "profile-bmad-echon"
)

REQUIRED_FIELDS=(
    "id:"
    "name:"
    "description:"
    "model:"
    "thinkingLevel:"
    "provider:"
    "isBuiltIn:"
    "icon:"
    "personaId:"
)

echo "Checking structure integrity for upgraded profiles:"
echo ""

for PROFILE in "${PROFILES[@]}"; do
    echo "  $PROFILE:"
    PROFILE_BLOCK=$(grep -A15 "id: '$PROFILE'" "$FILE")
    PROFILE_PASS=true

    for FIELD in "${REQUIRED_FIELDS[@]}"; do
        if ! echo "$PROFILE_BLOCK" | grep -q "$FIELD"; then
            echo "    ❌ Missing: $FIELD"
            PROFILE_PASS=false
            ((FAIL++))
        fi
    done

    if $PROFILE_PASS; then
        echo "    ✅ All fields present"
        ((PASS++))
    fi
done

echo ""
echo "Task 4.2 Results: $PASS/8 profiles have complete structure"
```

**Expected Results:** 8/8 PASS

---

## Phase 5: Synthesis & Final Report (Agent 12)

### Task 5.1: Generate Final Report

**Agent:** 12

```bash
#!/bin/bash
echo "=========================================="
echo "  BMAD PROFILES OPUS UPGRADE - FINAL REPORT"
echo "=========================================="
echo ""
echo "Execution Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Target Project: /home/aip0rt/Desktop/automaker"
echo ""

FILE="/home/aip0rt/Desktop/automaker/apps/ui/src/store/app-store.ts"
TOTAL_PASS=0
TOTAL_FAIL=0

echo "=== UPGRADE VERIFICATION ==="
echo ""

# Check all 8 profiles upgraded
PROFILES=(
    "profile-bmad-finn|Finn"
    "profile-bmad-cerberus|Cerberus"
    "profile-bmad-mary|Mary"
    "profile-bmad-walt|Walt"
    "profile-bmad-axel|Axel"
    "profile-bmad-apex|Apex"
    "profile-bmad-zen|Zen"
    "profile-bmad-echon|Echon"
)

echo "Upgraded Profiles (sonnet → opus):"
for PROFILE_INFO in "${PROFILES[@]}"; do
    ID="${PROFILE_INFO%%|*}"
    NAME="${PROFILE_INFO##*|}"
    echo -n "  $NAME: "
    if grep -A10 "id: '$ID'" "$FILE" | grep -q "model: 'opus'"; then
        echo "✅ opus"
        ((TOTAL_PASS++))
    else
        echo "❌ FAIL"
        ((TOTAL_FAIL++))
    fi
done

echo ""
echo "=== NON-TARGET VERIFICATION ==="
echo ""

# Verify Balanced still sonnet
echo -n "Balanced (should be sonnet): "
if grep -A10 "id: 'profile-balanced'" "$FILE" | grep -q "model: 'sonnet'"; then
    echo "✅ sonnet"
    ((TOTAL_PASS++))
else
    echo "❌ FAIL"
    ((TOTAL_FAIL++))
fi

# Verify Quick Edit still haiku
echo -n "Quick Edit (should be haiku): "
if grep -A10 "id: 'profile-quick-edit'" "$FILE" | grep -q "model: 'haiku'"; then
    echo "✅ haiku"
    ((TOTAL_PASS++))
else
    echo "❌ FAIL"
    ((TOTAL_FAIL++))
fi

echo ""
echo "=== MODEL DISTRIBUTION ==="
echo ""

OPUS=$(grep -c "model: 'opus'" "$FILE")
SONNET=$(grep -c "model: 'sonnet'" "$FILE")
HAIKU=$(grep -c "model: 'haiku'" "$FILE")

echo "  opus:   $OPUS profiles"
echo "  sonnet: $SONNET profiles"
echo "  haiku:  $HAIKU profiles"

echo ""
if [ "$OPUS" -eq 12 ] && [ "$SONNET" -eq 1 ] && [ "$HAIKU" -eq 1 ]; then
    echo "  ✅ Distribution correct (12/1/1)"
    ((TOTAL_PASS++))
else
    echo "  ❌ Distribution mismatch"
    ((TOTAL_FAIL++))
fi

echo ""
echo "=========================================="
echo "  FINAL RESULTS"
echo "=========================================="
echo ""
echo "  Total Checks: $((TOTAL_PASS + TOTAL_FAIL))"
echo "  Passed: $TOTAL_PASS"
echo "  Failed: $TOTAL_FAIL"
echo ""

if [ "$TOTAL_FAIL" -eq 0 ]; then
    echo "  ✅ UPGRADE COMPLETE - ALL SYSTEMS GO"
    echo ""
    echo "  Decision: ✅ GO"
    echo ""
    echo "  All 8 BMAD profiles upgraded to Opus."
    echo "  Balanced (sonnet) and Quick Edit (haiku) preserved."
else
    echo "  ❌ UPGRADE INCOMPLETE"
    echo ""
    echo "  Decision: ❌ NO-GO"
    echo ""
    echo "  $TOTAL_FAIL check(s) failed. Review required."
fi

echo ""
echo "=========================================="
```

---

## Success Criteria

All of the following must be TRUE:

- [ ] 8 BMAD profiles changed from `model: 'sonnet'` to `model: 'opus'`
- [ ] Finn, Cerberus, Mary, Walt, Axel, Apex, Zen, Echon all show `model: 'opus'`
- [ ] Balanced profile still shows `model: 'sonnet'`
- [ ] Quick Edit profile still shows `model: 'haiku'`
- [ ] Heavy Task, Party Synthesis, Sage, Theo unchanged (already opus)
- [ ] Final distribution: opus=12, sonnet=1, haiku=1
- [ ] No TypeScript compilation errors introduced
- [ ] All profile structures remain intact (9 required fields each)

---

## Expected Final State

### After Upgrade - All 14 Profiles

| #   | Profile               | Model    | Thinking   | Change     |
| --- | --------------------- | -------- | ---------- | ---------- |
| 1   | Heavy Task            | opus     | ultrathink | -          |
| 2   | Balanced              | sonnet   | medium     | -          |
| 3   | Quick Edit            | haiku    | -          | -          |
| 4   | BMAD: Party Synthesis | opus     | ultrathink | -          |
| 5   | BMAD: Sage            | opus     | high       | -          |
| 6   | BMAD: Theo            | opus     | high       | -          |
| 7   | BMAD: Finn            | **opus** | medium     | ✅ Changed |
| 8   | BMAD: Cerberus        | **opus** | high       | ✅ Changed |
| 9   | BMAD: Mary            | **opus** | high       | ✅ Changed |
| 10  | BMAD: Walt            | **opus** | medium     | ✅ Changed |
| 11  | BMAD: Axel            | **opus** | medium     | ✅ Changed |
| 12  | BMAD: Apex            | **opus** | medium     | ✅ Changed |
| 13  | BMAD: Zen             | **opus** | high       | ✅ Changed |
| 14  | BMAD: Echon           | **opus** | high       | ✅ Changed |

**Model Distribution:** 12 opus, 1 sonnet, 1 haiku

---

## Rollback Instructions

If upgrade fails or causes issues:

```bash
# Restore from backup (created in Task 1.2)
cd /home/aip0rt/Desktop/automaker/apps/ui/src/store
BACKUP=$(ls -t app-store.ts.backup-* | head -1)
cp "$BACKUP" app-store.ts

# Or git restore
git checkout -- apps/ui/src/store/app-store.ts
```

---

## Post-Upgrade Verification

After PRP execution completes:

1. **Restart dev server:**

   ```bash
   npm run dev:web
   ```

2. **Visual verification:**
   - Navigate to Settings → AI Profiles
   - Verify all BMAD agents show "opus" badge
   - Only "Balanced" should show "sonnet"
   - Only "Quick Edit" should show "haiku"

3. **Functional test:**
   - Select any upgraded profile (e.g., BMAD: Finn)
   - Verify it works correctly with opus model

---

## Error Handling

**If any upgrade fails:**

1. Agent identifies which profile failed
2. Agent attempts targeted fix for that specific profile
3. If fix fails, agent reports detailed error with line numbers
4. Synthesis agent compiles all issues for remediation

**If errors found during verification:**

1. **DO NOT** just report - **FIX** the issues
2. Spin up additional subagents if needed
3. Re-verify after each fix
4. Continue until 100% pass rate

---

**END OF PRP**
