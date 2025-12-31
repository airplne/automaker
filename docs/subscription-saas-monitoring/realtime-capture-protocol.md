# Real-Time Contribution Capture Protocol

**Version:** 1.0
**Purpose:** Systematically capture and evaluate agent contributions during feature execution to validate 10-agent team effectiveness.

---

## 1. Capture Protocol Overview

### 1.1 When to Capture

**Trigger Points:**

- Immediately after each feature execution completes
- When synthesis document is generated
- Before moving to next feature in sequence
- At any point where agent output becomes available

**Critical Window:** Within 5 minutes of synthesis completion while details are fresh.

### 1.2 What to Look For

**Primary Indicators:**

1. **Agent Name Mentions:** Is the agent explicitly referenced in synthesis?
2. **Domain-Specific Language:** Does the contribution use terminology specific to their domain?
3. **Unique Insights:** Does the agent provide something no other agent could?
4. **Technical Specificity:** Are recommendations tied to actual project tech stack?
5. **Actionable Recommendations:** Can the advice be directly implemented?

**Secondary Indicators:**

- References to specific files, APIs, or patterns
- Identification of tradeoffs or tensions
- Risk assessment or security considerations
- Performance implications
- Testing strategy recommendations

### 1.3 How to Extract Contributions

**Extraction Method:**

1. Read synthesis document from top to bottom
2. Identify each section or paragraph by agent
3. Copy exact text (preserve formatting)
4. Tag with agent name and domain
5. Score against rubric (Section 3)

**Tools:**

- Text editor for copying exact quotes
- Spreadsheet or structured document for scoring
- Comparison against expectations matrix

---

## 2. Per-Agent Capture Template

**Instructions:** Use this template for EACH agent after EVERY feature execution. Score each dimension 1-3.

### Agent Capture Form (Use for All 10 Agents)

```
==============================================================================
FEATURE: [Feature Name/ID]
EXECUTION TIMESTAMP: [YYYY-MM-DD HH:MM:SS]
SYNTHESIS DOCUMENT: [Path or reference]
==============================================================================

=== AGENT 1: Analyst (Strategist) ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
  1 = Generic/no domain expertise shown
  2 = Some domain terminology, partially relevant
  3 = Deep domain expertise, highly specific

SPECIFICITY TO THIS FEATURE: [1/2/3]
  1 = Could apply to any project
  2 = Somewhat tailored to this feature
  3 = Highly specific to this exact implementation

UNIQUE INSIGHT: [Yes/No]
  Does this agent provide something no other agent could?

TECHNICAL GROUNDING: [Yes/No]
  References specific tech (Stripe, OAuth, PostgreSQL, React, etc.)?

MENTIONED IN SYNTHESIS: [Yes/No]
  Is agent name explicitly called out?

NOTES:
[Additional observations, red flags, or context]

------------------------------------------------------------------------------

=== AGENT 2: Architect ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 3: Security Guardian ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 4: Financial Strategist ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 5: Operations Commander ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 6: Fulfillization Manager ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 7: Strategist/Marketer ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 8: Technologist/Architect ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 9: Apex ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

------------------------------------------------------------------------------

=== AGENT 10: Zen ===
RAW CONTRIBUTION:
"""
[Paste exact text from synthesis - preserve formatting]
[If agent not mentioned, write: "NOT MENTIONED IN SYNTHESIS"]
"""

DOMAIN RELEVANCE: [1/2/3]
SPECIFICITY TO THIS FEATURE: [1/2/3]
UNIQUE INSIGHT: [Yes/No]
TECHNICAL GROUNDING: [Yes/No]
MENTIONED IN SYNTHESIS: [Yes/No]

NOTES:

==============================================================================
```

---

## 3. Red Flag Checklist

**Critical Red Flags (Immediate Investigation Required):**

- [ ] **Echo Chamber:** Agent says "I agree with [previous agent]" without adding value
- [ ] **Generic Advice:** Contribution could apply to ANY project (e.g., "make sure to test thoroughly")
- [ ] **No Domain Expertise:** Agent doesn't use terminology specific to their domain
- [ ] **Ghost Agent:** Agent not mentioned at all in synthesis output
- [ ] **Copy-Paste:** Agent echoes another agent's exact point verbatim
- [ ] **No Tech References:** Agent doesn't reference project stack (Stripe, PostgreSQL, OAuth, React, Express, etc.)
- [ ] **Vague Recommendations:** No actionable specifics (e.g., "consider security" vs. "implement rate limiting on /api/webhooks")
- [ ] **Domain Mismatch:** Agent comments outside their expertise (e.g., Architect discussing pricing strategy)

