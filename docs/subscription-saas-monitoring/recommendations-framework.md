# Recommendations Framework

## Post-Test Actionable Items for BMAD 10-Agent Team

**Document Version:** 1.0
**Created:** 2025-12-31
**Purpose:** Structured framework for converting test observations into actionable improvements

---

## 1. Immediate Actions Matrix

| Priority | Action                                         | Owner         | Reason                                            | Estimated Effort |
| -------- | ---------------------------------------------- | ------------- | ------------------------------------------------- | ---------------- |
| **P0**   | Fix agents not invoked (if any)                | Dev Team      | Critical system failure - agents must participate | 2-4 hours        |
| **P0**   | Fix synthesis integration if agents missing    | Dev Team      | Broken synthesis defeats multi-agent purpose      | 2-4 hours        |
| **P0**   | Restore agent personas if responses generic    | Dev Team      | Loss of specialized expertise                     | 1-2 hours        |
| **P1**   | Address low-scoring agents (avg < 2.0)         | Dev Team + PM | Quality threshold breach                          | 4-8 hours        |
| **P1**   | Fix echo chamber if detected (>70% similarity) | Dev Team      | Defeats diversity requirement                     | 2-4 hours        |
| **P1**   | Enhance domain coverage if < 25/30 points      | Content Team  | Missing critical perspectives                     | 4-6 hours        |
| **P2**   | Refine synthesis quality if < 4/5              | Content Team  | Optimization opportunity                          | 2-3 hours        |
| **P2**   | Improve low-contribution agents (score < 2.5)  | Content Team  | Performance tuning                                | 1-2 hours each   |
| **P2**   | Add missing domain knowledge to agents         | Content Team  | Preventive enhancement                            | Ongoing          |

---

## 2. Agent-Specific Tuning Recommendations

### Common Issues and Fixes

| Agent                      | Potential Issue                    | Symptoms                                              | Recommended Fix                                                                                                                        | Implementation              |
| -------------------------- | ---------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Analyst Strategist**     | Too generic business analysis      | Vague market insights, no data-driven recommendations | Add: "Provide specific metrics, market data, and quantified risks. Reference industry benchmarks."                                     | Update agent persona file   |
| **Financial Strategist**   | Missing financial modeling         | Revenue mentioned but no unit economics, LTV, CAC     | Add: "Always include unit economics (LTV, CAC, churn impact), pricing model validation, and financial projections."                    | Update agent persona file   |
| **Security Guardian**      | Checklist-style responses          | Generic security list without SaaS specifics          | Add: "Focus on subscription-specific vulnerabilities (payment data, multi-tenancy isolation, API abuse). Prioritize by risk."          | Update agent persona file   |
| **Technologist Architect** | Architecture without scalability   | Tech stack mentioned, no scaling strategy             | Add: "Address multi-tenancy architecture, database sharding, API rate limiting, and horizontal scaling patterns."                      | Update agent persona file   |
| **Fulfillization Manager** | Operations without automation      | Manual processes described                            | Add: "Emphasize automation opportunities, self-service features, and operational metrics (support ticket reduction, onboarding time)." | Update agent persona file   |
| **Strategist Marketer**    | Marketing without growth metrics   | Tactics listed, no growth levers                      | Add: "Quantify growth channels (CAC by channel, conversion rates, viral coefficients). Focus on PLG and retention."                    | Update agent persona file   |
| **Zen**                    | Philosophical without practicality | Abstract insights, no actionable wisdom               | Add: "Ground philosophical insights in practical team actions. Connect principles to specific SaaS challenges."                        | Update agent persona file   |
| **Apex**                   | Synthesis misses agent inputs      | Summary doesn't reference specific agents             | Fix: "Explicitly require: 'Synthesize insights from [Agent A], [Agent B], [Agent C]... ensuring each contributes.'"                    | Update synthesis logic      |
| **All Agents**             | Echo chamber effect                | Agents repeat same points                             | Add: "Before responding, review previous agents' contributions. Provide a UNIQUE perspective or decline to contribute."                | Update system prompt        |
| **All Agents**             | Missing from synthesis             | Agent invoked but not in final output                 | Fix: Check synthesis prompt logic - ensure all agent outputs are passed to Apex/Zen. Verify agent output format compatibility.         | Debug synthesis integration |

