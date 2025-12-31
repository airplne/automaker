# Synthesis Quality Evaluation Framework

## Purpose

This framework evaluates the quality of multi-agent synthesis outputs to ensure deep collaboration, diverse perspectives, and actionable recommendations.

---

## 1. Structure Analysis Checklist

When reviewing a synthesis, verify each element:

- [ ] **Synthesis explicitly names agents by name/role**
  - Example: "Sage raised concerns about market timing, while Theo emphasized technical debt"
  - Not just: "From a business perspective..."

- [ ] **Synthesis shows deliberation (not just list of points)**
  - Evidence of dialogue, back-and-forth, or evolution of thinking
  - Not just sequential bullet points from each agent

- [ ] **Synthesis identifies tensions/tradeoffs between perspectives**
  - Example: "Cerberus's security requirements conflict with Finn's need for frictionless UX"
  - Shows where agents disagreed or had competing priorities

- [ ] **Synthesis provides prioritized recommendations**
  - Clear ranking: Must-have, Should-have, Nice-to-have
  - Rationale for prioritization based on agent inputs

- [ ] **Synthesis is specific to THIS feature (not generic)**
  - References actual project tech stack (React, Express, Zustand, etc.)
  - Mentions specific user flows or business context
  - Not applicable to any random SaaS project

---

## 2. Perspective Coverage Matrix

| Agent        | Perspective              | Represented? | How Represented?                                          | Notes                                                                    |
| ------------ | ------------------------ | ------------ | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Sage**     | Business Strategy        | ☐ Yes ☐ No   | Market positioning, competitive advantage, revenue impact | Should address: Go-to-market, pricing strategy, business model fit       |
| **Theo**     | Technical Architecture   | ☐ Yes ☐ No   | System design, scalability, integration patterns          | Should address: Implementation approach, technical debt, maintainability |
| **Finn**     | User Experience          | ☐ Yes ☐ No   | User flows, friction points, accessibility                | Should address: User journey, onboarding, delight factors                |
| **Cerberus** | Security & Compliance    | ☐ Yes ☐ No   | Threat modeling, data protection, regulatory requirements | Should address: Authentication, authorization, data privacy              |
| **Mary**     | Research & Validation    | ☐ Yes ☐ No   | User research findings, validation approach               | Should address: Assumptions to test, validation metrics                  |
| **Walt**     | Financial Impact         | ☐ Yes ☐ No   | Cost analysis, ROI projections, pricing                   | Should address: Development cost, operational costs, revenue potential   |
| **Axel**     | Operational Feasibility  | ☐ Yes ☐ No   | Deployment complexity, monitoring, maintenance            | Should address: DevOps requirements, operational overhead                |
| **Apex**     | Performance Engineering  | ☐ Yes ☐ No   | Performance considerations, optimization strategies       | Should address: Scalability bottlenecks, resource utilization            |
| **Zen**      | Code Quality & Standards | ☐ Yes ☐ No   | Code maintainability, testing strategy, standards         | Should address: Test coverage, refactoring needs, tech debt              |
| **Echon**    | Post-Launch Success      | ☐ Yes ☐ No   | Launch readiness, monitoring strategy, iteration plan     | Should address: Success metrics, feedback loops, support readiness       |

**Coverage Score:** \_\_\_ / 10 perspectives represented

---

## 3. Quality Indicators

### Positive Signs (Evidence of Deep Collaboration)

✅ **Agents disagree on something**

- Example: "Finn wanted single-click upgrade, but Cerberus required explicit consent for billing changes"
- Shows: Real deliberation, not rubber-stamping

✅ **Tradeoffs are explicitly weighed**

- Example: "We chose simplicity over flexibility because early adopters value quick setup (Sage's input) over power-user features"
- Shows: Prioritization based on constraints

✅ **Final recommendation balances multiple concerns**

- Example: "Implement tiered pricing (Walt), with clear upgrade paths (Finn), using feature flags for gradual rollout (Axel), with comprehensive audit logging (Cerberus)"
- Shows: Integration of diverse needs

✅ **Specific to project tech stack/context**

- Example: "Add subscription state to Zustand store (apps/ui/src/store/app-store.ts), expose via Express routes (apps/server/src/routes/subscription/)"
- Shows: Deep understanding of actual codebase

✅ **Identifies risks and mitigations**

- Example: "Theo noted database migration complexity; Axel proposed phased rollout to mitigate"
- Shows: Anticipatory thinking

### Negative Signs (Shallow Collaboration)

❌ **All agents agree (likely not enough depth)**

- Example: "Everyone thinks this is a good idea"
- Problem: No critical thinking, likely surface-level analysis

❌ **Generic recommendations (could apply to any project)**

- Example: "Use secure authentication and store passwords properly"
- Problem: Not leveraging project-specific context

❌ **Missing perspectives entirely**

- Example: Security feature with no input from Cerberus
- Problem: Incomplete analysis

❌ **Synthesis just lists bullet points without integration**