**Warning Flags (Monitor but May Be Acceptable):**

- [ ] **Minimal Contribution:** Agent mentioned but contribution is 1-2 sentences
- [ ] **Indirect Mention:** Agent's domain discussed but agent not named
- [ ] **Overlap:** Multiple agents cover same ground (acceptable if from different angles)
- [ ] **Synthesis Consolidation:** Agent's point merged into broader recommendation

**Documentation Required:**

- For each red flag, capture specific example
- Note severity (Critical/Warning)
- Track patterns across multiple features

---

## 4. Quality Indicators

### 4.1 High-Quality Contribution Markers

**Excellent (Score 3/3):**

- Uses domain-specific terminology naturally (e.g., "webhook signature validation", "idempotency keys", "PCI DSS compliance")
- References specific project technologies by name (Stripe API, PostgreSQL schemas, OAuth 2.0 flows)
- Provides actionable recommendations with file paths or API endpoints
- Identifies nuanced tradeoffs (e.g., "Stripe Checkout simplifies PCI compliance but reduces customization")
- Demonstrates understanding of feature dependencies
- Cites specific security standards, patterns, or best practices

**Examples:**

```
GOOD: "Implement webhook signature validation using Stripe's webhook secret
and crypto.timingSafeEqual to prevent timing attacks on HMAC comparison."

BAD: "Make sure webhooks are secure."
```

```
GOOD: "Store subscription_id in PostgreSQL users table with UNIQUE constraint
to prevent duplicate subscriptions. Index on stripe_customer_id for webhook lookups."

BAD: "Store subscription data in the database."
```

### 4.2 Domain-Specific Quality Indicators

**Analyst (Strategist):**

- Market segmentation specific to SaaS pricing (SMB vs. Enterprise)
- References to competitive landscape
- User journey mapping tied to subscription lifecycle

**Architect:**

- Specific database schema recommendations (tables, columns, indexes)
- API endpoint design (/api/subscriptions/webhook, /api/billing/portal)
- Architectural pattern references (Event Sourcing, CQRS, etc.)

**Security Guardian:**

- Specific vulnerabilities (IDOR, timing attacks, webhook replay)
- Security standards (PCI DSS, OWASP Top 10)
- Concrete mitigations with code implications

**Financial Strategist:**

- Revenue recognition standards (ASC 606)
- Tax implications (VAT, sales tax via Stripe Tax)
- Churn metrics and retention strategies

**Operations Commander:**

- Monitoring specifics (error rates, webhook latency, failed payments)
- Incident response procedures
- Runbook entries for operational scenarios

**Fulfillization Manager:**

- User onboarding flows post-subscription
- Provisioning automation triggers
- Customer success touchpoints

**Strategist/Marketer:**

- Pricing psychology (anchoring, decoy pricing)
- Conversion optimization tactics
- Messaging frameworks for tier differentiation

**Technologist/Architect:**

- Technology stack selection rationale
- Integration patterns (Stripe SDK, React hooks)
- State management for subscription status

**Apex:**

- Cross-domain synthesis
- Strategic priorities
- Risk orchestration across all domains

**Zen:**

- Experience design principles
- Cognitive load considerations
- Emotional friction points in billing UX

### 4.3 Technical Grounding Checklist

**Project Tech Stack (SaaS Subscription System):**

- [ ] Stripe (Checkout, Customer Portal, Webhooks, Subscriptions API)
- [ ] OAuth 2.0 / JWT authentication
- [ ] PostgreSQL (database)
- [ ] React (frontend)
- [ ] Express (backend)
- [ ] WebSocket (real-time updates)
- [ ] Node.js ecosystem

**Does the contribution:**

- [ ] Reference at least one technology from the stack?
- [ ] Show understanding of how technologies integrate?
- [ ] Propose implementation using these specific tools?

---

## 5. Capture Workflow

### 5.1 Step-by-Step Process

**STEP 1: Immediate Post-Execution**

