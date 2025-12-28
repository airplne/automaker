# PRP: Ollama Integration Verification Protocol

**Status:** Pending Execution
**Created:** 2025-12-27
**Team:** Claude Team
**Source:** BMAD Party Mode Review (Winston, Amelia, Murat, John)

---

## Context

The Codex team has reported implementing comprehensive Ollama support in Automaker, including:

1. A real Ollama-backed provider with tool loop capabilities
2. Model ID routing for `ollama:*` and `ollama-*` patterns
3. A "big-model plans, local model executes" hybrid harness for Auto Mode
4. API exposure for Ollama model discovery
5. Environment variable configuration

**This PRP provides a systematic verification protocol to validate these claims before merge.**

## Execution Notes (Read First)

- Automaker server default port is `3008` (unless `PORT` is set).
- `GET /api/models/available` returns `{ "success": true, "models": [...] }` (not a raw array).
- Automaker UI currently only exposes Claude model aliases (`haiku`/`sonnet`/`opus`). For deterministic Ollama testing, set `feature.model` via API (`/api/features/create` or `/api/features/update`) to an `ollama:<tag>` string.
- `AUTOMAKER_MODEL_AUTO` only applies when a feature has no `model` set (feature-level `model` takes precedence).

---

## Claimed Implementation Files

| File                                                | Claimed Line | Purpose                                       |
| --------------------------------------------------- | ------------ | --------------------------------------------- |
| `apps/server/src/providers/ollama-provider.ts`      | ~413         | Tool loop with Read/Write/Edit/Glob/Grep/Bash |
| `apps/server/src/providers/provider-factory.ts`     | ~11          | Routes ollama model IDs                       |
| `libs/model-resolver/src/resolver.ts`               | ~49          | Non-Claude model string passthrough           |
| `apps/server/src/services/auto-mode-service.ts`     | ~2287        | Planner/executor harness                      |
| `apps/server/src/routes/models/routes/providers.ts` | ~20          | Ollama in providers API                       |
| `apps/server/src/routes/models/routes/available.ts` | ~18          | Ollama model discovery via /api/tags          |

---

## Phase 1: File Existence Verification

**Objective:** Confirm claimed files exist (line numbers may have shifted)

```bash
# Run from project root
ls -la apps/server/src/providers/ollama-provider.ts
ls -la apps/server/src/providers/provider-factory.ts
ls -la libs/model-resolver/src/resolver.ts
ls -la apps/server/src/services/auto-mode-service.ts
ls -la apps/server/src/routes/models/routes/providers.ts
ls -la apps/server/src/routes/models/routes/available.ts
```

**Checklist:**

- [ ] `ollama-provider.ts` exists
- [ ] `provider-factory.ts` exists
- [ ] `resolver.ts` exists
- [ ] `auto-mode-service.ts` exists
- [ ] `providers.ts` (routes) exists
- [ ] `available.ts` (routes) exists

---

## Phase 2: Code Inspection Checklist

### 2.1 Ollama Provider (`ollama-provider.ts`)

**Search for:**

```bash
rg -n "(Read|Write|Edit|Glob|Grep|Bash)" apps/server/src/providers/ollama-provider.ts
```

**Verify:**

- [ ] File exports an Ollama provider class/function
- [ ] Tool loop implementation exists (handles tool calls iteratively)
- [ ] Read tool handler implemented
- [ ] Write tool handler implemented
- [ ] Edit tool handler implemented
- [ ] Glob tool handler implemented
- [ ] Grep tool handler implemented
- [ ] Bash tool handler implemented
- [ ] Error handling for tool failures exists

### 2.2 Provider Factory (`provider-factory.ts`)

**Search for:**

```bash
rg -n "ollama" apps/server/src/providers/provider-factory.ts
```

**Verify:**

- [ ] Routes `ollama:*` pattern to Ollama provider
- [ ] Routes `ollama-*` pattern to Ollama provider
- [ ] Fallback/error handling for unknown providers

### 2.3 Model Resolver (`libs/model-resolver/src/resolver.ts`)

**Search for:**

```bash
rg -n -C 5 "raw model string|ollama|claude-" libs/model-resolver/src/resolver.ts
```

**Verify:**

- [ ] Non-Claude model strings pass through unchanged
- [ ] No forced mapping to Claude model IDs for Ollama models

