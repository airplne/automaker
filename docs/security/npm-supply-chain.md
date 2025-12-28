# npm Supply Chain Security

Automaker includes built-in protections against npm supply chain attacks. This document explains the risks, protections, and how to configure them.

## Background

When an Automaker agent works on a project, it often needs to install dependencies via `npm install`, `pnpm install`, or `yarn install`. The npm ecosystem has known security risks that can be exploited by malicious or compromised packages.

### Lifecycle Scripts

npm packages can define scripts that run automatically during installation:

- `preinstall` - runs before installation begins
- `install` - runs during installation
- `postinstall` - runs after installation completes
- `prepare` - runs after installation and before publish

These scripts can execute **arbitrary code** with your user's permissions. A malicious or compromised package can:

- **Steal credentials** - SSH keys, AWS tokens, npm tokens, API keys from environment variables
- **Modify or delete files** - Access any file your user account can access
- **Install persistence mechanisms** - Add cron jobs, launch agents, modify shell profiles
- **Exfiltrate data** - Upload source code, credentials, or other sensitive information
- **Open network connections** - Communicate with external servers
- **Mine cryptocurrency** - Consume system resources for malicious purposes

### Remote Execution Commands

Commands like `npx`, `npm exec`, `pnpm dlx`, and `yarn dlx` download and execute packages immediately without adding them to your project dependencies. This is **extremely high-risk** for untrusted packages because:

- Code executes with full system access immediately
- No opportunity to review code before execution
- No record in package.json or lockfiles
- Often used in tutorials targeting beginners

### Supply Chain Attacks

Real-world attack vectors include:

- **Typosquatting** - Malicious packages with names similar to popular packages (e.g., `crossenv` vs `cross-env`)
- **Dependency confusion** - Exploiting npm's package resolution to inject malicious private packages
- **Compromised maintainers** - Legitimate packages taken over by attackers through stolen credentials or social engineering
- **Malicious updates** - Trusted packages that introduce malicious code in later versions
- **Transitive dependencies** - Malicious code hidden deep in the dependency tree

## Automaker's Protections

### Default Behavior (Strict Mode)

By default, Automaker implements a defense-in-depth approach:

1. **Blocks install scripts** - All `npm install`, `pnpm install`, and `yarn install` commands are automatically rewritten to include `--ignore-scripts`

2. **Blocks high-risk execution** - Commands like `npx`, `npm exec`, `pnpm dlx`, `yarn dlx`, and `bunx` require explicit user approval before execution

3. **Hardens terminal sessions** - Terminal sessions launched through Automaker include secure npm environment variables by default

### Approval Flow

When an agent attempts a blocked command, you'll see an approval dialog with these options:

- **Proceed with scripts disabled** (recommended) - Run the command with `--ignore-scripts` automatically added. This is the safest option that still allows dependency installation.

- **Allow scripts once** - Run the command as-is this one time, allowing lifecycle scripts to execute. Use this when you trust the specific packages being installed.

- **Allow scripts for this worktree** - Remember the choice for the current git worktree. Future commands in this worktree won't require approval.

- **Allow scripts for this project** - Remember the choice for the entire project. Updates the project's npm security policy.

- **Cancel** - Block the command entirely. The agent will receive an error and can adjust its approach.

### Security Modes

You can adjust the security policy per project in **Settings > npm Security**:

| Mode                 | Install Scripts    | High-Risk Commands | Best For                                                       |
| -------------------- | ------------------ | ------------------ | -------------------------------------------------------------- |
| **Strict** (default) | Blocked by default | Require approval   | All projects, especially those you don't fully control         |
| **Prompt**           | Require approval   | Require approval   | Trusted projects where you want review before allowing scripts |
| **Allow**            | Allowed            | Allowed            | Only for fully trusted projects you control completely         |

### Configuration Options

Each project can configure:

- **Dependency Install Policy** - Choose strict, prompt, or allow mode
- **Allow Install Scripts** - Global toggle for lifecycle scripts
- **Allowed Packages for Rebuild** - Whitelist specific packages that need native compilation (future feature)

## Best Practices

### For All Projects

1. **Use Docker/VM isolation** - The strongest protection is running Automaker agents in isolated environments where they cannot access your personal files, credentials, or SSH keys. See [Docker Isolation Guide](/docs/docker-isolation.md).

2. **Keep strict mode enabled** - Only relax security settings when you have a specific, justified need. Return to strict mode when done.

3. **Review approval requests carefully** - Before approving script execution:
   - Check the package name for typos or suspicious variations
   - Verify it's from a trusted source (check npm registry, GitHub stars, maintainer)
   - Consider the project's maturity and community trust
   - Review recent issues for security concerns

4. **Monitor the audit log** - Periodically review `.automaker/npm-security-audit.jsonl` to see what commands were blocked or approved.

### For Trusted Projects

If you're working on a project you fully control and trust:

1. **Keep lockfiles committed** - Ensure `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` is committed and up to date

2. **Use deterministic installs** - Prefer `npm ci` over `npm install` for reproducible builds from lockfiles

3. **Run security audits** - Regularly run `npm audit` to detect known vulnerabilities

4. **Review dependencies** - Before adding new packages, research their security posture, maintenance status, and community reputation