- [ ] Locate synthesis document (check agent output, terminal, or logs)
- [ ] Copy full synthesis to capture document
- [ ] Note timestamp and feature ID
- [ ] Verify all 10 agents participated (check agent list in config)

**STEP 2: Extract Agent Contributions**

- [ ] Read synthesis line-by-line
- [ ] Identify each agent's section or mentions
- [ ] Copy exact text into template (preserve formatting)
- [ ] Mark agents with no contribution as "NOT MENTIONED IN SYNTHESIS"

**STEP 3: Score Against Rubric**
For each agent:

- [ ] Rate Domain Relevance (1-3)
- [ ] Rate Specificity to Feature (1-3)
- [ ] Determine Unique Insight (Yes/No)
- [ ] Check Technical Grounding (Yes/No)
- [ ] Confirm Mentioned in Synthesis (Yes/No)
- [ ] Add notes for context

**STEP 4: Flag and Document**

- [ ] Run through Red Flag Checklist (Section 3)
- [ ] Check Quality Indicators (Section 4)
- [ ] Compare to Expectations Matrix (from expectations-matrix.md)
- [ ] Calculate aggregate scores
- [ ] Document patterns or anomalies

**STEP 5: Save and Compare**

- [ ] Save capture document with feature ID in filename
  - Format: `capture-[featureId]-[timestamp].md`
  - Example: `capture-subscription-tiers-20250131-143022.md`
- [ ] Compare to previous captures for trends
- [ ] Update pattern log if new issues emerge

### 5.2 Automation Opportunities

**Semi-Automated Extraction:**

- Use grep/regex to extract agent name mentions
- Parse synthesis document structure
- Auto-populate template with extracted sections

**Scoring Assistance:**

- Keyword detection for domain terms (Stripe, webhook, OAuth, etc.)
- Tech stack reference counter
- Red flag pattern matching

**Trending Analysis:**

- Aggregate scores across features
- Identify consistently weak agents
- Track improvement or degradation over time

---

## 6. Output and Reporting

### 6.1 Per-Feature Summary

After completing capture, generate summary:

```
FEATURE: [Name]
EXECUTION DATE: [Date]
SYNTHESIS LENGTH: [Word count]

AGENT PARTICIPATION:
- Explicitly Mentioned: [X/10]
- Provided Unique Insight: [X/10]
- Domain Relevance Avg: [X.X/3.0]
- Specificity Avg: [X.X/3.0]
- Technical Grounding: [X/10]

RED FLAGS: [Count]
- Critical: [Count]
- Warning: [Count]

TOP PERFORMERS: [Agent names]
UNDERPERFORMERS: [Agent names]

NOTES:
[Key observations, patterns, or concerns]
```

### 6.2 Cross-Feature Trends

After 3+ features, analyze trends:

```
TREND ANALYSIS (Features 1-N)

CONSISTENT PERFORMERS:
[Agents that score high across all features]

INCONSISTENT AGENTS:
[Agents with variable performance]

GHOST AGENTS:
[Agents rarely mentioned]

EMERGING PATTERNS:
[Repeated red flags, common gaps]

RECOMMENDATIONS:
[Specific actions to improve team performance]
```

### 6.3 Integration with Validation Report

**Feed into validation-report.md:**

- Agent-by-agent performance data
- Red flag counts and severity
- Recommendation for configuration changes
- Evidence for "is 10 agents worth it?" decision

---

## 7. Protocol Maintenance

### 7.1 Protocol Versioning

- **Version 1.0:** Initial protocol (this document)
- **Updates:** When rubric changes, add new section with version number
- **Changelog:** Track modifications to scoring system or red flags

### 7.2 Calibration

**Periodic Review (Every 5 Features):**

- Are scores consistent across evaluators?
- Do red flags correlate with actual problems?
- Should thresholds be adjusted?

**Refinement Triggers:**

- New agent added to team
- New domain expertise required
- Red flag identified that wasn't in checklist

---

## 8. Quick Reference Card

**For each feature execution:**

1. **Capture:** Copy synthesis immediately
2. **Extract:** Pull out each agent's contribution
3. **Score:** Use 1-3 rubric + Yes/No checks
4. **Flag:** Run red flag checklist
5. **Save:** Document with feature ID
6. **Compare:** Check against expectations matrix

**Red Flags to Watch:**

