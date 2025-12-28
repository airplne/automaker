# npm Security Guardrails - Verification Report

## Reverification (Post-Fix)

Date: 2025-12-27T21:23:35-05:00  
Repo: `automaker` @ `b60e8f0` (working tree not clean; 111 changes)

### Verdict

**PASS** — builds, tests, and lint checks are green.

| Check               | Result | Notes                                                |
| ------------------- | ------ | ---------------------------------------------------- |
| Build `libs/types`  | ✅     | `npm run build --workspace=libs/types`               |
| Build `apps/server` | ✅     | `npm run build --workspace=apps/server`              |
| Build `apps/ui`     | ✅     | `npm run build --workspace=apps/ui`                  |
| Tests `apps/server` | ✅     | `npm run test:run --workspace=apps/server` (822/822) |
| Lint `apps/server`  | ✅     | 0 errors (65 warnings)                               |
| Lint `apps/ui`      | ✅     | 0 errors (86 warnings)                               |

### Spot-checks vs Claude team report

- TS build fix present in `apps/server/src/providers/claude-provider.ts` (previous `entry.command` undefined issue resolved).
- Policy engine changes present in `apps/server/src/lib/npm-security-policy.ts` (allow-mode audit, prompt-mode install approval, rebuild whitelist flow).
- Approval + audit wiring present in `apps/server/src/providers/claude-provider.ts` (uses `requestApproval()`; fail-safe returns `cancel` on error; audit logs via `settingsService.logNpmSecurityAudit()`).
- UI ↔ server contract aligned in `apps/ui/src/store/app-store.ts` (`POST /api/npm-security/approval/:requestId` with `{ decision, rememberChoice }`).
- Server ESLint config present in `apps/server/eslint.config.mjs`; UI redeclare issue avoided by using `NpmSecuritySettingsView` in `apps/ui/src/components/views/settings-view/npm-security/index.tsx`.

### Manual UI (optional / pending)

Not executed. Suggested checklist:

1. Trigger an approval (e.g., `npx ...`) and confirm the approval dialog appears and resolves.
2. Verify audit log entries are written to `{projectPath}/.automaker/npm-security-audit.jsonl`.
3. Confirm “Prompt” mode behavior for high-risk commands matches docs (currently, approval is only enforced for high-risk commands in “Strict” mode in `apps/server/src/lib/npm-security-policy.ts:156`).

---

## Historical (Initial run)

Date: 2025-12-27T20:26:33-05:00  
Repo: `automaker` @ `b60e8f0` (working tree not clean)

## Verdict

**FAIL** — not ready to merge as-is.

Primary blockers:

- Server build fails (`tsc`) in `apps/server`.
- npm security policy tests fail (4 failures) and full server suite fails (6 failures total).
- Approval + audit logging plumbing is not wired (TODOs; unused server approval/audit code).
- UI ↔ server approval endpoint contract mismatch.
- Lint fails for both `apps/server` (config) and `apps/ui` (1 error).

---

## Phase 1: File Existence

### Types

- Types file: **EXISTS** (`libs/types/src/npm-security.ts`)
- Required exports: **FOUND** (`NpmSecuritySettings`, `ClassifiedCommand`, `NpmSecurityApprovalRequest`, `NpmSecurityAuditEntry`, `DEFAULT_NPM_SECURITY_SETTINGS`)

### Server

- Command classifier: **EXISTS** (`apps/server/src/lib/npm-command-classifier.ts`)
- Policy engine: **EXISTS** (`apps/server/src/lib/npm-security-policy.ts`)
- API routes: **EXISTS** (`apps/server/src/routes/npm-security/`) — 5 `.ts` files (`index.ts`, `common.ts`, `routes/{settings,audit,approval}.ts`)

### UI

- Settings page: **EXISTS** (`apps/ui/src/components/views/settings-view/npm-security/index.tsx`)
- Approval dialog: **EXISTS** (`apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx`)
- Hook: **EXISTS** (`apps/ui/src/hooks/use-npm-security-events.ts`)

### Tests

- Test files: **EXISTS** — 3 files:
  - `apps/server/tests/unit/lib/npm-command-classifier.test.ts`
  - `apps/server/tests/unit/lib/npm-security-policy.test.ts`
  - `apps/server/tests/unit/services/npm-security-settings.test.ts`

### Docs

