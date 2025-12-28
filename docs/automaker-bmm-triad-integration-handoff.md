# AutoMaker Integration Handoff: Replace BMAD Roster with BMM‑Triad (3 Agents)

**Date:** 2025-12-27  
**Audience:** AutoMaker integration teams (server + UI + packaging)  
**Source of truth (Triad spec):** `docs/bmm-triad-module-spec.md`
**Status:** Implemented ✅ (Triad-only UI + backward-compatible server resolution)

---

## Goal

AutoMaker currently exposes a broad BMAD persona roster (PM/Architect/Dev/etc). The goal is to **stop exposing/using the legacy BMAD roster** in AutoMaker and **replace it with the BMM‑Triad roster (3 personas)**:

| Target Persona ID             | Display Name (from manifest)                             | Responsibility                                               |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| `bmad:strategist-marketer`    | `Sage (Product Strategist + Market Intelligence Expert)` | Business WHY/WHO, product strategy, requirements, narrative  |
| `bmad:technologist-architect` | `Theo (Technical Architect + Implementation Specialist)` | Technical HOW, architecture, implementation, testing/quality |
| `bmad:fulfillization-manager` | `Finn (Delivery + Experience + Operations Specialist)`   | SHIP + UX/docs/ops + end-user experience                     |

Optional decision (call out explicitly in implementation): keep or hide `bmad:party-synthesis` (AutoMaker’s injected one-shot multi-agent “synthesis” persona). Current state: kept + exposed (triad-only synthesis).

---

## What’s Already Implemented (Verified in Repo)

### Spec definition of “complete”

The spec explicitly states triad is not “complete” until registration is done: `docs/bmm-triad-module-spec.md:391` (and full “Registration Requirements” section at `docs/bmm-triad-module-spec.md:399`).

### Triad module exists on disk (repo `_bmad/`)

Triad module files exist under:

- `_bmad/bmm-triad/agents/…`
- `_bmad/bmm-triad/workflows/…`
- `_bmad/bmm-triad/config.yaml`
- `_bmad/bmm-triad/data/migration-guide.md`
- `_bmad/bmm-triad/teams/default-party.csv`
- `_bmad/bmm-triad/_module-installer/module.yaml`

### Registration is done in repo `_bmad/_config`

Evidence (line refs):

- Module present in repo manifest: `_bmad/_config/manifest.yaml:10`
- Triad agents registered in repo agent manifest:
  - `_bmad/_config/agent-manifest.csv:21` (`technologist-architect`)
  - `_bmad/_config/agent-manifest.csv:22` (`strategist-marketer`)
  - `_bmad/_config/agent-manifest.csv:23` (`fulfillization-manager`)
- Triad files registered in repo files manifest: `_bmad/_config/files-manifest.csv:462` (11 `bmm-triad/...` entries through `:472`)

### CLI invocations exist (Claude + Codex)

This repo also has:

- Claude slash-commands: `.claude/commands/bmad/bmm-triad/...` (3 agent commands + 4 workflow commands)
- Codex prompts: `.codex/prompts/bmad-bmm-triad-*` (3 agent prompts + 4 workflow prompts)

These are relevant for human/operator workflows, but **AutoMaker runtime personas are not driven by these files** (AutoMaker uses `@automaker/bmad-bundle`).

---

## AutoMaker Runtime Source: `@automaker/bmad-bundle` (Resolved)

### AutoMaker’s persona source is `@automaker/bmad-bundle`

AutoMaker server lists personas by reading the **bundled** manifest:

- `apps/server/src/services/bmad-persona-service.ts` uses `getBmadAgentManifestPath()`
- `libs/bmad-bundle/src/index.ts` defines bundle root as `bundle/_bmad`

### Current bundled BMAD includes `bmm-triad`

The bundled BMAD directory currently contains only:
`libs/bmad-bundle/bundle/_bmad/{core,bmm,bmb,cis,_memory,bmm-triad}`.

This means:

- AutoMaker runtime persona listing can expose the triad personas from the bundled manifests.

Quick confirmation command:

```bash
ls libs/bmad-bundle/bundle/_bmad
```

---

## AutoMaker Integration Touchpoints (Where “Legacy BMAD” Is Wired In)

### 1) Packaging: `@automaker/bmad-bundle` contents + version

What exists today:

- Bundle version constant: `libs/bmad-bundle/src/index.ts:4`
- Bundled BMAD directory: `libs/bmad-bundle/bundle/_bmad/` (includes `bmm-triad/`)
- Bundled agent manifest: `libs/bmad-bundle/bundle/_bmad/_config/agent-manifest.csv` (includes triad rows)

