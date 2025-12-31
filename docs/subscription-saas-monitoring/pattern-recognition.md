# Cross-Feature Pattern Recognition Framework

**Purpose:** Identify trends, consistency issues, and domain gaps across multiple feature executions in the Subscription Management SaaS project.

**When to Use:** After 3+ features have been analyzed. Best insights emerge at 5+ features.

---

## 1. Agent Consistency Pattern Tracking

Track the domain lens each agent applies across features to detect consistency and specialization.

### Tracking Matrix

| Agent                      | F1 Focus | F2 Focus | F3 Focus | F4 Focus | F5 Focus | Consistent? | Pattern Notes                                              |
| -------------------------- | -------- | -------- | -------- | -------- | -------- | ----------- | ---------------------------------------------------------- |
| **Analyst Strategist**     |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Business requirements, user needs, market fit    |
| **Financial Strategist**   |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Revenue impact, pricing, billing logic           |
| **Fulfillization Manager** |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Delivery, deployment, operational readiness      |
| **Operations Commander**   |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Process, execution, team coordination            |
| **Security Guardian**      |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Security, compliance, data protection            |
| **Strategist Marketer**    |          |          |          |          |          | ☐ Yes ☐ No  | Expected: GTM strategy, positioning, customer acquisition  |
| **Technologist Architect** |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Technical architecture, scalability, integration |
| **Apex**                   |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Strategic synthesis, prioritization, tradeoffs   |
| **Zen**                    |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Holistic balance, risk awareness, wisdom         |
| **Echon**                  |          |          |          |          |          | ☐ Yes ☐ No  | Expected: Synthesis quality, coherence, actionability      |

### How to Fill

For each feature, summarize the agent's primary focus in 3-5 words:

- "Revenue model implications"
- "Multi-tenant data isolation"
- "User onboarding flow"
- "GDPR compliance requirements"

### Consistency Evaluation

**Consistent (Yes):** Agent applies the same domain lens across 80%+ of features
**Inconsistent (No):** Agent's focus shifts unpredictably or overlaps with others' domains

**What Consistency Means:**

- **Good Consistency:** Agent has clear expertise and applies it reliably
- **Bad Consistency:** Agent is stuck in a rut, not adapting to feature needs
- **Good Inconsistency:** Agent adapts perspective based on feature requirements
- **Bad Inconsistency:** Agent has no clear role or echoes others

---

## 2. Recurring Issue Detection

### Agents Consistently Underperforming

**Symptoms to Watch For:**

1. **Silent Agent Pattern**
   - Score ≤ 2 on 2+ features
   - No unique insights across multiple features
   - Output is generic or echoes other agents

2. **Misaligned Domain Pattern**
   - Agent addresses wrong domain consistently
   - Example: Financial Strategist discussing UX instead of revenue

3. **Low Value-Add Pattern**
   - Agent contributes but insights are obvious
   - No unique perspective that others missed

**Threshold for "Consistent Underperformance":**

- 2+ features with score ≤ 2, OR
- 3+ features with no unique insights (even if score is 3), OR
- 4+ features where agent was marked as "could be absorbed by another"

**Action Triggers:**

- Review agent system prompt and role definition
- Check if domain is relevant to this project type
- Consider consolidating with better-performing agent

### Agents Consistently Overperforming

**What Excellence Looks Like:**

1. **Distinctive Voice Pattern**
   - Score 4-5 consistently
   - Unique insights not duplicated by others
   - Clear domain expertise evident

2. **Adaptive Excellence Pattern**
   - Adjusts depth based on feature relevance
   - Still provides value even on tangential features

3. **Synthesis Catalyst Pattern**
   - Other agents reference this agent's points
   - Frames discussions that improve overall quality

**Threshold for "Consistent Excellence":**

- 3+ features with score ≥ 4, AND
- 2+ features with unique critical insights, AND
- No features where marked as "redundant"

**Action Triggers:**

- Study this agent's prompts as exemplar
- Consider expanding this agent's scope
- Use as template for improving underperformers

### Domain Gaps (Topics No Agent Addressed)

**SaaS Subscription Management Checklist:**

