# Practice Session: Merchant API Migration Drill

**Date**: 2026-01-24
**Scenario**: Enterprise Content API → Merchant API Migration
**Focus**: System Design + Stakeholder Management

---

## Migration Gap Analysis Matrix (Example)

This is the matrix you'd present in Phase 2 of your approach:

### Content API → Merchant API Breaking Changes

| Change Area | Content API (Current) | Merchant API (New) | Client Usage | Migration Effort | Risk |
|-------------|----------------------|-------------------|--------------|------------------|------|
| **Product IDs** | `online:lang:targetCountry:offerId` | `online:lang:feedLabel:offerId` | All 50K SKUs | Medium | High - breaks existing references |
| **Custom Attributes** | `type`, `unit` fields + `customGroups` | Recursive `customAttributes`, units in value string | Heavy - market-specific data | **High** | High - middleware rewrite |
| **Batch Methods** | HTTP BATCH supported | `customBatch` only | 2M calls/day | Medium | Medium - call pattern change |
| **Inventory Service** | `inventory` service | `localInventory` + new patterns | Real-time updates | Medium | Medium - restructure needed |
| **Supplemental Feeds** | Separate feed type | Integrated pattern | Used for inventory | Low | Low - similar concept |
| **Price Format** | Allowed commas in value | Only `+`, `-`, `.`, digits | All products | Low | Low - validation change |
| **Destinations** | `destinations` field | `includedDestinations` + `excludedDestinations` | Per-market targeting | Low | Low - field rename |

### Effort Legend

| Level | Definition | Typical Eng Time |
|-------|------------|------------------|
| **Low** | Config/field rename, no logic change | < 1 day |
| **Medium** | Code change required, well-scoped | 2-5 days |
| **High** | Middleware rewrite, testing across markets | 1-2 weeks |

### Risk Legend

| Level | Definition | Mitigation |
|-------|------------|------------|
| **Low** | Unlikely to cause production issues | Standard testing |
| **Medium** | Could cause issues if not tested | Staged rollout |
| **High** | Production impact likely without careful migration | Shadow traffic + market-by-market |

---

## Visual: Migration Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MIGRATION TIMELINE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PHASE 1: DISCOVERY          PHASE 2: GAP ANALYSIS                  │
│  ┌──────────────────┐        ┌──────────────────┐                   │
│  │ • API usage logs │        │ • Breaking changes│                  │
│  │ • Middleware map │   ──►  │ • Effort matrix   │                  │
│  │ • Multi-market   │        │ • Risk assessment │                  │
│  │   specifics      │        │ • Priority ranking│                  │
│  └──────────────────┘        └──────────────────┘                   │
│         Week 1                    Week 2                             │
│                                                                      │
│  PHASE 3: MIGRATION PLAN     PHASE 4: EXECUTION                     │
│  ┌──────────────────┐        ┌──────────────────┐                   │
│  │ • Parallel setup │        │ • Shadow traffic │                   │
│  │ • Test bed scope │   ──►  │ • Market rollout │                   │
│  │ • Rollback plan  │        │ • VN→PH→TH→MY→SG→ID                 │
│  │ • Success metrics│        │ • Kill switch    │                   │
│  └──────────────────┘        └──────────────────┘                   │
│         Week 3                    Weeks 4-8                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Visual: Multi-Seller Account Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MCA (Multi-Client Account)                        │
│                    Platform-Level Manager                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │ Sub-Account │  │ Sub-Account │  │ Sub-Account │                  │
│  │ SINGAPORE   │  │ MALAYSIA    │  │ THAILAND    │   ... x6        │
│  │             │  │             │  │             │                  │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                  │
│  │ │Single-  │ │  │ │Single-  │ │  │ │Single-  │ │                  │
│  │ │Seller   │ │  │ │Seller   │ │  │ │Seller   │ │  Top Merchants  │
│  │ │(Top 50) │ │  │ │(Top 50) │ │  │ │(Top 50) │ │                  │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                  │
│  │             │  │             │  │             │                  │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                  │
│  │ │Multi-   │ │  │ │Multi-   │ │  │ │Multi-   │ │                  │
│  │ │Seller   │ │  │ │Seller   │ │  │ │Seller   │ │  Long-tail      │
│  │ │(5000+)  │ │  │ │(5000+)  │ │  │ │(5000+)  │ │  Aggregated     │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
│                                                                      │
│  Migration Order: VN (lowest) ──► ID (highest volume)               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Practice Session Transcript

### Turn 1: Stakeholder Pushback

**Interviewer**: "The client's CTO just messaged saying their engineering team is 'too busy with Q1 launches' to prioritize this migration. They want to know if they can just wait until closer to the deadline. How would you handle this?"

