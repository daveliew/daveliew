# Practice Scenario: Enterprise Merchant API Migration

**Type**: System Design + Stakeholder Management Hybrid
**Difficulty**: Medium-Hard
**Time**: 35-45 minutes
**Pillars Tested**: RRK, GCA, Leadership, Googleyness

---

## Context

You're a Solutions Architect at Google supporting enterprise retail clients. One of your largest accounts - a major SEA e-commerce platform with 50,000+ SKUs across 6 markets - is still on Content API for Shopping. The deprecation deadline (Aug 2026) is 7 months away, and they haven't started migration planning.

Their current setup:
- Content API v2.1 for product feeds
- Custom middleware that transforms their catalog data
- Multi-market feeds (SG, MY, TH, PH, VN, ID)
- Real-time inventory updates via supplemental feeds
- ~2M API calls/day

---

## Turn 1

**Interviewer**: "The client's CTO just messaged saying their engineering team is 'too busy with Q1 launches' to prioritize this migration. They want to know if they can just wait until closer to the deadline. How would you handle this?"

**Your Response**: _(Practice out loud, then reveal)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is a stakeholder management question disguised as a technical one. Show empathy first, then reframe the risk.

**Sample Response**:
"I'd first acknowledge their Q1 pressure - that's real. But I'd reframe the timeline risk:

1. **Quantify the risk**: 'If migration starts in month 6, you have 1 month for development, testing, and rollout across 6 markets. One bug in production = broken Shopping ads during peak season.'

2. **Propose a middle path**: 'What if we do a lightweight audit now - just 2-3 hours of your eng time - to identify the breaking changes specific to your implementation? Then you can scope the real effort and schedule it post-Q1 with confidence.'

3. **Create urgency without panic**: 'The biggest risk isn't the deadline - it's discovering late that your custom middleware has dependencies we didn't anticipate.'

I'd also offer to run that initial audit myself and present findings to reduce their burden."

**What this demonstrates**: Empathy, risk reframing, offering to take on work, partnership mindset.
</details>

---

## Turn 2

**Interviewer**: "Good. Let's say they agree to the audit. Walk me through how you'd assess their Content API implementation and plan the migration to Merchant API."

**Your Response**: _(Practice your system design approach)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: Use a structured approach. Show you know the Google ecosystem AND migration patterns.

**Sample Response**:

"I'd break this into three phases:

**Phase 1: Discovery (Current State)**
- Pull their API usage logs - which endpoints, call volumes, error rates
- Review their feed structure - custom attributes, supplemental feeds
- Map their middleware transformations - what business logic lives there?
- Identify multi-market specifics - different currencies, shipping, tax rules

**Phase 2: Gap Analysis (Breaking Changes)**

The key Content API → Merchant API changes I'd flag:

| Content API | Merchant API | Migration Impact |
|-------------|--------------|------------------|
| `products.insert` | `products.insert` (similar but new SDK) | Low - mostly SDK change |
| `inventory` service | `localInventory` + new patterns | Medium - restructure needed |
| `targetCountry` | `feedLabel` | Medium - ID format changes |
| Custom attributes format | Recursive structure change | High - middleware rewrite |
| Batch HTTP methods | `customBatch` only | Medium - call pattern change |