### Agent-Specific Enhancement Checklist

**Analyst Strategist:**

- [ ] Add subscription business model expertise (usage-based vs. seat-based)
- [ ] Include competitive analysis frameworks
- [ ] Reference SaaS industry benchmarks (e.g., T2D3, Rule of 40)

**Financial Strategist:**

- [ ] Add SaaS-specific financial metrics (MRR, ARR, NDR, GDR)
- [ ] Include pricing strategy frameworks (value-based, tiered, usage-based)
- [ ] Reference cash flow implications of annual vs. monthly billing

**Security Guardian:**

- [ ] Add multi-tenancy security patterns
- [ ] Include compliance frameworks (SOC 2, GDPR, HIPAA for SaaS)
- [ ] Reference OAuth/SSO security best practices

**Technologist Architect:**

- [ ] Add multi-tenancy architecture patterns (database-per-tenant vs. shared schema)
- [ ] Include API design for SaaS (rate limiting, webhooks, versioning)
- [ ] Reference scalability patterns (caching, CDN, database scaling)

**Fulfillization Manager:**

- [ ] Add customer success metrics (health scores, engagement tracking)
- [ ] Include onboarding automation strategies
- [ ] Reference support scaling (self-service, chatbots, tiered support)

**Strategist Marketer:**

- [ ] Add PLG (Product-Led Growth) strategies
- [ ] Include SaaS growth playbooks (freemium, free trial, demo-first)
- [ ] Reference retention and expansion tactics (upsell, cross-sell)

**Zen:**

- [ ] Add team dynamics insights for subscription model stress
- [ ] Include sustainable growth philosophy (avoid growth-at-all-costs)
- [ ] Reference long-term thinking vs. short-term metrics obsession

**Apex:**

- [ ] Enforce synthesis completeness check (all agents represented)
- [ ] Add explicit integration of conflicting perspectives
- [ ] Include strategic priorities ranking (what to do first)

---

## 3. Synthesis Improvement Recommendations

### If Synthesis is Missing Perspectives

**Symptoms:**

- Apex/Zen output doesn't reference all invoked agents
- Key domain areas mentioned by agents absent from synthesis
- Word count suggests summary, not synthesis

**Checklist of Fixes:**

- [ ] **Verify input format:** Confirm all agent outputs are passed to synthesis agent
- [ ] **Update synthesis prompt:** Add requirement: "Your synthesis MUST integrate insights from ALL contributing agents: [list agent names]. Explicitly reference each."
- [ ] **Add validation step:** Before returning synthesis, check if all agent names appear in output
- [ ] **Increase synthesis model capability:** Consider using Opus for synthesis if currently using Sonnet
- [ ] **Provide synthesis examples:** Add few-shot examples showing proper integration of 5-7 agent perspectives
- [ ] **Debug agent output passing:** Log what inputs Apex/Zen receive vs. what agents actually output

### If Synthesis is Too Generic

**Symptoms:**

- High-level platitudes without specific insights
- No mention of unique agent contributions
- Reads like generic SaaS advice, not integrated expertise

**Checklist of Fixes:**

- [ ] **Require specificity:** Add to prompt: "Avoid generic advice. Extract and integrate SPECIFIC, ACTIONABLE insights from each agent."
- [ ] **Demand examples:** Add: "Support each recommendation with concrete examples or data points from agent contributions."
- [ ] **Enforce perspective integration:** Add: "Highlight where agents AGREE and DISAGREE. Resolve conflicts with reasoned synthesis."
- [ ] **Set quality bar:** Add: "Your synthesis should be MORE valuable than reading all agents individually. Add emergent insights."
- [ ] **Provide anti-patterns:** Show examples of BAD synthesis (generic) vs. GOOD synthesis (integrated, specific)
- [ ] **Increase output length:** If synthesis is too short, it's likely summarizing not synthesizing. Require minimum length.

### If Synthesis Has High Quality But Missing Agents

**Root Cause:** Likely integration issue, not synthesis capability issue.

**Checklist of Fixes:**