**My Response**:
> I would need to ask some clarifying questions:
> 1. Study the delta in API routes to see what is the impact sizing
> 2. 2M API calls is a lot! I would recommend we scope out top SKUs as a test bed for API shift
> 3. As a Google SA, perhaps we can help find a quick win suggestion for them

**Coaching Feedback**:
- ✓ Good: Impact sizing first, test bed thinking, quick win mindset
- △ Improve: Address their concern first (empathy), quantify the risk (business impact), offer to take on work yourself

**Stronger Pattern**:
1. **Empathize** → "I hear your concern"
2. **Reframe** → "Here's the real risk"
3. **Offer action** → "Here's what I'll do to help"
4. **Close with value** → "This protects you from X"

---

### Turn 2: Migration Planning (System Design)

**Interviewer**: "Walk me through how you'd assess their Content API implementation and plan the migration to Merchant API."

**My Response**:
> 1. I would want a lay of the land - do they use some kind of internal db? Do different teams manage it? How do different countries manage?
> 2. I would want to know if they have Multi-Seller Account constraints too - is this a many:1, many:many type problem
> 3. I would ask interviewer if I can scope this down to a 1:1 API first, then a many:1 extension, then many:many bonus if there is time
> 4. I would assume signals are purely from the web surface for now (so I can ring-fence against tech knowledge and focus on web tech showcase)

**Coaching Feedback**:
- ✓ Good: Clarifying before diving in, org complexity awareness, scoping request (smart interview move), playing to strengths
- △ Improve: After clarifying, deliver the actual plan. Show structured phases. Demonstrate Google product knowledge.

**Key Learning**: Clarify fast (30 sec), then deliver your structured approach (3 min)

**Stronger Pattern**:
> "I'll state my assumptions, then walk through my approach. Stop me if you want me to go deeper on anything."
>
> "I'd break this into three phases: **Discovery**, **Gap Analysis**, **Migration Plan**..."

---

### Turn 3: Technical Deep Dive

**Interviewer**: "You mentioned the custom attributes format change is 'High' impact. Can you go deeper on that? What specifically changes and why is it risky?"

**My Response**:
> I'm fuzzy - I know that custom attributes probably signal a more niche/narrow data shape than non-custom so that's the track I want to go deeper. Metadata impact might be high e.g. loyalty pricing.

**Coaching Feedback**:
- ✓ Good: Honest about knowledge gap, connects custom attributes to business impact (loyalty pricing)
- △ Improve: Use the "I don't know" pivot framework

**The Pivot Framework**:
```
1. ACKNOWLEDGE → "I haven't implemented this specific change, but..."
2. CONNECT     → "...it sounds similar to X which I have done..."
3. APPROACH    → "...my first step would be to..."
4. CURIOSITY   → "...I'd want to understand Y before committing"
```

**Key Technical Details (Reference)**:
| Content API | Merchant API |
|-------------|--------------|
| `type`, `unit` as separate fields | Removed - units appended to value |
| `customGroups` container | Recursive `customAttributes` with `groupValues` |

---

### Turn 4: Production Incident

**Interviewer**: "The client's eng team messages you at 9am: 'We pushed to production last night and now 30% of our products are disapproved in Merchant Center. Help!' What do you do?"

**My Response**:
> 1. Let's try to find patterns in the disapproval - known issues like image overlays, image background colors
> 2. Perhaps it's some lack of content, or messy product titles
> 3. Is client able to isolate via the API log which accounts they were from? Or product category?

**Coaching Feedback**:
- ✓ Good: Pattern-finding instinct, data-driven (API logs), segmentation thinking
- △ Improve: The timing is the clue! "Pushed last night → disapproved today" = migration caused this, not generic product quality issues

**Key Learning**: When timing is obvious, name it.
- Image overlays/messy titles = would have been disapproved BEFORE the push
- First question should be: "What disapproval reason is Merchant Center showing?"
- Hypothesis should start migration-related: feedLabel, custom attributes, price format

**Framework**: CLARIFY → ISOLATE → HYPOTHESIZE → VERIFY → RESOLVE

---

### Turn 5: Retrospective

**Interviewer**: "The issue was feedLabel format. You helped them fix it. Now the CTO asks: 'What should we have done differently to prevent this?'"

**My Response**:
> 1. What was the testing methodology? Did we do a pre/post?
> 2. Did we do sampling e.g. 5% of all SKUs?
> 3. Based on #2, did we also cherry pick the best selling ones - helps contain commercial risks beyond technical risks
> 4. I should have created a migration guide preemptively

**Coaching Feedback**:
- ✓ Good: Process thinking, sampling approach, **commercial risk lens** (best sellers = business impact), **self-critique** included
- △ Improve: Flip questions → recommendations, make self-critique more specific