- Example:
  - Sage: Do market research
  - Theo: Build scalable system
  - Finn: Make it user-friendly
- Problem: No synthesis, just aggregation

❌ **No mention of implementation complexity**

- Example: "Just add blockchain integration"
- Problem: Ignores feasibility (Axel/Theo would flag this)

---

## 4. Scoring Rubric for Synthesis Quality (0-5)

### Score: 5 (Exceptional)

- **All perspectives integrated** - 9-10 agents meaningfully represented
- **Tensions identified** - Multiple examples of conflicting priorities explicitly discussed
- **Actionable recommendations** - Specific file paths, code patterns, implementation sequence
- **Evidence of iteration** - Shows how initial ideas evolved through discussion
- **Project-specific** - References actual Automaker architecture, tech stack, and constraints

**Example:** "Cerberus insisted on rate limiting for subscription API (apps/server/src/routes/subscription/), but Apex warned this adds 50ms latency. We compromised: rate limit at nginx level (Axel's suggestion) to minimize app-level overhead. Walt confirmed <10k monthly active users make this acceptable. Implementation in 3 phases: (1) Stripe webhook integration, (2) Zustand store updates, (3) feature flag gates."

---

### Score: 4 (Strong)

- **Most perspectives represented** - 7-8 agents with substantial input
- **Some integration** - At least 2-3 examples of tradeoff discussions
- **Mostly actionable** - Recommendations are specific but may lack implementation details
- **Some project context** - References tech stack but may be partially generic

**Example:** "Theo proposed microservices for subscription management, but Axel noted operational complexity for current team size. Compromise: monolithic Express routes with clear service boundaries for future extraction. Finn's UX mockups inform API design. Implementation: Add /api/subscription endpoints, integrate Stripe SDK."

---

### Score: 3 (Adequate)

- **Perspectives listed but not integrated** - 5-6 agents contribute independently
- **Limited synthesis** - Minimal discussion of tensions or tradeoffs
- **Recommendations exist but generic** - "Use best practices" without specifics
- **Some project references** - Mix of project-specific and generic advice

**Example:** "From business perspective (Sage): subscriptions increase MRR. From technical perspective (Theo): need database schema for plans. From UX perspective (Finn): users want simple upgrade. From security perspective (Cerberus): validate payment tokens. Recommendation: Implement subscription system with proper security."

---

### Score: 2 (Weak)

- **Missing multiple perspectives** - Only 3-4 agents represented
- **No real synthesis** - Just sequential statements
- **Vague recommendations** - No implementation guidance
- **Mostly generic** - Could apply to any project

**Example:** "We should add subscriptions. Make sure it's secure and user-friendly. Use a payment processor. Test thoroughly."

---

### Score: 1 (Very Shallow)

- **Only 1-2 perspectives** - Minimal agent participation
- **No integration** - Disconnected points
- **Generic platitudes** - No actionable content
- **No project context** - Ignores actual codebase

**Example:** "Subscriptions are important for SaaS businesses. Users like good experiences. Security matters."

---

### Score: 0 (No Real Synthesis)

- **Echo chamber** - Just repeats user request
- **No agent perspectives** - Agents didn't actually contribute
- **No analysis** - No evaluation or recommendations
- **Template response** - Copy-paste generic content

**Example:** "As requested, we'll implement subscription functionality. This will be good for the business."

---

## 5. Example Good vs Bad Synthesis

### Example Scenario: "Add Stripe subscription management to Automaker"

---

### ❌ BAD SYNTHESIS (Score: 2)

**Team Recommendation:**

We should implement subscription functionality for Automaker. This will allow monetization.

**Key Points:**

- Add subscription tiers (Basic, Pro, Enterprise)
- Integrate payment processing
- Create billing dashboard
- Ensure security best practices
- Make UI intuitive
- Test before launch

**Next Steps:**

- Research payment providers
- Design database schema
- Build UI components
- Write tests

**Analysis:** This is terrible. No agent voices, completely generic, could apply to any app, no specific implementation guidance, no tradeoffs discussed, no project context.

---

### ✅ GOOD SYNTHESIS (Score: 5)

**Team Recommendation: Phased Stripe Integration with Feature-Flag Gating**

**Context & Deliberation:**

Sage identified subscription revenue as critical for sustainability (current model unsustainable at scale). However, Cerberus immediately flagged PCI compliance concerns, while Theo noted architectural complexity of retrofitting billing into existing monorepo.

**Key Tension:** Finn advocated for "one-click upgrade" UX, but Cerberus required explicit multi-step consent for PCI compliance. **Resolution:** Two-step flow with progress indicator (Finn's compromise) + explicit confirmation screen (Cerberus's requirement).

**Second Tension:** Walt's ROI analysis showed Stripe fees (2.9% + 30¢) eat into margins for <$10/month plans. Sage pushed back: "Better to have revenue with fees than no revenue." **Resolution:** Minimum $15/month Pro tier (Walt's threshold) with annual discount to encourage commitment.

