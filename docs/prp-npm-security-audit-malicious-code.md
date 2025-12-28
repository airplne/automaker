# PRP: Security Audit — Malicious Code Detection in npm Security Implementation

## Context

The Claude team implemented npm security guardrails. This PRP performs an adversarial security audit to detect any malicious code, backdoors, RATs, data exfiltration, or supply chain attack vectors that may have been introduced.

**IMPORTANT:** This is a defensive audit. Assume hostile intent and verify everything.

---

## Threat Model

| Threat            | Description                                      | Detection Method               |
| ----------------- | ------------------------------------------------ | ------------------------------ |
| Backdoor          | Hidden command execution path bypassing security | Code path analysis             |
| RAT               | Remote access trojan / reverse shell             | Network call detection         |
| Data Exfiltration | Sending user data to external servers            | Outbound request scan          |
| Credential Theft  | Stealing API keys, tokens, env vars              | Sensitive data access patterns |
| Supply Chain      | Malicious dependencies introduced                | Package.json diff              |
| Logic Bomb        | Time-delayed or conditional malicious behavior   | Conditional logic audit        |
| Bypass Path       | Intentional hole in security policy              | Policy enforcement audit       |

---

## Audit Tasks

### Phase 1: Network & External Communication (Agents 1-3)

#### Agent 1: Scan for Outbound Network Calls

```bash
# Look for fetch, axios, http, https, request, got, node-fetch in new files
rg -n "fetch\(|axios\.|http\.|https\.|request\(|got\(|node-fetch" \
  apps/server/src/lib/npm-command-classifier.ts \
  apps/server/src/lib/npm-security-policy.ts \
  apps/server/src/routes/npm-security/ \
  apps/server/src/services/settings-service.ts

# Check for WebSocket connections
rg -n "WebSocket|ws://|wss://|socket\.io" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/
```

**Expected:** NO external network calls in security enforcement code

**RED FLAG:** Any fetch/axios/http call to external URLs

---

#### Agent 2: Scan for DNS/IP Resolution

```bash
# Look for DNS lookups or hardcoded IPs
rg -n "dns\.|resolve\(|lookup\(|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|[a-z0-9]+\.(com|net|org|io)" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/

# Check for base64 encoded URLs (common obfuscation)
rg -n "atob\(|btoa\(|Buffer\.from\(.*base64|fromCharCode" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/
```

**Expected:** NO hardcoded external domains or IPs

**RED FLAG:** Base64 encoded strings, obfuscated URLs

---

#### Agent 3: Scan UI for External Calls

```bash
# Check UI components for suspicious network activity
rg -n "fetch\(|axios|http://|https://|\.send\(|\.post\(" \
  apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx \
  apps/ui/src/components/views/settings-view/npm-security/ \
  apps/ui/src/hooks/use-npm-security-events.ts

# Look for external script loading
rg -n "createElement\('script'\)|\.src\s*=|eval\(|Function\(" \
  apps/ui/src/components/dialogs/npm-security*.tsx \
  apps/ui/src/components/views/settings-view/npm-security/
```

**Expected:** Only calls to local `/api/` endpoints

**RED FLAG:** External URLs, dynamic script injection, eval()

---

### Phase 2: Command Execution & Shell Access (Agents 4-6)

#### Agent 4: Scan for Hidden Command Execution

```bash
# Look for exec, spawn, execSync, child_process
rg -n "exec\(|execSync|spawn\(|spawnSync|child_process|shelljs|execa" \
  apps/server/src/lib/npm-command-classifier.ts \
  apps/server/src/lib/npm-security-policy.ts \
  apps/server/src/routes/npm-security/

# Check for process.env manipulation beyond expected
rg -n "process\.env\[|process\.env\.|process\.kill|process\.exit" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/
```

**Expected:** Command classifier should ONLY classify, not execute. Policy engine may read env but should NOT execute commands.

