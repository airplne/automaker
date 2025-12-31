# Domain Depth Scoring Framework

**Purpose:** Evaluate each agent's domain-specific expertise and actionable value in the 10-agent BMAD Executive Suite.

**Version:** 1.0
**Date:** 2025-12-31

---

## 1. Scoring Rubric (0-3 per agent)

### Score 0 - Not Present

**Definition:** Agent was not invoked, did not respond, or provided no meaningful contribution.

**Indicators:**

- No output in agent session
- Empty or placeholder response
- Generic "I agree" without elaboration

---

### Score 1 - Surface Level

**Definition:** Generic statements that could apply to any project; no domain-specific terminology or insights.

**Indicators:**

- Vague recommendations without specifics
- Could be written by someone unfamiliar with the domain
- No technical terminology
- No reference to standards, patterns, or best practices

**Examples by Agent:**

**Sage (Business/Product Strategy):**

```
"This feature should help users. Make sure it's easy to use."
```

❌ No business metrics, value propositions, or market positioning

**Theo (Technical Architecture):**

```
"Use a database to store the data. Make sure it's scalable."
```

❌ No specific patterns, technologies, or architectural decisions

**Finn (Delivery & UX):**

```
"Make the UI look good. Users should understand it."
```

❌ No UX principles, accessibility standards, or user journey insights

**Cerberus (Security & Compliance):**

```
"Make sure it's secure. Don't let hackers in."
```

❌ No threat modeling, compliance frameworks, or security controls

**Mary (Data & Analytics):**

```
"Track some metrics. Make charts to see how it's doing."
```

❌ No specific KPIs, data models, or analytical frameworks

**Walt (Financial Strategy):**

```
"This will cost money. Try to make profit."
```

❌ No cost models, revenue projections, or unit economics

**Axel (Operations & Infrastructure):**

```
"Deploy it to production. Monitor it so it doesn't break."
```

❌ No deployment strategies, SLIs/SLOs, or operational runbooks

**Apex (Performance Optimization):**

```
"Make it fast. Don't make it slow."
```

❌ No performance budgets, profiling strategies, or optimization techniques

**Zen (Code Quality & Maintainability):**

```
"Write clean code. Add some tests."
```

❌ No design patterns, refactoring strategies, or quality metrics

**Echon (Post-Launch & Evolution):**

```
"See how users react. Maybe improve it later."
```

❌ No feedback loops, iteration strategies, or growth frameworks

---

### Score 2 - Domain Relevant

**Definition:** Uses domain-specific concepts and terminology; shows understanding of the feature and domain context.

**Indicators:**

- Uses appropriate technical/domain terminology
- Relates recommendations to the specific feature
- Shows awareness of common patterns and approaches
- Considers the domain context (SaaS, subscriptions, payments)

**Examples by Agent:**

**Sage (Business/Product Strategy):**

```
"For subscription management, consider tiered pricing (Basic/Pro/Enterprise).
Track MRR, churn rate, and LTV:CAC ratio. The trial-to-paid conversion funnel
will be critical for measuring success."
```

✅ Uses SaaS metrics and pricing models

**Theo (Technical Architecture):**

```
"Implement a webhook handler for Stripe events using an idempotent consumer pattern.
Use a message queue (Redis Streams or RabbitMQ) to handle webhook retries.
Store subscription state in PostgreSQL with proper ACID guarantees."
```

✅ Names specific technologies and architectural patterns

**Finn (Delivery & UX):**

```
"Apply progressive disclosure for complex pricing tiers. Use microcopy to reduce
friction in the upgrade flow. Ensure WCAG 2.1 AA compliance for payment forms.
A/B test the CTA placement on the pricing page."
```

✅ References UX principles and accessibility standards

**Cerberus (Security & Compliance):**

```
"Implement PCI-DSS SAQ-A compliance by using Stripe Checkout (no card data touches
our servers). Apply rate limiting to webhook endpoints (100 req/min). Store webhook
signatures and validate them using constant-time comparison."
```

✅ References specific compliance frameworks and security controls

**Mary (Data & Analytics):**

```
"Create a star schema for subscription analytics with fact tables for events
(upgrades, downgrades, cancellations) and dimension tables for users, plans, and time.
Track cohort retention curves and MRR movements (expansion, contraction, churn)."
```

✅ Uses data modeling terminology and SaaS-specific metrics

**Walt (Financial Strategy):**

```
"Model unit economics: CAC=$150, LTV=$900 (30 months avg lifetime). Target 40%
gross margin after payment processing fees (2.9% + $0.30). Revenue recognition
must follow ASC 606 for deferred revenue on annual plans."
```

✅ Provides specific financial metrics and accounting standards

**Axel (Operations & Infrastructure):**

```
"Set SLO of 99.9% uptime for payment processing (43 minutes/month error budget).
Implement circuit breakers for Stripe API calls with 3-retry exponential backoff.
Use blue-green deployment for subscription service to ensure zero-downtime releases."
```

✅ Specifies SLOs, deployment strategies, and resilience patterns

**Apex (Performance Optimization):**

```
"Set performance budget: subscription page TTI < 2s, webhook processing < 200ms p99.
Use Redis caching for subscription status with 5-minute TTL. Implement database
connection pooling (max 20 connections) to prevent resource exhaustion."
```

✅ Provides specific performance targets and optimization techniques

**Zen (Code Quality & Maintainability):**

```
"Apply the Strategy pattern for different subscription tiers. Use the Repository
pattern to abstract subscription data access. Ensure 80% code coverage with unit
tests and integration tests for critical payment paths. Use TypeScript strict mode."
```

✅ References design patterns and quality metrics

**Echon (Post-Launch & Evolution):**

```
"Monitor subscription lifecycle events: trial starts, conversions, upgrades,
voluntary/involuntary churn. Set up feedback collection at cancellation (exit surveys).
Plan quarterly pricing experiments based on willingness-to-pay analysis."
```

✅ Describes feedback loops and iteration strategies

---

### Score 3 - Deep Expertise

**Definition:** Demonstrates deep domain expertise with specific, actionable recommendations; considers edge cases, tradeoffs, and references industry standards.

**Indicators:**

- Highly specific and actionable recommendations
- References authoritative standards, research, or best practices
- Considers multiple scenarios, edge cases, and tradeoffs
- Provides prioritization or decision frameworks
- Shows awareness of industry-leading practices

**Examples by Agent:**

**Sage (Business/Product Strategy):**

```
"Implement Value Metric Pricing aligned to customer outcomes (e.g., per-seat for teams,
usage-based for API calls). Reference Patrick Campbell's ProfitWell research showing
value metric pricing increases LTV by 30-50% vs. flat-rate. Design pricing tiers with
10X value gap between tiers (Good/Better/Best framework). Include strategic 'fence'
features: Basic (self-serve), Pro (priority support + SSO), Enterprise (dedicated CSM + SLA).

For trial optimization, implement a Product-Led Growth motion: 7-day free trial with
time-to-value < 5 minutes (Wes Bush PLG framework). Track PQL (Product Qualified Lead)
criteria: 3+ core actions in first 48 hours = 5X conversion rate.

Churn prevention: Implement cancellation flow with Save offers (downgrade to lower tier,
pause subscription). Analyze churn cohorts by acquisition channel, plan tier, and usage
pattern. Target involuntary churn (failed payments) separately with dunning campaigns
(Stripe Smart Retries + email sequence)."
```

✅ References industry research (Patrick Campbell), frameworks (PLG, Good/Better/Best), and specific strategies with quantified impact

**Theo (Technical Architecture):**

```
"Subscription Architecture:

1. **Event-Driven State Machine:** Model subscription lifecycle as explicit state machine
   (trialing → active → past_due → canceled). Use XState or similar for deterministic
   state transitions. Emit domain events (SubscriptionCreated, SubscriptionUpgraded)
   to event bus for downstream services.

2. **Webhook Processing (Idempotency):** Stripe sends duplicate webhooks. Implement
   idempotency using `stripe_event_id` as idempotency key in DB (unique constraint).
   Use outbox pattern: atomic write to `subscription_events` table + background worker
   polls for processing. This ensures exactly-once processing and survives crashes.

3. **Data Consistency:** Use saga pattern for multi-step operations (upgrade = cancel old
   subscription + create new + prorate refund). Implement compensating transactions for
   failure cases. PostgreSQL advisory locks prevent race conditions on subscription updates.

4. **Integration Boundaries:** Subscription service as bounded context. Expose GraphQL API
   for queries, gRPC for synchronous commands, Kafka for async events. Apply CQRS: write
   model optimized for consistency, read model (materialized view) optimized for query performance.

5. **Failure Modes:** Circuit breaker for Stripe API (open after 5 consecutive failures,
   half-open retry after 30s). For webhook failures, implement exponential backoff with
   jitter (Stripe retries for 3 days). Dead letter queue for unprocessable events with
   alerting to PagerDuty.

**Trade-offs:** Event-driven adds complexity but provides audit trail and enables
decoupling. CQRS increases operational overhead but scales read/write independently.
For MVP, start with synchronous REST + webhook queue, evolve to event-driven as scale demands."
```

✅ Specific architectural patterns (saga, CQRS, outbox), considers failure modes, discusses tradeoffs, provides evolution path

**Finn (Delivery & UX):**

```
"Subscription UX - Evidence-Based Design:

1. **Pricing Page:** Apply Decoy Effect (behavioral economics): Basic $10, Pro $30,
   Enterprise $100. Position Pro as 'Most Popular' (middle option bias). Show annual
   vs. monthly side-by-side with '2 months free' framing (loss aversion, Kahneman/Tversky).

   Jakob's Law: Match competitor pricing layouts (users expect 3-column grid). Add trust
   signals: "30-day money-back guarantee", security badges (Norton, SSL), social proof
   (testimonials with photos + company logos).

2. **Trial Flow (BJ Fogg Behavior Model):** Reduce friction (Ability) + increase motivation:
   - **Ability:** Email-only signup, no credit card for trial (reduces anxiety, per Baymard
     Institute, CC-required trials have 30-40% lower conversion)
   - **Motivation:** Progress indicators (3-step setup), empty states with action prompts
     (BJ Fogg 'tiny habits'), celebration moments (confetti on first success)
   - **Prompt:** Time-based emails (day 3: 'here's what you haven't tried', day 6: 'trial
     ending soon' urgency)

3. **Upgrade Flow:**
   - Contextual CTAs at point of need (hit plan limit → inline upgrade modal, not redirect)
   - Show ROI calculator (e.g., "Save 12 hours/week = $600/month at $50/hr")
   - Apply Zeigarnik Effect: Show locked features with partial previews to create desire
   - One-click upgrade (pre-populate billing from trial email, Stripe Link for autofill)

4. **Accessibility (WCAG 2.1 AAA):**
   - Payment forms: ARIA labels, error announcements, keyboard navigation (tab order)
   - Color contrast ratio 7:1 (AAA) for critical CTAs
   - Screen reader testing with NVDA/JAWS: ensure pricing table reads row-by-row
   - Form validation: inline errors with aria-describedby, not just color-coded

5. **Experimentation Framework:**
   - A/B test annual discount framing: '2 months free' vs. '17% off' vs. '$240/year'
   - Track micro-conversions: pricing page visit → plan selection → payment info → complete
   - Use multi-armed bandit (Optimizely, VWO) for CTA copy optimization (faster than pure A/B)

**Design System:** Build subscription components in Storybook with all states (loading,
error, success). Ensure design tokens (spacing, colors) match brand system. Reference
Stripe's payment element for battle-tested patterns."
```

