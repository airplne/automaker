# npm Security Documentation Implementation Checklist

This checklist guides you through implementing the complete documentation for Automaker's npm security guardrails feature.

## Completed Items

- [x] Create `/docs/security/` directory
- [x] Write comprehensive npm supply chain security documentation
- [x] Create JSDoc patterns for code documentation
- [x] Prepare README security section updates
- [x] Create security documentation index

## Files Created

### Documentation Files

1. **`docs/security/npm-supply-chain.md`** (266 lines)
   - Comprehensive user guide for npm security features
   - Background on supply chain attacks
   - Security modes and configuration
   - Best practices and troubleshooting
   - Technical details

2. **`docs/security/jsdoc-patterns.md`** (540 lines)
   - JSDoc examples for all main security functions
   - Type documentation patterns
   - Testing documentation standards
   - Code documentation guidelines

3. **`docs/security/README-security-section.md`** (76 lines)
   - Proposed security section for main README
   - Security features overview table
   - Suggested cross-references
   - Placement guidance

4. **`docs/security/README.md`** (160 lines)
   - Security documentation index
   - Quick links for users and developers
   - Security philosophy
   - External resources

## Pending Tasks

### 1. Update Main README.md

**Location:** `/README.md`

**Action:** Add security features section after the Security Disclaimer callout (around line 98)

**Content to add:**

```markdown
## Security Features

Automaker includes multiple layers of security protection:

### npm Supply Chain Protection

- **Lifecycle scripts blocked by default** - `--ignore-scripts` added automatically
- **High-risk commands require approval** - `npx`, `npm exec`, etc. need consent
- **Smart approval dialogs** - Clear options to proceed safely or cancel
- **Audit logging** - All decisions logged to `.automaker/npm-security-audit.jsonl`

**Security Modes:**

| Mode                 | Install Scripts | High-Risk Commands | Best For                    |
| -------------------- | --------------- | ------------------ | --------------------------- |
| **Strict** (default) | Blocked         | Require approval   | All projects                |
| **Prompt**           | Ask first       | Require approval   | Trusted projects            |
| **Allow**            | Allowed         | Allowed            | Fully trusted projects only |

See [npm Supply Chain Security](docs/security/npm-supply-chain.md) for details.

### Isolation & Sandboxing

- **Docker containers** - [Docker Isolation Guide](docs/docker-isolation.md)
- **Path sandboxing** - `ALLOWED_ROOT_DIRECTORY` environment variable
- **Git worktree isolation** - Each feature runs in isolated worktree
```

**Cross-references to add:**

In "Learn More" > "Documentation" section (around line 537):

```markdown
- [npm Supply Chain Security](./docs/security/npm-supply-chain.md) - Protection against malicious packages
```

### 2. Add JSDoc Comments to Code Files

Apply the patterns from `docs/security/jsdoc-patterns.md` to these files:

**Priority 1 - Core Functions:**

- `apps/server/src/lib/npm-command-classifier.ts`
  - [x] File-level JSDoc already exists
  - [ ] Enhance `classifyCommand()` with example from jsdoc-patterns.md
  - [ ] Enhance `detectPackageManager()` with example
  - [ ] Enhance `rewriteInstallCommand()` with example
  - [ ] Add `hasIgnoreScriptsFlag()` documentation
  - [ ] Add utility function documentation

**Priority 2 - Type Definitions:**

- `libs/types/src/npm-security.ts`
  - [x] File-level JSDoc already exists
  - [ ] Enhance `ClassifiedCommand` interface with example
  - [ ] Enhance `NpmSecuritySettings` interface
  - [ ] Enhance `NpmSecurityApprovalRequest` interface
  - [ ] Enhance `NpmSecurityApprovalOption` interface

**Priority 3 - Service Functions:**

- `apps/server/src/services/auto-mode-service.ts`
  - [ ] Add JSDoc for `enforceNpmSecurityPolicy()` function
  - [ ] Add JSDoc for `createApprovalRequest()` function
  - [ ] Add JSDoc for `logNpmSecurityEvent()` function

**Priority 4 - Settings Functions:**

- `apps/server/src/lib/settings-helpers.ts`
  - [ ] Add JSDoc for `getNpmSecuritySettings()` function
  - [ ] Add JSDoc for `updateNpmSecuritySettings()` function

### 3. Update Related Documentation

**`docs/docker-isolation.md`:**

Add cross-reference to npm security:

```markdown
## Security Benefits

Running in Docker provides multiple security advantages:

- Isolated filesystem (agents cannot access host files)
- No access to host credentials
- Combined with [npm supply chain protection](security/npm-supply-chain.md) for defense-in-depth
```

**`DISCLAIMER.md`:**

Add reference to npm security features:

```markdown
## Automaker's Built-in Protections

While AI agents have significant system access, Automaker includes security features:

- npm supply chain protection (see [npm Supply Chain Security](docs/security/npm-supply-chain.md))
- Git worktree isolation
- Optional path sandboxing

These features reduce risk but do not eliminate it. Docker/VM isolation is still strongly recommended.
```

### 4. Add UI Documentation Comments

**Settings Component:**

- `apps/ui/src/components/views/settings-view/npm-security.tsx` (if exists)
  - [ ] Add component-level JSDoc explaining the settings UI
  - [ ] Document each setting's security implications

**Approval Dialog:**

- `apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx` (if exists)
  - [ ] Add component-level JSDoc explaining approval flow
  - [ ] Document each approval option

### 5. Create Tests Documentation

Add test file headers explaining security coverage:

**`apps/server/tests/unit/lib/npm-command-classifier.test.ts`:**

```typescript
/**
 * Test suite for npm command classification security features.
 *
 * Tests verify that:
 * - All package managers are correctly detected
 * - High-risk commands are properly flagged
 * - Command rewriting preserves shell syntax
 * - Edge cases (subshells, operators) are handled
 *
 * Security coverage:
 * - Malicious command patterns
 * - Shell injection attempts
 * - Commands that try to bypass --ignore-scripts
 */
```

### 6. Add Inline Code Comments

For complex security logic, add inline comments explaining the security reasoning:

**Example in `npm-command-classifier.ts`:**

```typescript
// Use word boundaries to avoid false matches in paths
// For example, "/path/to/npm-packages" should not match as npm
if (/\b(npx|npm)\b/.test(normalized)) {
  return 'npm';
}
```

**Example in policy enforcement:**

```typescript
// High-risk execute commands always require approval, even in allow mode
// This provides a security backstop against accidental dangerous executions
if (classified.isHighRiskExecute && settings.dependencyInstallPolicy !== 'allow') {
  requiresApproval = true;
}
```

## Verification Steps

After implementing documentation:

### 1. Documentation Quality

- [ ] All security documentation is clear and actionable
- [ ] Examples are practical and tested
- [ ] Cross-references are correct and work
- [ ] No broken links in markdown files

### 2. Code Documentation

- [ ] All public functions have JSDoc comments
- [ ] JSDoc examples compile and run correctly
- [ ] Parameter descriptions are accurate
- [ ] Return types are documented

### 3. User Experience

- [ ] New users can find npm security documentation easily
- [ ] Troubleshooting section addresses common issues
- [ ] Security recommendations are prominent
- [ ] Technical details don't overwhelm basic guidance

### 4. Developer Experience

- [ ] Contributors can understand security code
- [ ] JSDoc provides useful IDE tooltips
- [ ] Test coverage is clear from documentation
- [ ] Security philosophy is communicated

## Build and Test

After adding JSDoc comments, verify:

```bash
# TypeScript compilation
npm run build:packages

# Linting
npm run lint

# Tests
npm run test:server

# Verify JSDoc appears in IDE
# Open any file and hover over documented functions
```

## Documentation Style Guide

When writing security documentation:

### DO

- Use clear, direct language
- Provide concrete examples
- Explain WHY, not just WHAT
- Link to related documentation
- Include troubleshooting for common issues
- Show both safe and unsafe examples
- Explain the threat model

### DON'T

- Use jargon without explanation
- Assume deep technical knowledge
- Skip security implications
- Provide examples without context
- Hide risks or limitations
- Oversell protection ("100% secure")
- Make users feel blamed for security issues

## Security Documentation Principles

1. **Transparency** - Clearly state what is and isn't protected
2. **Actionability** - Provide concrete steps users can take
3. **Progressiveness** - Start simple, allow deeper exploration
4. **Accuracy** - Never overstate security guarantees
5. **Accessibility** - Make security understandable to all skill levels

## Questions to Ask

Before marking documentation complete:

- Can a new user understand the security risks?
- Can they configure security settings appropriately?
- Do they know what to do when commands are blocked?
- Can contributors add security features correctly?
- Is the threat model clear?
- Are limitations honestly communicated?
- Is Docker/VM isolation prominently recommended?

## Maintenance

Security documentation should be reviewed:

- When npm security features change
- When new attack vectors are discovered
- When user questions reveal gaps
- At least quarterly for accuracy

Keep documentation in sync with code changes.

---

**Implementation Priority:**

1. Update main README.md (high visibility)
2. Add JSDoc to npm-command-classifier.ts (most referenced)
3. Update DISCLAIMER.md (critical security context)
4. Enhance type definitions (developer experience)
5. Add service function documentation (completeness)

**Estimated Time:**

- README updates: 30 minutes
- Code JSDoc: 2-3 hours
- Related doc updates: 1 hour
- Verification: 1 hour

**Total: ~5 hours**