For each feature, check if these critical topics were addressed by ANY agent:

#### Business & Revenue

- ☐ Pricing model impact
- ☐ Revenue recognition implications
- ☐ Subscription lifecycle effects
- ☐ Customer LTV considerations
- ☐ Churn risk factors

#### Technical & Architecture

- ☐ Multi-tenant data isolation
- ☐ Scalability considerations
- ☐ API design and integration
- ☐ Database schema impact
- ☐ Background job implications

#### Security & Compliance

- ☐ Data privacy (GDPR, CCPA)
- ☐ PCI DSS compliance (payment data)
- ☐ Authentication and authorization
- ☐ Audit logging requirements
- ☐ Data retention policies

#### Operations & Support

- ☐ Customer support implications
- ☐ Monitoring and alerting needs
- ☐ Deployment and rollback strategy
- ☐ Data migration requirements
- ☐ Documentation needs

#### User Experience

- ☐ Admin portal UX
- ☐ End-user experience
- ☐ Mobile considerations
- ☐ Accessibility requirements
- ☐ Onboarding flow impact

**Gap Analysis:**

After each feature, identify:

1. **Critical gaps:** Important topics NO agent covered
2. **Recurring gaps:** Same topic missed across 2+ features
3. **Ownership gaps:** Topic relevant to an agent's domain but not addressed

**Example Gap Log:**

| Feature | Critical Gap           | Which Agent Should Have Covered | Impact |
| ------- | ---------------------- | ------------------------------- | ------ |
| F1      | PCI DSS compliance     | Security Guardian               | HIGH   |
| F2      | Revenue recognition    | Financial Strategist            | MEDIUM |
| F3      | Multi-tenant isolation | Technologist Architect          | HIGH   |

---

## 3. Feature-Type Patterns

Identify which agents excel at which feature types to optimize future assignments.

### Pattern Matrix

| Feature Type                           | Best Contributing Agents | Weakest Contributing Agents | Notes                                        |
| -------------------------------------- | ------------------------ | --------------------------- | -------------------------------------------- |
| **Business/Product Features**          |                          |                             | Expected: Analyst, Strategist Marketer, Apex |
| (pricing, plans, user segments)        |                          |                             |                                              |
| **Technical/Architecture Features**    |                          |                             | Expected: Technologist, Security Guardian    |
| (API design, database, integration)    |                          |                             |                                              |
| **Security Features**                  |                          |                             | Expected: Security Guardian, Technologist    |
| (auth, compliance, data protection)    |                          |                             |                                              |
| **Performance Features**               |                          |                             | Expected: Technologist, Operations Commander |
| (scale, optimization, caching)         |                          |                             |                                              |
| **UX/Delivery Features**               |                          |                             | Expected: Analyst, Fulfillization, Zen       |
| (workflows, onboarding, notifications) |                          |                             |                                              |

### How to Identify Patterns

1. **After 3 features:** Note preliminary patterns
2. **After 5 features:** Validate patterns and identify outliers
3. **After 7+ features:** Use patterns to predict future performance

**Best Contributors:** Agents who scored 4-5 consistently for this feature type
**Weakest Contributors:** Agents who scored 1-2 consistently for this feature type

### Using These Patterns

**Prompt Optimization:**

- Enhance prompts for agents in their strong domains
- Add examples from strong performers to weak performers

**Feature Assignment:**

- For critical features, ensure best-fit agents are included
- Consider excluding agents with weak patterns for specific types

**Team Composition:**

- Identify if team is unbalanced (too many in one domain)
- Consider adding specialist agents for recurring gaps

---

## 4. Trend Analysis

Detect whether agent performance is improving, declining, or stable over time.

### Improvement Trend Detection

**Agent is Improving When:**

1. **Score Progression:** F1: 2 → F2: 3 → F3: 4
2. **Depth Increase:** Early features generic, later features show deep expertise
3. **Gap Reduction:** Agent starts covering blind spots from earlier features
4. **Synthesis Quality:** Better integration with other agents' points

**Measurement Approach:**