### 2.4 Auto Mode Service - Planner Harness (`auto-mode-service.ts`)

**Search for:**

```bash
rg -n "AUTOMAKER_MODEL_PLANNER|AUTOMAKER_PLANNER_ALLOWED_TOOLS" apps/server/src/services/auto-mode-service.ts
```

**Verify:**

- [ ] `AUTOMAKER_MODEL_PLANNER` env var is read
- [ ] Planner model used for spec/plan generation
- [ ] Executor model (main model) used for task execution
- [ ] `AUTOMAKER_PLANNER_ALLOWED_TOOLS` env var is read
- [ ] Tool access properly restricted for planner when configured
- [ ] Clear separation between planning phase and execution phase
- [ ] Context/plan properly passed from planner to executor

### 2.5 Models API - Providers Route (`routes/providers.ts`)

**Search for:**

```bash
rg -n "ollama" apps/server/src/routes/models/routes/providers.ts
```

**Verify:**

- [ ] Ollama listed as available provider
- [ ] Provider metadata includes relevant info (name, capabilities)

### 2.6 Models API - Available Route (`routes/available.ts`)

**Search for:**

```bash
rg -n "ollama|/api/tags" apps/server/src/routes/models/routes/available.ts
```

**Verify:**

- [ ] Calls Ollama `/api/tags` endpoint
- [ ] Parses response correctly
- [ ] Includes Ollama models in response
- [ ] Handles Ollama not running gracefully

---

## Phase 3: Integration Smoke Tests

### Prerequisites

- [ ] Ollama installed and running locally
- [ ] At least one model pulled (e.g., `ollama pull qwen2.5-coder:7b`)
- [ ] Automaker server can be started
- [ ] Valid `ANTHROPIC_API_KEY` for planner tests (planner currently uses Claude)
- [ ] If you change any `AUTOMAKER_*` env vars, restart the Automaker server (env vars are read by the server process)
- [ ] If `ALLOWED_ROOT_DIRECTORY` is set, ensure it contains your `PROJECT_PATH`

### 3.1 Model Discovery Test

**Setup:**

```bash
# Ensure Ollama is running
ollama list

# Start Automaker server (method depends on your setup)
npm run dev:server

# Optional: set a stable base URL for the commands below
export AUTOMAKER_BASE_URL=${AUTOMAKER_BASE_URL:-http://localhost:3008}
```

**Test:**

```bash
curl -s "$AUTOMAKER_BASE_URL/api/models/providers" | jq '.providers.ollama'
curl -s "$AUTOMAKER_BASE_URL/api/models/available" | jq '.models[] | select(.provider == "ollama")'
```

**Expected:**

- `/api/models/providers` shows `providers.ollama.available == true` when Ollama is reachable
- `/api/models/available` includes at least one Ollama model with metadata; models discovered from Ollama `/api/tags` are expected to match `ollama list` output (there may also be static/suggested Ollama model entries)

- [ ] API returns 200
- [ ] Response includes Ollama models
- [ ] Discovered model names match `ollama list` output (if Ollama is running)

### 3.2 Direct Ollama Execution Test

**Setup (recommended, deterministic):** create a feature with `feature.model` set to an Ollama model.

```bash
export AUTOMAKER_BASE_URL=${AUTOMAKER_BASE_URL:-http://localhost:3008}
export PROJECT_PATH="/absolute/path/to/your/project"
export OLLAMA_MODEL="ollama:qwen2.5-coder:7b"

# Unset planner to test direct execution-only mode (restart server after changing env vars)
unset AUTOMAKER_MODEL_PLANNER

# Create a feature that will run in Auto Mode using Ollama as executor
FEATURE_ID="$(
  curl -s -X POST "$AUTOMAKER_BASE_URL/api/features/create" \
    -H 'content-type: application/json' \
    -d "{\"projectPath\":\"$PROJECT_PATH\",\"feature\":{\"title\":\"Ollama smoke test\",\"category\":\"PRP\",\"description\":\"Create a new file named ollama-smoke.txt at the project root containing the single line: hello from ollama\",\"model\":\"$OLLAMA_MODEL\",\"planningMode\":\"skip\",\"requirePlanApproval\":false,\"skipTests\":true}}" \
  | jq -r '.feature.id'
)"
echo "FEATURE_ID=$FEATURE_ID"

# Run the feature (async)
curl -s -X POST "$AUTOMAKER_BASE_URL/api/auto-mode/run-feature" \
  -H 'content-type: application/json' \
  -d "{\"projectPath\":\"$PROJECT_PATH\",\"featureId\":\"$FEATURE_ID\",\"useWorktrees\":false}" \
  | jq .
```