- [ ] **Check agent invocation logs:** Verify all agents were actually called
- [ ] **Check agent output format:** Ensure all agents return valid, parseable output
- [ ] **Check synthesis input assembly:** Debug how agent outputs are collected and passed to synthesis
- [ ] **Check for empty outputs:** Some agents may return empty/null, causing them to be skipped
- [ ] **Add error handling:** Ensure failed agent invocations still pass partial results to synthesis
- [ ] **Add agent output validation:** Before synthesis, validate all expected agents contributed non-empty outputs

---

## 4. Process Improvements

### For Better Test Coverage

**Feature Selection Strategy:**

- [ ] **Rotate feature complexity:** Alternate between simple, moderate, complex features across tests
- [ ] **Test domain-specific features:** Choose features that trigger specific agents (e.g., "payment processing" for Financial + Security)
- [ ] **Include edge cases:** Test features with conflicting requirements (e.g., "free tier" - Financial vs. Marketing tension)
- [ ] **Vary feature types:** Alternate between new features, enhancements, refactors, infrastructure
- [ ] **Document feature rationale:** In monitoring script, explain why each test feature was chosen

**Timing of Monitoring:**

- [ ] **Pre-implementation baseline:** Run before major agent changes to establish baseline
- [ ] **Post-implementation validation:** Run after agent updates to measure improvement
- [ ] **Periodic health checks:** Run weekly/monthly to catch degradation
- [ ] **Pre-release gate:** Run before releasing new agent versions to production
- [ ] **Incident response:** Run after user reports quality issues to diagnose

**Coverage Gaps to Address:**

- [ ] **Multi-agent collaboration:** Currently tests individual contributions, not inter-agent communication
- [ ] **Sequential vs. parallel:** Test if agent order matters (do later agents reference earlier ones?)
- [ ] **Conflict resolution:** Deliberately create conflicting requirements to test synthesis quality
- [ ] **Long-context handling:** Test with very large feature descriptions to check for context window issues

### For More Reliable Monitoring

**Capture Protocols:**

- [ ] **Standardize output format:** Require all agents to return structured JSON with: contribution, domain_areas, confidence_level
- [ ] **Add metadata logging:** Capture: agent invocation order, response time, token usage, model used
- [ ] **Implement checkpointing:** Save intermediate state after each agent in case of failure
- [ ] **Add retry logic:** If agent invocation fails, retry up to 3 times before marking as failed
- [ ] **Capture full conversation history:** Save entire agent conversation, not just final output, for debugging

**Scoring Calibration:**

- [ ] **Anchor scores with examples:** For each score (1-5), provide concrete examples of what that quality looks like
- [ ] **Use multiple raters:** Have 2-3 reviewers score same output to check inter-rater reliability
- [ ] **Calibrate domain coverage:** Periodically review if 30 domain areas are still comprehensive (add/remove as needed)
- [ ] **Weight by importance:** Not all domain areas are equal - consider weighting (e.g., security 2x weight for payment features)
- [ ] **Trend over time:** Track if scores are inflating/deflating over time - recalibrate baseline

**Automation Opportunities:**

- [ ] **Auto-detect echo chamber:** Implement cosine similarity check on agent outputs (flag if >70% similar)
- [ ] **Auto-check synthesis completeness:** Regex check for all agent names in synthesis output
- [ ] **Auto-calculate domain coverage:** Script to parse agent outputs and auto-score domain coverage
- [ ] **Auto-generate comparison reports:** Compare current run to previous baseline - highlight regressions
- [ ] **CI/CD integration:** Run subset of monitoring tests on every agent config change

---

## 5. Success Criteria Validation Table

### Test Results Template

| Criterion                   | Threshold                | Actual      | Status            | Notes                           |
| --------------------------- | ------------------------ | ----------- | ----------------- | ------------------------------- |
| **All 10 agents invoked**   | 100% (10/10)             | \_\_\_/10   | ⬜ PASS / ⬜ FAIL | List any agents not invoked:    |
| **Unique contributions**    | ≥80% distinct content    | \_\_%       | ⬜ PASS / ⬜ FAIL | Echo chamber detected: YES / NO |
| **Domain coverage score**   | ≥83% (25/30 areas)       | **/30 (**%) | ⬜ PASS / ⬜ FAIL | Missing domains:                |
| **Synthesis quality**       | ≥80% (4/5 score)         | **/5 (**%)  | ⬜ PASS / ⬜ FAIL | Issues:                         |
| **No agent < 2.0 avg**      | 0 agents below threshold | \_\_ agents | ⬜ PASS / ⬜ FAIL | Low performers:                 |
| **Agent score avg**         | ≥3.0 team average        | **.**       | ⬜ PASS / ⬜ FAIL | Team performance level          |
| **All agents in synthesis** | 100% referenced          | \_\_/10     | ⬜ PASS / ⬜ FAIL | Missing from synthesis:         |