- Calculate moving average of scores (window = 3 features)
- Improvement = moving average increases by 0.5+ over 3 features
- Strong improvement = 2+ point increase from first to latest feature

**Example:**

```
Financial Strategist Trend:
F1: 2, F2: 3, F3: 3, F4: 4, F5: 5
Moving Avg (3): [2.67, 3.33, 4.00]
Trend: IMPROVING (+1.33 over 5 features)
```

### Decline Trend Detection

**Agent is Declining When:**

1. **Score Regression:** F1: 4 → F2: 3 → F3: 2
2. **Increasing Redundancy:** Started unique, now echoing others
3. **Domain Drift:** Losing focus on core expertise
4. **Generic Output:** Early features specific, later features generic

**Measurement Approach:**

- Calculate moving average of scores (window = 3 features)
- Decline = moving average decreases by 0.5+ over 3 features
- Strong decline = 2+ point drop from first to latest feature

**Red Flag Thresholds:**

- Any agent declining from 4+ to 2 or lower = URGENT REVIEW
- 2+ agents declining simultaneously = SYSTEM ISSUE (prompt changes, model changes)

### Statistical Approach

**Simple Trend Line (Linear Regression):**

For each agent, plot: `Score = m * (Feature Number) + b`

- **Positive slope (m > 0.3):** Improving
- **Negative slope (m < -0.3):** Declining
- **Flat slope (-0.3 ≤ m ≤ 0.3):** Stable

**Confidence:**

- Need minimum 4 features for basic trend
- 6+ features for reliable trend
- 10+ features for statistical confidence

**Tool Suggestion:**

Create a simple spreadsheet with:

- Rows = Agents
- Columns = F1, F2, F3, F4, F5, Trend, Slope
- Conditional formatting: Green (improving), Red (declining), Yellow (stable)

---

## 5. Pattern Red Flags

Early warning signs that require immediate investigation.

### Red Flag Checklist

#### Agent Silence Pattern

- ☐ Same agent scored ≤ 2 across 3+ consecutive features
- ☐ Same agent contributed no unique insights across 3+ features
- ☐ Agent's output length declining (500 words → 200 words → 100 words)

**Action:** Review agent prompt, check if domain is relevant, consider removing agent

#### Echo Chamber Pattern

- ☐ Same agent echoing others consistently (3+ features)
- ☐ Agent's points already covered by another agent each time
- ☐ Agent waits for others to speak first, then summarizes

**Action:** Check agent order in conversation, review for role overlap, consider consolidation

#### Domain Coverage Gap Pattern

- ☐ Same critical topic missed across 3+ features
- ☐ Topic is clearly relevant but no agent addresses it
- ☐ Gap was identified in earlier feature reviews but persists

**Action:** Add topic to specific agent's prompt, create new specialist agent, or enhance Apex/Echon synthesis

#### Synthesis Quality Decline

- ☐ Echon's synthesis coherence dropping (4-5 → 2-3)
- ☐ Apex's strategic prioritization becoming generic
- ☐ Final output missing insights from individual agents

**Action:** Review synthesis agent prompts, check if too many agents talking, verify context window limits

#### Team Imbalance Pattern

- ☐ 5+ agents all focusing on same domain (e.g., all talking about UX)
- ☐ Critical domain consistently weak (e.g., no one discussing security)
- ☐ Specialist agents going off-domain (Security Guardian discussing marketing)

**Action:** Rebalance team composition, clarify agent roles, add missing specialists

#### Fatigue Pattern

- ☐ All agents declining simultaneously
- ☐ Output quality dropping across the board
- ☐ Generic responses replacing specific insights

**Action:** Check for model changes, review prompt drift, verify context quality, consider conversation reset

---

## 6. SaaS-Specific Patterns to Watch

Domain-specific patterns critical for Subscription Management SaaS success.

### Payment/Billing Expertise Gap

**What to Watch:**

- ☐ Financial Strategist addresses ONLY business strategy, not billing mechanics
- ☐ Technologist Architect doesn't mention payment gateway integration
- ☐ Security Guardian misses PCI DSS compliance requirements
- ☐ No agent discusses payment failure handling or retry logic

**Pattern Recognition:**