- "I agree with..."
- Generic advice
- No tech stack references
- Agent not mentioned
- Copy-paste from another agent

**Quality Markers:**

- Domain terminology
- Specific tech (Stripe, PostgreSQL, OAuth)
- Actionable recommendations
- Tradeoff identification

---

## 9. Example Capture (Reference)

```
==============================================================================
FEATURE: Subscription Tier Management
EXECUTION TIMESTAMP: 2025-01-31 14:30:22
SYNTHESIS DOCUMENT: .automaker/features/sub-tiers-001/agent-output.md
==============================================================================

=== AGENT 1: Analyst (Strategist) ===
RAW CONTRIBUTION:
"""
The Analyst emphasized the importance of market segmentation, recommending
a three-tier structure (Basic, Pro, Enterprise) aligned with SMB, mid-market,
and enterprise customer personas. Highlighted competitive analysis showing
$29/$99/$299 pricing aligns with market expectations for dev tools.
"""

DOMAIN RELEVANCE: 3/3
  Uses market segmentation terminology, competitive analysis, persona alignment

SPECIFICITY TO THIS FEATURE: 3/3
  Specific pricing points, tier names, customer segments for THIS product

UNIQUE INSIGHT: Yes
  Competitive pricing data and persona mapping unique to Analyst domain

TECHNICAL GROUNDING: No
  Focuses on market/strategy, not tech implementation (appropriate for role)

MENTIONED IN SYNTHESIS: Yes
  "The Analyst emphasized..." - explicit attribution

NOTES:
Strong performance. Analyst stayed in lane (strategy/market) and provided
actionable tier structure. No red flags.

------------------------------------------------------------------------------

=== AGENT 2: Architect ===
RAW CONTRIBUTION:
"""
NOT MENTIONED IN SYNTHESIS
"""

DOMAIN RELEVANCE: 1/3
  No contribution to evaluate

SPECIFICITY TO THIS FEATURE: 1/3
  No contribution to evaluate

UNIQUE INSIGHT: No
TECHNICAL GROUNDING: No
MENTIONED IN SYNTHESIS: No

NOTES:
**RED FLAG - CRITICAL**: Architect not mentioned despite feature requiring
database schema for subscription tiers, API endpoints for tier management,
and integration with Stripe Products API. Major gap in technical design.

==============================================================================
```

---

## 10. Protocol Success Metrics

**This protocol is successful if:**

1. **Coverage:** All 10 agents evaluated after each feature
2. **Consistency:** Scoring is reproducible across features
3. **Actionability:** Red flags lead to concrete improvements
4. **Trend Detection:** Patterns emerge across 3+ features
5. **Decision Support:** Data feeds into "is 10 agents worth it?" decision

**Failure Indicators:**

- Captures skipped or incomplete
- Scores vary wildly for same agent across features
- Red flags identified but no action taken
- No patterns detected after 5+ features
- Data not used in validation report

---

## Appendix A: Scoring Rubric Detail

### Domain Relevance (1-3)

**Score 1:** Generic contribution with no domain expertise

- Example: "Make sure to implement this feature properly"
- Uses no domain-specific terminology
- Could come from any agent regardless of specialty

**Score 2:** Some domain terminology, partially relevant

- Example: "Consider implementing tiered pricing with good UX"
- Uses some domain terms but vaguely
- Contribution is recognizable as coming from this domain

**Score 3:** Deep domain expertise, highly specific

- Example: "Implement three-tier SaaS pricing using anchoring psychology with middle tier as profit maximizer at 3x cost basis, $99/mo price point"
- Rich domain terminology
- Demonstrates deep expertise specific to this domain

### Specificity to Feature (1-3)

**Score 1:** Could apply to any project

- Example: "Make sure to test thoroughly"
- No reference to THIS feature's requirements
- Generic best practice

**Score 2:** Somewhat tailored to this feature

- Example: "Implement subscription management with proper error handling"
- Recognizes feature context
- Still somewhat generic

**Score 3:** Highly specific to this exact implementation

- Example: "Store subscription tier in PostgreSQL users.subscription_tier ENUM('basic','pro','enterprise') with index for filtering, sync with Stripe Product metadata on webhook events"
- Specific to this tech stack
- Specific to this feature's requirements
- Actionable implementation detail

---

**END OF PROTOCOL**