### Final Verdict Criteria

**PASS:** All criteria met. System performing as designed.

- Action: Document success, maintain current configuration, schedule next health check.

**PARTIAL:** 5-6 of 7 criteria met. System functional but needs tuning.

- Action: Implement P1 recommendations, re-test within 1 week.

**FAIL:** <5 criteria met. System not meeting quality standards.

- Action: Implement P0 and P1 recommendations immediately, escalate to dev team, re-test within 2-3 days.

**Final Verdict:** [Select one based on test results]

- ⬜ **PASS** - System healthy, no immediate action required
- ⬜ **PARTIAL** - System functional, tuning recommended
- ⬜ **FAIL** - System needs immediate attention

---

## 6. Next Steps Checklist

### Immediate (Within 24 hours)

- [ ] **Share report with user**
  - Format: Link to monitoring report Markdown file
  - Include: Final verdict, key findings, recommended actions
  - Provide: Timeline for addressing P0/P1 items

- [ ] **Implement P0 recommendations immediately**
  - If agents not invoked: Fix invocation logic
  - If synthesis broken: Fix integration
  - If personas lost: Restore agent configurations
  - Estimate completion: \_\_\_\_ hours

- [ ] **Create improvement tickets**
  - P0 items: Create GitHub issues with "critical" label
  - P1 items: Create GitHub issues with "high priority" label
  - P2 items: Create GitHub issues with "enhancement" label
  - Assign owners and deadlines

### Short-term (Within 1 week)

- [ ] **Schedule follow-up test if PARTIAL**
  - Target date: ****\_****
  - Same feature or different: **\_\_\_\_**
  - Expected outcome: Move from PARTIAL to PASS

- [ ] **Implement P1 recommendations**
  - Low-scoring agents: Enhance prompts/personas
  - Echo chamber: Add unique perspective requirement
  - Domain coverage: Add missing expertise

- [ ] **Update agent configurations**
  - Apply fixes from Section 2 (Agent-Specific Tuning)
  - Test changes in isolation before re-running full test
  - Document what was changed and why

### Medium-term (Within 1 month)

- [ ] **Document learnings for future tests**
  - Update monitoring playbook with new insights
  - Add discovered edge cases to test suite
  - Refine scoring rubrics based on ambiguities found

- [ ] **Implement P2 recommendations**
  - Synthesis quality enhancements
  - Process improvements
  - Automation opportunities

- [ ] **Calibrate success criteria**
  - Review if thresholds are appropriate
  - Adjust based on accumulated test data
  - Document rationale for any threshold changes

### Long-term (Ongoing)

- [ ] **Establish monitoring cadence**
  - Weekly health checks: ⬜ YES / ⬜ NO
  - Pre-release validation: ⬜ YES / ⬜ NO
  - Post-incident analysis: ⬜ YES / ⬜ NO

- [ ] **Build monitoring automation**
  - Auto-run tests on agent config changes
  - Auto-generate comparison reports
  - Auto-alert on degradation

- [ ] **Expand test coverage**
  - Add more feature types
  - Test multi-turn conversations
  - Test conflict resolution scenarios

---

## 7. Escalation Criteria

### When to Escalate to Development Team

**Immediate Escalation (P0):**

1. **Multiple agents consistently failing**
   - Symptom: 3+ agents not invoked across multiple test runs
   - Impact: System fundamentally broken
   - Action: Halt testing, debug agent invocation pipeline
   - Owner: Dev Team Lead

2. **Synthesis integration broken**
   - Symptom: Apex/Zen receives no inputs OR outputs empty synthesis
   - Impact: Multi-agent system reduced to single-agent
   - Action: Debug synthesis input assembly, check agent output format compatibility
   - Owner: Backend Engineer

