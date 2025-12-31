# PRP: Fix + Enhance “Enhance with AI” (Add/Edit Feature dialogs)

---

**Status:** READY FOR EXECUTION
**Priority:** P0 (bug fix / reliability) + P1 (new @ file references)
**Assignee:** Claude Dev Team (Terminal)
**Created:** 2025-12-29
**Last Updated:** 2025-12-30
**Type:** Bug Fix + UX/Feature Enhancement

---

## Executive Summary

Users report that “Enhance with AI” sometimes appears to do nothing and does not incorporate any context beyond the raw description. This PRP fixes reliability and adds a minimal-but-useful “@ file reference” workflow that:

1. **P0 – Reliability:** Make enhancement always return actionable output or a clear, user-facing error (auth/credits/etc.)
2. **P0 – Context:** Include already-attached _text_ context files in the enhancement request
3. **P1 – @ References:** Detect `@` mentions, provide a picker UI, and include referenced file snippets in the enhancement request
4. **P1 – UX:** Show a simple “Referenced files” list under the textarea (no rich-text chips inside the textarea)

This PRP is designed to be testable in CI by adding **mock mode** to the enhance endpoint when `AUTOMAKER_MOCK_AGENT=true`.

---

## Scope & Non‑Goals

### In Scope

- Add Feature dialog enhancement: `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`
- Edit Feature dialog enhancement: `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`
- Description input component (shared): `apps/ui/src/components/ui/description-image-dropzone.tsx`
- Enhance endpoint: `apps/server/src/routes/enhance-prompt/routes/enhance.ts`

### Explicit Non‑Goals (for this PRP)

- Caret-positioned dropdown “under cursor” (requires a caret-coordinate utility/lib). MVP anchors the picker to the textarea region.
- Rich-text inline chips inside the textarea.
- Using attached **images** as vision context for enhancement (endpoint is text-only today).
- A full blown codebase indexing service; we’ll do a bounded client-side directory walk for MVP, with an optional follow-up server endpoint if needed.

---

## Current Implementation (Verified)

### Frontend call path (already exists)

- Add Feature: `handleEnhanceDescription()` calls `api.enhancePrompt?.enhance(...)` and replaces the description on success.
- Edit Feature: same pattern.
- API client method exists: `apps/ui/src/lib/http-api-client.ts:623` posts to `/api/enhance-prompt`.

### Backend endpoint (already exists)

- `POST /api/enhance-prompt` is implemented in `apps/server/src/routes/enhance-prompt/routes/enhance.ts`.
- It calls `query()` from `@anthropic-ai/claude-agent-sdk` and extracts text with `extractTextFromStream()`.

### Why it can “do nothing” in practice

Common failure modes that look like “no-op” to users:

- Anthropic auth not configured (no CLI auth + no API key) → backend returns error
- Credits/rate-limit errors → backend returns error
- Streaming response parsing returns empty output → backend returns error
- UI shows a toast but user misses it → perceived no-op

---

## Preconditions (Do These First)

### 1) Claude auth readiness

To get real enhancements, you must have Anthropic auth configured:

- Preferred: use Automaker UI → Settings → API Keys → store Anthropic key (persists to `.env`)
- Or run server with `ANTHROPIC_API_KEY=...`

If you do **not** have credentials (CI / offline), use mock mode (Phase 1.1).

### 2) Auth middleware note (optional)

If `AUTOMAKER_API_KEY` is set, all `/api/*` routes (except `/api/health`) require `X-API-Key`.

---

## Phase 0: Reproduce + Capture Evidence (30–45 min)

1. Start backend and UI:
   ```bash
   npm run dev:full
   # or in two terminals:
   # npm run dev --workspace=apps/server
   # npm run dev --workspace=apps/ui
   ```
2. In UI: open a project, open Add Feature dialog, type a short description, click “Enhance with AI”.
3. Confirm a network request is made:
   - URL: `/api/enhance-prompt`
   - Payload: `{ originalText, enhancementMode, model? }`
4. If it fails, capture:
   - Browser console error (if any)
   - Server console error (stderr/stdout)
   - Response JSON from `/api/enhance-prompt`

Optional direct call (if server running and auth allows):

