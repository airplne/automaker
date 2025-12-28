# README Security Section Update

This file contains the proposed security section to add to the main README.md. It should be inserted after the "Security Disclaimer" section and before "Community & Support".

---

## Security Features

Automaker includes multiple layers of security protection to safeguard your development environment:

### npm Supply Chain Protection

AI agents often need to install dependencies, which introduces supply chain attack risks. Automaker provides automatic protection:

- **Lifecycle scripts are blocked by default** - All `npm install`, `pnpm install`, and `yarn install` commands automatically use `--ignore-scripts` to prevent malicious code execution during installation
- **High-risk commands require approval** - Tools like `npx`, `npm exec`, `pnpm dlx`, and `yarn dlx` require explicit user consent before running
- **Smart approval dialogs** - When approval is needed, you get clear options to proceed safely, allow once, or cancel
- **Audit logging** - All security decisions are logged to `.automaker/npm-security-audit.jsonl` for review

**Security Modes:**

| Mode                 | Install Scripts | High-Risk Commands | Best For                    |
| -------------------- | --------------- | ------------------ | --------------------------- |
| **Strict** (default) | Blocked         | Require approval   | All projects                |
| **Prompt**           | Ask first       | Require approval   | Trusted projects            |
| **Allow**            | Allowed         | Allowed            | Fully trusted projects only |

For detailed information, see [npm Supply Chain Security](docs/security/npm-supply-chain.md).

### Isolation & Sandboxing

We **strongly recommend** running Automaker in Docker or VM isolation:

- **Docker containers** - Run agents in isolated containers with no host filesystem access ([Docker Isolation Guide](docs/docker-isolation.md))
- **Path sandboxing** - Optional `ALLOWED_ROOT_DIRECTORY` environment variable restricts file access to specific directories
- **Git worktree isolation** - Each feature runs in an isolated git worktree, protecting your main branch from experimental changes

### Additional Security

- **API key encryption** - Credentials stored securely in the `DATA_DIR` with encryption
- **Plan approval workflow** - Review AI-generated plans before implementation begins (optional)
- **Real-time monitoring** - Watch agent activity in real-time and stop if unexpected behavior occurs

**Security Disclaimer:** Automaker uses AI agents with access to your filesystem and command execution. See the full [Security Disclaimer](DISCLAIMER.md) for risks and recommendations.

---

## Suggested Placement

This section should replace or augment the existing brief security mention in the README. It should appear:

1. After the "Security Disclaimer" callout box
2. Before "Community & Support"
3. Include the security table for quick reference
4. Link to detailed documentation for users who want to learn more

## Additional Cross-References to Add

Consider adding these cross-references throughout the README:

**In the "Getting Started" section:**

```markdown
> **Security Note:** For untrusted projects, always run Automaker in [Docker isolation](docs/docker-isolation.md). See [npm Supply Chain Security](docs/security/npm-supply-chain.md) for details.
```

**In the "Features" > "Security & Isolation" section:**
Update the existing text to mention:

- npm supply chain protection
- Lifecycle script blocking
- Link to npm-supply-chain.md

**In the "Learn More" > "Documentation" section:**
Add:

```markdown
- [npm Supply Chain Security](./docs/security/npm-supply-chain.md) - Protection against malicious packages
```
