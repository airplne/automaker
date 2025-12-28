# Security Documentation

This directory contains comprehensive security documentation for Automaker's security features and best practices.

## Documents

### [npm Supply Chain Security](./npm-supply-chain.md)

**Primary documentation for npm security guardrails**

Learn about Automaker's built-in protections against npm supply chain attacks, including:

- Background on lifecycle scripts and remote execution risks
- Supply chain attack vectors (typosquatting, dependency confusion, compromised maintainers)
- How Automaker's protections work (strict mode, approval flow, command rewriting)
- Security modes (strict, prompt, allow)
- Best practices for trusted and untrusted projects
- Troubleshooting common issues
- Technical details and configuration

**Audience:** All users, especially those working with untrusted codebases

### [JSDoc Documentation Patterns](./jsdoc-patterns.md)

**Code documentation standards for npm security implementation**

Comprehensive JSDoc patterns and examples for documenting security-related code:

- Command classification functions
- Policy enforcement functions
- Audit logging functions
- Settings management functions
- Type documentation
- Testing documentation standards

**Audience:** Developers contributing to Automaker's security features

### [README Security Section](./README-security-section.md)

**Proposed updates to main README.md**

Contains the security section to add to the main README, including:

- Overview of npm supply chain protection
- Security modes comparison table
- Isolation and sandboxing recommendations
- Suggested cross-references throughout README

**Audience:** Developers updating the main README

## Related Documentation

### In Parent Directories

- [../docker-isolation.md](../docker-isolation.md) - Running Automaker in isolated Docker containers
- [../../DISCLAIMER.md](../../DISCLAIMER.md) - General security disclaimer and AI agent risks
- [../terminal.md](../terminal.md) - Terminal security and session management

## Quick Links

### For Users

- **New to Automaker?** Start with the [Security Disclaimer](../../DISCLAIMER.md) to understand the risks
- **Setting up for first time?** Read [Docker Isolation Guide](../docker-isolation.md) for the safest setup
- **Working with dependencies?** See [npm Supply Chain Security](./npm-supply-chain.md) for protection details

### For Developers

- **Adding security features?** Follow [JSDoc Patterns](./jsdoc-patterns.md) for documentation standards
- **Updating README?** Use the content from [README Security Section](./README-security-section.md)
- **Understanding implementation?** Read the inline JSDoc in:
  - `libs/types/src/npm-security.ts` - Type definitions
  - `apps/server/src/lib/npm-command-classifier.ts` - Command analysis
  - `apps/server/src/services/auto-mode-service.ts` - Policy enforcement

## Security Philosophy

Automaker's security approach is based on three principles:

### 1. Defense in Depth

Multiple layers of protection:

- Command rewriting (add `--ignore-scripts`)
- Approval workflows (high-risk commands)
- Audit logging (track all decisions)
- Environment hardening (secure defaults)

No single point of failure.

### 2. Secure by Default

Users get the strongest protection automatically:

- Strict mode enabled by default
- Lifecycle scripts blocked by default
- High-risk commands require approval
- Audit logging always active

Security requires opting out, not opting in.

### 3. User Control

Users can adjust security based on trust level:

- Per-project settings
- Granular approval options (once, worktree, project)
- Transparent decision-making (approval dialogs explain risks)
- Full audit trail (review past decisions)

## Security Responsibilities

### What Automaker Protects Against

- **npm lifecycle script attacks** - Malicious code in install/postinstall scripts
- **Remote execution attacks** - Dangerous npx/bunx/dlx commands
- **Typosquatting** - Similar package names (via approval review)
- **Dependency confusion** - Private package injection (via approval review)

### What Users Must Protect Against

- **Social engineering** - Users approving dangerous commands without review
- **Compromised host** - If your machine is already compromised, isolation is essential
- **File system access** - AI agents can access any files your user can access
- **Network access** - Agents can make network requests

**Bottom line:** Always use Docker/VM isolation for untrusted projects.

## Reporting Security Issues

If you discover a security vulnerability in Automaker:

1. **Do not** open a public GitHub issue
2. Email the maintainers privately with details
3. Include steps to reproduce and potential impact
4. Allow reasonable time for a fix before public disclosure

See [SECURITY.md](../../SECURITY.md) (if available) for detailed reporting guidelines.

## Security Resources

### npm Security

- [npm Blog: Package Install Scripts Vulnerability](https://blog.npmjs.org/post/141702881055/package-install-scripts-vulnerability-disclosed)
- [Snyk: npm Security Best Practices](https://snyk.io/blog/ten-npm-security-best-practices/)
- [Socket.dev: What Are npm Install Scripts?](https://socket.dev/blog/what-is-npm-install-scripts)

### Supply Chain Security

- [CISA: Software Supply Chain Security](https://www.cisa.gov/topics/software-security/software-supply-chain-security)
- [SLSA: Supply Chain Levels for Software Artifacts](https://slsa.dev/)
- [OWASP: Top 10 Software Component Security Risks](https://owasp.org/www-project-top-ten/)

### AI Security

- [OWASP: AI Security and Privacy Guide](https://owasp.org/www-project-ai-security-and-privacy-guide/)
- [NIST: AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)

---

**Last Updated:** 2025-12-27

**Maintained By:** Automaker Security Team