**Key Learning**: Include yourself in the critique.
- "I should have pushed harder" = ownership
- "They should have tested better" = blame

**Stronger self-critique**: "I knew feedLabel was a breaking change. I raised it, but didn't push hard enough when timeline pressure came up. That's on me."

---

### Turn 6: Wrap-up

**Interviewer**: "Last question - why should this client trust you as their SA? You're not an engineer on their team. What value do you actually bring?"

**My Response**:
> 1. I am a hub to all the various Google POC nodes - leave to me to navigate and bring them to the right place
> 2. I work closely with sales so I pair the CBO and commercial risks with technical and operational execution
> 3. I am always learning to improve the process
> 4. Given I'm on the forefront of bigger clients, I can be exposed to cutting edge tech + best practices

**Coaching Feedback**:
- ✓ Good: "Hub" connector value, **commercial + technical bridge** (this is your differentiator!), pattern recognition from big clients
- △ Improve: Rule of 3 (more memorable), add "what I'm NOT", make "always learning" concrete

**Key Learning**: Confidence + Humility = Trust
- Confident: "Here's the value I bring"
- Humble: "Here's what I'm NOT - I'm not writing their code, not on-call for production"

---

## Overall Drill Feedback

### Your Strengths (Lean Into These)

| Strength | Evidence | Interview Signal |
|----------|----------|------------------|
| **Commercial + Technical Bridge** | "Cherry pick best sellers to contain commercial risk" | Rare - most SAs only talk tech |
| **Scoping Instinct** | "Can I scope to 1:1 first, then extend?" | Smart interview move |
| **Self-Critique** | "I should have created a migration guide" | Googleyness - ownership |
| **Data-Driven** | "Isolate via API log" | Not guessing, investigating |
| **Hub/Connector Mindset** | "I navigate Google POCs for them" | Clear role understanding |

### Areas to Sharpen

| Area | What Happened | Fix |
|------|---------------|-----|
| **Empathy First** | Jumped to solutions in Turn 1 | "I hear you..." before redirecting |
| **Timing = Causality** | Went to generic issues in Turn 4 | "Just pushed → just broke" = migration caused it |
| **Questions → Recommendations** | Framed as "did we...?" | Flip to "we should have..." |
| **Technical Depth** | Fuzzy on custom attributes | Use pivot framework, then study specifics |
| **Concise Delivery** | 4 points when 3 is stronger | Rule of 3 for memorable closes |

### Your Interview Persona

Based on this drill, your natural style is:

> **"The Business-Minded Technical Partner"**
> - Pairs commercial risk with technical execution
> - Asks good scoping questions
> - Takes ownership (self-critique)
> - Navigates complexity via segmentation

This is a **strong SA profile**. The coaching is about sharpening delivery, not changing who you are.

---

## Key Takeaways (Complete)

1. **Empathize before expertise** - Acknowledge stakeholder concerns before redirecting
2. **Clarify fast, then deliver** - Don't spend all your time asking questions
3. **State assumptions explicitly** - "For this mock, let me assume..."
4. **Use visual frameworks** - Matrices, phases, diagrams show structured thinking
5. **Scope the problem** - "Can I start with X, then extend to Y?" is a smart interview move
6. **Timing = Causality** - "Just did X → Just broke" means X caused it
7. **Include yourself in retrospectives** - "I should have pushed harder" = ownership
8. **Confidence + Humility** - Say what you bring AND what you're not
9. **Rule of 3** - Three points land better than four
10. **Pivot when fuzzy** - Acknowledge → Connect → Approach → Curiosity

---

---

## Bonus Turn: Test Strategy Design (Gmail E2E)

**Interviewer**: "How would you design end-to-end integration, load/performance, and security tests for a real-world system like Gmail?"

**My Clarifying Questions**:
> 1. Is there a priority of the three topics - e2e, load/performance, security?
> 2. Is the end user consumer or enterprise?
> 3. Is there a deadline to meet?

**My Approach**:
> Consumer needs: speed, trust (data security + consistent functionality), value (free vs paid)
>
> Proposed e2e use case: compose → send → receive → reply
>
> Scope: single country, user-to-user (not groups)
>
> Trade-off: broad/macro (multiple users, general) vs deep dive (1:1 interaction)

**My Test Design**:
> Test case matrix:
> - Compose: user launches new email, adds params (title, body, address)
> - Send: CTA invokes send, API generates POST to server
> - Receive: data not mutated, timestamp confirmation
> - Reply: idempotent in 1:1 setting
>
> Infrastructure: 3 phases - API routes first, then client-API-server integration, then full e2e sample email
>
> Failure modes: chronology via timestamps, diff check on strings, deliberate wrong email for expected failure

