# Uniqueness Verification Protocol

**Purpose:** Ensure each of the 10 agents provides DISTINCT value without echo or redundancy.

**Version:** 1.0
**Created:** 2025-12-31
**Project:** Subscription SaaS Monitoring

---

## 1. Per-Feature Uniqueness Analysis Template

For each feature analyzed by the 10-agent team, complete this matrix:

| Agent                       | Primary Unique Point             | Also Said By                   | Unique?  | Score |
| --------------------------- | -------------------------------- | ------------------------------ | -------- | ----- |
| **Sage** (Product Strategy) | [Main strategic insight]         | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Theo** (Tech Architect)   | [Main technical design]          | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Finn** (UX Designer)      | [Main user experience point]     | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Cerberus** (Security)     | [Main security concern]          | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Mary** (Market Analyst)   | [Main market insight]            | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Walt** (Financial)        | [Main financial metric]          | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Axel** (DevOps)           | [Main operations point]          | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Apex** (Performance)      | [Main performance concern]       | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Zen** (Code Quality)      | [Main quality principle]         | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |
| **Echon** (Reliability)     | [Main reliability consideration] | [List agents who touched this] | ✅/⚠️/❌ | G/Y/R |

**Scoring Legend:**

- **Green (G):** Fully Unique - Said something NO other agent mentioned
- **Yellow (Y):** Partially Unique - Added nuance to a shared point
- **Red (R):** Duplicate - Repeated another agent's point verbatim or with trivial rewording

**Target:** Minimum 7/10 agents Green, 3/10 Yellow acceptable, 0 Red

---

## 2. Echo Detection Protocol

### 2.1 Direct Echo Patterns

**Explicit Agreement Statements (RED FLAG):**

```
❌ "I agree with Sage that..."
❌ "As Theo mentioned..."
❌ "Building on what Finn said..."
❌ "Echoing Cerberus's point..."
❌ "Similar to Mary's analysis..."
```

**Detection Rule:** If an agent explicitly references another agent's point without adding NEW information, flag as echo.

### 2.2 Paraphrased Duplicates

**Example - Subscription Pricing Feature:**

**Sage says:** "We need tiered pricing with a free trial to maximize conversion from freemium to paid."

**Echo (BAD):**

- **Mary says:** "A freemium model with upgrade tiers will improve our conversion funnel."
- **Analysis:** Same point, different words. NO new insight.

**Unique Addition (GOOD):**

- **Mary says:** "Competitor analysis shows 14-day trials convert 23% better than 7-day trials in SaaS billing tools. We should benchmark against ChartMogul's $299/month tier."
- **Analysis:** Adds market data, specific competitor, specific pricing point.

**Detection Rule:** If two agents discuss the same topic, Agent B must provide:

- Different dimension (strategy vs tactics)
- New data point (metrics, benchmarks, examples)
- Different domain lens (business vs technical vs user)

### 2.3 Echo Severity Levels

| Level                               | Description                                                                   | Action                          |
| ----------------------------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| **Level 1: Harmless Reinforcement** | Agent briefly acknowledges another's point but primary contribution is unique | ⚠️ Note but allow               |
| **Level 2: Duplicate Angle**        | Agent covers same topic from same angle with minimal new insight              | 🔶 Flag for review              |
| **Level 3: Pure Echo**              | Agent repeats another's point with no added value                             | 🛑 Reject - request re-analysis |

**Example Level 1 (Acceptable):**

- **Theo:** "We'll need webhook retry logic with exponential backoff for failed payment notifications."
- **Echon:** "Agree webhooks need retries. From reliability perspective, we should also implement idempotency keys to prevent duplicate charges if retry succeeds after timeout."
- **Analysis:** Echon acknowledges but adds NEW technical requirement (idempotency).

**Example Level 3 (Unacceptable):**

- **Theo:** "We'll need webhook retry logic with exponential backoff."
- **Axel:** "We should implement retry mechanisms for webhooks to handle failures."
- **Analysis:** Axel repeats Theo's point with no new information. REJECT.

### 2.4 Paraphrase Detection Checklist

For each point, ask:

1. **Does this add a NEW fact?** (data, metric, example, constraint)
2. **Does this add a NEW perspective?** (different domain lens)
3. **Does this add a NEW consequence?** (different risk, opportunity, or trade-off)