| Feature | Payment Topic               | Agent Coverage            | Gap?     |
| ------- | --------------------------- | ------------------------- | -------- |
| F1      | Payment gateway integration | None                      | CRITICAL |
| F2      | Subscription billing cycle  | Financial (surface level) | MEDIUM   |
| F3      | Refund handling             | None                      | HIGH     |

**Action When Pattern Emerges:**

- After 2 features with payment gaps: Add payment domain explicitly to Financial + Technologist prompts
- Create "Payment Domain Checklist" for Apex to verify coverage

### Multi-Tenant Isolation Blind Spots

**What to Watch:**

- ☐ Technologist Architect doesn't mention tenant isolation in database design
- ☐ Security Guardian misses tenant-level access control
- ☐ No agent discusses cross-tenant data leakage risks
- ☐ API design doesn't consider tenant context

**Pattern Recognition:**

| Feature | Isolation Concern         | Agent Coverage           | Gap?     |
| ------- | ------------------------- | ------------------------ | -------- |
| F1      | Database schema tenant_id | Technologist (mentioned) | OK       |
| F2      | API tenant context        | None                     | CRITICAL |
| F3      | Report data filtering     | None                     | HIGH     |

**Action When Pattern Emerges:**

- After 2 features with isolation gaps: Add "Multi-tenant security checklist" to Security Guardian
- Technologist Architect should ALWAYS address tenant isolation in architecture discussions

### Compliance (GDPR/PCI) Coverage

**What to Watch:**

- ☐ Security Guardian doesn't mention GDPR for user data features
- ☐ PCI DSS not discussed when payment data is involved
- ☐ Data retention policies not addressed
- ☐ Right to erasure (GDPR) not considered for user features

**Pattern Recognition:**

| Feature              | Compliance Need       | Agent Coverage       | Gap?     |
| -------------------- | --------------------- | -------------------- | -------- |
| F1 (User Profile)    | GDPR data portability | None                 | HIGH     |
| F2 (Payment Method)  | PCI DSS storage       | Security (mentioned) | OK       |
| F3 (Usage Analytics) | GDPR consent          | None                 | CRITICAL |

**Action When Pattern Emerges:**

- Create compliance matrix template for Security Guardian
- Apex should flag when compliance-relevant features lack coverage

### Scale/Performance Considerations

**What to Watch:**

- ☐ Technologist doesn't discuss scale implications (e.g., "What if we have 100k tenants?")
- ☐ Database indexing not mentioned for query-heavy features
- ☐ Caching strategies absent from high-traffic features
- ☐ Background job processing not considered for async operations

**Pattern Recognition:**

| Feature            | Scale Concern              | Agent Coverage           | Gap? |
| ------------------ | -------------------------- | ------------------------ | ---- |
| F1 (Reporting)     | Query performance at scale | None                     | HIGH |
| F2 (Notifications) | Background job queue       | Operations (mentioned)   | OK   |
| F3 (Search)        | Indexing strategy          | Technologist (mentioned) | OK   |

**Action When Pattern Emerges:**

- Add scale scenario prompts to Technologist Architect
- Operations Commander should verify scalability for operational features

### User Experience: Admin vs End-User

**What to Watch:**

- ☐ UX discussions don't differentiate admin vs end-user personas
- ☐ Admin portal complexity not addressed (power users need different UX)
- ☐ Self-service vs support-assisted flows not distinguished
- ☐ Role-based UI differences not considered

**Pattern Recognition:**

| Feature              | UX Persona              | Agent Coverage      | Gap?   |
| -------------------- | ----------------------- | ------------------- | ------ |
| F1 (Plan Management) | Admin (tenant owner)    | Analyst (mentioned) | OK     |
| F2 (Usage Dashboard) | End-user + Admin        | None - conflated    | MEDIUM |
| F3 (Billing Portal)  | End-user (self-service) | Analyst (mentioned) | OK     |

**Action When Pattern Emerges:**

- Analyst Strategist should explicitly call out persona differences
- Zen should flag when persona needs are in tension

---

## 7. Pattern Summary Template

Use this template after analyzing 3+ features to synthesize cross-feature patterns.