**RED FLAG:** Any exec/spawn calls in classifier or policy files

---

#### Agent 5: Verify Terminal Service Changes Are Safe

```bash
# Check terminal-service.ts changes specifically
git diff HEAD~20 -- apps/server/src/services/terminal-service.ts | head -200

# Look for any new command execution paths
rg -n "exec|spawn|shell|child_process" apps/server/src/services/terminal-service.ts
```

**Expected:** Only env var injection, no new command execution paths

**RED FLAG:** New exec/spawn calls, bypassing existing security

---

#### Agent 6: Check for Command Injection Vulnerabilities

```bash
# Look for string concatenation in commands
rg -n "\`.*\$\{|\" \+ |' \+ |\.join\(.*shell" \
  apps/server/src/lib/npm-command-classifier.ts \
  apps/server/src/lib/npm-security-policy.ts

# Check for unsanitized user input in commands
rg -n "userInput|req\.body|req\.query|req\.params" \
  apps/server/src/routes/npm-security/*.ts \
  apps/server/src/lib/npm-*.ts
```

**Expected:** No string concatenation building shell commands

**RED FLAG:** User input directly in command strings without sanitization

---

### Phase 3: Data Access & Credential Handling (Agents 7-9)

#### Agent 7: Scan for Credential Access

```bash
# Look for API key, token, password, secret access
rg -n "API_KEY|TOKEN|PASSWORD|SECRET|ANTHROPIC|OPENAI|credential|apiKey|accessToken" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/

# Check for reading sensitive files
rg -n "\.env|credentials|\.ssh|id_rsa|\.npmrc|\.netrc" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/
```

**Expected:** NO access to credentials in npm security code

**RED FLAG:** Reading API keys, tokens, or sensitive files

---

#### Agent 8: Verify Audit Log Doesn't Leak Sensitive Data

```bash
# Check what gets logged to audit file
rg -n "logNpmSecurityAudit|writeFile.*audit|appendFile.*audit" \
  apps/server/src/services/settings-service.ts \
  apps/server/src/lib/npm-security-policy.ts

# Check audit entry structure for sensitive fields
rg -A 20 "NpmSecurityAuditEntry|interface.*Audit" libs/types/src/npm-security.ts
```

**Expected:** Audit logs contain only: timestamp, command, decision, policy mode

**RED FLAG:** Logging full environment, API keys, or user data

---

#### Agent 9: Check for Data Exfiltration via Audit

```bash
# Verify audit writes only to local file, not network
rg -n "fetch|axios|http|send\(" \
  apps/server/src/services/settings-service.ts | grep -i audit

# Check audit file path is within project only
rg -n "\.automaker/npm-security-audit|auditPath|AUDIT_FILE" \
  apps/server/src/services/settings-service.ts \
  apps/server/src/lib/npm-security-policy.ts
```

**Expected:** Writes only to `.automaker/npm-security-audit.jsonl` within project

**RED FLAG:** Network calls in audit code, writing outside project directory

---

### Phase 4: Policy Bypass & Logic Bombs (Agents 10-12)

#### Agent 10: Check for Hidden Bypass Conditions

```bash
# Look for suspicious conditionals that always allow
rg -n "if.*true|if.*1.*===.*1|if.*false.*\|\||DEBUG|SKIP_SECURITY|BYPASS" \
  apps/server/src/lib/npm-security-policy.ts \
  apps/server/src/lib/npm-command-classifier.ts

# Check for environment variable overrides
rg -n "process\.env\..*SKIP|process\.env\..*BYPASS|process\.env\..*DISABLE" \
  apps/server/src/lib/npm-*.ts
```

**Expected:** NO always-true conditions or bypass env vars

**RED FLAG:** Hidden debug flags, always-allow conditions

---

#### Agent 11: Check for Time-Based Logic Bombs