Changes applied (shipped):

- Added `libs/bmad-bundle/bundle/_bmad/bmm-triad/`
- Updated bundled manifests under `libs/bmad-bundle/bundle/_bmad/_config/`:
  - `agent-manifest.csv` (triad rows)
  - `manifest.yaml` (includes `bmm-triad`)
  - `files-manifest.csv` (triad file entries + refreshed `_config` hashes)
- Bundle version bumped to `6.0.0-alpha.22` in `libs/bmad-bundle/package.json`

### 2) Server: persona listing + resolution

Persona list creation:

- `apps/server/src/services/bmad-persona-service.ts:97` builds `id: bmad:<row.name>` from the bundle’s CSV rows.
- `apps/server/src/services/bmad-persona-service.ts` injects `bmad:party-synthesis` and filters public personas to triad + party-synthesis.

Defaults logic:

- `apps/server/src/services/bmad-persona-service.ts` includes triad defaults (Sage=10000, Theo=12000, Finn=9000).

Scaffolding uses triad personas:

- `apps/server/src/services/bmad-service.ts` uses `bmad:strategist-marketer` / `bmad:technologist-architect` for methodology cards.

### 3) UI: built-in BMAD profiles + agent pickers

Default built-in profiles now include only triad + party-synthesis (plus 3 core profiles):

- `apps/ui/src/store/app-store.ts` (`DEFAULT_AI_PROFILES` has 7 entries total)

Feature creation dialog uses a triad-only multi-select:

- `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx` (Prompt tab: “Add Triad Agents to Task”, max 3)

Feature editing dialog shows a single “BMM Triad Agents” section (triad-only):

- `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx`

Profile form shows triad-only default agent selection:

- `apps/ui/src/components/views/profiles-view/components/profile-form.tsx`

---

## Recommended Migration Strategy (Two Phases)

### Phase A — Ship triad into AutoMaker without breaking existing users (Implemented ✅)

**A1) Update `@automaker/bmad-bundle` to include `bmm-triad`**

1. Copy module directory: `_bmad/bmm-triad/` → `libs/bmad-bundle/bundle/_bmad/bmm-triad/`
2. Update bundled `_config` manifests:
   - Add `bmm-triad` to bundled `manifest.yaml`
   - Append the 3 triad agent rows to bundled `agent-manifest.csv`
   - Append 11 file rows for triad files to bundled `files-manifest.csv` + refresh hashes for modified config files
3. Bump bundle version (recommended) and rebuild:
   - `libs/bmad-bundle/package.json`
   - `libs/bmad-bundle/src/index.ts:4`

**A2) Hide legacy personas from AutoMaker UI, but keep server compatibility**

- Prefer: `listPersonas()` returns only triad (plus optional `party-synthesis`) so UI cannot pick legacy personas anymore.
- But keep `resolvePersona()` able to resolve legacy IDs temporarily so old saved Feature cards (if any) don’t hard-break.

This is “remove from UI” without “break existing data”.

### Phase B — Fully remove legacy BMAD persona usage (Deferred)

Once you confirm there are no legacy persona IDs stored in user projects:

- Remove legacy persona IDs from:
  - UI built-in profiles (`apps/ui/src/store/app-store.ts`)
  - UI persona pickers (`add-feature-dialog.tsx`, `edit-feature-dialog.tsx`, `profile-form.tsx`)
  - Server scaffolding defaults (`apps/server/src/services/bmad-service.ts`)
  - Server `getAgentDefaults()` mapping (`apps/server/src/services/bmad-persona-service.ts`)
- Update unit tests that assume legacy personas exist:
  - `apps/server/tests/unit/services/bmad-persona-service.test.ts`

---

## Concrete Implementation Checklist (Triad-Only Target State)

### Bundle (must be done first)

- [x] `libs/bmad-bundle/bundle/_bmad/bmm-triad/` exists
- [x] `libs/bmad-bundle/bundle/_bmad/_config/agent-manifest.csv` contains triad rows
- [x] `libs/bmad-bundle/bundle/_bmad/_config/manifest.yaml` includes `bmm-triad`
- [x] `libs/bmad-bundle/bundle/_bmad/_config/files-manifest.csv` includes triad file entries + updated config hashes
- [x] (Recommended) bump `BMAD_BUNDLE_VERSION` and package version