If all answers are NO → Flag as echo.

---

## 3. Cross-Agent Overlap Matrix

### 3.1 High-Risk Overlap Pairs

| Agent Pair          | Potential Overlap Areas                  | How to Distinguish                                                                                              | Detection Rule                                                     |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Sage + Mary**     | Market positioning, competitive analysis | **Sage:** Forward-looking strategy, product differentiation<br>**Mary:** Historical data, competitor benchmarks | Mary cites competitors/data; Sage proposes unique positioning      |
| **Theo + Apex**     | Technical architecture, performance      | **Theo:** System design, integration patterns<br>**Apex:** Scalability metrics, optimization techniques         | Apex must cite numbers (QPS, latency); Theo focuses on structure   |
| **Theo + Zen**      | Code design, architecture patterns       | **Theo:** System-level architecture<br>**Zen:** Code-level principles (SOLID, DRY)                              | Zen discusses classes/functions; Theo discusses services/layers    |
| **Finn + Echon**    | User-facing concerns                     | **Finn:** User experience, UI/UX flows<br>**Echon:** User-visible reliability (SLOs, error handling)            | Finn focuses on _delight_; Echon focuses on _dependability_        |
| **Axel + Apex**     | Infrastructure, deployment               | **Axel:** CI/CD pipelines, deployment automation<br>**Apex:** Runtime performance, load testing                 | Axel discusses _how to deploy_; Apex discusses _what to measure_   |
| **Cerberus + Walt** | Risk assessment                          | **Cerberus:** Security/compliance risks<br>**Walt:** Financial risks (churn, CAC)                               | Cerberus discusses threats; Walt discusses unit economics          |
| **Sage + Finn**     | Product vision                           | **Sage:** Business strategy, market fit<br>**Finn:** User needs, interaction design                             | Sage discusses _why we build_; Finn discusses _how users interact_ |
| **Zen + Echon**     | System robustness                        | **Zen:** Code maintainability, test coverage<br>**Echon:** Runtime reliability, monitoring                      | Zen discusses _code health_; Echon discusses _production health_   |

### 3.2 Medium-Risk Overlap Pairs

| Agent Pair          | Potential Overlap       | Distinguishing Factor                                |
| ------------------- | ----------------------- | ---------------------------------------------------- |
| **Mary + Walt**     | Business metrics        | Mary = market size/share; Walt = margin/costs        |
| **Axel + Cerberus** | Infrastructure security | Axel = deployment/ops; Cerberus = threats/compliance |
| **Apex + Echon**    | Production concerns     | Apex = speed; Echon = stability                      |

### 3.3 Low-Risk Pairs (Naturally Distinct)

These pairs rarely overlap due to fundamentally different domains:

- Cerberus + Finn (Security vs UX)
- Walt + Zen (Finance vs Code Quality)
- Mary + Axel (Market Analysis vs DevOps)

---

## 4. Uniqueness Scoring System

### 4.1 Scoring Criteria

**Fully Unique (Green) - 10 points:**

- Introduces a point NO other agent mentioned
- Comes from agent's unique domain expertise
- Would leave a gap if removed

**Partially Unique (Yellow) - 5 points:**

- Adds meaningful nuance to a shared topic
- Provides domain-specific angle on common theme
- Enriches discussion but doesn't introduce net-new point

**Duplicate (Red) - 0 points:**

- Repeats another agent's point
- Paraphrases without new insight
- Could be removed without losing information

### 4.2 Scoring Example - Subscription Billing Feature

**Agent Contributions:**

**Sage (Product Strategy):**

> "We should support annual/monthly billing with a 15% discount for annual to improve cash flow and reduce churn."

**Analysis:** Introduces pricing strategy and discount incentive. **GREEN (10 pts)**

---

**Theo (Tech Architect):**

> "We'll need a BillingCycle enum (MONTHLY, ANNUAL), a prorated calculation service, and webhook integration with Stripe for subscription lifecycle events."

**Analysis:** Introduces technical implementation details. **GREEN (10 pts)**

---

**Walt (Financial):**

> "Annual plans improve LTV by 3x and reduce CAC payback period from 12 months to 4 months based on SaaS benchmarks."