**Test Task:** Create a simple file via Automaker UI or API

**Verify:**

- [ ] Ollama receives the request (check Ollama logs)
- [ ] Tool calls are made (Read/Write/etc.)
- [ ] Task completes successfully
- [ ] File actually created on disk
- [ ] Agent output updated: `cat "$PROJECT_PATH/.automaker/features/$FEATURE_ID/agent-output.md"`

### 3.3 Hybrid Mode Test (Planner + Executor)

**Setup:**

```bash
export AUTOMAKER_BASE_URL=${AUTOMAKER_BASE_URL:-http://localhost:3008}
export PROJECT_PATH="/absolute/path/to/your/project"
export AUTOMAKER_MODEL_PLANNER='claude-sonnet-4-20250514'
export OLLAMA_MODEL='ollama:qwen2.5-coder:7b'
export AUTOMAKER_PLANNER_ALLOWED_TOOLS=''

# IMPORTANT: Ensure the Automaker server is started/restarted with these env vars set.
# Example (run in the same shell that starts the server):
#   ANTHROPIC_API_KEY="sk-ant-..." AUTOMAKER_MODEL_PLANNER="$AUTOMAKER_MODEL_PLANNER" AUTOMAKER_PLANNER_ALLOWED_TOOLS="$AUTOMAKER_PLANNER_ALLOWED_TOOLS" npm run dev:server

# Create a feature that triggers a planning phase (planningMode must be spec/full or lite+approval)
FEATURE_ID="$(
  curl -s -X POST "$AUTOMAKER_BASE_URL/api/features/create" \
    -H 'content-type: application/json' \
    -d "{\"projectPath\":\"$PROJECT_PATH\",\"feature\":{\"title\":\"Hybrid planner/executor smoke test\",\"category\":\"PRP\",\"description\":\"Create a new TypeScript utility module at libs/utils/src/date-format.ts exporting a function formatDateISO(date: Date): string, and add unit tests under libs/utils/tests/date-format.test.ts.\",\"model\":\"$OLLAMA_MODEL\",\"planningMode\":\"spec\",\"requirePlanApproval\":false,\"skipTests\":true}}" \
  | jq -r '.feature.id'
)"
echo "FEATURE_ID=$FEATURE_ID"

# Run the feature (async)
curl -s -X POST "$AUTOMAKER_BASE_URL/api/auto-mode/run-feature" \
  -H 'content-type: application/json' \
  -d "{\"projectPath\":\"$PROJECT_PATH\",\"featureId\":\"$FEATURE_ID\",\"useWorktrees\":false}" \
  | jq .
```

**Test Task:** Multi-step task requiring planning (e.g., "Create a new TypeScript utility module with a function to format dates, include tests")

**Verify:**

- [ ] Server logs show Claude used for planning
- [ ] Server logs show Ollama used for execution
- [ ] Plan is coherent and passed to executor
- [ ] Ollama successfully executes planned steps
- [ ] Final output matches planned specification

### 3.4 Planner Tool Access Test

**Setup:**

```bash
export AUTOMAKER_MODEL_PLANNER='claude-sonnet-4-20250514'
export AUTOMAKER_MODEL_AUTO='ollama:qwen2.5-coder:7b'
export AUTOMAKER_PLANNER_ALLOWED_TOOLS='Read,Glob'
```

**Verify:**

- [ ] Planner can use Read tool
- [ ] Planner can use Glob tool
- [ ] Planner cannot use Write/Edit/Bash (restricted)

---

## Phase 4: Edge Case Verification

### 4.1 Invalid Model ID

**Test:**

```bash
export AUTOMAKER_MODEL_AUTO='ollama:nonexistent-model-xyz'
```

**Expected:** Graceful error message, not crash

- [ ] Server returns meaningful error
- [ ] No server crash/hang
- [ ] Error logged appropriately

### 4.2 Ollama Not Running

**Test:**