**Coaching Feedback**:
- ✓ Good: Clarifying questions, scoping instinct, 3-phase layered approach, negative testing, honest about gaps
- △ Improve: Label assertions explicitly, mention test data/cleanup, sharpen "idempotent" usage

**Key Learning**: Assertions = the specific checks you make (response code 200, body matches, timestamp within SLA). Also mention test accounts + cleanup for production credibility.

---

## Future Scenarios to Create

- [x] **Web-to-App Bridging** - Created and drilled! See `scenarios/web-to-app-bridging.md`

---

## Web-to-App Bridging Drill

### Turn 1: Investigating Attribution Gap

**Interviewer**: "The marketing lead says their app install campaigns show low conversion rates, but anecdotally they hear users saying 'I found you on Google.' Where would you start?"

**My Clarifying Questions**:
> 1. iOS or Android? % split?
> 2. Are they using MMP and does that show different data?
> 3. What sort of app install campaign?
> 4. What's their conversion event?

**Coaching Feedback**:
- ✓ Good: iOS vs Android is smart (ATT changes everything), MMP as comparison source, campaign type matters
- △ Improve: Also ask "Is Firebase linked to Google Ads?" - often the first thing broken

### Turn 2: Firebase → Google Ads Integration

**Interviewer**: "gclid IS reaching Firebase on Android, but Google Ads isn't showing conversions. What's happening?"

**My Response**:
> Check docs for syntax/implementation, but theoretically: check campaign_id passed, Firebase ↔ Ads link working (user permissions, API permissions), attribution settings align.

**Coaching Feedback**:
- ✓ Good: Correct area (Firebase ↔ Ads link), honest about needing docs
- △ Improve: The pipeline is LINK → MARK (Key Events) → IMPORT (Conversion Actions). Not "campaign_id" - gclid is what matters.

**Key Learning**: Firebase → Google Ads pipeline:
```
1. LINK      Firebase project ↔ Google Ads account
2. MARK      Events as "Key Events" in GA4/Firebase
3. IMPORT    Conversion actions in Google Ads
```

### Turn 3: Deferred Deep Linking

**Interviewer**: "How does a user click Shopping Ad, install app, and land on specific product page (not home)?"

**My Questions**:
> Asked for ASCII diagram to understand the flow. Clarified that Firebase Dynamic Links isn't the only solution - AppsFlyer OneLink, Branch also do deferred deep linking.

**Coaching Feedback**:
- ✓ Good: Understood that deferred deep linking is a concept, not a single product
- ✓ Good: Connected to client's existing AppsFlyer setup

### Turn 4: Measurement Architecture

**Interviewer**: "We want ONE dashboard showing ROAS across web and app. How?"

**My Response**:
> Client's own SOT via inhouse BI is best. Minimize discrepancy, 1P data is key, ATT disruption is real.

**Coaching Feedback**:
- ✓ Good: Instincts correct (BigQuery unification, 1P data, industry trends)
- △ Improve: Structure as OPTIONS → TRADE-OFFS → RECOMMENDATION → EXPECTATION

**Key Learning**: Three options for unified reporting:
1. GA4 as hub (native but numbers won't match Google Ads)
2. BigQuery unification (full control, engineering effort)
3. Keep separate SOTs, blend in dashboard (pragmatic but manual)

### Turn 5: Stakeholder Pushback

**Interviewer**: "Why can't we just trust Google Ads numbers? This sounds expensive."

**My Response**:
> Explained gTech partnership, PSPs, JTP, profit-bidding, listed discrepancy drivers (DDA, EVC vs CTC), mentioned OCI for alignment.

**Coaching Feedback**:
- ✓ Good: Strong domain knowledge (DDA, EVC, CTC, OCI, tROAS)
- △ Improve: Too much jargon for frustrated stakeholder. Pattern: EMPATHIZE → SIMPLIFY → REFRAME → OFFER PATH

**Key Learning**: When stakeholder is frustrated:
- Empathize first ("I hear you")
- Simplify (no acronyms)
- Reframe cost as investment
- Offer ONE clear next step

### Turn 6: Synthesis

**Interviewer**: "One piece of advice to improve their web-to-app measurement?"

**My Response**:
> Verify Firebase-Google Ads link is working first.

**Coaching Feedback**:
- ✓ Nailed it: Concise, foundational, first-principles thinking

---

## W2A Drill Key Takeaways

1. **iOS vs Android** = fundamentally different attribution realities (ATT)
2. **Firebase → Google Ads pipeline**: LINK → MARK → IMPORT
3. **Deferred deep linking** = concept (Firebase, AppsFlyer, Branch all do it)
4. **"One number" doesn't exist** - help clients choose trade-offs
5. **Empathize → Simplify → Reframe → Offer path** for frustrated stakeholders
6. **Synthesis**: ONE answer with conviction, no hedging

---

*Session continues...*