5. **Consider project-level `.npmrc`** - For maximum security, add `ignore-scripts=true` to your project's `.npmrc` file

### For Untrusted Projects

If you're running agents on third-party projects or unfamiliar codebases:

1. **Always use Docker/VM isolation** - This is non-negotiable for untrusted code

2. **Keep strict mode enabled** - Never relax security settings for untrusted projects

3. **Never approve script execution** without careful review of:
   - Every package being installed
   - The project's package.json and lockfiles
   - Recent commits to the repository
   - The maintainer's reputation

4. **Use a separate user account** - Run Automaker under a limited user account with no access to personal files or credentials

5. **Monitor system activity** - Use process monitors or security tools to watch for suspicious activity

## Troubleshooting

### "Build failed because native module wasn't compiled"

Some legitimate packages require lifecycle scripts to compile native code (e.g., `node-pty`, `esbuild`, `sharp`, `sqlite3`, `canvas`).

**Solutions:**

1. **One-time approval** - Click "Allow scripts once" in the approval dialog to compile the specific package

2. **Use pre-built binaries** - Many packages offer pre-built binaries. Check if your package supports them:

   ```bash
   # Example for node-pty
   npm install node-pty --ignore-scripts
   # Then download pre-built binary separately
   ```

3. **Rebuild specific packages** - After installing with `--ignore-scripts`, rebuild only trusted packages:

   ```bash
   npm install --ignore-scripts
   npm rebuild node-pty sqlite3
   ```

4. **Whitelist packages** - (Future feature) Add trusted packages to the allowed rebuild list in settings

### "npx command was blocked"

High-risk execution commands require approval to protect against arbitrary code execution.

**Solutions:**

1. **Approve in dialog** - Click "Allow once" if you trust the package being executed

2. **Use prompt mode** - Change to "prompt" mode in settings for less friction with high-risk commands

3. **Install first, then execute** - Instead of `npx create-react-app`, do:

   ```bash
   npm install -g create-react-app
   create-react-app my-app
   ```

4. **Review the package** - Before approving, verify the package on npm registry and check its reputation

### "Cannot find module after install"

If packages are missing after installing with `--ignore-scripts`:

1. **Check for postinstall setup** - Some packages use postinstall to set up their structure. Review the package's install script to see if it's doing legitimate setup vs running arbitrary code.

2. **Run setup manually** - If the postinstall is just file copying or configuration, you can often do it manually

3. **Use a different package** - Consider alternatives that don't require lifecycle scripts

### Understanding the Audit Log

The audit log is stored at `.automaker/npm-security-audit.jsonl` (JSON Lines format, one event per line).

Each entry includes:

- **timestamp** - When the event occurred
- **eventType** - Type of security event (command-blocked, approval-granted, etc.)
- **command** - Full command details including risk level
- **decision** - User's choice (if applicable)

You can view recent events:

```bash
tail -20 .automaker/npm-security-audit.jsonl | jq .
```

Or filter by event type:

```bash
grep "approval-granted" .automaker/npm-security-audit.jsonl | jq .
```

## Technical Details

### How Command Rewriting Works

When strict mode is enabled:

1. **Command classification** - Every shell command is analyzed to detect package manager operations
2. **Risk assessment** - Commands are classified by type (install, high-risk-execute, script-run, other) and risk level (low, medium, high)
3. **Policy enforcement** - Based on the command type and project security settings, commands may be:
   - Rewritten to add `--ignore-scripts`
   - Blocked pending user approval
   - Allowed through unchanged

### Supported Package Managers

Automaker protects installations across all major package managers:

- **npm** - `npm install`, `npm ci`, `npm add`, `npx`, `npm exec`
- **pnpm** - `pnpm install`, `pnpm add`, `pnpm dlx`, `pnpm exec`
- **yarn** - `yarn`, `yarn install`, `yarn add`, `yarn dlx`
- **bun** - `bun install`, `bun add`, `bunx`, `bun x`

### Environment Hardening

Terminal sessions include these npm security environment variables:

```bash
npm_config_ignore_scripts=true  # Block lifecycle scripts by default
```

This provides defense-in-depth even if command rewriting is bypassed.

## Related Documentation

- [Security Disclaimer](/DISCLAIMER.md) - General security warnings and AI agent risks
- [Docker Isolation Guide](/docs/docker-isolation.md) - Running Automaker in isolated containers
- [Settings Documentation](/docs/settings.md) - Configuring Automaker settings

## Security Resources

- [npm Blog: Security Best Practices](https://blog.npmjs.org/post/141702881055/package-install-scripts-vulnerability-disclosed)
- [Snyk: npm Security Best Practices](https://snyk.io/blog/ten-npm-security-best-practices/)
- [Socket.dev: Supply Chain Security](https://socket.dev/blog/what-is-npm-install-scripts)

## Reporting Security Issues

If you discover a security vulnerability in Automaker's npm protection system:

1. **Do not** open a public GitHub issue
2. Email the maintainers privately with details
3. Include steps to reproduce and potential impact
4. Allow time for a fix before public disclosure

---

**Remember**: No security system is perfect. The safest approach is **always** running Automaker in Docker or VM isolation, especially for untrusted projects.