### Server

- [x] Filter persona list to triad (plus optional `party-synthesis`):
  - `apps/server/src/services/bmad-persona-service.ts:97`
- [x] Add triad defaults:
  - `apps/server/src/services/bmad-persona-service.ts:308`
- [x] Update scaffolding cards to triad persona IDs:
  - `apps/server/src/services/bmad-service.ts:251`

### UI

- [x] Replace built-in BMAD profiles with triad profiles only:
  - `apps/ui/src/store/app-store.ts:849`
- [x] Replace agent pickers/groupings to show only triad:
  - `apps/ui/src/components/views/board-view/dialogs/add-feature-dialog.tsx:394`
  - `apps/ui/src/components/views/board-view/dialogs/edit-feature-dialog.tsx:562`
  - `apps/ui/src/components/views/profiles-view/components/profile-form.tsx:200`
- [x] Fix persona ID matching in `add-feature-dialog.tsx` (uses `bmad:`-prefixed IDs; triad-only)

---

## Persona Mapping (Legacy → Triad)

Reference mapping is documented in `_bmad/bmm-triad/data/migration-guide.md:66` (see “Map Current State” table).

Recommended mapping for AutoMaker:

| Legacy personaId                                        | Replace with                  | Why                                            |
| ------------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `bmad:pm`                                               | `bmad:strategist-marketer`    | Strategy + prioritization collapses into Sage  |
| `bmad:analyst`                                          | `bmad:strategist-marketer`    | Research + requirements collapse into Sage     |
| `bmad:innovation-strategist` / `bmad:storyteller`       | `bmad:strategist-marketer`    | Market + narrative collapse into Sage          |
| `bmad:architect`                                        | `bmad:technologist-architect` | Architecture collapses into Theo               |
| `bmad:dev` / `bmad:quick-flow-solo-dev`                 | `bmad:technologist-architect` | Implementation collapses into Theo             |
| `bmad:tea`                                              | `bmad:technologist-architect` | Testing strategy collapses into Theo           |
| `bmad:sm`                                               | `bmad:fulfillization-manager` | Delivery/process collapses into Finn           |
| `bmad:ux-designer`                                      | `bmad:fulfillization-manager` | UX collapses into Finn                         |
| `bmad:tech-writer`                                      | `bmad:fulfillization-manager` | Docs collapses into Finn                       |
| `bmad:brainstorming-coach` / `bmad:presentation-master` | `bmad:fulfillization-manager` | Facilitation/communication collapses into Finn |

Notes:

- `bmad:party-synthesis` is not part of the triad spec but is currently injected by AutoMaker (`apps/server/src/services/bmad-persona-service.ts:110`). Decide whether to keep it available, hide it, or remove it.
- Builder personas (`bmad:agent-builder`, `bmad:module-builder`, `bmad:workflow-builder`, and/or `bmad:bmad-master`) are not needed in a triad-only product UX. If you still need internal tooling, hide them from end-user selection.

---

## Acceptance Criteria (Triad Integration Done)

**Runtime (server API)**

- `GET /api/bmad/personas` returns only:
  - `bmad:strategist-marketer`
  - `bmad:technologist-architect`
  - `bmad:fulfillization-manager`
  - (optional) `bmad:party-synthesis`

**UI**

- No UI surface offers legacy BMAD personas in pickers, built-in profiles, or defaults.
- The “Select up to 4 specialized BMAD agents” copy is updated to triad language (and optionally max lowered to 3).

**Project install**

- Running “Initialize BMAD” installs triad into project root `_bmad/` (because the bundle now contains `bmm-triad`).

**Regression**

- Existing unit tests updated (or new tests added) to reflect triad-only behavior.

---

## Appendix: Key Evidence References (Triad Module Completion in Repo `_bmad/`)

- `docs/bmm-triad-module-spec.md:391` (registration required for “complete”)
- `_bmad/_config/agent-manifest.csv:21` (Theo)
- `_bmad/_config/agent-manifest.csv:22` (Sage)
- `_bmad/_config/agent-manifest.csv:23` (Finn)
- `_bmad/_config/manifest.yaml:10` (module listed)
- `_bmad/_config/files-manifest.csv:462` (triad file hashes begin; 11 entries)
- `.claude/commands/bmad/bmm-triad/workflows/triad-discovery.md:1` (workflow one-liner command format)
- `.codex/prompts/bmad-bmm-triad-workflows-triad-discovery.md:1` (Codex prompt one-liner command format)