```bash
curl -sS -X POST "http://localhost:3008/api/enhance-prompt" \
  -H "Content-Type: application/json" \
  -d '{"originalText":"add dark mode","enhancementMode":"improve"}' | jq
```

---

## Phase 1 (P0): Fix Reliability + Include Existing Attached Text Context (2–4 hours)

### 1.1 Add mock mode for `/api/enhance-prompt` (CI-safe)

**Goal:** Allow UI/E2E tests to exercise enhancement flows without hitting Anthropic.

**File:** `apps/server/src/routes/enhance-prompt/routes/enhance.ts`

**Behavior:**

- If `process.env.AUTOMAKER_MOCK_AGENT === 'true'`, return:
  - `success: true`
  - `enhancedText`: deterministic transform based on `enhancementMode` (e.g., prefix + a couple bullet-like lines)
  - Never call `query()` in mock mode

**Acceptance:**

- With `AUTOMAKER_MOCK_AGENT=true`, endpoint returns 200 and a non-empty `enhancedText` for all 4 modes.

### 1.2 Improve backend error messaging for auth/billing/rate-limit

**Goal:** Replace opaque failures with actionable guidance.

**File:** `apps/server/src/routes/enhance-prompt/routes/enhance.ts`

**Implementation notes:**

- Detect common patterns (similar to `apps/server/src/routes/setup/routes/verify-claude-auth.ts`) and return a user-friendly message:
  - “Claude not configured. Add an API key in Settings → API Keys.”
  - “Insufficient credits…”
  - “Rate limit reached…”

**Acceptance:**

- Typical auth/billing errors return a meaningful `error` string (no stack dumps to client).

### 1.3 Include attached text files in enhancement context (frontend)

**Problem:** `DescriptionImageDropZone` already supports attaching `.md`/`.txt` files, but enhancement ignores them today.

**Files:**

- `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`
- `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`

**Implementation:**

- Before calling `api.enhancePrompt.enhance(...)`, build a context prefix from attached text files:
  - Add Feature: `newFeature.textFilePaths` (each has `filename` + `content`)
  - Edit Feature: `editingFeature.textFilePaths` (same shape)
- Prefix format (keep short):

  ```text
  Context (attached text files):
  --- notes.md ---
  <first N lines>

  ---
  User request:
  <original description>
  ```

- Guardrails:
  - Limit per file: e.g. first 200 lines and/or first 12_000 chars
  - Skip empty content

**Acceptance:**

- With an attached `.md` file, the enhancement request includes that content (verify via devtools request body in mock mode).

### 1.4 Optional refactor: shared helper to avoid duplication

If both dialogs implement identical “build enhancement input” logic, create a helper:

- **New file:** `apps/ui/src/lib/enhance-with-ai.ts`
- Export `buildEnhanceInput({ description, attachedTextFiles, referencedFiles })`

---

## Phase 2 (P1): @ File References + Picker + Context-Aware Enhancement (4–7 hours)

### 2.1 Define the @ reference contract (MVP)