- `docs/security/`: **EXISTS** — 8 files, **2595** total lines
- `docs/security/README-security-section.md`: **EXISTS**

---

## Phase 2: Modified Files / Integrations

| Area                       | Status        | Notes                                                                                                                                                                                                                  |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ClaudeProvider integration | ⚠️ PARTIAL    | Integrates `createNpmSecurityEnforcer`, but has TODO placeholders and currently does not wire approval/audit to real implementations; also fails TypeScript build (`apps/server/src/providers/claude-provider.ts:88`). |
| ProviderFactory injection  | ✅ INTEGRATED | `ProviderFactory.getProviderForModel(modelId, settingsService?)` and `new ClaudeProvider(settingsService)` present.                                                                                                    |
| SettingsService extension  | ✅ EXTENDED   | `getNpmSecuritySettings`, `updateNpmSecuritySettings`, audit log read/write implemented.                                                                                                                               |
| TerminalService hardening  | ✅ HARDENED   | Secure npm env vars injected by default (`npm_config_ignore_scripts`, `PNPM_IGNORE_SCRIPTS`, `YARN_ENABLE_SCRIPTS`, etc.).                                                                                             |
| UI store integration       | ⚠️ PARTIAL    | Approval state exists, but approval resolve fetch path/payload do not match server routes.                                                                                                                             |
| Root route integration     | ✅ INTEGRATED | Global `NpmSecurityApprovalDialog` rendered; hook `useNpmSecurityEvents()` called.                                                                                                                                     |
| Shared settings types      | ✅ EXTENDED   | `ProjectSettings.npmSecurity` and `DEFAULT_PROJECT_SETTINGS.npmSecurity` present in `libs/types/src/settings.ts`.                                                                                                      |

---

## Phase 3: Tests

### Test Counts

- `npm-command-classifier.test.ts`: 31 tests
- `npm-security-policy.test.ts`: 21 tests
- `npm-security-settings.test.ts`: 12 tests
- Total (these files): 64 tests

### Targeted Test Run (Agent 9)

Command:

```bash
npm run test:run --workspace=apps/server -- tests/unit/lib/npm-command-classifier.test.ts tests/unit/lib/npm-security-policy.test.ts
```

Result: **FAIL** — 4 failing tests (all in `npm-security-policy.test.ts`)

Failing tests:

1. `with allow policy > still logs security events` (expected `onAuditLog` to be called)
2. `with prompt policy > requires approval before allowing commands` (expected `onApprovalRequired` to be called)
3. `with prompt policy > blocks commands when user cancels` (expected `allowed === false`, got `true`)
4. `with allowedPackagesForRebuild > blocks rebuild for non-whitelisted packages` (expected `onApprovalRequired` to be called)

### Full Server Suite (Agent 10)

Command:

```bash
npm run test:run --workspace=apps/server
```

Result: **FAIL** — `6 failed | 816 passed (822)`

Additional failures (beyond npm policy tests):

- `tests/integration/services/auto-mode-service.integration.test.ts > ... > should use feature-specific model`
- `tests/unit/services/agent-service.test.ts > ... > should use custom model if provided`

These failures appear caused by the updated `ProviderFactory.getProviderForModel(modelId, settingsService?)` call signature (tests expect a 1-arg call).

---

## Phase 4: Documentation

Docs verification: **PASS**

- `docs/security/` has 8 files and totals 2595 lines (matches PRP expectation).
- `docs/security/README-security-section.md` includes the three policy modes and recommended placement section.

---

## Phase 5: Build Verification

| Build  | Command                                 | Status  | Notes                                                                                                            |
| ------ | --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| Types  | `npm run build --workspace=libs/types`  | ✅ PASS |                                                                                                                  |
| Server | `npm run build --workspace=apps/server` | ❌ FAIL | TypeScript error: `apps/server/src/providers/claude-provider.ts(88,78): 'entry.command' is possibly 'undefined'` |
| UI     | `npm run build --workspace=apps/ui`     | ✅ PASS |                                                                                                                  |

---

## Phase 6: Security Logic Verification

### Package Manager Coverage

- **PASS** — classifier detects `npm`, `pnpm`, `yarn`, `bun` (`apps/server/src/lib/npm-command-classifier.ts`)

### Risk Levels

- **PASS** — risk levels defined as `'low' | 'medium' | 'high'` (`apps/server/src/lib/npm-command-classifier.ts:251`)

### Policy Modes (strict / prompt / allow)