**Phase 3: Migration Plan**
1. Set up parallel Merchant API connection (don't cut over yet)
2. Run shadow traffic - same products to both APIs, compare results
3. Market-by-market rollout starting with lowest volume (VN) → highest (ID)
4. Kill switch ready - ability to revert to Content API if issues

I'd present this as a decision doc with effort estimates and risk ratings."

**What this demonstrates**: Structured thinking, Google product knowledge, migration best practices, risk mitigation.
</details>

---

## Turn 3

**Interviewer**: "You mentioned the custom attributes format change is 'High' impact. Can you go deeper on that? What specifically changes and why is it risky?"

**Your Response**: _(This tests technical depth)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: Show you've actually read the docs. If you don't know the exact details, show how you'd find out.

**Sample Response**:

"In Content API v2, custom attributes had `type` and `unit` fields - you'd specify something like `type: 'string'` and `unit: 'cm'`. In v2.1 and Merchant API, those were removed. Now units get appended to the value string itself - so instead of `{value: '5.6', unit: 'cm'}`, it's just `{value: '5.6 cm'}`.

Also, custom groups became recursive custom attributes. Previously you had a flat structure with `customGroups` as a container. Now `customAttributes` can nest with a `groupValues` field.

**Why it's risky for this client**:
1. Their middleware likely has type-checking logic that expects those fields
2. If they're using custom attributes for market-specific data (like local certifications), the transformation could break silently
3. Validation that worked before might fail - and you won't see errors until products get disapproved

**My approach**:
- Export a sample of their current custom attributes
- Run through the new format validator
- Identify which transformations need updating before they touch any code

Honestly, if I'm not 100% certain on the exact schema differences, I'd pull up the [migration guide](https://developers.google.com/merchant/api/guides/compatibility/overview) and walk through it with their team. I don't want to give them wrong info that wastes engineering time."

**What this demonstrates**: Technical depth, intellectual honesty ("if I'm not certain..."), practical approach.
</details>

---

## Turn 4

**Interviewer**: "It's now 3 months into migration. The client's eng team messages you: 'We pushed to production last night and now 30% of our products are disapproved in Merchant Center. Help!' What do you do?"

**Your Response**: _(Troubleshooting under pressure)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: Use the troubleshooting framework - CLARIFY → ISOLATE → HYPOTHESIZE → VERIFY → RESOLVE. Stay calm.

**Sample Response**:

"First, I'd avoid panic mode. 30% disapproval post-migration is recoverable.

**CLARIFY** (5 min):
- 'Is this 30% across all markets or concentrated in one?'
- 'What's the disapproval reason in Merchant Center?' (This is the key data point)
- 'Were these products approved yesterday on Content API?'
- 'What changed in last night's push - just the API switch or also product data?'

**ISOLATE** (10 min):
- Compare a disapproved product's payload (new Merchant API) vs its old Content API format
- Check if disapprovals cluster by: market, product category, or specific attributes
- Look at the Diagnostics tab in Merchant Center for pattern

**HYPOTHESIZE** (based on what I'd expect):
Given this is migration-related, likely causes:
1. **Required field missing** - Merchant API might require fields Content API didn't
2. **Format validation stricter** - e.g., GTIN format, price format
3. **feedLabel vs targetCountry mismatch** - product IDs now constructed differently
4. **Custom attributes structure** - the issue we flagged earlier

**VERIFY & RESOLVE**:
- Pull 5-10 disapproved products, diff the payloads
- Once identified, quick fix options:
  - Supplemental feed patch (fast, no code deploy)
  - Rollback to Content API temporarily while fixing (if still within deprecation window)
  - Emergency middleware fix if it's a transformation bug

I'd also communicate clearly: 'Here's what I know, here's what I'm checking, here's when you'll hear back.' No silent debugging."

**What this demonstrates**: Structured troubleshooting, calm under pressure, client communication, practical solutions.
</details>

---

## Turn 5

**Interviewer**: "The issue was feedLabel format. You helped them fix it and products are back to approved. Now the CTO asks: 'What should we have done differently to prevent this?' What do you tell them?"

**Your Response**: _(Leadership + retrospective thinking)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: Be constructive, not blame-y. Show you can do retrospectives that improve process.

**Sample Response**:

"I'd frame this as a learning opportunity, not a blame session:

**What we should have done**:

1. **Shadow traffic testing** - Run Merchant API in parallel for a week, compare approval rates before cutting over. We talked about this in the plan but skipped it for speed.

2. **Staged rollout** - Start with 1 market (lowest volume), verify for 48 hours, then expand. Going all 6 markets at once was risky.

3. **Validation layer** - Before any API call, validate payload against Merchant API schema. Catch format issues before they hit Google's systems.

4. **Monitoring dashboard** - Set up alerts on disapproval rate. If it spikes >5% above baseline, auto-alert and pause the rollout.

**What I should have pushed harder on**:

Honestly, I knew the shadow testing was important but didn't push back hard enough when timeline pressure came up. Next time I'd be more direct: 'We can skip this, but here's the specific risk: production disapprovals that impact revenue. Is that a tradeoff you want to make?'

**For future migrations**:
Create a migration playbook with these checkpoints. This won't be the last API migration."

**What this demonstrates**: Ownership (including self-critique), constructive retrospective, process improvement mindset, leadership without authority.
</details>

---

## Turn 6 (Wrap-up)

**Interviewer**: "Last question - why should this client trust you as their SA? You're not an engineer on their team. What value do you actually bring?"

**Your Response**: _(Googleyness + self-awareness)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is the "why you" question. Be confident but not arrogant.

**Sample Response**:

"Three things:

**1. Cross-client pattern recognition**
I've seen this migration across multiple enterprise clients. I know which parts are smooth and which cause problems. Their engineers are seeing it for the first time - I'm not.

**2. Google-side context**
I can tell them what's coming in the roadmap, what's known issues vs real bugs, and who to escalate to if something goes wrong. Their engineers can't get that context.

**3. Translation layer**
Their CTO speaks business outcomes. Their engineers speak code. Google's docs speak API specs. I translate between all three. When the CTO asks 'Is this risky?', I can give a real answer, not 'it depends.'

But I'm also clear about what I'm NOT: I'm not writing their code. I'm not on-call for their production. My job is to make their engineers more effective at adopting Google products - not to replace them."

**What this demonstrates**: Clear value prop, humility about scope, partnership mindset.
</details>

---

## Key Learnings from This Scenario

1. **API migration is a system design problem** - versioning, backwards compatibility, rollout strategy
2. **Technical depth + stakeholder management are inseparable** - you need both
3. **Structured troubleshooting beats panic** - CLARIFY → ISOLATE → HYPOTHESIZE → VERIFY → RESOLVE
4. **Retrospectives show leadership** - especially when you include self-critique
5. **Your value as SA is translation and pattern recognition** - not replacing engineers

---

## How to Practice This

1. **Read aloud** - Practice speaking the responses, not just reading
2. **Time yourself** - Each turn should be 2-4 minutes max
3. **Record yourself** - Listen back for filler words, unclear explanations
4. **Vary the scenario** - Change the client type (SMB vs Enterprise), the API (GA4, GTM, Ads), the problem

---

*This scenario can flex to answer: system design, troubleshooting, stakeholder management, and Googleyness questions.*