- A “file mention” is a project-relative path token like: `@src/routes/index.js`
- Parsing rule: `@` followed by non-whitespace up to the next whitespace
- Security rule: ignore any mention that is:
  - absolute (starts with `/` or `C:\`)
  - contains `..`

**New util (recommended):** `apps/ui/src/lib/file-mentions.ts`

- `extractFileMentions(text: string): string[]`
- `removeFileMention(text: string, mention: string): string`

### 2.2 UI: show a picker when @ is typed (anchored to textarea)

**File:** `apps/ui/src/components/ui/description-image-dropzone.tsx`

**MVP UX:**

- When the user types `@` (or when the cursor is in an active mention), open a popover anchored under the textarea.
- The popover shows:
  - Search input (defaults to the current mention query)
  - List of matching files (top 20–50)
- Selecting a file replaces the current `@<query>` token with `@<relativePath>`.
- Escape closes the popover.

**Implementation notes:**

- Do **not** attempt “under-caret positioning” in this PRP (requires a new dependency/utility).
- Use `getElectronAPI()` and existing FS methods:
  - `api.readdir(dirPath)`
  - `api.readFile(filePath)`

### 2.3 Build a bounded file index (client-side) for suggestions

**Goal:** Provide “good enough” file search without adding a new server API.

**Approach:**

- Use `currentProject.path` (already available in `DescriptionImageDropZone`) as the root.
- Perform a BFS directory walk via `api.readdir()` with guardrails:
  - Skip directories: `node_modules`, `.git`, `.automaker`, `dist`, `build`, etc.
  - Hard limits: max directories visited, max files indexed, max time budget (e.g., 2s)
  - Cache results per `projectPath` in component/module scope
- Filter by `mentionQuery` (substring match, case-insensitive) and return top N.

**Optional follow-up (not required here):**

- Add a server endpoint `/api/fs/search-files` using `listAllFilesInDirectory()` from `@automaker/git-utils` for faster search on large repos.

### 2.4 Include @-referenced file snippets in enhancement request

**Files:**

- `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx`
- `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`

**Implementation:**

1. Parse mentions from the description using `extractFileMentions()`.
2. Resolve each to an absolute path:
   - `absPath = currentProject.path + '/' + relPath`
3. Read contents with `api.readFile(absPath)`.
4. Prefix the enhancement input with a “Context (referenced files)” section.
5. Keep strict limits per file (same as Phase 1.3).

**Acceptance:**

- With mock mode enabled, devtools shows `originalText` includes the referenced file snippet section.

### 2.5 UX: show “Referenced files” list under the textarea (Option C)

**File:** `apps/ui/src/components/ui/description-image-dropzone.tsx`

**Behavior:**

- Derive referenced files from `extractFileMentions(value)` (no separate source of truth).
- Render a small list of badges under the textarea:
  - Clicking “x” removes that mention from the text (uses `removeFileMention()` and calls `onChange`).

---

## Testing Plan

### Backend

- Add unit tests for mock mode + error mapping in `apps/server/tests/unit/routes/enhance-prompt.test.ts` (new).
- Run:
  ```bash
  npm run test:unit --workspace=apps/server
  ```

### UI (Playwright)

Because enhancement normally calls Anthropic, run UI tests with mock mode:

```bash
AUTOMAKER_MOCK_AGENT=true npm run test --workspace=apps/ui
```

Add/extend Playwright coverage:

- `apps/ui/tests/features/add-feature-to-backlog.spec.ts`: verify “Enhance with AI” updates the textarea content in mock mode.
- `apps/ui/tests/features/edit-feature.spec.ts`: verify enhancement updates description in edit dialog in mock mode.
- Add a new small test that types `@` and selects a file from the picker (if feasible/reliable), or at minimum validates the referenced-files list renders after inserting `@src/...` manually.

---

## Acceptance Criteria (Definition of Done)

### P0

- [ ] “Enhance with AI” updates the description in **both** Add Feature and Edit Feature dialogs when Claude is configured.
- [ ] When Claude is not configured / credits are insufficient / rate limited, UI shows a clear actionable error (not a silent no-op).
- [ ] Attached **text** files from `DescriptionImageDropZone` are included as context in the enhancement request.
- [ ] Mock mode (`AUTOMAKER_MOCK_AGENT=true`) makes `/api/enhance-prompt` deterministic and CI-safe.

### P1

- [ ] Typing `@` opens a file picker UI (anchored under textarea) and selecting a file inserts `@<relativePath>`.
- [ ] Enhancement includes referenced file snippets for `@` mentions (bounded/limited).
- [ ] A “Referenced files” list renders under the textarea with remove support.

---

## Files / Touch Points

### Server

- `apps/server/src/routes/enhance-prompt/routes/enhance.ts` (mock mode + better errors)

### UI

- `apps/ui/src/components/ui/description-image-dropzone.tsx` (mention picker + referenced files list)
- `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx` (include attached text + referenced file context)
- `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx` (same)
- `apps/ui/src/lib/http-api-client.ts` (already has enhancePrompt method)
- `apps/ui/src/lib/file-mentions.ts` (new util, recommended)
- `apps/ui/src/lib/enhance-with-ai.ts` (optional helper)

---

## Notes

- The FS APIs available to the UI are `api.readdir(dirPath)` and `api.readFile(filePath)` (no nested `api.fs.*` object).
- `/api/fs/readdir` is non-recursive; directory walking must be explicit if you want to build a file list.
- If you later decide caret-positioned dropdown is required, add a caret coordinate helper and keep the rest of this implementation intact.