```bash
# Look for date/time checks that could trigger later
rg -n "Date\.|getTime\(|setTimeout|setInterval|new Date" \
  apps/server/src/lib/npm-command-classifier.ts \
  apps/server/src/lib/npm-security-policy.ts

# Check for specific date comparisons
rg -n "2024|2025|2026|January|February|March|April|May|June|July|August|September|October|November|December" \
  apps/server/src/lib/npm-*.ts
```

**Expected:** Date usage only for timestamps in audit logs

**RED FLAG:** Future date comparisons, delayed execution logic

---

#### Agent 12: Verify Strict Mode is Actually Strict

```bash
# Check strict mode implementation
rg -A 10 "strict|Strict" apps/server/src/lib/npm-security-policy.ts

# Verify --ignore-scripts is ALWAYS added in strict mode
rg -n "ignore-scripts|ignoreScripts" apps/server/src/lib/npm-command-classifier.ts
```

**Expected:** Strict mode ALWAYS blocks scripts, no exceptions

**RED FLAG:** Conditions that bypass strict mode

---

### Phase 5: Dependency & Supply Chain (Agents 13-14)

#### Agent 13: Check for New Dependencies

```bash
# Diff package.json files
git diff HEAD~20 -- package.json apps/server/package.json apps/ui/package.json libs/types/package.json

# List any new dependencies
git diff HEAD~20 -- "**/package.json" | grep "^\+"
```

**Expected:** NO new dependencies added for npm security feature

**RED FLAG:** New npm packages, especially obscure or recently published ones

---

#### Agent 14: Check for Dynamic Requires/Imports

```bash
# Look for dynamic imports that could load malicious code
rg -n "require\(\s*[^'\"]|import\(\s*[^'\"]|require\(.*\+|import\(.*\+" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/

# Check for __dirname manipulation
rg -n "__dirname|__filename|path\.join\(.*\.\./" \
  apps/server/src/lib/npm-*.ts
```

**Expected:** Only static imports with explicit paths

**RED FLAG:** Dynamic require/import, path traversal

---

### Phase 6: UI Attack Vectors (Agents 15-16)

#### Agent 15: Check for XSS in Approval Dialog

```bash
# Look for dangerouslySetInnerHTML or innerHTML
rg -n "dangerouslySetInnerHTML|innerHTML|__html" \
  apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx \
  apps/ui/src/components/views/settings-view/npm-security/

# Check for unsanitized rendering of command strings
rg -n "command|cmd" apps/ui/src/components/dialogs/npm-security-approval-dialog.tsx
```

**Expected:** Command displayed as text, not HTML

**RED FLAG:** dangerouslySetInnerHTML with user/command data

---

#### Agent 16: Check Store for Persistent Attack Surface

```bash
# Look at app-store npm security state
rg -A 30 "npmSecurity|pendingApproval" apps/ui/src/store/app-store.ts

# Check for localStorage/sessionStorage persistence
rg -n "localStorage|sessionStorage" \
  apps/ui/src/components/dialogs/npm-security*.tsx \
  apps/ui/src/store/app-store.ts
```

**Expected:** State in memory only, no persistence of security-sensitive data

**RED FLAG:** Persisting approval decisions or commands to storage

---

### Phase 7: Code Obfuscation Detection (Agents 17-18)

#### Agent 17: Check for Obfuscated Code

```bash
# Look for hex-encoded strings
rg -n "\\\\x[0-9a-f]{2}|0x[0-9a-f]{4,}" \
  apps/server/src/lib/npm-*.ts \
  apps/server/src/routes/npm-security/

# Look for suspicious long strings
rg -n "\"[a-zA-Z0-9+/=]{50,}\"" \
  apps/server/src/lib/npm-*.ts

# Check for minified/obfuscated variable names
rg -n "var _0x|function _0x|const _[a-z]=[" \
  apps/server/src/lib/npm-*.ts
```

**Expected:** Clean, readable code with meaningful variable names