✅ References behavioral economics (Kahneman, BJ Fogg), specific research (Baymard Institute), UX laws (Jakob's Law), accessibility details, and experimentation frameworks

**Cerberus (Security & Compliance):**

```
"Subscription Security & Compliance - Defense in Depth:

1. **PCI-DSS Compliance (Minimize Scope):**
   - Use Stripe Checkout or Elements (SAQ-A: simplest compliance, no card data on servers)
   - If custom form: SAQ-A-EP requires network segmentation, quarterly ASV scans, annual
     penetration test, PCI DSS v4.0 compliance by March 2025
   - Never log card numbers (even truncated last-4 should be masked in logs)
   - Implement Content Security Policy (CSP) to prevent XSS injection into payment forms

2. **Webhook Security (OWASP API Security Top 10):**
   - Validate Stripe signatures using constant-time comparison (timing attack prevention)
   - Rate limiting: 100 req/min per IP (prevent replay attacks), use token bucket algorithm
   - Webhook endpoint authentication: require shared secret in header (HMAC-SHA256)
   - Idempotency: store processed `stripe_event_id` with 24-hour retention, reject duplicates
   - TLS 1.3 only for webhook endpoints, disable TLS 1.0/1.1 (PCI DSS requirement)

3. **Data Protection (GDPR, CCPA):**
   - PII minimization: only store email, not full billing address (Stripe holds sensitive data)
   - Right to erasure: implement user deletion workflow that cancels subscriptions + anonymizes
     historical data (replace email with `deleted_user_<uuid>@example.com`)
   - Data retention policy: purge canceled subscription details after 7 years (IRS requirement
     for financial records), anonymize after 90 days of cancellation
   - Encryption: AES-256 for sensitive data at rest (subscription metadata), TLS 1.3 in transit
   - Use Stripe's data residency features for EU customers (GDPR Article 44-50)

4. **Authentication & Authorization:**
   - Subscription management requires authenticated session (JWT with 15-min expiry, refresh tokens)
   - Implement CSRF protection for subscription update endpoints (double-submit cookie pattern)
   - Authorization: users can only view/modify their own subscriptions (IDOR prevention via
     `WHERE user_id = :authenticated_user_id` in all queries)
   - Admin access: MFA required (TOTP), audit log all subscription modifications with IP + timestamp

5. **Threat Modeling (STRIDE):**
   - **Spoofing:** Attacker sends fake webhook → Mitigated by signature verification
   - **Tampering:** Attacker modifies subscription state → Mitigated by server-side state management
   - **Repudiation:** User claims they didn't upgrade → Mitigated by audit logs, email confirmations
   - **Information Disclosure:** Attacker enumerates subscription IDs → Mitigated by UUIDs, authz checks
   - **Denial of Service:** Webhook flood → Mitigated by rate limiting, queue depth limits
   - **Elevation of Privilege:** User upgrades without payment → Mitigated by server-side verification
     of payment status before granting access

6. **Incident Response:**
   - Security playbook: suspected payment fraud → freeze subscription, notify Stripe Radar,
     contact user via registered email
   - Webhook failure > 1 hour → PagerDuty alert, check Stripe dashboard for missed events
   - Data breach notification: 72-hour GDPR requirement, maintain incident response runbook

**Compliance Checklist:**
- [ ] PCI DSS SAQ-A completed annually
- [ ] SOC 2 Type II controls for payment processing (if B2B)
- [ ] GDPR DPA (Data Processing Agreement) with Stripe
- [ ] Privacy policy updated with subscription data handling
- [ ] Penetration test report (annual, per PCI DSS)

**Reference:** OWASP Payment Security Top 10, Stripe Security Best Practices, NIST 800-53 controls."
```

✅ Specific compliance frameworks (PCI DSS, GDPR, OWASP), threat modeling (STRIDE), security controls with implementation details, incident response procedures

**Mary (Data & Analytics):**

```
"Subscription Analytics - Data Engineering & Insights:

1. **Data Model (Kimball Star Schema):**
   - **Fact Tables:**
     - `fact_subscription_events`: grain = one event per subscription state change
       (created, trial_end, upgraded, downgraded, canceled, reactivated)
       - Measures: MRR, quantity, discount_amount
       - Foreign keys: user_dim, plan_dim, time_dim, cancellation_reason_dim
     - `fact_daily_mrr_snapshot`: grain = one row per subscription per day (Type 2 SCD)
       - Enables cohort analysis, MRR movement waterfall charts

   - **Dimension Tables:**
     - `dim_user`: user attributes (acquisition_channel, signup_date, customer_segment)
     - `dim_plan`: plan metadata (tier, billing_interval, price, feature_set)
     - `dim_time`: date dimension (day, week, month, quarter, is_weekend, is_holiday)
     - `dim_cancellation_reason`: taxonomy (price_too_high, missing_features, poor_support, other)

2. **SaaS Metrics (Christoph Janz SaaS Metrics):**
   - **MRR Movements:** New, Expansion (upgrades), Contraction (downgrades), Churn, Reactivation
     - Formula: `MRR_end = MRR_start + New + Expansion - Contraction - Churn + Reactivation`
     - Visualize as waterfall chart (Baremetrics-style)

   - **Cohort Retention:** Group users by signup month, track % still active in month 1, 2, 3...N
     - Target: >90% month-1 retention, >70% month-12 retention for healthy SaaS
     - Color-coded heatmap (green = high retention, red = high churn)

   - **LTV Calculation (Probabilistic Model):**
     - Simple: `LTV = ARPU / Churn Rate` (assumes linear churn)
     - Advanced: Survival analysis (Kaplan-Meier estimator) to model time-to-churn distribution
     - Segment by cohort, acquisition channel, plan tier (Enterprise LTV likely 10X+ higher than Basic)

   - **Quick Ratio (Growth Efficiency):** `(New MRR + Expansion MRR) / (Contraction MRR + Churned MRR)`
     - Target: >4.0 (high growth), <1.0 (shrinking)
     - Leading indicator: predicts 6-month revenue trajectory

3. **Data Pipeline (ELT Architecture):**
   - **Extract:** Stripe webhooks → Kafka topic `stripe.subscription.events`
   - **Load:** Kafka consumer → raw events in PostgreSQL `staging.stripe_events` (JSONB column)
   - **Transform:** DBT models transform raw events into star schema
     - Incremental models: process only new events since last run (performance)
     - Tests: uniqueness of subscription_id + event_timestamp, not_null on MRR
   - **Orchestration:** Airflow DAG runs hourly, backfill capability for historical corrections
   - **Data Quality:** Great Expectations checks (MRR always positive, state transitions valid)

4. **Analytics Dashboards (Actionable Insights):**
   - **Executive Dashboard (Looker/Tableau):**
     - KPIs: MRR, MRR Growth Rate (MoM), Logo Churn %, Revenue Churn %, Quick Ratio, LTV:CAC
     - Alerts: MRR Growth < 5% MoM (yellow), Quick Ratio < 2.0 (red)

   - **Product Dashboard:**
     - Trial conversion funnel: signup → activation (first core action) → paid conversion
     - Feature adoption by plan tier (shows which features drive upgrades)
     - Churn reasons breakdown (Pareto chart: 80% of churn from top 3 reasons)

   - **Financial Dashboard:**
     - Revenue recognition: deferred revenue balance (annual plans amortized monthly per ASC 606)
     - Payment success rate, failed payment recovery rate (dunning effectiveness)
     - Gross margin by plan tier (after Stripe fees, COGS)

5. **Predictive Analytics (Churn Prevention):**
   - **Churn Prediction Model (Random Forest / XGBoost):**
     - Features: usage frequency (last 7/14/30 days), support tickets, login streak, plan tier,
       tenure, discount %, feature adoption score
     - Target: binary classification (churns in next 30 days: yes/no)
     - Output: churn probability score (0-100%)
     - Intervention: users with >70% churn probability → trigger automated "We miss you" campaign
       or assign to Customer Success Manager for outreach

   - **Model Evaluation:** AUC-ROC >0.80, precision/recall tradeoff (optimize recall to catch
     all at-risk users, even with false positives)

   - **A/B Test Analysis (Bayesian A/B Testing):**
     - Primary metric: trial-to-paid conversion rate
     - Secondary: time-to-convert, plan tier selected
     - Use Bayesian posterior credible intervals (avoid p-value misinterpretation)
     - Minimum sample size: 385 per variant (5% MDE, 80% power, 5% baseline conversion)

6. **Data Governance:**
   - **PII Handling:** Anonymize user emails in analytics warehouse (hash with SHA-256 + salt)
   - **Access Control:** Analytics team read-only access, row-level security (RLS) in Looker
     (CSMs only see their assigned accounts)
   - **Data Lineage:** Track data transformations from source (Stripe) → warehouse → dashboard
     (DBT docs, Atlan/Alation for data catalog)

**Reference:** Christoph Janz SaaS Metrics, DBT Best Practices, Kimball Dimensional Modeling,
"Lean Analytics" by Croll & Yoskovitz."
```

✅ Detailed data models (star schema), specific SaaS metrics with formulas, data pipeline architecture, predictive analytics, references authoritative sources

**Walt (Financial Strategy):**

```
"Subscription Financial Model - Unit Economics & Revenue Strategy:

1. **Unit Economics Framework:**
   - **CAC (Customer Acquisition Cost):**
     - Formula: `CAC = (Sales + Marketing Spend) / New Customers`
     - Segment by channel: Organic ($50), Paid Social ($200), Enterprise Sales ($5,000)
     - Include: ad spend, sales salaries, marketing tools (HubSpot, Google Ads), creative production
     - Target: CAC payback < 12 months (SaaS Capital benchmark)

   - **LTV (Lifetime Value):**
     - Formula: `LTV = ARPU × Gross Margin % × (1 / Churn Rate)`
     - Example: $50 ARPU × 75% margin × (1 / 5% monthly churn) = $750 LTV
     - Gross Margin: Revenue - COGS (Stripe fees 2.9%+$0.30, hosting, support costs)
     - Advanced: Use cohort-based LTV (month 1-12 actual, month 13+ projected)

   - **LTV:CAC Ratio:**
     - Target: >3.0 (healthy SaaS), <3.0 suggests overspending on acquisition or high churn
     - Danger zone: <1.0 (losing money on every customer)
     - Per David Skok (Matrix Partners): 3:1 ratio with <12 month payback = ideal

   - **Magic Number (Sales Efficiency):**
     - Formula: `(MRR_Q2 - MRR_Q1) × 4 / Sales&Marketing_Spend_Q1`
     - >1.0 = efficient growth, <0.5 = inefficient (burning cash)
     - Indicates when to scale sales team (wait until >0.75)

2. **Pricing Strategy (Van Westendorp Price Sensitivity Meter):**
   - Conduct pricing research: survey 500+ target customers
     - "At what price is it too cheap (suspicious quality)?" → floor price
     - "At what price is it expensive but still consider?" → optimal price point
     - "At what price is it too expensive (never buy)?" → ceiling price

   - **Value-Based Pricing:** Price = % of value delivered (not cost-plus)
     - Example: If product saves 10 hours/week = $500/week value → charge $100/month (20% of value)
     - Reference: Patrick Campbell (ProfitWell) - "charge 10-20% of value created"

   - **Price Discrimination (Good/Better/Best):**
     - Basic: $10/mo (self-serve, 1 user, limited features) → targets SMBs
     - Pro: $30/mo (5 users, advanced features, priority support) → targets growing companies
     - Enterprise: $200/mo (unlimited users, SSO, SLA, CSM) → targets large orgs
     - Design 10X value gap: Enterprise perceived value should be 10X Basic (not 20X price)

3. **Revenue Recognition (ASC 606 / IFRS 15):**
   - **5-Step Model:**
     1. Identify contract: user accepts Terms of Service + payment
     2. Identify performance obligations: subscription access for billing period
     3. Determine transaction price: $50/month or $500/year
     4. Allocate price to obligations: single obligation (subscription access)
     5. Recognize revenue: ratably over subscription period

   - **Deferred Revenue (Liability):**
     - Annual plan: $500 upfront → recognize $41.67/month over 12 months
     - Balance sheet: Deferred Revenue account, reduces each month as revenue recognized
     - Bookings vs. Revenue: $500 booking in Jan, but only $41.67 revenue in Jan

   - **Proration Handling:**
     - Upgrade mid-month: credit unused days on old plan, charge new plan prorated
     - Accounting: adjustment to Deferred Revenue, recognized in current period

   - **Refunds:** Reverse recognized revenue in refund period (contra-revenue account)

4. **Financial Modeling (3-Statement Model):**
   - **Income Statement:**
     - Revenue: MRR × 12 (annualize), model growth rate (e.g., 10% MoM)
     - COGS: Stripe fees, AWS hosting (variable with users), support costs
     - Gross Profit: Revenue - COGS, target >70% margin for SaaS
     - Opex: Sales, Marketing, R&D, G&A (salaries, tools, office)
     - EBITDA: Gross Profit - Opex (profitability metric, target >20% for mature SaaS)

   - **Cash Flow Statement:**
     - Operating CF: EBITDA + changes in working capital (Deferred Revenue is cash inflow)
     - Annual plans improve cash flow (12 months upfront vs. 1 month at a time)
     - Runway: Cash / Monthly Burn Rate (target 18+ months for safety)

   - **Balance Sheet:**
     - Assets: Cash, AR (if invoicing), Deferred Costs (sales commissions amortized)
     - Liabilities: Deferred Revenue (unearned cash), AP, Debt
     - Equity: Retained Earnings, Shareholder Equity

5. **Scenario Planning (Monte Carlo Simulation):**
   - Model uncertainty: churn rate (3-7%), ARPU growth (0-15%), CAC (±30%)
   - Run 10,000 simulations to estimate revenue distribution (P10, P50, P90 scenarios)
   - Stress test: what if churn doubles? What if CAC increases 50%?
   - Helps determine: fundraising needs, hiring plan, break-even timeline

6. **Key Financial Metrics Dashboard:**
   - **Top-line:** MRR, ARR, YoY Growth Rate, Bookings (TCV/ACV for enterprise)
   - **Profitability:** Gross Margin %, EBITDA %, Rule of 40 (Growth% + Margin% >40)
   - **Efficiency:** CAC Payback, LTV:CAC, Magic Number, Burn Multiple ($ burned / net new ARR)
   - **Cash:** Cash Balance, Monthly Burn Rate, Runway (months), Free Cash Flow
   - **Benchmarks (SaaS Capital, OpenView):** Median SaaS growth 30% YoY, churn 5-7%, LTV:CAC 3:1

7. **Investor Metrics (If Fundraising):**
   - **ARR (Annual Recurring Revenue):** MRR × 12, key metric for valuation
   - **Net Revenue Retention (NRR):** Start with $100 cohort → after 12 months, what's the revenue?
     - Formula: `(Starting MRR + Expansion - Contraction - Churn) / Starting MRR × 100%`
     - Target: >100% (expansion offsets churn), >120% = best-in-class
     - Per Bessemer: NRR >100% → "logo-efficient growth" (grow without new customers)

   - **Valuation Multiples:** SaaS companies trade at 5-15X ARR (varies by growth rate, NRR, scale)
     - High growth (>100% YoY) + high NRR (>120%) = 10-15X ARR
     - Moderate growth (30-50% YoY) = 5-8X ARR
     - Use public comps (Salesforce, HubSpot) and recent private market transactions

**Reference:** David Skok (Matrix Partners) SaaS Metrics, SaaS Capital Benchmarks, Bessemer
Cloud Index, "SaaS Metrics 2.0" by David Skok, ASC 606 Revenue Recognition Standard."
```

✅ Comprehensive unit economics with formulas, pricing strategies with research methods, detailed revenue recognition (ASC 606), financial modeling, scenario planning, investor metrics

**Axel (Operations & Infrastructure):**

```
"Subscription Operations - Production Readiness & SRE:

1. **SLIs / SLOs / SLAs (Google SRE Framework):**
   - **SLI (Service Level Indicator) - Measurements:**
     - Availability: `(successful requests / total requests) × 100%`
     - Latency: `p99 response time < 500ms` (99th percentile, not average)
     - Correctness: `subscription state accuracy = 100%` (no ghost subscriptions)

   - **SLO (Service Level Objective) - Internal Targets:**
     - Availability: 99.9% uptime (43 minutes downtime/month error budget)
     - Latency: 95% of subscription API requests < 200ms, 99% < 500ms
     - Webhook processing: 99.5% processed within 30 seconds of receipt

   - **SLA (Service Level Agreement) - Customer-Facing Commitments:**
     - Enterprise tier: 99.95% uptime (21 minutes/month), breach = 10% monthly credit
     - Pro tier: 99.9% uptime, no SLA for Basic tier
     - Response time: P1 incidents (payment failure) < 1 hour response, P2 < 4 hours

   - **Error Budget Policy:**
     - If SLO breached (availability < 99.9%): freeze feature launches, focus on reliability
     - Monthly error budget: 43 minutes. If consumed in week 1 → incident postmortem + fixes
     - Toil reduction: automate manual ops work, target <50% of ops time on toil

2. **Deployment Strategy (Zero-Downtime):**
   - **Blue-Green Deployment:**
     - Maintain two identical environments (Blue = production, Green = new version)
     - Deploy to Green, run smoke tests, flip load balancer to Green (instant rollback to Blue if issues)
     - Rollback SLA: <5 minutes to revert to previous version

   - **Database Migrations (Expand-Contract Pattern):**
     - Never breaking changes in one deploy
     - Phase 1: Add new column (nullable), deploy app that writes to both old & new
     - Phase 2: Backfill data, deploy app that reads from new column
     - Phase 3: Remove old column (after monitoring confirms no usage)

   - **Canary Releases:**
     - Roll out to 5% of traffic (canary), monitor error rates, latency, business metrics
     - Automated rollback if error rate >1% or latency >2X baseline
     - Progressive rollout: 5% → 25% → 50% → 100% over 24 hours

3. **Webhook Reliability (At-Least-Once Delivery):**
   - **Idempotency Keys:** Store `stripe_event_id` in DB with unique constraint (prevent duplicate processing)
   - **Retry Logic (Exponential Backoff with Jitter):**
     - Stripe retries webhooks for 3 days with exponential backoff
     - Our side: If DB unavailable, write webhook to DLQ (Dead Letter Queue), retry later
     - Backoff: 1s, 2s, 4s, 8s, 16s (max 1 hour), add jitter (±20%) to prevent thundering herd

   - **Circuit Breaker (Michael Nygard "Release It!" pattern):**
     - Track failure rate of downstream service (Stripe API, DB)
     - States: Closed (normal), Open (reject requests, fail fast), Half-Open (test recovery)
     - Threshold: 5 consecutive failures → Open for 30s → Half-Open (1 test request)

   - **Monitoring:** Track webhook processing lag (time from Stripe send → our processing complete)
     - Alert if lag >5 minutes (indicates queue backlog or processing failures)
     - Dashboard: webhook success rate, p99 processing time, DLQ depth

4. **Database Operations (PostgreSQL Best Practices):**
   - **Connection Pooling (PgBouncer):**
     - Max 20 connections to DB (PostgreSQL limit ~100-200, reserve for other services)
     - Pool mode: Transaction (most efficient for OLTP workloads)
     - Prevents connection exhaustion under load spikes

   - **Query Performance:**
     - Index on `user_id`, `subscription_id`, `stripe_event_id` (B-tree indexes)
     - Avoid SELECT * (specify columns), use EXPLAIN ANALYZE to profile queries
     - Target: all subscription queries <10ms at p95

   - **Backup & Recovery (RPO/RTO):**
     - RPO (Recovery Point Objective): <5 minutes data loss (continuous WAL archiving to S3)
     - RTO (Recovery Time Objective): <30 minutes to restore (automated restore scripts)
     - Daily full backups + continuous WAL streaming (PostgreSQL streaming replication)
     - Test restore monthly (verify backups are valid)

   - **Replica Lag:** Monitor replication lag <10s (read replicas for analytics queries)

5. **Observability (Three Pillars):**
   - **Metrics (Prometheus + Grafana):**
     - RED method: Rate (req/s), Errors (error %), Duration (latency p50/p95/p99)
     - USE method: Utilization (CPU, memory), Saturation (queue depth), Errors
     - Custom metrics: active_subscriptions_gauge, mrr_total_gauge, webhook_processing_duration_histogram

   - **Logs (Structured JSON Logging):**
     - ELK Stack (Elasticsearch, Logstash, Kibana) or Datadog Logs
     - Include: request_id (trace all logs for a request), user_id, subscription_id, event_type
     - Log levels: ERROR (requires action), WARN (monitor), INFO (audit trail), DEBUG (dev only)
     - Retention: 30 days in hot storage, 1 year in cold storage (S3)

   - **Traces (OpenTelemetry + Jaeger):**
     - Distributed tracing: API request → DB query → Stripe API call (see full latency breakdown)
     - Identify slow spans: if webhook processing >500ms, trace shows which step is slow
     - Sample 1% of traces in production (avoid overhead), 100% in staging

6. **Incident Response (PagerDuty On-Call Rotation):**
   - **Severity Levels:**
     - P0 (Critical): Payment processing down, affects all users → page immediately, 15-min response SLA
     - P1 (High): Webhook processing lag >30 minutes → page, 1-hour response SLA
     - P2 (Medium): Non-critical feature broken, affects <10% users → ticket, next business day
     - P3 (Low): Minor bug, no user impact → backlog

   - **Runbooks (Automated Remediation):**
     - Symptom: "Webhook queue depth >1000" → Runbook: scale up worker count (Kubernetes HPA)
     - Symptom: "DB connection pool exhausted" → Runbook: restart app pods (clear stale connections)
     - Symptom: "Stripe API rate limit" → Runbook: enable exponential backoff, notify team

   - **Postmortem (Blameless Culture):**
     - Within 48 hours of P0/P1 incidents
     - Template: Timeline, Root Cause (5 Whys), Impact (users affected, revenue lost), Action Items
     - Share publicly (engineering all-hands) to learn from incidents
     - Track MTTR (Mean Time to Resolve): target <1 hour for P0, <4 hours for P1

7. **Capacity Planning (Proactive Scaling):**
   - Model growth: if subscriptions grow 20% MoM, when do we hit DB CPU limit (80% threshold)?
   - Plan infrastructure upgrades 3 months ahead (avoid reactive emergency scaling)
   - Load testing: Simulate 10X traffic (JMeter, k6), identify bottlenecks before hitting production
   - Horizontal scaling: Stateless API servers (add more pods), vertical scaling for DB (bigger instance)

8. **Cost Optimization:**
   - Right-size instances: if CPU utilization <30% for 7 days, downsize instance (save 50% cost)
   - Reserved Instances (AWS): 1-year RI for stable workloads (save 30-40% vs. on-demand)
   - Spot Instances for batch jobs (webhook processing workers): save 70% vs. on-demand
   - Monitor cost per subscription: target <$5 infrastructure cost per active subscription

**Reference:** Google SRE Book, "Release It!" by Michael Nygard, "Database Reliability
Engineering" by Campbell & Majors, AWS Well-Architected Framework, Stripe Webhook Best Practices."
```

✅ Comprehensive SRE practices (SLIs/SLOs/SLAs), deployment strategies with migration patterns, webhook reliability patterns, database operations, observability (metrics/logs/traces), incident response with runbooks, capacity planning

**Apex (Performance Optimization):**

```
"Subscription Performance Optimization - Latency, Throughput & Resource Efficiency:

1. **Performance Budgets (Accountability Framework):**
   - **Frontend (User-Perceived Performance):**
     - FCP (First Contentful Paint): <1.0s (mobile 3G)
     - LCP (Largest Contentful Paint): <2.5s (Core Web Vital, Google ranking factor)
     - TTI (Time to Interactive): <3.5s (pricing page must be interactive quickly)
     - CLS (Cumulative Layout Shift): <0.1 (no jank when pricing cards load)
     - Bundle size: main.js <200KB gzipped, pricing page <50KB incremental

   - **Backend (API Performance):**
     - p50: <100ms (median, most requests fast)
     - p95: <200ms (95% of requests under this, small tail latency)
     - p99: <500ms (99% under, acceptable tail latency)
     - p99.9: <1s (catch outliers, prevent worst-case user experience)

   - **Database Queries:**
     - Simple queries (SELECT by primary key): <5ms
     - Complex queries (JOIN across subscriptions + users): <50ms at p95
     - No N+1 queries (use eager loading, JOIN or batching)

   - **Monitoring:** Lighthouse CI in build pipeline (fail PR if LCP >2.5s), Sentry Performance
     for backend tracing, Real User Monitoring (RUM) for actual user metrics

2. **Frontend Optimization (React Performance):**
   - **Code Splitting (Route-Based):**
     - Lazy load pricing page: `const Pricing = lazy(() => import('./Pricing'))`
     - Suspense fallback: skeleton loader (avoid blank screen)
     - Route-based chunking reduces main bundle by 60%

   - **React Rendering Optimization:**
     - Memoization: `React.memo()` for PricingCard components (prevent re-renders)
     - `useMemo()` for expensive calculations (annual vs. monthly price comparison)
     - `useCallback()` for event handlers passed to children (avoid function re-creation)
     - Virtual scrolling (react-window) if displaying >100 subscription history items

   - **Image Optimization:**
     - WebP format (30% smaller than PNG/JPEG), fallback to JPEG for Safari <14
     - Responsive images: `<img srcset>` for mobile/tablet/desktop (serve appropriately sized)
     - Lazy loading: `loading="lazy"` for below-fold images (testimonials, logos)
     - Compress with ImageOptim or Squoosh (target <100KB per image)

   - **Asset Optimization:**
     - Minification: Terser for JS, cssnano for CSS (remove whitespace, mangle variable names)
     - Tree shaking: Remove unused Lodash functions (use lodash-es + named imports)
     - Compression: Brotli (better than gzip, 20% smaller), serve with `Content-Encoding: br`
     - CDN: Cloudflare or Fastly for edge caching (reduce TTFB to <100ms globally)

3. **Backend Optimization (Node.js / Express):**
   - **Caching Strategy (Multi-Layer):**
     - **L1 - In-Memory (Node.js):** Cache subscription plan metadata (rarely changes) in Map
       - TTL: 5 minutes, invalidate on plan updates
       - Reduces DB queries by 90% for read-heavy plan lookups

     - **L2 - Redis (Distributed Cache):** Cache user subscription status
       - Key: `sub:${userId}`, Value: `{status: 'active', plan: 'pro', expires: '2025-12-31'}`
       - TTL: 5 minutes (balance freshness vs. cache hit rate)
       - Cache-aside pattern: check Redis → if miss, query DB → populate Redis
       - Reduces DB load by 80% for subscription status checks

     - **L3 - CDN (Cloudflare):** Cache public pricing page (static HTML)
       - Cache-Control: max-age=3600 (1 hour), stale-while-revalidate=86400
       - Purge cache on pricing updates (Cloudflare API)

   - **Database Query Optimization:**
     - **Indexes:**
       - B-tree index on `user_id` (fast equality lookup)
       - Partial index on `status = 'active'` (only index active subscriptions, smaller index)
       - Composite index on `(user_id, created_at)` for subscription history queries

     - **Query Patterns:**
       - Avoid SELECT * (specify columns, reduce data transfer)
       - Use `EXPLAIN ANALYZE` to verify index usage (look for Index Scan, not Seq Scan)
       - Pagination: cursor-based (`WHERE created_at > :cursor ORDER BY created_at LIMIT 20`)
         instead of offset-based (OFFSET 1000 LIMIT 20 is slow for large offsets)

     - **N+1 Query Prevention:**
       - Bad: `for (user of users) { await getSubscription(user.id) }` (100 queries for 100 users)
       - Good: `SELECT * FROM subscriptions WHERE user_id IN (:userIds)` (1 query with IN clause)
       - Use DataLoader for automatic batching and caching (Facebook's solution)

   - **Connection Pooling (pg):**
     - Pool size: 20 connections (matches PgBouncer config)
     - Idle timeout: 10s (release connections quickly)
     - Max wait time: 5s (fail fast if pool exhausted, don't hang request)

4. **API Design (Efficient Data Transfer):**
   - **GraphQL (If Applicable):**
     - Client requests only needed fields (avoid over-fetching)
     - DataLoader for batching subscription lookups (prevents N+1)
     - Complexity analysis: limit query depth (max 5 levels) and breadth (max 100 nodes)

   - **REST Optimization:**
     - Field filtering: `GET /subscriptions?fields=id,status,plan` (return only requested fields)
     - Compression: gzip response bodies >1KB (reduces payload size by 70%)
     - HTTP/2: multiplexing (parallel requests over single connection, reduces latency)
     - Pagination: `Link` header with next/prev URLs (HAL or JSON:API standard)

   - **Payload Size:**
     - Target: <50KB per API response (mobile network efficiency)
     - Use ISO 8601 date strings (compact), not full Date objects with timezone
     - Avoid redundant data (don't return full user object if only user_id needed)

5. **Webhook Processing (High Throughput):**
   - **Queue-Based Processing (Bull Queue on Redis):**
     - Webhook arrives → immediately ACK 200 OK (Stripe expects <5s response)
     - Push to Redis queue → background worker processes asynchronously
     - Concurrency: 10 workers processing in parallel (tune based on DB capacity)
     - Rate limiting: max 100 jobs/second (prevent DB overload)

   - **Batch Processing:**
     - Group similar operations (e.g., 10 subscription updates) into single DB transaction
     - Reduces DB round-trips from 10 to 1 (10X faster)
     - Tradeoff: Slightly higher latency per individual webhook (100ms → 200ms), but much
       higher total throughput (1000 webhooks/min → 5000 webhooks/min)

   - **Parallel Processing (Where Safe):**
     - Independent webhooks (different subscriptions) can process in parallel
     - Serialize webhooks for same subscription (prevent race conditions on state updates)
     - Use Redis Lua script for atomic "claim next unprocessed webhook" logic

6. **Profiling & Benchmarking:**
   - **Frontend Profiling:**
     - Chrome DevTools Performance tab: record page load, identify long tasks (>50ms)
     - React DevTools Profiler: identify components with unnecessary re-renders
     - Webpack Bundle Analyzer: visualize bundle size, find large dependencies to replace

   - **Backend Profiling:**
     - Node.js --inspect flag: Chrome DevTools CPU profiler (find hot code paths)
     - clinic.js (Doctor, Flame, Bubbleprof): identify event loop delays, GC pressure
     - APM tools (DataDog, New Relic): production profiling with minimal overhead (<1%)

   - **Load Testing:**
     - k6 or Artillery: simulate 1000 concurrent users, measure p99 latency under load
     - Test scenarios: 100 subscriptions created/min, 500 webhook events/min
     - Identify bottlenecks: CPU-bound (add more pods), DB-bound (optimize queries),
       network-bound (enable compression)

7. **Resource Efficiency (Cost & Sustainability):**
   - **Memory Management (Node.js Heap):**
     - Target: <512MB heap size per worker (allows 4 workers on 2GB instance)
     - Monitor heap growth: if increasing over time → memory leak (use heap snapshots to debug)
     - GC tuning: use --max-old-space-size=512 to prevent runaway heap growth

   - **CPU Optimization:**
     - Offload CPU-intensive tasks to worker threads (image processing, PDF generation)
     - Use Node.js 18+ with V8 optimizations (faster async/await, better JIT compilation)
     - Cluster mode: spawn 4 worker processes (utilize all CPU cores on 4-core instance)

   - **Network Efficiency:**
     - Keep-alive connections to DB and Redis (avoid TCP handshake overhead)
     - HTTP/2 connection reuse for Stripe API calls (fewer connections, lower latency)
     - Compress API responses (gzip/brotli saves 70% bandwidth → lower AWS data transfer costs)

8. **Core Web Vitals (SEO & User Experience):**
   - **LCP Optimization (Largest Contentful Paint <2.5s):**
     - Preload hero image: `<link rel="preload" as="image" href="hero.webp">`
     - Server-side render (SSR) pricing page for instant content (avoid client-side fetch delay)
     - Use CDN for fast TTFB (<100ms globally)

   - **CLS Prevention (Cumulative Layout Shift <0.1):**
     - Reserve space for async content: set width/height on images, skeleton loaders
     - Avoid inserting content above existing content (no banner that pushes page down)
     - Use CSS containment: `contain: layout` to isolate layout shifts

   - **INP Optimization (Interaction to Next Paint <200ms):**
     - Debounce input handlers (don't process every keystroke, wait 300ms after typing stops)
     - Use requestIdleCallback for non-critical work (analytics tracking)
     - Avoid long tasks: break up work into <50ms chunks (use setTimeout to yield to browser)

**Reference:** Web.dev Performance, Google Core Web Vitals, High Performance Browser Networking
(Ilya Grigorik), Node.js Best Practices, DataLoader documentation, "Systems Performance" by
Brendan Gregg."
```

✅ Detailed performance budgets with specific metrics, multi-layer caching strategy, query optimization techniques, profiling tools, Core Web Vitals optimization, references authoritative sources

**Zen (Code Quality & Maintainability):**

````
"Subscription Code Quality - Design Patterns, Testing & Technical Debt Management:

1. **Design Patterns (Gang of Four + Domain-Driven Design):**
   - **Strategy Pattern (Plan Pricing Logic):**
     ```typescript
     interface PricingStrategy {
       calculatePrice(quantity: number): number;
       getFeatures(): Feature[];
     }

     class BasicPlan implements PricingStrategy {
       calculatePrice(q: number) { return 10 * q; }
       getFeatures() { return [Feature.BasicSupport]; }
     }

     class ProPlan implements PricingStrategy {
       calculatePrice(q: number) { return 30 * q * (1 - 0.1 * Math.min(q / 10, 0.2)); } // Volume discount
       getFeatures() { return [Feature.PrioritySupport, Feature.SSO]; }
     }
     ```
     **Why:** Easily add new plans without modifying existing code (Open/Closed Principle)

   - **State Pattern (Subscription Lifecycle):**
     ```typescript
     abstract class SubscriptionState {
       abstract handle(event: SubscriptionEvent): SubscriptionState;
       abstract canUpgrade(): boolean;
     }

     class TrialingState extends SubscriptionState {
       handle(event: TrialEndEvent) { return new ActiveState(); }
       canUpgrade() { return true; }
     }

     class ActiveState extends SubscriptionState {
       handle(event: PaymentFailedEvent) { return new PastDueState(); }
       canUpgrade() { return true; }
     }
     ```
     **Why:** Encapsulates state-specific behavior, prevents invalid state transitions

   - **Repository Pattern (Data Access Layer):**
     ```typescript
     interface SubscriptionRepository {
       findById(id: string): Promise<Subscription | null>;
       findByUserId(userId: string): Promise<Subscription[]>;
       save(sub: Subscription): Promise<void>;
     }

     class PostgresSubscriptionRepository implements SubscriptionRepository {
       // DB-specific implementation
     }
     ```
     **Why:** Abstracts data source, makes testing easier (mock repository), enables DB migration

   - **Factory Pattern (Subscription Creation):**
     ```typescript
     class SubscriptionFactory {
       static create(plan: Plan, user: User, paymentMethod: PaymentMethod): Subscription {
         const sub = new Subscription({
           id: generateId(),
           userId: user.id,
           plan: plan,
           status: 'trialing',
           trialEnd: addDays(new Date(), 7),
         });
         sub.addDomainEvent(new SubscriptionCreatedEvent(sub));
         return sub;
       }
     }
     ```
     **Why:** Centralizes complex construction logic, ensures invariants (always starts with trial)

   - **Observer Pattern (Domain Events):**
     ```typescript
     class Subscription extends AggregateRoot {
       upgrade(newPlan: Plan) {
         this.plan = newPlan;
         this.addDomainEvent(new SubscriptionUpgradedEvent(this.id, newPlan.id));
       }
     }

     class EmailSubscriptionUpgraded implements DomainEventHandler {
       handle(event: SubscriptionUpgradedEvent) {
         emailService.send('subscription-upgraded', event.subscriptionId);
       }
     }
     ```
     **Why:** Decouples core business logic from side effects (email, analytics), follows Single Responsibility

2. **SOLID Principles (Robert C. Martin):**
   - **S - Single Responsibility:** SubscriptionService handles business logic, StripeService
     handles payment provider integration (don't mix concerns)

   - **O - Open/Closed:** Adding new plan tier doesn't modify existing PricingStrategy implementations
     (extend via new class, not modify existing)

   - **L - Liskov Substitution:** Any PricingStrategy can be used interchangeably (BasicPlan, ProPlan
     have same interface, no surprising behavior)

   - **I - Interface Segregation:** Don't force clients to depend on methods they don't use (separate
     ISubscriptionReader and ISubscriptionWriter interfaces)

   - **D - Dependency Inversion:** SubscriptionService depends on SubscriptionRepository interface
     (abstraction), not PostgresSubscriptionRepository (concrete implementation)

3. **Testing Strategy (Test Pyramid):**
   - **Unit Tests (70% of tests, fast, isolated):**
     - Test business logic in isolation (mock all dependencies)
     - Example: `calculateProration()` function (given old plan, new plan, days remaining → return refund amount)
     - Tools: Jest, Vitest
     - Coverage target: 80%+ for critical business logic (subscription state machine, pricing calculations)
     - Test file: `subscription.service.test.ts` (co-located with `subscription.service.ts`)

   - **Integration Tests (20% of tests, slower, test interactions):**
     - Test repository + database (use test DB, not mocks)
     - Example: Save subscription → query by user_id → assert correct data returned
     - Test webhook processing end-to-end (receive webhook → process → assert DB state updated)
     - Tools: Testcontainers (spin up PostgreSQL in Docker), Supertest (HTTP testing)
     - Isolation: Truncate tables before each test (prevent test pollution)

   - **E2E Tests (10% of tests, slowest, test critical paths):**
     - Test full user journey: signup → trial → upgrade → payment success → active subscription
     - Test failure scenarios: payment declined → retry → eventually canceled
     - Tools: Playwright, Cypress
     - Run in CI on every PR, run full suite nightly
     - Use staging environment (with Stripe test mode)

   - **Contract Tests (API Contracts):**
     - Test Stripe webhook schema (ensure we handle all fields correctly)
     - Pact or JSON Schema validation: assert incoming webhooks match expected structure
     - Prevents breaking changes when Stripe API updates

4. **Code Quality Metrics:**
   - **Cyclomatic Complexity:** Max 10 per function (McCabe metric, measures decision points)
     - High complexity → hard to test, likely has bugs
     - Refactor: extract functions, use guard clauses, replace conditionals with polymorphism

   - **Code Coverage:** 80%+ for critical paths (subscription creation, state transitions, proration)
     - Don't chase 100% (diminishing returns), focus on business-critical code
     - Tools: Istanbul (c8), Coveralls for PR coverage diffs

   - **Code Duplication:** <5% duplicated lines (DRY principle)
     - Tools: jscpd, SonarQube
     - Refactor: extract common logic into shared functions/classes

   - **Linting (ESLint + TypeScript):**
     - Enforce: no `any` types (use `unknown` + type guards), explicit return types on functions
     - Rules: no-unused-vars, no-console (use logger), prefer-const
     - Prettier for formatting (never debate tabs vs. spaces again)

5. **Error Handling (Resilience Patterns):**
   - **Typed Errors (Discriminated Unions):**
     ```typescript
     type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

     class SubscriptionNotFoundError extends AppError {
       code = 'SUBSCRIPTION_NOT_FOUND';
       httpStatus = 404;
     }

     function getSubscription(id: string): Result<Subscription> {
       const sub = repository.findById(id);
       if (!sub) return { ok: false, error: new SubscriptionNotFoundError(id) };
       return { ok: true, value: sub };
     }
     ```
     **Why:** Forces callers to handle errors (type system enforces it), no uncaught exceptions

   - **Retry Logic (Transient Failures):**
     ```typescript
     async function callStripeWithRetry<T>(fn: () => Promise<T>): Promise<T> {
       for (let i = 0; i < 3; i++) {
         try {
           return await fn();
         } catch (e) {
           if (e instanceof StripeNetworkError && i < 2) {
             await sleep(2 ** i * 1000); // Exponential backoff: 1s, 2s
             continue;
           }
           throw e;
         }
       }
     }
     ```
     **Why:** Handles transient network failures gracefully, improves reliability

   - **Fallback (Degraded Experience):**
     ```typescript
     async function getSubscriptionStatus(userId: string): Promise<string> {
       try {
         return await redis.get(`sub:${userId}`);
       } catch (e) {
         logger.warn('Redis unavailable, falling back to DB', e);
         return await db.query('SELECT status FROM subscriptions WHERE user_id = $1', [userId]);
       }
     }
     ```
     **Why:** System remains functional even if cache layer fails (graceful degradation)

6. **Refactoring (Technical Debt Management):**
   - **When to Refactor:**
     - Rule of Three: duplicate code twice → OK, third time → refactor into shared function
     - Before adding new feature: if current code is messy, clean it first (Boy Scout Rule)
     - After code review: address feedback, improve naming, extract complex logic

   - **Refactoring Techniques (Martin Fowler):**
     - Extract Function: long function → break into smaller named functions (max 20 lines per function)
     - Replace Conditional with Polymorphism: giant switch statement → Strategy pattern
     - Introduce Parameter Object: function with 5+ params → wrap in config object
     - Replace Magic Numbers with Named Constants: `if (status === 'active')` → `if (status === SubscriptionStatus.ACTIVE)`

   - **Technical Debt Register:**
     - Track known issues: "Subscription state machine needs refactoring" (estimated 3 days)
     - Prioritize: High interest debt (blocks new features) first, low interest debt (cosmetic) later
     - Allocate 20% of sprint capacity to debt reduction (1 day per week)

7. **Documentation (Code as Communication):**
   - **Self-Documenting Code (Naming):**
     - Good: `calculateProratedRefund(oldPlan, newPlan, daysRemaining)` (clear intent)
     - Bad: `calc(p1, p2, d)` (cryptic abbreviations)

   - **JSDoc Comments (Public APIs):**
     ```typescript
     /**
      * Upgrades a subscription to a new plan with prorated billing.
      *
      * @param subscriptionId - The ID of the subscription to upgrade
      * @param newPlanId - The ID of the plan to upgrade to
      * @returns Result containing the updated subscription or error
      * @throws {SubscriptionNotFoundError} If subscription doesn't exist
      * @throws {InvalidPlanError} If new plan is lower tier than current
      */
     async function upgradeSubscription(subscriptionId: string, newPlanId: string): Promise<Result<Subscription>>
     ```
     **Why:** Helps IDE autocomplete, generates API docs, clarifies edge cases

   - **ADRs (Architecture Decision Records):**
     - Document key decisions: "Why we chose PostgreSQL over MongoDB for subscriptions"
     - Template: Context (problem), Decision (solution), Consequences (tradeoffs)
     - Store in `docs/adr/0001-subscription-state-machine.md`

   - **README (For Subscription Module):**
     - Quick start: how to run tests, how to process a webhook locally
     - Architecture diagram: show state machine, key classes, data flow
     - Common tasks: "How to add a new plan tier", "How to test proration logic"

8. **Code Review Checklist:**
   - [ ] Does this change increase cyclomatic complexity? (run complexity tool)
   - [ ] Are there sufficient tests? (unit + integration for new logic)
   - [ ] Is error handling correct? (all promises have .catch or try/catch)
   - [ ] Are naming conventions followed? (camelCase functions, PascalCase classes)
   - [ ] Is there code duplication? (check for similar logic elsewhere)
   - [ ] Does this introduce tech debt? (if yes, create follow-up task)
   - [ ] Are edge cases handled? (null checks, boundary conditions, race conditions)
   - [ ] Is logging appropriate? (log errors, audit trail for state changes)

**Reference:** "Design Patterns" by Gang of Four, "Clean Code" by Robert C. Martin, "Refactoring"
by Martin Fowler, "Domain-Driven Design" by Eric Evans, Test Pyramid (Martin Fowler), SOLID Principles."
````

✅ Detailed design patterns with code examples, SOLID principles applied, comprehensive testing strategy (test pyramid), code quality metrics, error handling patterns, refactoring techniques, documentation best practices

**Echon (Post-Launch & Evolution):**

```
"Subscription Post-Launch - Feedback Loops, Iteration & Continuous Improvement:

1. **Feedback Collection (Voice of Customer):**
   - **In-App Feedback (Contextual):**
     - Trigger: User downgrades/cancels → modal: "Why are you leaving?" (radio buttons + text field)
     - Options: Price too high (40%), Missing features (25%), Poor UX (15%), Switching to competitor (20%)
     - Tool: Hotjar, Qualaroo for exit surveys (micro-surveys at decision points)
     - Response rate: 20-30% (incentivize with discount code for feedback)

   - **NPS Survey (Net Promoter Score):**
     - Cadence: 90 days after trial conversion (established users, not new trials)
     - Question: "How likely are you to recommend us to a colleague?" (0-10 scale)
     - Follow-up: "What's the primary reason for your score?" (open text)
     - Segment NPS by plan tier, cohort, feature usage (identify patterns)
     - Target: NPS >50 (world-class SaaS), <30 (red flag)

   - **Feature Requests (Product Board):**
     - Tool: Canny, ProductBoard, or simple Notion board
     - Users upvote requests (democratic prioritization)
     - Track: # of votes, MRR of requesting users (Enterprise customer request = high priority)
     - Respond to every request: "under consideration", "planned Q2", or "won't do" with rationale

   - **Support Ticket Analysis:**
     - Tag tickets: billing, feature-confusion, bug, integration-request
     - Track: volume per tag, resolution time, escalations
     - Pattern: If 50+ tickets about same issue (e.g., "how to upgrade?") → UX problem, not support problem

2. **Telemetry & Behavioral Analytics:**
   - **Product Analytics (Amplitude, Mixpanel):**
     - Track events: `subscription_created`, `upgrade_initiated`, `upgrade_completed`, `cancellation_started`
     - Funnels:
       - Trial Conversion: trial_start → activation (3+ core actions) → trial_convert → paid
       - Upgrade Flow: view_pricing → select_plan → enter_payment → confirm → success
     - Drop-off analysis: If 60% abandon at payment step → investigate (UX friction? Trust issue?)

   - **Cohort Analysis (Retention Heatmap):**
     - Group users by signup month (Jan 2024 cohort, Feb 2024 cohort, etc.)
     - Track: % still active in month 1, 2, 3...12
     - Identify: Which cohorts have best retention? (acquisition channel, onboarding changes, feature launches)
     - Example insight: "March cohort (after new onboarding) has 15% better month-3 retention"

   - **Feature Adoption (Engagement Scoring):**
     - Track: % of Pro users who use SSO (Enterprise feature) → if low, maybe doesn't justify Pro tier
     - Segment: High-engagement users (login 5+ days/week) vs. low-engagement (1x/week)
     - Churn predictor: Low engagement → high churn risk → trigger intervention (email campaign, CSM outreach)

   - **Session Recordings (Qualitative Insights):**
     - Tool: FullStory, Hotjar
     - Watch: 50 sessions of users upgrading (do they hesitate? revisit pricing page multiple times?)
     - Watch: 20 sessions of users canceling (frustration moments? confused by cancellation flow?)
     - Pair with quantitative data: funnel shows 40% drop-off at payment → watch sessions to see WHY

3. **A/B Testing & Experimentation (Continuous Optimization):**
   - **Hypothesis-Driven Testing:**
     - Framework: "We believe that [change] will result in [outcome] for [segment]"
     - Example: "We believe that showing annual discount as '2 months free' (vs. '17% off') will
       increase annual plan selection by 15% for SMB users"

   - **Test Design (Rigor):**
     - Randomization: 50/50 split (control vs. variant), ensure even distribution
     - Sample size: Calculate required sample (power analysis): 385 per variant for 5% MDE, 80% power
     - Duration: Run for 2 weeks minimum (capture weekday/weekend behavior, avoid day-of-week bias)
     - Guardrail metrics: Ensure test doesn't hurt key metrics (conversion rate, revenue per user)

   - **What to Test:**
     - Pricing page: annual discount framing, tier order (Basic/Pro/Enterprise vs. Enterprise/Pro/Basic)
     - Upgrade CTAs: "Upgrade Now" vs. "Start Free Trial" (when hitting plan limits)
     - Trial length: 7 days vs. 14 days (longer = more time to value, but delays revenue)
     - Cancellation flow: offer downgrade vs. offer pause vs. no retention offer

   - **Analysis (Bayesian vs. Frequentist):**
     - Bayesian: Probability that variant is better (e.g., 95% chance variant increases conversion)
     - Frequentist: p-value <0.05 (reject null hypothesis)
     - Prefer Bayesian for business decisions (easier to interpret, incorporates prior knowledge)
     - Tools: Optimizely, VWO, or custom implementation with bayesian-testing npm package

4. **Continuous Deployment (Fast Iteration):**
   - **Feature Flags (Gradual Rollout):**
     - Tool: LaunchDarkly, Unleash, or custom Redis-based flags
     - Rollout: 5% → 25% → 50% → 100% over 48 hours (monitor metrics at each stage)
     - Kill switch: If error rate spikes >2X or conversion drops >10% → instant rollback (no redeploy)
     - Targeting: Enable for internal users first (dogfooding), then beta users, then general availability

   - **Deployment Cadence:**
     - Small, frequent deploys (daily or multiple per day) vs. big bang releases (risky)
     - Each deploy: 1-3 features or bug fixes (easy to identify cause if something breaks)
     - Automated: CI/CD pipeline runs tests → deploys to staging → smoke tests → deploys to production

   - **Monitoring Post-Deploy:**
     - Watch key metrics for 2 hours after deploy: error rate, latency, conversion rate, MRR
     - Set up alerts: Slack notification if subscription creation rate drops >20% (deployment issue?)
     - Keep team on standby for 1 hour after deploy (ready to rollback if needed)

5. **Roadmap Planning (Prioritization Frameworks):**
   - **RICE Scoring (Intercom Framework):**
     - Reach: How many users affected per quarter? (1000 users = 1000 points)
     - Impact: How much does it improve experience? (Massive=3, High=2, Medium=1, Low=0.5)
     - Confidence: How sure are we? (100% = 1.0, 80% = 0.8, 50% = 0.5)
     - Effort: How many person-weeks? (2 weeks, 8 weeks, etc.)
     - Score: `(Reach × Impact × Confidence) / Effort`
     - Example: "Add annual billing discount"
       - Reach: 500 users/quarter, Impact: 2 (high), Confidence: 0.9, Effort: 1 week
       - Score: (500 × 2 × 0.9) / 1 = 900 (high priority)

   - **Value vs. Effort Matrix (2×2):**
     - Quick Wins (high value, low effort): Do first (annual discount, cancellation flow improvements)
     - Big Bets (high value, high effort): Plan for next quarter (usage-based pricing, tiered permissions)
     - Fill-ins (low value, low effort): Do if spare capacity (UI polish, minor bug fixes)
     - Time Sinks (low value, high effort): Avoid or defer (rarely used features, over-engineering)

   - **Kano Model (Customer Delight):**
     - Basic Needs: Expected features (reliable billing, email receipts) → absence causes dissatisfaction
     - Performance Needs: More is better (faster checkout, better support) → linear satisfaction
     - Delighters: Unexpected features (proactive refunds, birthday discount) → exponential satisfaction
     - Invest in: Delighters for differentiation, Performance for competitiveness, Basic to avoid churn

6. **Churn Reduction (Retention Experiments):**
   - **Proactive Interventions:**
     - Risk signal: User hasn't logged in for 14 days + past_due payment status
       - Action: Email sequence (day 14: "We miss you + here's what's new", day 21: "Payment issue, update card")
     - Risk signal: Usage dropped 50% in last 30 days
       - Action: CSM outreach (for Enterprise), automated email (for Pro/Basic)

   - **Cancellation Flow Optimization:**
     - Offer downgrade: "Too expensive?" → suggest lower tier (retain some MRR vs. 0)
     - Offer pause: "Need a break?" → pause for 1-3 months (reactivation easier than re-signup)
     - Offer discount: "Stay for 20% off next 3 months" (only if LTV > discounted revenue)
     - Collect reason: "What made you cancel?" → tag reasons, aggregate, address top issues

   - **Win-Back Campaigns:**
     - Target: Canceled users from 30-90 days ago (not too recent, not too far gone)
     - Message: "We've added [feature they requested]" or "Come back with 50% off first month"
     - Track: reactivation rate (target 5-10%), LTV of reactivated users (often lower than new users)

7. **Growth Experiments (Expansion Revenue):**
   - **Upsell Triggers (Contextual Prompts):**
     - User hits plan limit (e.g., 5 team members on Pro plan) → modal: "Upgrade to Enterprise for unlimited"
     - User tries locked feature (e.g., SSO on Basic plan) → "Available on Pro plan - upgrade now"
     - Timing: When user sees value (e.g., after 3 months of consistent usage → offer annual plan)

   - **Packaging Changes (Value Perception):**
     - Bundle features: Move popular feature from Pro to Basic (increases trial conversions)
     - Create new tier: Split Pro into Pro & Premium (capture willingness-to-pay from high-value users)
     - Usage-based add-ons: "Need more API calls? $10 per 10,000 calls" (expand revenue without changing base price)

   - **Annual Plan Conversion:**
     - Incentive: 2 months free (16% discount) → most popular
     - Timing: Offer at month 6 (user is engaged, sees value) → 20% conversion rate
     - Test: Proactive offer vs. self-serve option only (proactive likely increases conversion)

8. **Learning Culture (Blameless Postmortems):**
   - **Experiment Postmortem (Win or Lose):**
     - Document: Hypothesis, test design, results (quantitative + qualitative), learnings
     - Example: "Annual discount test - 'Save $X' outperformed '2 months free' by 8% (p=0.03)"
     - Share: All-hands meeting, wiki, Slack channel (celebrate learnings, not just wins)

   - **Failed Experiments (Embrace Failure):**
     - "We tested removing free trial → conversions dropped 60% → learned free trial is critical"
     - "We tested $5 Basic plan → no increase in conversions vs. $10 → learned price isn't the issue"
     - Value: Avoids repeating mistakes, validates assumptions, informs future experiments

   - **Knowledge Base (Institutional Memory):**
     - Document: "What we've learned about subscription UX" (compiled insights from 50+ experiments)
     - Onboard new PMs with historical experiments (why we do things this way, what didn't work)

**Reference:** "Lean Analytics" by Croll & Yoskovitz, "Hacking Growth" by Sean Ellis, RICE Prioritization
(Intercom), Kano Model, Bayesian A/B Testing, NPS Best Practices."
```

✅ Comprehensive feedback collection methods, behavioral analytics, A/B testing framework, continuous deployment practices, prioritization frameworks (RICE, Kano), churn reduction strategies, growth experiments, learning culture

---

## 2. Per-Agent Domain Expectations

### Sage (Business/Product Strategy)

**Domain-Specific Terminology:**

- MRR, ARR, LTV, CAC, churn rate, NRR, quick ratio
- Product-led growth (PLG), freemium, value metric pricing
- Price sensitivity, willingness-to-pay, Good/Better/Best
- Customer segmentation, acquisition channels, cohort analysis

**Standards/Best Practices:**

- Patrick Campbell (ProfitWell) pricing research
- SaaS Capital benchmarks
- Lean Canvas, Jobs-to-be-Done framework

**Deep Expertise Indicators:**

- Quantified metrics with targets (e.g., "LTV:CAC >3.0")
- References industry research/studies
- Specific pricing strategies with rationale
- Churn prevention tactics aligned to user personas

---

### Theo (Technical Architecture)

**Domain-Specific Terminology:**

- Event-driven architecture, saga pattern, CQRS, outbox pattern
- Idempotency, circuit breaker, exponential backoff
- Bounded context, aggregate root, domain events
- State machine, webhook processing, eventual consistency

**Standards/Best Practices:**

- SOLID principles, Domain-Driven Design (Eric Evans)
- Microservices patterns (Chris Richardson)
- API design (REST, GraphQL, gRPC)

**Deep Expertise Indicators:**

- Specific architectural patterns with implementation details
- Considers failure modes and tradeoffs
- References authoritative books/frameworks (DDD, Release It!)
- Discusses evolution path (MVP → scale)

---

### Finn (Delivery & UX)

**Domain-Specific Terminology:**

- Progressive disclosure, microcopy, WCAG 2.1 AA/AAA
- Behavioral economics (loss aversion, decoy effect, middle option bias)
- BJ Fogg Behavior Model, Jakob's Law, Zeigarnik Effect
- A/B testing, multi-armed bandit, funnel optimization

**Standards/Best Practices:**

- Web Content Accessibility Guidelines (WCAG)
- Nielsen Norman Group usability heuristics
- Baymard Institute e-commerce UX research

**Deep Expertise Indicators:**

- References psychological principles with examples
- Cites UX research (Baymard, NN/g)
- Provides specific accessibility requirements (contrast ratios, ARIA)
- Experimentation frameworks with metrics

---

### Cerberus (Security & Compliance)

**Domain-Specific Terminology:**

- PCI-DSS SAQ-A, GDPR, CCPA, SOC 2 Type II
- OWASP Top 10, STRIDE threat modeling
- HMAC-SHA256, TLS 1.3, AES-256, TOTP
- Idempotency, rate limiting, CSRF, IDOR

**Standards/Best Practices:**

- OWASP Application Security Verification Standard (ASVS)
- NIST 800-53 controls
- Stripe Security Best Practices
- GDPR data protection principles

**Deep Expertise Indicators:**

- Specific compliance frameworks (PCI-DSS v4.0)
- Threat modeling with mitigations (STRIDE)
- Security controls with implementation details
- Incident response procedures

---

### Mary (Data & Analytics)

**Domain-Specific Terminology:**

- Star schema, fact table, dimension table, Type 2 SCD
- Cohort retention, MRR movements, waterfall chart
- Kaplan-Meier estimator, survival analysis
- ELT pipeline, DBT, Great Expectations, DataLoader

**Standards/Best Practices:**

- Kimball dimensional modeling
- SaaS metrics (Christoph Janz)
- Data quality frameworks (Great Expectations)

**Deep Expertise Indicators:**

- Detailed data models with grain definitions
- SaaS metrics with formulas (not just names)
- Data pipeline architecture (Extract, Load, Transform)
- Predictive analytics (churn models with features)

---

### Walt (Financial Strategy)

**Domain-Specific Terminology:**

- Unit economics, CAC payback, gross margin, EBITDA
- Deferred revenue, ASC 606, revenue recognition
- Magic Number, Burn Multiple, Rule of 40
- Van Westendorp Price Sensitivity Meter, Monte Carlo simulation

**Standards/Best Practices:**

- ASC 606 / IFRS 15 revenue recognition
- David Skok (Matrix Partners) SaaS metrics
- SaaS Capital / Bessemer benchmarks

**Deep Expertise Indicators:**

- Financial formulas with worked examples
- Revenue recognition with accounting standards
- Scenario planning / stress testing
- Investor metrics (NRR, ARR multiples)

---

### Axel (Operations & Infrastructure)

**Domain-Specific Terminology:**

- SLIs, SLOs, SLAs, error budget
- Blue-green deployment, canary release, expand-contract migration
- Circuit breaker, exponential backoff with jitter, DLQ
- Prometheus, Grafana, ELK stack, OpenTelemetry

**Standards/Best Practices:**

- Google SRE Book (SLIs/SLOs/error budgets)
- AWS Well-Architected Framework
- "Release It!" by Michael Nygard (resilience patterns)

**Deep Expertise Indicators:**

- Specific SLO targets (99.9% uptime)
- Deployment strategies with rollback plans
- Observability (metrics, logs, traces) with tools
- Incident response with MTTR targets

---

### Apex (Performance Optimization)

**Domain-Specific Terminology:**

- FCP, LCP, TTI, CLS, INP (Core Web Vitals)
- p50, p95, p99, p99.9 latency
- Multi-layer caching (in-memory, Redis, CDN)
- Code splitting, tree shaking, brotli compression

**Standards/Best Practices:**

- Web.dev Performance guidelines
- Google Core Web Vitals thresholds
- High Performance Browser Networking (Ilya Grigorik)

**Deep Expertise Indicators:**

- Performance budgets with specific metrics (<2.5s LCP)
- Multi-layer caching strategy with TTLs
- Profiling tools (Chrome DevTools, clinic.js)
- Database query optimization (indexes, EXPLAIN ANALYZE)

---

### Zen (Code Quality & Maintainability)

**Domain-Specific Terminology:**

- SOLID principles, design patterns (Strategy, State, Repository, Factory, Observer)
- Test pyramid, unit/integration/E2E tests, code coverage
- Cyclomatic complexity, code duplication, technical debt
- Refactoring techniques (Extract Function, Replace Conditional with Polymorphism)

**Standards/Best Practices:**

- Gang of Four design patterns
- Clean Code / Clean Architecture (Robert C. Martin)
- Refactoring (Martin Fowler)
- Domain-Driven Design (Eric Evans)

**Deep Expertise Indicators:**

- Design patterns with code examples
- Test strategy (test pyramid with percentages)
- Code quality metrics with targets (80% coverage)
- Refactoring techniques with before/after examples

---

### Echon (Post-Launch & Evolution)

**Domain-Specific Terminology:**

- NPS, cohort retention, A/B testing, RICE prioritization
- Feature flags, gradual rollout, kill switch
- Churn prediction, win-back campaigns, upsell triggers
- Kano Model, Value vs. Effort matrix, Bayesian A/B testing

**Standards/Best Practices:**

- Lean Analytics (Croll & Yoskovitz)
- Hacking Growth (Sean Ellis)
- RICE prioritization (Intercom)
- Kano Model (customer satisfaction)

**Deep Expertise Indicators:**

- Feedback loops with specific tools (Hotjar, Amplitude)
- A/B testing with sample size calculations
- Prioritization frameworks with worked examples (RICE)
- Churn reduction tactics with expected outcomes

---

## 3. Scoring Matrix Template

| Agent                       | Feature 1 | Feature 2 | Feature 3 | Feature 4 | Feature 5 | Avg Score |
| --------------------------- | --------- | --------- | --------- | --------- | --------- | --------- |
| **Sage** (Business/Product) | /3        | /3        | /3        | /3        | /3        | /3        |
| **Theo** (Architecture)     | /3        | /3        | /3        | /3        | /3        | /3        |
| **Finn** (Delivery & UX)    | /3        | /3        | /3        | /3        | /3        | /3        |
| **Cerberus** (Security)     | /3        | /3        | /3        | /3        | /3        | /3        |
| **Mary** (Data & Analytics) | /3        | /3        | /3        | /3        | /3        | /3        |
| **Walt** (Financial)        | /3        | /3        | /3        | /3        | /3        | /3        |
| **Axel** (Operations)       | /3        | /3        | /3        | /3        | /3        | /3        |
| **Apex** (Performance)      | /3        | /3        | /3        | /3        | /3        | /3        |
| **Zen** (Code Quality)      | /3        | /3        | /3        | /3        | /3        | /3        |
| **Echon** (Post-Launch)     | /3        | /3        | /3        | /3        | /3        | /3        |
| **Total**                   | **/30**   | **/30**   | **/30**   | **/30**   | **/30**   | **/30**   |

**Interpretation:**

- **27-30 (90-100%):** Exceptional domain expertise across all agents
- **24-26 (80-89%):** Strong domain coverage with minor gaps
- **21-23 (70-79%):** Adequate expertise, some surface-level responses
- **18-20 (60-69%):** Significant gaps, several agents lack depth
- **<18 (<60%):** Poor quality, many agents provided generic or no input

---

## 4. Domain-Specific Keywords Reference

### Sage (Business/Product Strategy)

**Keywords indicating deep expertise:**

- MRR, ARR, LTV, CAC, NRR, Quick Ratio, Rule of 40
- Churn rate (logo vs. revenue), retention curves
- Value metric pricing, Good/Better/Best, price anchoring
- PLG (Product-Led Growth), PQL (Product Qualified Lead)
- Freemium, trial-to-paid conversion, activation metrics
- Customer segmentation, ICP (Ideal Customer Profile)
- Patrick Campbell, ProfitWell, SaaS Capital benchmarks

### Theo (Technical Architecture)

**Keywords indicating deep expertise:**

- Event-driven architecture, CQRS, saga pattern, outbox pattern
- Idempotency, circuit breaker, bulkhead, rate limiting
- Domain-Driven Design, bounded context, aggregate root
- State machine, webhook processing, eventual consistency
- GraphQL, gRPC, REST, API versioning
- PostgreSQL, Redis, Kafka, message queue
- SOLID principles, microservices, service mesh

### Finn (Delivery & UX)

**Keywords indicating deep expertise:**

- WCAG 2.1 AA/AAA, ARIA labels, screen reader
- Progressive disclosure, microcopy, empty states
- Behavioral economics (loss aversion, decoy effect, anchoring)
- BJ Fogg Behavior Model, Jakob's Law, Hick's Law
- A/B testing, multi-armed bandit, funnel analysis
- Core Web Vitals (LCP, FID, CLS)
- Nielsen Norman Group, Baymard Institute
- Design system, Storybook, component library

### Cerberus (Security & Compliance)

**Keywords indicating deep expertise:**

- PCI-DSS SAQ-A, GDPR, CCPA, SOC 2 Type II
- OWASP Top 10, ASVS, STRIDE threat modeling
- HMAC-SHA256, AES-256, TLS 1.3, RSA-2048
- JWT, CSRF, XSS, SQL injection, IDOR
- Rate limiting, DDoS protection, WAF (Web Application Firewall)
- Data residency, encryption at rest/in transit
- Penetration testing, ASV scans, vulnerability management
- Incident response, security playbook, data breach notification

### Mary (Data & Analytics)

**Keywords indicating deep expertise:**

- Star schema, fact table, dimension table, Type 2 SCD
- Cohort analysis, retention curves, churn prediction
- MRR movements (new, expansion, contraction, churn)
- ELT pipeline, DBT, Airflow, Great Expectations
- Kimball dimensional modeling, data warehouse
- Survival analysis, Kaplan-Meier estimator
- Feature engineering, Random Forest, XGBoost, AUC-ROC
- DataLoader, N+1 query prevention, query optimization
- Amplitude, Mixpanel, Looker, Tableau

### Walt (Financial Strategy)

**Keywords indicating deep expertise:**

- Unit economics, CAC payback, LTV:CAC ratio
- Gross margin, EBITDA, Rule of 40, Magic Number
- Deferred revenue, ASC 606, IFRS 15, revenue recognition
- Bookings, billings, TCV/ACV (Total/Annual Contract Value)
- Burn Multiple, runway, free cash flow
- Net Revenue Retention (NRR), GRR (Gross Revenue Retention)
- Van Westendorp Price Sensitivity Meter
- Monte Carlo simulation, scenario planning, stress testing
- David Skok, SaaS Capital, Bessemer Cloud Index

### Axel (Operations & Infrastructure)

**Keywords indicating deep expertise:**

- SLIs, SLOs, SLAs, error budget, MTTR
- Blue-green deployment, canary release, rolling deployment
- Circuit breaker, bulkhead, retry with exponential backoff
- Observability (metrics, logs, traces), OpenTelemetry
- Prometheus, Grafana, ELK stack, Datadog, New Relic
- Kubernetes, Docker, Helm, service mesh (Istio)
- Database replication, WAL archiving, RPO/RTO
- Incident response, postmortem, runbook, PagerDuty
- Google SRE Book, "Release It!" by Michael Nygard

### Apex (Performance Optimization)

**Keywords indicating deep expertise:**

- Core Web Vitals: LCP, FID/INP, CLS, TTFB
- Latency percentiles: p50, p95, p99, p99.9
- Code splitting, tree shaking, lazy loading
- Brotli compression, minification, bundle size
- Multi-layer caching (in-memory, Redis, CDN)
- Connection pooling, query optimization, indexes
- React.memo, useMemo, useCallback, virtual scrolling
- Profiling (Chrome DevTools, clinic.js, flame graphs)
- DataLoader, N+1 query prevention, batching
- Web.dev Performance, High Performance Browser Networking

### Zen (Code Quality & Maintainability)

**Keywords indicating deep expertise:**

- SOLID principles (Single Responsibility, Open/Closed, etc.)
- Design patterns: Strategy, State, Repository, Factory, Observer
- Test pyramid: unit (70%), integration (20%), E2E (10%)
- Code coverage (80%+ critical paths), cyclomatic complexity (<10)
- Refactoring: Extract Function, Replace Conditional with Polymorphism
- TypeScript strict mode, ESLint, Prettier
- Domain-Driven Design, bounded context, aggregate root
- Error handling (typed errors, Result type, retry logic)
- Technical debt register, Boy Scout Rule, Rule of Three
- Clean Code, Refactoring (Martin Fowler), Gang of Four

### Echon (Post-Launch & Evolution)

**Keywords indicating deep expertise:**

- NPS (Net Promoter Score), CSAT, exit surveys
- Cohort retention, churn prediction, win-back campaigns
- A/B testing, Bayesian A/B testing, sample size calculation
- Feature flags, gradual rollout, kill switch
- RICE prioritization (Reach, Impact, Confidence, Effort)
- Kano Model (basic needs, performance needs, delighters)
- Amplitude, Mixpanel, FullStory, Hotjar
- Upsell triggers, expansion revenue, packaging changes
- Blameless postmortem, experiment documentation
- Lean Analytics, Hacking Growth (Sean Ellis)

---

## Usage Instructions

### For Evaluators:

1. **Read agent session transcripts** for each feature (5 features total)
2. **Score each agent (0-3)** using the rubric above:
   - Look for domain-specific terminology
   - Check for specific, actionable recommendations
   - Verify references to standards/best practices
   - Assess consideration of edge cases and tradeoffs
3. **Fill out the scoring matrix** (one score per agent per feature)
4. **Calculate averages** (per agent, per feature, and total)
5. **Identify gaps:** Agents consistently scoring 0-1 need better prompting or context
6. **Generate report:** Summarize findings with examples of strong/weak responses

### For Prompt Engineers:

1. **Use keywords list** to enhance agent prompts (e.g., "consider PCI-DSS compliance" for Cerberus)
2. **Provide examples** of Score 3 responses during agent onboarding
3. **Iterate on prompts** if agents consistently score <2 (add domain context, examples, constraints)

### For Product Teams:

1. **Quality gate:** Require average score >24/30 before marking feature as "ready for implementation"
2. **Track over time:** Monitor if agent quality improves with prompt refinements
3. **Identify blind spots:** If all agents score low on a feature, may indicate poorly defined requirements

---

**End of Domain Depth Scoring Framework**