3. **Agent responses not matching personas**
   - Symptom: All agents give generic responses, no specialization detected
   - Impact: Loss of expert diversity, defeats purpose of multi-agent system
   - Action: Review agent configuration loading, check if personas are being applied
   - Owner: AI/Prompt Engineer

**High Priority Escalation (P1):**

4. **Consistent low scores (<2.5 avg) across team**
   - Symptom: Team average below 3.0 across multiple features
   - Impact: System not providing value, user experience poor
   - Action: Review prompt quality, model selection, agent design
   - Owner: Product Manager + AI Engineer

5. **Echo chamber effect persists after fixes**
   - Symptom: >70% similarity even after adding unique perspective requirements
   - Impact: Reduced value from multi-agent system
   - Action: Redesign agent differentiation strategy, consider agent interaction model
   - Owner: AI Architect

6. **Domain coverage consistently missing critical areas**
   - Symptom: Same 5+ domain areas missing across different features
   - Impact: Blind spots in analysis, potential risks missed
   - Action: Add new specialized agents OR enhance existing agent expertise
   - Owner: Content Lead + Product Manager

**Medium Priority Escalation (P2):**

7. **Individual agent persistent underperformance**
   - Symptom: Same agent scores <2.0 across 3+ different features
   - Impact: Weak link in team, may be better to remove than keep
   - Action: Deep dive on agent persona, consider redesign or removal
   - Owner: AI Engineer + Subject Matter Expert

8. **Synthesis quality plateau**
   - Symptom: Synthesis stuck at 3/5 despite improvements
   - Impact: Integration not adding value beyond individual contributions
   - Action: Reconsider synthesis approach (different model, different prompt strategy, human-in-loop)
   - Owner: AI Architect

### Escalation Process

1. **Document the issue**
   - What: Specific criterion failing
   - Evidence: Test results showing failure
   - Impact: Why this matters to end users
   - Attempts: What fixes were already tried

2. **Assess severity**
   - P0: Blocks all progress, escalate immediately
   - P1: Degrades quality, escalate within 1 day
   - P2: Optimization opportunity, escalate within 1 week

3. **Notify appropriate owner**
   - Tag in GitHub issue
   - Slack message to owner + manager
   - Include: Link to monitoring report, specific recommendation, requested timeline

4. **Track to resolution**
   - Create follow-up test to validate fix
   - Document what was changed
   - Update monitoring framework if new failure mode discovered

---

## 8. Meta: Using This Framework

### For Each Test Run

1. Run the subscription SaaS monitoring test
2. Capture results in the validation table (Section 5)
3. Calculate Final Verdict (PASS / PARTIAL / FAIL)
4. Review Immediate Actions Matrix (Section 1) - implement P0 items
5. Check agent-specific issues (Section 2) - apply relevant fixes
6. If synthesis issues, apply Section 3 recommendations
7. Complete Next Steps Checklist (Section 6)
8. Escalate if criteria met (Section 7)

### For Framework Maintenance

- Update after every 5 test runs based on learnings
- Add new common issues to Section 2 as discovered
- Refine success criteria thresholds based on data
- Expand escalation criteria as new failure modes found

### For Continuous Improvement

- Track metrics over time: Are we improving?
- Document what fixes actually worked vs. didn't
- Share learnings across team
- Update agent personas based on real-world performance

---

## Appendix: Quick Reference

### Decision Tree

```
Test Complete
    ↓
All criteria met? → YES → PASS → Schedule next health check
    ↓ NO
5-6 criteria met? → YES → PARTIAL → Implement P1, retest in 1 week
    ↓ NO
<5 criteria met? → YES → FAIL → Implement P0+P1, escalate, retest in 2-3 days
```

### Priority Definitions

- **P0:** Blocks all progress, fix immediately (0-24 hours)
- **P1:** Degrades quality, fix soon (1-7 days)
- **P2:** Optimization opportunity, plan work (1-4 weeks)

### Owner Roles

- **Dev Team:** Code changes, system fixes
- **Content Team:** Prompt/persona enhancements
- **PM:** Requirements, prioritization
- **AI Engineer:** Model selection, prompt engineering
- **AI Architect:** System design, multi-agent orchestration

---

**End of Recommendations Framework**