**Analysis:** Adds financial metrics to annual billing discussion. **YELLOW (5 pts)** - Builds on Sage's annual billing idea but adds quantitative financial lens.

---

**Mary (Market Analyst):**

> "Competitors like ProfitWell and Baremetrics both offer annual discounts between 10-20%. Our 15% is competitive."

**Analysis:** Adds competitive benchmark data. **YELLOW (5 pts)** - Validates Sage's pricing but adds market context.

---

**Finn (UX Designer):**

> "Annual billing should be default-selected in the signup flow since it's our preferred option, with clear savings messaging: 'Save $180/year'."

**Analysis:** Introduces UX implementation for annual billing. **GREEN (10 pts)** - New dimension (UI/UX).

---

**Cerberus (Security):**

> "Annual subscriptions need prorated refund calculations if user cancels mid-term. This creates audit requirements for financial compliance (SOC 2)."

**Analysis:** Introduces compliance angle. **GREEN (10 pts)** - Security/compliance perspective not covered.

---

**Axel (DevOps):**

> "We need monitoring for Stripe webhook delivery failures and a replay mechanism in case webhooks are missed during deployments."

**Analysis:** Introduces operational reliability for webhooks. **GREEN (10 pts)** - Operations perspective.

---

**Apex (Performance):**

> "We should implement webhook retry logic with exponential backoff for failed payment notifications."

**Analysis:** Technical implementation for webhook reliability. **GREEN (10 pts)** if Axel didn't mention retries; **YELLOW (5 pts)** if overlap with Axel.

---

**Zen (Code Quality):**

> "The billing calculation logic should be extracted into a pure function with comprehensive unit tests covering edge cases like leap years and partial months."

**Analysis:** Introduces code quality/testing requirement. **GREEN (10 pts)** - Code design perspective.

---

**Echon (Reliability):**

> "We need idempotency keys on all billing API calls to prevent duplicate charges if webhooks retry after timeout. SLO: 99.9% billing accuracy."

**Analysis:** Introduces idempotency and SLO. **GREEN (10 pts)** if no overlap; **YELLOW (5 pts)** if Apex already mentioned idempotency.

---

**Feature Score:** 95/100 points (9 Green + 1 Yellow)
**Verdict:** ✅ Excellent uniqueness. Each agent provides distinct value.

### 4.3 Minimum Thresholds

| Metric                    | Target   | Action if Below                                    |
| ------------------------- | -------- | -------------------------------------------------- |
| **Team Uniqueness Score** | ≥ 85/100 | Review agent prompts for domain separation         |
| **Green Agents**          | ≥ 7/10   | Flag overlapping agents for re-analysis            |
| **Red Agents**            | 0/10     | If any Red, reject and request unique contribution |

---

## 5. Cross-Feature Consistency Check

### 5.1 Domain Consistency Matrix

Track whether each agent CONSISTENTLY brings their domain lens across multiple features:

| Agent        | Consistent Domain Focus? | Feature 1 Evidence     | Feature 2 Evidence     | Feature 3 Evidence     | Consistency Score |
| ------------ | ------------------------ | ---------------------- | ---------------------- | ---------------------- | ----------------- |
| **Sage**     | Product Strategy         | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Theo**     | Tech Architecture        | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Finn**     | UX Design                | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Cerberus** | Security                 | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Mary**     | Market Analysis          | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Walt**     | Financial                | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Axel**     | DevOps                   | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Apex**     | Performance              | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Zen**      | Code Quality             | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |
| **Echon**    | Reliability              | [Example contribution] | [Example contribution] | [Example contribution] | ✅/⚠️/❌          |

**Consistency Criteria:**

- ✅ **Consistent:** Agent stays in their domain lane across all features
- ⚠️ **Drift:** Agent occasionally ventures into another agent's domain
- ❌ **Inconsistent:** Agent changes domain focus per feature

**Example - Subscription SaaS Project:**

| Agent    | Feature: Billing Plans                   | Feature: Payment Gateway            | Feature: Usage Analytics            | Consistency       |
| -------- | ---------------------------------------- | ----------------------------------- | ----------------------------------- | ----------------- |
| **Sage** | Pricing tiers for market positioning     | Checkout UX for conversion          | Analytics as product differentiator | ✅ (Strategy)     |
| **Theo** | BillingCycle enum, prorated calculations | Stripe API integration architecture | Event streaming to analytics DB     | ✅ (Architecture) |
| **Walt** | LTV impact of annual plans               | Payment processing fee analysis     | Cost per analytics query            | ✅ (Finance)      |