---

### CROSS-FEATURE PATTERN SUMMARY

**Project:** Subscription Management SaaS
**Features Analyzed:** [F1, F2, F3, F4, F5, ...]
**Date Range:** [Start Date] to [End Date]
**Analyzer:** [Your Name/Role]

---

#### AGENT PERFORMANCE PATTERNS

**Top Performers (Consistently Strong):**

1. **[Agent Name]** - Trend: [Improving/Stable] - Avg Score: [X.X]
   - Strength: [What they do exceptionally well]
   - Pattern: [What makes them consistent]
   - Example: [Best contribution from recent feature]

2. **[Agent Name]** - Trend: [Improving/Stable] - Avg Score: [X.X]
   - Strength: [...]
   - Pattern: [...]
   - Example: [...]

**Underperformers (Needs Attention):**

1. **[Agent Name]** - Trend: [Declining/Stable Low] - Avg Score: [X.X]
   - Weakness: [What's missing or wrong]
   - Pattern: [Why they're underperforming]
   - Action: [Specific fix needed]

2. **[Agent Name]** - Trend: [Declining/Stable Low] - Avg Score: [X.X]
   - Weakness: [...]
   - Pattern: [...]
   - Action: [...]

**Trend Highlights:**

- [Agent X] showing strong improvement: F1 (2) → F5 (5)
- [Agent Y] showing concerning decline: F1 (4) → F5 (2)
- [Agent Z] consistently stable but could improve in [domain]

---

#### DOMAIN COVERAGE ANALYSIS

**Well-Covered Domains:**

1. **[Domain Name]** (e.g., Technical Architecture)
   - Primary Agent: [Agent Name]
   - Supporting Agents: [Agent Names]
   - Quality: [Excellent/Good/Adequate]
   - Example: [Strong coverage in F3 where...]

2. **[Domain Name]**
   - Primary Agent: [...]
   - Supporting Agents: [...]
   - Quality: [...]
   - Example: [...]

**Domain Gaps (Recurring):**

1. **[Domain Name]** (e.g., Payment Compliance)
   - Missing in Features: [F1, F3, F4]
   - Should Be Covered By: [Agent Name]
   - Impact: [HIGH/MEDIUM/LOW]
   - Action: [Add to [Agent]'s prompt: "Always consider..."]

2. **[Domain Name]**
   - Missing in Features: [...]
   - Should Be Covered By: [...]
   - Impact: [...]
   - Action: [...]

**SaaS-Specific Gaps:**

- ☐ Payment/billing mechanics: [Status]
- ☐ Multi-tenant isolation: [Status]
- ☐ GDPR/PCI compliance: [Status]
- ☐ Scale/performance: [Status]
- ☐ Admin vs end-user UX: [Status]

---

#### FEATURE-TYPE INSIGHTS

**Business/Product Features:**

- Best Agents: [List]
- Weakest Agents: [List]
- Recommendation: [For future business features, emphasize...]

**Technical/Architecture Features:**

- Best Agents: [List]
- Weakest Agents: [List]
- Recommendation: [For future technical features, emphasize...]

**Security Features:**

- Best Agents: [List]
- Weakest Agents: [List]
- Recommendation: [For future security features, emphasize...]

**[Other Feature Types as Relevant]**

---

#### RED FLAGS & ALERTS

**Active Red Flags:**

- ☐ [Agent X] silent for 3+ features (F2, F3, F4)
- ☐ [Agent Y] consistently echoing [Agent Z] (F1, F2, F3)
- ☐ [Domain] gap recurring across 3+ features (F1, F2, F4)
- ☐ Synthesis quality declining (Echon: F1=5, F5=3)
- ☐ [Other pattern]

**Resolved Red Flags:**

- ✅ [Agent X] was silent F1-F2, but improved at F3 after prompt update
- ✅ [Domain] gap in F1-F2 resolved by F3 onward

---

#### RECOMMENDATIONS

**Immediate Actions (This Week):**

1. [Action]: [Specific step to address top red flag]
2. [Action]: [Specific step to improve underperformer]
3. [Action]: [Specific step to close critical gap]

**Short-Term Improvements (Next 3 Features):**

1. [Action]: [Enhance prompts for...]
2. [Action]: [Rebalance team composition by...]
3. [Action]: [Add monitoring for...]

**Long-Term Optimizations (After 10 Features):**

1. [Action]: [Consider consolidating agents...]
2. [Action]: [Create specialist agent for...]
3. [Action]: [Develop automated gap detection for...]

---

#### OVERALL TEAM HEALTH

**Current State:** [Excellent / Good / Needs Improvement / Critical]

**Justification:**

- [Key strength 1]
- [Key strength 2]
- [Key concern 1]
- [Key concern 2]

**Confidence in Team:**

- ☐ High - Team consistently delivers quality insights
- ☐ Medium - Team has gaps but improving
- ☐ Low - Major issues need resolution before continuing

**Next Review:** After Feature [X] (approx [Date])

---

### APPENDIX: RAW DATA

**Score Matrix:**

| Agent                  | F1  | F2  | F3  | F4  | F5  | Avg | Trend |
| ---------------------- | --- | --- | --- | --- | --- | --- | ----- |
| Analyst Strategist     |     |     |     |     |     |     |       |
| Financial Strategist   |     |     |     |     |     |     |       |
| Fulfillization Manager |     |     |     |     |     |     |       |
| Operations Commander   |     |     |     |     |     |     |       |
| Security Guardian      |     |     |     |     |     |     |       |
| Strategist Marketer    |     |     |     |     |     |     |       |
| Technologist Architect |     |     |     |     |     |     |       |
| Apex                   |     |     |     |     |     |     |       |
| Zen                    |     |     |     |     |     |     |       |
| Echon                  |     |     |     |     |     |     |       |

**Unique Insight Count:**

| Agent                  | F1  | F2  | F3  | F4  | F5  | Total |
| ---------------------- | --- | --- | --- | --- | --- | ----- |
| Analyst Strategist     |     |     |     |     |     |       |
| Financial Strategist   |     |     |     |     |     |       |
| Fulfillization Manager |     |     |     |     |     |       |
| Operations Commander   |     |     |     |     |     |       |
| Security Guardian      |     |     |     |     |     |       |
| Strategist Marketer    |     |     |     |     |     |       |
| Technologist Architect |     |     |     |     |     |       |
| Apex                   |     |     |     |     |     |       |
| Zen                    |     |     |     |     |     |       |
| Echon                  |     |     |     |     |     |       |

---

**END OF PATTERN SUMMARY**

---

## How to Use This Framework

### Workflow

1. **After Each Feature:** Complete individual feature scorecards (see `individual-scorecard.md`)

2. **After Feature 3:** Begin tracking consistency patterns (Section 1)

3. **After Feature 5:**
   - Complete first full pattern analysis (Section 2-4)
   - Generate first Pattern Summary (Section 7)

4. **After Feature 7+:**
   - Update trend analysis (Section 4)
   - Refine feature-type patterns (Section 3)
   - Monitor for red flags (Section 5)

5. **Ongoing:**
   - Watch for SaaS-specific patterns (Section 6)
   - Update Pattern Summary every 3-5 features
   - Adjust agent prompts based on findings

### Integration with Other Monitoring

- **Individual Scorecards** → Feed into pattern tracking
- **Conversation Quality Reviews** → Inform trend analysis
- **Synthesis Validation** → Detect synthesis decline patterns
- **Final Output Assessment** → Validate pattern predictions

### Success Metrics

**You're Doing Well When:**

- Patterns emerge clearly by feature 5
- Red flags are caught early (within 2-3 features)
- Agent improvements are measurable and documented
- Domain gaps are identified before they become critical

**Continuous Improvement:**

- Use patterns to predict future performance
- Proactively adjust prompts before issues compound
- Share learnings across projects
- Build institutional knowledge of what works

---

## Version History

- **v1.0** (2025-12-31): Initial framework for Subscription SaaS monitoring
- Pattern recognition designed for 10-agent executive suite
- SaaS-specific domain patterns based on payment, compliance, multi-tenancy focus
