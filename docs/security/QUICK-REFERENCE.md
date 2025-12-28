# npm Security Quick Reference

One-page reference for Automaker's npm security guardrails.

## Security Modes

| Mode                 | Lifecycle Scripts | High-Risk Commands | Use Case                           |
| -------------------- | ----------------- | ------------------ | ---------------------------------- |
| **Strict** (default) | Blocked           | Require approval   | All projects, especially untrusted |
| **Prompt**           | Ask first         | Require approval   | Trusted projects you control       |
| **Allow**            | Allowed           | Allowed            | Fully trusted projects only        |

## Command Behavior

### Install Commands

- `npm install` → `npm install --ignore-scripts`
- `pnpm add pkg` → `pnpm add pkg --ignore-scripts`
- `yarn install` → `yarn install --ignore-scripts`

### High-Risk Commands (Require Approval)

- `npx create-react-app` - Downloads and executes immediately
- `npm exec package` - Executes package from npm
- `pnpm dlx tool` - Downloads and runs tool
- `yarn dlx utility` - Downloads and executes utility
- `bunx command` - Bun's execute command

## Approval Options

When a command requires approval:

1. **Proceed with scripts disabled** (recommended)
   - Adds `--ignore-scripts` automatically
   - Safest option

2. **Allow scripts once**
   - Runs command as-is this one time
   - Use when you trust the specific package

3. **Allow scripts for this worktree**
   - Remembers choice for current git worktree
   - Scoped to specific feature branch

4. **Allow scripts for this project**
   - Updates project security settings
   - Applies to all future commands

5. **Cancel**
   - Blocks the command
   - Agent receives error and can adjust

## Common Issues

### "Native module wasn't compiled"

**Problem:** Package needs lifecycle scripts to compile native code

**Solutions:**

1. Approve scripts once in dialog
2. Rebuild specific packages: `npm rebuild node-pty`
3. Use pre-built binaries if available

**Common packages needing scripts:**

- `node-pty` (terminal emulation)
- `esbuild` (bundler)
- `sharp` (image processing)
- `sqlite3` (database)
- `canvas` (graphics)

### "npx command was blocked"

**Problem:** High-risk execute command requires approval

**Solutions:**

1. Click "Allow once" if you trust the package
2. Install globally first: `npm install -g tool && tool`
3. Change to "prompt" mode for less friction

### "Module not found after install"

**Problem:** Package uses postinstall for setup

**Solutions:**

1. Review package's install script
2. Run setup manually if legitimate
3. Consider alternative package

## Configuration

### Project Settings

Location: `{projectPath}/.automaker/settings.json`

```json
{
  "npmSecurity": {
    "dependencyInstallPolicy": "strict",
    "allowInstallScripts": false,
    "allowedPackagesForRebuild": []
  }
}
```

### Change Security Mode

**Via UI:**
Settings > npm Security > Dependency Install Policy

**Via JSON:**

```json
{
  "npmSecurity": {
    "dependencyInstallPolicy": "prompt" // or "allow"
  }
}
```

## Audit Log

**Location:** `{projectPath}/.automaker/npm-security-audit.jsonl`

**View recent events:**

```bash
tail -20 .automaker/npm-security-audit.jsonl | jq .
```

**Filter by type:**

```bash
grep "approval-granted" .automaker/npm-security-audit.jsonl | jq .
```

**Event types:**

- `command-blocked`
- `command-rewritten`
- `approval-requested`
- `approval-granted`
- `approval-denied`
- `policy-changed`

## Best Practices

### All Projects

1. Use Docker/VM isolation
2. Keep strict mode enabled
3. Review approval requests carefully
4. Check audit log periodically

### Trusted Projects

1. Commit and update lockfiles
2. Use `npm ci` for reproducible builds
3. Run `npm audit` regularly
4. Research packages before adding

### Untrusted Projects

1. **Always** use Docker/VM isolation
2. **Never** approve without careful review
3. Run under limited user account
4. Monitor system activity

## Security Checklist

Before approving install scripts:

- [ ] Verified package name (no typos)
- [ ] Checked npm registry page
- [ ] Reviewed GitHub repository
- [ ] Checked recent issues/PRs
- [ ] Verified maintainer reputation
- [ ] Considered alternatives
- [ ] Running in isolated environment

## Quick Commands

### Install without scripts (manual)

```bash
npm install --ignore-scripts
pnpm install --ignore-scripts
yarn install --ignore-scripts
```

### Rebuild specific packages

```bash
npm rebuild package-name
```

### Check package info

```bash
npm view package-name
npm info package-name
```

### Audit dependencies

```bash
npm audit
npm audit fix
```

## Environment Variables

Automaker sets these by default in terminal sessions:

```bash
npm_config_ignore_scripts=true  # Block scripts by default
```

## Package Manager Support

| Package Manager | Install Detection | High-Risk Detection | Rewriting |
| --------------- | ----------------- | ------------------- | --------- |
| npm             | ✓                 | ✓                   | ✓         |
| pnpm            | ✓                 | ✓                   | ✓         |
| yarn            | ✓                 | ✓                   | ✓         |
| bun             | ✓                 | ✓                   | ✓         |

## Risk Levels

| Level      | Description                    | Example                        |
| ---------- | ------------------------------ | ------------------------------ |
| **High**   | Immediate code execution       | `npx create-react-app`         |
| **Medium** | Install with lifecycle scripts | `npm install`                  |
| **Low**    | Install with scripts blocked   | `npm install --ignore-scripts` |

## Getting Help

1. **Troubleshooting:** [npm-supply-chain.md](./npm-supply-chain.md) - Comprehensive guide
2. **Security Questions:** See "Reporting Security Issues" in npm-supply-chain.md
3. **Configuration:** Settings > npm Security in UI
4. **Docker Isolation:** [docker-isolation.md](../docker-isolation.md)

## Related Documentation

- [npm Supply Chain Security](./npm-supply-chain.md) - Full documentation
- [Docker Isolation Guide](../docker-isolation.md) - Isolated execution
- [Security Disclaimer](/DISCLAIMER.md) - General AI agent risks

---

**Quick Tip:** When in doubt, keep strict mode enabled and use Docker isolation.

**Remember:** No security feature is perfect. Always use Docker/VM isolation for untrusted projects.