**Third Tension:** Theo wanted microservice architecture for billing isolation, but Axel warned against operational complexity (team of 2 can't manage multiple services). **Resolution:** Monolithic Express routes with clean service boundaries (`apps/server/src/services/subscription-service.ts`) to enable future extraction if needed.

**Technical Implementation (Theo + Apex + Zen):**

1. **Data Model** (`apps/server/src/services/subscription-service.ts`):
   - Add `SubscriptionTier` enum to `@automaker/types`
   - Store Stripe customer ID in existing `settings.json` (avoid new database dependency)
   - Use Stripe as source of truth for subscription state (reduce sync complexity)

2. **API Routes** (`apps/server/src/routes/subscription/`):
   - `POST /api/subscription/create-checkout` - Initiate Stripe Checkout
   - `POST /api/subscription/webhook` - Handle Stripe events (Cerberus: require signature validation)
   - `GET /api/subscription/status` - Check current tier (Apex: cache for 5min to reduce Stripe API calls)

3. **Frontend** (`apps/ui/src/components/views/subscription-view/`):
   - Add subscription state to Zustand store (`store/app-store.ts`)
   - Pricing table component (Finn: mobile-first, accessible, WCAG AA)
   - Success/error screens with clear next steps

4. **Feature Gating** (Zen's requirement):
   - Wrap premium features with `<SubscriptionGate tier="pro">` component
   - Graceful degradation (show upgrade prompt, not error)
   - Comprehensive E2E tests for each tier's access controls

**Operational Rollout (Axel + Echon):**

- **Phase 1 (Week 1):** Stripe integration behind feature flag (`SUBSCRIPTION_ENABLED=false`)
- **Phase 2 (Week 2):** Beta test with 10 internal users (Echon: monitor conversion funnel)
- **Phase 3 (Week 3):** Public launch with monitoring (Axel: alert on webhook failures, payment success rate <95%)

**Financial Projections (Walt):**

- Development cost: ~80 hours ($8K at $100/hr)
- Break-even: 534 Pro subscriptions ($15/mo) = $8,010 MRR
- Year 1 projection: 200 Pro + 20 Enterprise ($99/mo) = $5,980/mo = $71,760/yr
- ROI: Break-even at Month 2 if conversion rate ≥2.5%

**Research Validation (Mary):**

- Survey 50 current users about willingness to pay (hypothesis: $15/mo acceptable for power users)
- A/B test annual discount (20% vs 30% off) to maximize LTV
- Monitor cancellation reasons (instrument feedback form in cancellation flow)

**Risk Register:**

| Risk                                           | Owner    | Mitigation                                             |
| ---------------------------------------------- | -------- | ------------------------------------------------------ |
| Stripe webhook failures lose subscription data | Axel     | Dead-letter queue + manual reconciliation script       |
| PCI compliance violation                       | Cerberus | Use Stripe Checkout (no card data touches our servers) |
| Poor conversion rate (<1%)                     | Sage     | Free trial (14 days) before charging                   |
| Performance bottleneck on `/status` endpoint   | Apex     | Redis cache + 5min TTL                                 |
| Incomplete test coverage                       | Zen      | Require 90% coverage on subscription service           |

**Success Metrics (Echon):**

- **Launch criteria:** 0 P0 bugs, <2s page load, 95% Stripe webhook success rate
- **Post-launch monitoring:** Conversion rate, churn rate, revenue growth
- **Iteration triggers:** If conversion <1.5% after 2 weeks, revisit pricing (Walt) and UX friction (Finn)

**Dissenting Opinion (Theo):**

"I still believe microservices are the right long-term architecture, but I acknowledge Axel's operational concerns are valid for a 2-person team. We should revisit this decision if we scale beyond 10K users or add a third engineer."

---

**Analysis:** This is excellent. All 10 agents represented with specific contributions, multiple tensions explicitly discussed with resolutions, project-specific implementation details (exact file paths, tech stack), risk mitigation, phased rollout, success metrics, and even a dissenting opinion. Score: 5/5.

---

## Usage Guidelines

### For Monitoring Agents:

1. Apply this rubric to each synthesis output
2. Document score and rationale
3. Flag scores <3 for immediate attention
4. Track patterns (e.g., "Security perspective consistently missing")

### For Team Leads:

1. Review flagged low-quality syntheses
2. Identify root causes (agent prompt issues? insufficient context?)
3. Iterate on agent configurations
4. Use high-scoring syntheses as training examples

### For Feature Owners:

1. Request re-synthesis if score <4
2. Use checklist to identify missing perspectives
3. Provide additional context to improve specificity

---

## Continuous Improvement

Track synthesis quality over time:

- **Baseline:** Average score for first 10 features
- **Target:** 90% of syntheses score ≥4 within 30 days
- **Review cadence:** Weekly quality review meeting
- **Feedback loop:** Share high/low examples with agent developers

---

**Document Version:** 1.0
**Owner:** Monitoring Agent 5 - Synthesis Quality Monitor
**Last Updated:** 2025-12-31