- **FAIL** — types define all 3 modes (`libs/types/src/npm-security.ts:31`), but policy enforcement appears incomplete:
  - `prompt` mode behavior is not implemented in `enforcePolicy` for high-risk commands (no approval invoked), matching the failing tests.
  - `allow` mode returns without calling `callbacks.onAuditLog`, matching the failing tests.

### `--ignore-scripts` Injection

- **PASS** — implemented via command rewrite for install commands (`apps/server/src/lib/npm-command-classifier.ts` and `apps/server/src/lib/npm-security-policy.ts:206`)
- **PASS** — secure env defaults injected in terminal sessions (`apps/server/src/services/terminal-service.ts:47`)

### Audit Logging

- **PARTIAL / FAIL (wiring)**:
  - `SettingsService.logNpmSecurityAudit()` writes JSONL to `{projectPath}/.automaker/npm-security-audit.jsonl`.
  - However, `logNpmSecurityAudit` is not referenced outside `settings-service.ts`, and `ClaudeProvider`’s `onAuditLog` callback currently only logs to `logger` with a TODO.

### Approval Workflow

- **PARTIAL / FAIL (wiring + contract)**:
  - Server routes expose approval endpoints and an in-memory pending approvals store (`apps/server/src/routes/npm-security/routes/approval.ts`), but `requestApproval()` is not used anywhere else in `apps/server/src`.
  - UI approval resolution uses `POST /api/npm-security/approval/resolve` with `{ requestId, selectedOption, rememberChoice }`, but the server implements `POST /api/npm-security/approval/:requestId` with `{ decision, rememberChoice }`.
  - UI event hook listens for Electron `autoMode` events of type `npm_security_approval_required`, but no server-side emitter for that event string was found in this repo.

---

## Phase 7: API Endpoints Verification

Server registers routes:

- `app.use('/api/npm-security', createNpmSecurityRoutes(settingsService))` (`apps/server/src/index.ts:155`)

Endpoints present (`apps/server/src/routes/npm-security/index.ts`):

- Settings: `GET/PUT /settings/:projectPath(*)`
- Settings helper: `POST /settings/:projectPath(*)/allow-scripts`
- Approval: `GET /approval/pending`, `POST /approval/:requestId`, `GET /approval/stream`
- Audit: `GET /audit/:projectPath(*)`

Status: **PASS (exists)** / **FAIL (UI contract mismatch)** for the approval submit endpoint.

---

## Phase 9: Lint Check

| Workspace | Command                                | Status  | Notes                                                                                                                       |
| --------- | -------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------- |
| Server    | `npm run lint --workspace=apps/server` | ❌ FAIL | ESLint v9 cannot find `eslint.config.(js                                                                                    | mjs | cjs)`for`apps/server`. |
| UI        | `npm run lint --workspace=apps/ui`     | ❌ FAIL | 1 error: `no-redeclare` for `NpmSecuritySettings` (`apps/ui/src/components/views/settings-view/npm-security/index.tsx:13`). |

---

## Manual UI Verification (Optional / Pending)

Not executed (manual pending).

Suggested checklist:

1. Open Settings → npm Security.
2. With a project selected, confirm GET loads from `GET /api/npm-security/settings/:projectPath(*)`.
3. Toggle each policy mode and confirm PUT updates persist.
4. Trigger a high-risk command (e.g., `npx ...`) from an agent and confirm:
   - approval request is generated,
   - dialog appears,
   - decision is sent to the correct server endpoint,
   - audit log entry is written to `{projectPath}/.automaker/npm-security-audit.jsonl`.

---

## Issues Found (Blocking)

1. **Server build broken**: TypeScript error in `apps/server/src/providers/claude-provider.ts` prevents compilation.
2. **npm security policy tests failing**: prompt/allow behaviors not implemented as expected.
3. **Approval + audit wiring incomplete**: server approval and audit mechanisms are present but unused; ClaudeProvider contains TODO placeholders.
4. **UI ↔ server approval contract mismatch**: UI uses `/approval/resolve` + `selectedOption`; server expects `/approval/:requestId` + `decision`.
5. **Lint failures**:
   - `apps/server` lint fails due to missing ESLint v9 config.
   - `apps/ui` lint has a real error (`no-redeclare`) in npm security settings component.
6. **Full server test suite regression**: provider factory signature change breaks existing tests (`agent-service` + `auto-mode-service` expectations).