**RED FLAG:** Hex escapes, base64 blobs, minified variable names

---

#### Agent 18: Full File Review for Anomalies

```bash
# Count lines in new files (unusually large = suspicious)
wc -l apps/server/src/lib/npm-command-classifier.ts \
  apps/server/src/lib/npm-security-policy.ts

# Check for unusual file permissions
ls -la apps/server/src/lib/npm-*.ts

# Look for hidden files in npm-security directory
ls -la apps/server/src/routes/npm-security/
find apps/server/src/routes/npm-security -name ".*"
```

**Expected:** Reasonable file sizes (<500 lines each), standard permissions

**RED FLAG:** Files >1000 lines, hidden files, unusual permissions

---

### Phase 8: Full Code Reading (Agents 19-20)

#### Agent 19: Read and Audit npm-command-classifier.ts

```bash
cat apps/server/src/lib/npm-command-classifier.ts
```

**Manual review for:**

- [ ] No network calls
- [ ] No command execution
- [ ] No credential access
- [ ] No obfuscated code
- [ ] Pure classification logic only

---

#### Agent 20: Read and Audit npm-security-policy.ts

```bash
cat apps/server/src/lib/npm-security-policy.ts
```

**Manual review for:**

- [ ] No network calls
- [ ] No hidden bypasses
- [ ] Strict mode is actually strict
- [ ] No data exfiltration
- [ ] Clean, auditable logic

---

## Report Format

```
npm Security Malicious Code Audit Report

=== NETWORK ANALYSIS ===
External network calls found: [NONE/LIST]
DNS lookups found: [NONE/LIST]
Hardcoded IPs/domains: [NONE/LIST]
Base64/obfuscated URLs: [NONE/LIST]

=== COMMAND EXECUTION ===
exec/spawn calls in security code: [NONE/LIST]
Command injection vulnerabilities: [NONE/LIST]
Terminal service changes: [SAFE/SUSPICIOUS]

=== DATA ACCESS ===
Credential access detected: [NONE/LIST]
Sensitive file access: [NONE/LIST]
Audit log contents: [SAFE/LEAKING DATA]

=== POLICY INTEGRITY ===
Hidden bypass conditions: [NONE/LIST]
Time-based triggers: [NONE/LIST]
Strict mode verified: [YES/NO]

=== SUPPLY CHAIN ===
New dependencies: [NONE/LIST]
Dynamic imports: [NONE/LIST]

=== UI SECURITY ===
XSS vulnerabilities: [NONE/LIST]
Persistent storage abuse: [NONE/LIST]

=== CODE QUALITY ===
Obfuscated code: [NONE/FOUND]
File size anomalies: [NONE/LIST]
Hidden files: [NONE/LIST]

=== MANUAL REVIEW ===
npm-command-classifier.ts: [CLEAN/SUSPICIOUS]
npm-security-policy.ts: [CLEAN/SUSPICIOUS]

=== VERDICT ===
Overall Security Assessment: [CLEAN / REQUIRES INVESTIGATION / MALICIOUS CODE DETECTED]

Specific Concerns:
1. [concern description]
2. [concern description]
```

---

## Success Criteria (All Must Pass)

- [ ] NO external network calls in security code
- [ ] NO credential/API key access
- [ ] NO hidden bypass conditions
- [ ] NO command execution in classifier/policy
- [ ] NO obfuscated or encoded strings
- [ ] NO new npm dependencies added
- [ ] NO XSS vulnerabilities in UI
- [ ] NO data exfiltration paths
- [ ] Strict mode ACTUALLY strict
- [ ] All code readable and auditable

---

## Escalation

If ANY of the following are found, **STOP and report immediately**:

1. External network calls to unknown domains
2. Credential/API key access
3. Base64 encoded executable code
4. exec/spawn calls in policy enforcement
5. Hidden bypass env variables
6. New suspicious npm dependencies