**Red Flag Example:**
| Agent | Feature 1 | Feature 2 | Feature 3 | Consistency |
|-------|-----------|-----------|-----------|-------------|
| **Sage** | Pricing strategy | "We need caching for performance" | UX flow for signup | ❌ Drifted into Apex/Finn domains |

---

## 6. Expected Unique Contributions by Agent

For **Subscription SaaS** project specifically, each agent should ONLY say things in their domain:

### 6.1 Sage (Product Strategist)

**Expected Unique Contributions:**

- Pricing strategy (freemium, tiered, usage-based)
- Go-to-market positioning (SMB vs Enterprise)
- Competitive differentiation ("Why choose us over Stripe Billing?")
- Product roadmap prioritization
- Feature bundling strategy
- Market expansion (geographic, vertical)

**Examples:**

- ✅ "We should target mid-market SaaS companies ($1M-$10M ARR) underserved by Stripe and Chargebee."
- ✅ "Our free tier should cap at 100 transactions/month to drive upgrades at growth inflection point."
- ❌ "We need to use PostgreSQL for the database." (Theo's domain)

---

### 6.2 Theo (Technical Architect)

**Expected Unique Contributions:**

- System architecture (microservices, monolith, event-driven)
- API design (REST, GraphQL, webhooks)
- Database schema (tables, relationships, indexes)
- Integration patterns (Stripe, PayPal, tax APIs)
- Data flow diagrams
- Technology stack decisions

**Examples:**

- ✅ "We'll use an event-driven architecture with a BillingService publishing events to a message queue for downstream processing."
- ✅ "Subscription data should be stored in a `subscriptions` table with foreign keys to `customers` and `plans`."
- ❌ "We should price our product at $99/month." (Sage's domain)

---

### 6.3 Finn (UX Designer)

**Expected Unique Contributions:**

- User flows (signup, upgrade, cancellation)
- UI/UX wireframes and mockups
- Onboarding experience
- Notification design (email, in-app)
- Error messaging and user feedback
- Accessibility (WCAG compliance)

**Examples:**

- ✅ "The upgrade modal should show side-by-side plan comparison with highlighted 'Most Popular' badge on the Pro tier."
- ✅ "Payment failure notifications should use friendly language: 'Oops, your card was declined' instead of 'Error 402'."
- ❌ "We need webhook retries for failed payments." (Axel/Apex's domain)

---

### 6.4 Cerberus (Security Guardian)

**Expected Unique Contributions:**

- Compliance requirements (PCI-DSS, SOC 2, GDPR)
- Threat modeling (fraud, data breaches)
- Audit logging (who changed what when)
- Encryption (at rest, in transit)
- Access control (RBAC, permissions)
- Secure coding practices

**Examples:**

- ✅ "All payment card data must be tokenized via Stripe; we NEVER store raw card numbers (PCI-DSS requirement)."
- ✅ "Subscription cancellations must be audit-logged with user ID, timestamp, and reason for SOC 2 compliance."
- ❌ "The subscription dashboard should have a clean, modern design." (Finn's domain)

---

### 6.5 Mary (Market Analyst)

**Expected Unique Contributions:**

- Market research (TAM, SAM, SOM)
- Competitive analysis (feature comparison, pricing benchmarks)
- Customer personas and segments
- Industry trends
- Buyer behavior insights
- Win/loss analysis

**Examples:**

- ✅ "Gartner reports 67% of SaaS companies will adopt usage-based pricing by 2025. We should offer this as an option."
- ✅ "Competitor analysis: ChartMogul charges $100/month for up to $10K MRR tracked, Baremetrics charges $108/month."
- ❌ "We need to implement exponential backoff for API retries." (Apex/Theo's domain)

---

### 6.6 Walt (Financial Strategist)

**Expected Unique Contributions:**

- Unit economics (CAC, LTV, payback period)
- Revenue modeling (MRR, ARR growth)
- Cost analysis (infrastructure, payment processing fees)
- Profitability metrics (gross margin, EBITDA)
- Pricing elasticity
- Cash flow impact

**Examples:**

- ✅ "Stripe charges 2.9% + $0.30 per transaction. At $99/month, our payment processing cost is $3.17, leaving $95.83 gross revenue."
- ✅ "Annual prepay improves cash flow by $X but reduces monthly flexibility. We should offer 15% discount to incentivize."
- ❌ "The payment form should autofill card details using browser autocomplete." (Finn's domain)

---

### 6.7 Axel (DevOps Commander)

**Expected Unique Contributions:**

- CI/CD pipelines (GitHub Actions, GitLab CI)
- Deployment automation (blue/green, canary)
- Infrastructure as code (Terraform, CloudFormation)
- Runbooks and incident response
- Container orchestration (Kubernetes, Docker)
- Environment management (dev, staging, prod)

**Examples:**

- ✅ "We need a blue/green deployment strategy for billing service to enable zero-downtime updates during payment processing."
- ✅ "Runbook required: 'How to rollback a failed billing service deployment' with step-by-step instructions."
- ❌ "The database should use B-tree indexes for subscription lookups." (Theo/Apex's domain)

---

### 6.8 Apex (Performance Engineer)

**Expected Unique Contributions:**

- Performance metrics (latency, throughput, QPS)
- Caching strategies (Redis, CDN)
- Database optimization (indexing, query tuning)
- Load testing and benchmarks
- Scalability analysis (vertical vs horizontal)
- Resource profiling (CPU, memory)

**Examples:**

- ✅ "We should cache active subscription data in Redis with 5-minute TTL to reduce database load from 1000 QPS to 50 QPS."
- ✅ "Load testing shows the billing API can handle 500 concurrent subscriptions/sec before latency exceeds 200ms."
- ❌ "We should offer a 14-day free trial to improve conversion." (Sage's domain)

---

### 6.9 Zen (Code Quality Sage)

**Expected Unique Contributions:**

- Code design principles (SOLID, DRY, KISS)
- Test strategy (unit, integration, E2E)
- Refactoring recommendations
- Code review standards
- Technical debt assessment
- Maintainability patterns

**Examples:**

- ✅ "The billing calculation logic violates SRP. Extract into `BillingCalculator` class with injected `TaxService` and `DiscountService`."
- ✅ "We need unit tests covering edge cases: leap year billing, mid-month upgrades, prorated refunds."
- ❌ "We should monitor webhook delivery failures with alerts." (Axel/Echon's domain)

---

### 6.10 Echon (Reliability Engineer)

**Expected Unique Contributions:**

- SLOs/SLIs (availability, error rate, latency)
- Graceful degradation strategies
- Error handling patterns (retries, circuit breakers)
- Monitoring and observability (metrics, logs, traces)
- Idempotency requirements
- Fallback mechanisms

**Examples:**

- ✅ "SLO: 99.9% billing accuracy (< 0.1% incorrect charges). Monitoring: alert if failed_payment_webhooks > 10/hour."
- ✅ "Implement idempotency keys on all Stripe API calls to prevent duplicate charges if webhook retries after timeout."
- ❌ "The pricing page should display annual savings prominently." (Finn/Sage's domain)

---

## 7. Uniqueness Verification Workflow

### Step 1: Initial Collection

For each feature, collect all 10 agent responses in a table:

| Agent    | Response Summary |
| -------- | ---------------- |
| Sage     | ...              |
| Theo     | ...              |
| Finn     | ...              |
| Cerberus | ...              |
| Mary     | ...              |
| Walt     | ...              |
| Axel     | ...              |
| Apex     | ...              |
| Zen      | ...              |
| Echon    | ...              |

### Step 2: Extract Key Points

For each agent, extract 3-5 key points:

**Example - Sage:**

1. Tiered pricing strategy (Free, Pro, Enterprise)
2. 15% discount for annual plans
3. Target mid-market SaaS companies
4. Free tier caps at 100 transactions/month
5. Competitive positioning vs. Stripe Billing

### Step 3: Cross-Check for Echoes

For each point, ask:

- Did any other agent say this?
- If yes, did they add new information?
- Score: Green/Yellow/Red

### Step 4: Complete Uniqueness Matrix

Fill out the template from Section 1.

### Step 5: Calculate Team Score

Sum up points (Green=10, Yellow=5, Red=0).

**Target:** ≥ 85/100

### Step 6: Review Red/Yellow Agents

If any agent scores Yellow or Red:

- Identify overlapping agent
- Determine if overlap is necessary (reinforcement) or wasteful (echo)
- If wasteful, request re-analysis with clearer domain boundaries

### Step 7: Cross-Feature Consistency

After analyzing 3+ features:

- Complete Section 5 matrix
- Verify each agent stays in their domain lane
- Flag any agents drifting into other domains

---

## 8. Common Uniqueness Violations

### Violation 1: Business Agents Overlapping (Sage + Mary + Walt)

**Problem:**

- Sage: "We should offer annual billing with a discount."
- Mary: "Annual billing is common in SaaS."
- Walt: "Annual billing improves cash flow."

**All 3 touch annual billing but from different angles. Is this echo?**

**Analysis:**

- Sage = Strategy (WHAT to offer)
- Mary = Market validation (competitors do this)
- Walt = Financial impact (WHY it's good financially)

**Verdict:** NOT echo if each adds distinct lens. ECHO if all just say "annual billing is good."

---

### Violation 2: Technical Agents Overlapping (Theo + Apex + Zen)

**Problem:**

- Theo: "We need caching for subscription data."
- Apex: "We should use Redis caching to reduce latency."
- Zen: "Caching should be abstracted into a CacheService interface."

**Analysis:**

- Theo = Mentions caching (architecture decision)
- Apex = Specifies Redis + metrics (performance engineering)
- Zen = Proposes design pattern (code quality)

**Verdict:** NOT echo if all 3 add value. Borderline if Theo + Apex both just say "use Redis."

---

### Violation 3: User-Facing Agents Overlapping (Finn + Sage)

**Problem:**

- Sage: "We need a seamless upgrade flow to convert free users to paid."
- Finn: "The upgrade modal should have clear CTAs and plan comparison."

**Analysis:**

- Sage = Business goal (conversion)
- Finn = UX implementation (how to achieve it)

**Verdict:** NOT echo. Complementary perspectives.

---

### Violation 4: Reliability Agents Overlapping (Axel + Echon + Apex)

**Problem:**

- Axel: "We need monitoring for webhook failures."
- Echon: "We should set SLOs for webhook delivery (99.9%)."
- Apex: "We should implement webhook retry with exponential backoff."

**Analysis:**

- Axel = Ops monitoring (detect failures)
- Echon = Reliability target (SLO)
- Apex = Performance implementation (retries)

**Verdict:** NOT echo. All add distinct value.

**Counter-Example (ECHO):**

- Axel: "We need webhook retries."
- Apex: "We should retry webhooks if they fail."

**Verdict:** ECHO. No new information between Axel and Apex.

---

## 9. Quality Checklist

Before finalizing feature analysis, verify:

- [ ] All 10 agents contributed
- [ ] No agent explicitly referenced another agent's point without adding new info
- [ ] Each agent stayed in their domain (per Section 6)
- [ ] Team uniqueness score ≥ 85/100
- [ ] At least 7/10 agents scored Green
- [ ] Zero agents scored Red
- [ ] Cross-feature consistency maintained (if applicable)

---

## 10. Remediation Actions

| Issue                               | Action                                                                                                           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Agent scored Red (echo)**         | Request re-analysis with instruction: "Provide a unique insight from your domain that NO other agent mentioned." |
| **Multiple Yellow scores**          | Review agent prompts to clarify domain boundaries                                                                |
| **Team score < 85**                 | Identify most overlapping agents; merge or clarify roles                                                         |
| **Agent drifts across features**    | Update agent prompt with explicit domain constraints                                                             |
| **Two agents consistently overlap** | Consider removing one agent or splitting into sub-domains                                                        |

---

## 11. Success Metrics

**Per Feature:**

- Team Uniqueness Score ≥ 85/100
- Green Agents ≥ 7/10
- Red Agents = 0/10

**Across Project:**

- Each agent maintains consistent domain focus (✅ in Section 5 matrix)
- No agent redundancy identified
- All 10 agents provide measurable value

**Validation:**

- Human reviewer can summarize each agent's unique contribution in one sentence
- Removing any agent would leave a noticeable gap in analysis

---

**End of Uniqueness Verification Protocol**
