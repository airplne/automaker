# PRP: Fix UI Crash - Undefined Project Path Access

**Status:** 🚨 URGENT - BLOCKS UI USAGE
**Created:** 2025-12-28
**Team:** Claude Dev Team
**Priority:** P0 - Critical

---

## Error

```
Cannot read properties of undefined (reading '/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test')
```

**Impact:** UI crashes when trying to access project data. AutoMaker UI unusable.

**Context:**

- Server is running successfully (http://localhost:3008)
- Error occurs in UI/Electron layer
- Error appeared after Executive Suite expansion implementation

---

## ULTRATHINK Analysis

### Error Pattern

The error indicates:

```javascript
undefined['/home/aip0rt/Desktop/CatalogBridge/cb-mono/Test'];
```

This means:

1. Code is trying to access a property on an object
2. The property key is a project path (absolute path)
3. The object itself is `undefined` (not initialized)

### Likely Root Causes

| Hypothesis                                  | Probability | Location                           |
| ------------------------------------------- | ----------- | ---------------------------------- |
| Project settings cache not initialized      | High        | `apps/ui/src/store/app-store.ts`   |
| Recent projects map undefined               | High        | `apps/ui/src/store/app-store.ts`   |
| BMAD persona profiles cache broken          | Medium      | Related to Executive Suite changes |
| Project-specific state accessed before load | Medium      | Component lifecycle issue          |

---

## Investigation Steps

### Step 1: Find the Error Source

**Open browser DevTools:**

1. In Electron app, press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac)
2. Go to Console tab
3. Look for the full stack trace of the error
4. Identify which file and line number is throwing the error

**Search codebase for project path access patterns:**

```bash
# Find where project paths are used as object keys
rg "\[projectPath\]|\[.*path.*\]" apps/ui/src/store/ apps/ui/src/hooks/ apps/ui/src/components/

# Find Map/Object access with paths
rg "\.get\(.*Path\)|\.set\(.*Path\)" apps/ui/src/

# Find settings/cache access
rg "projectSettings|recentProjects|projectCache" apps/ui/src/
```

### Step 2: Check App Store State Initialization

**File:** `apps/ui/src/store/app-store.ts`

**Search for:**

```typescript
// Look for Maps or objects that might not be initialized
projectSettings;
recentProjects;
projectCache;
settings;
```

**Verify initialization:**

- Is the object initialized in the store's initial state?
- Is it `undefined` or `null` before being set?
- Are there any early access points before initialization?

### Step 3: Check Executive Suite Changes

The error appeared after Executive Suite expansion. Check if the changes broke state initialization:

```bash
# Check what changed in app-store
git diff HEAD~5 apps/ui/src/store/app-store.ts

# Check if DEFAULT_AI_PROFILES changes broke something
rg "DEFAULT_AI_PROFILES" apps/ui/src/store/app-store.ts -A 10 -B 5
```

### Step 4: Check Project Loading Flow

**Trace the flow:**

1. UI loads → `app-store.ts` initializes
2. Recent projects loaded
3. Project selected
4. Project-specific data accessed

**Find where the crash happens:**

```bash
# Check components that access project data
rg "projectPath.*\[|\.get.*projectPath" apps/ui/src/components/views/

# Check hooks that use project state
rg "useProject|useSettings" apps/ui/src/hooks/
```

---

## Likely Fixes

### Fix 1: Initialize Map/Object Before Access

**If the issue is an uninitialized Map:**

```typescript
// BEFORE (BROKEN):
const projectSettings: Map<string, ProjectSettings> | undefined;
// Later:
projectSettings[projectPath]; // CRASH - projectSettings is undefined

// AFTER (FIXED):
const projectSettings: Map<string, ProjectSettings> = new Map();
// Later:
projectSettings.get(projectPath); // Safe
```

### Fix 2: Add Null Checks

**Add defensive checks:**

```typescript
// BEFORE (BROKEN):
const settings = projectSettingsMap[projectPath];

// AFTER (FIXED):
const settings = projectSettingsMap?.[projectPath] ?? defaultSettings;
```

### Fix 3: Fix Initialization Order

**If state is accessed before initialization:**

```typescript
// Ensure initialization happens in store creation
const useAppStore = create<AppState>((set, get) => ({
  // Initialize ALL maps/objects in initial state
  projectSettings: new Map(),
  recentProjects: [],
  // ...
}));
```

---

## Debug Commands

### Check Browser Console

```bash
# Start with DevTools open
npm run dev:electron:debug
```

In DevTools Console, check:

```javascript
// Check if store is initialized
window.__AUTOMAKER_STORE__;

// Check state
console.log(useAppStore.getState());
```

### Check for Recent Changes

```bash
# What changed in the last 5 commits to app-store?
git log -5 --oneline -- apps/ui/src/store/app-store.ts

# Show actual changes
git diff HEAD~5 apps/ui/src/store/app-store.ts

# Check if Executive Suite PR introduced the bug
git log --all --grep="Executive Suite" --oneline
git diff <commit-before-exec-suite> <commit-after-exec-suite> -- apps/ui/src/store/
```

---

## Verification Checklist

- [ ] Identify exact file and line number throwing the error (from stack trace)
- [ ] Identify which object/Map is undefined
- [ ] Verify initialization of that object in store initial state
- [ ] Add null checks or proper initialization
- [ ] Test: Create new project → No crash
- [ ] Test: Open existing project → No crash
- [ ] Test: Switch between projects → No crash
- [ ] Verify no other undefined access patterns exist

---

## Expected Deliverables

1. **Root cause identification:**
   - File and line number
   - Which object/Map is undefined
   - Why it's undefined

2. **Fix applied:**
   - Code changes
   - Explanation of fix

3. **Verification:**
   - UI loads without crash
   - Projects can be opened
   - Executive agents visible and selectable

---

## Emergency Workaround (If Needed)

If fix takes time, add temporary defensive code:

```typescript
// Wrap the crashing code in try-catch
try {
  const settings = projectSettingsMap[projectPath];
} catch (error) {
  console.error('Project settings access failed:', error);
  // Use defaults
  const settings = DEFAULT_PROJECT_SETTINGS;
}
```

---

## Timeline

**Estimated investigation time:** 5-15 minutes
**Estimated fix time:** 2-10 minutes
**Total:** 10-25 minutes

---

## Additional Context

**Suspicious areas based on Executive Suite work:**

1. `apps/ui/src/store/app-store.ts` - DEFAULT_AI_PROFILES was modified
2. Profile/persona-related state initialization
3. Project settings that reference personas

**Check if:**

- New executive agents broke profile initialization
- Project settings expecting old triad IDs
- Cache/Map of project-persona mappings not initialized

---

_Generated by BMAD Party Mode - Emergency Response_