```bash
# Stop Ollama
systemctl stop ollama  # or kill the process

# Try to use Ollama model
export AUTOMAKER_MODEL_AUTO='ollama:qwen2.5-coder:7b'
```

**Expected:** Timeout with clear error message

- [ ] Connection timeout handled
- [ ] Clear error message returned to user
- [ ] Server remains stable

### 4.3 Tool Execution Failure

**Test:** Trigger a tool that will fail (e.g., Read a non-existent file)

**Expected:** Ollama receives error, handles appropriately

- [ ] Error returned to model
- [ ] Model can retry or report failure
- [ ] No infinite loops

### 4.4 Ollama Base URL Configuration

**Test both env vars:**

```bash
# Test 1: AUTOMAKER_OLLAMA_BASE_URL
export AUTOMAKER_OLLAMA_BASE_URL='http://localhost:11434'
unset OLLAMA_HOST

# Test 2: OLLAMA_HOST fallback
unset AUTOMAKER_OLLAMA_BASE_URL
export OLLAMA_HOST='http://localhost:11434'
```

**Verify:**

- [ ] `AUTOMAKER_OLLAMA_BASE_URL` works
- [ ] `OLLAMA_HOST` works as fallback
- [ ] `AUTOMAKER_OLLAMA_BASE_URL` takes precedence if both set

---

## Phase 5: Test Suite Verification

### 5.1 Run Existing Tests

```bash
npm run test:packages
npm run test:server
```

- [ ] All tests pass
- [ ] No new test failures introduced

### 5.2 Check Test Coverage (if tooling exists)

```bash
# Check for Ollama-specific tests
rg -n "ollama" apps/server/tests libs
```

- [ ] Ollama provider has unit tests
- [ ] Provider factory routing has tests
- [ ] Model resolver passthrough has tests

### 5.3 Coverage Gaps Identified

List any areas without test coverage:

```
1. ____________________________________________
2. ____________________________________________
3. ____________________________________________
```

---

## Phase 6: Performance Baseline (Optional)

**Note:** This phase addresses the original question about "outperforming" Claude/Codex.

### 6.1 Benchmark Setup

**Task Set:** Define 5-10 representative tasks of varying complexity:

1. Simple file creation
2. Code modification (add a function)
3. Multi-file refactor
4. Bug fix with test
5. Feature implementation with multiple components

### 6.2 Configurations to Test

| Config         | Planner | Executor |
| -------------- | ------- | -------- |
| A (Baseline)   | Claude  | Claude   |
| B (Hybrid)     | Claude  | Ollama   |
| C (Local Only) | Ollama  | Ollama   |

### 6.3 Metrics to Capture

For each task and configuration:

- [ ] Success rate (task completed correctly)
- [ ] Time to completion
- [ ] Number of tool calls
- [ ] Number of retries/errors
- [ ] Token usage (for cost comparison)

### 6.4 Results Matrix

| Task | Config A Success | Config B Success | Config C Success | Notes |
| ---- | ---------------- | ---------------- | ---------------- | ----- |
| 1    |                  |                  |                  |       |
| 2    |                  |                  |                  |       |
| 3    |                  |                  |                  |       |
| 4    |                  |                  |                  |       |
| 5    |                  |                  |                  |       |

---

## Deliverables

Upon completion, provide:

1. **Completed Checklist:** All boxes checked with pass/fail
2. **Discrepancy Report:** Any differences from claimed implementation
3. **Evidence:**
   - Screenshots or log excerpts of successful hybrid mode execution
   - API response samples
4. **Test Coverage Assessment:** Gaps identified and recommendations
5. **Performance Data (if Phase 6 completed):** Benchmark results
6. **Recommendations:** Any suggested improvements or concerns

---

## Sign-Off

| Phase   | Completed By | Date | Status |
| ------- | ------------ | ---- | ------ |
| Phase 1 |              |      |        |
| Phase 2 |              |      |        |
| Phase 3 |              |      |        |
| Phase 4 |              |      |        |
| Phase 5 |              |      |        |
| Phase 6 |              |      |        |

**Final Verdict:** [ ] VERIFIED / [ ] ISSUES FOUND / [ ] BLOCKED

**Notes:**

```


```

---

_Generated by BMAD Party Mode - Winston (Architect), Amelia (Developer), Murat (Test Architect), John (PM)_
