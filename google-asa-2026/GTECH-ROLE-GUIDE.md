# Google gTech L4 Advertising Solutions Architect - Role Deep Dive

Complements PREP-GUIDE.md with role-specific technical depth.

---

## The Four Evaluation Pillars

Every Google SA interview scores on these four attributes:

| Pillar | What They Evaluate |
|--------|-------------------|
| **Role-Related Knowledge (RRK)** | Google Ads ecosystem, measurement architecture, API patterns, GCP fundamentals |
| **General Cognitive Ability (GCA)** | Breaking down ambiguous problems (e.g., "Country X has high advertiser churn - how would you solve it?") |
| **Leadership** | Emergent leadership - stepping up, mentoring, championing ideas without formal authority |
| **Googleyness** | Comfort with ambiguity, bias to action, collaboration, intellectual curiosity |

**Format**: Phone screen (30-60 min) + 4-5 onsite/virtual rounds (45 min each)

---

## L4 vs L3: The Critical Distinction

**L3**: Works on clearly defined tasks under guidance, executes established practices, limited architectural decisions.

**L4**: Takes ambiguous problems end-to-end with minimal oversight, makes decisions affecting others, demonstrates emerging technical leadership.

### L4 Ownership Language (Use This in STAR Answers)

- "I took ownership of..."
- "I identified the gap and..."
- "I independently drove..."
- "I coordinated across teams..."
- "The impact was [quantified result]..."

**Weak (L3)**: Describes task completion under direction
**Strong (L4)**: Demonstrates initiative, cross-functional coordination, trade-off analysis, quantified outcomes

### L4 System Design Expectations

System design is **not typically required** for L4 SWE but may appear for Ads/Cloud teams. When asked:
- Expect simplified, high-level questions (URL shortener, caching, rate limiting)
- Demonstrate object modeling and service decomposition
- **Not** expected to architect complete distributed systems

---

## The Measurement Stack You Must Know

### GTM Container Architecture

```
Account → Container → Workspace → Version
              │
    ┌─────────┴─────────┐
    │                   │
Web Container      Server Container
(client-side)      (Cloud Run/GCP)
```

**Critical**: Consent initialization trigger must fire BEFORE all other triggers (Consent Mode compliance).

### GA4 Event-Based Data Model

| Concept | Detail |
|---------|--------|
| Schema | Every row = one event (not sessions like UA) |
| BigQuery tables | `events_YYYYMMDD` (daily), `events_intraday_YYYYMMDD` (streaming) |
| Key fields | `event_params` (REPEATED, requires UNNEST), `user_pseudo_id`, `privacy_info.analytics_storage`, `session_traffic_source_last_click` |
| Measurement Protocol | Augments (never replaces) client-side; requires existing `client_id`; events within 72 hours |

### Enhanced Conversions

| Variant | Use Case |
|---------|----------|
| **Enhanced Conversions for Web** | Real-time matching on conversion pages (e-commerce) |
| **Enhanced Conversions for Leads** | Delayed matching via offline import (lead-gen) |

**Implementation**:
- SHA256 hash after normalization (lowercase, trim whitespace, remove periods in gmail.com)
- Minimum PII: email OR (name + address) OR phone + one other
- Validate: Check `em` parameter in network requests to `googleadservices.com/pagead/conversion/`

### Consent Mode v2

Four consent signals:
1. `ad_storage`
2. `analytics_storage`
3. `ad_user_data` (new)
4. `ad_personalization` (new)

| Mode | Behavior |
|------|----------|
| **Basic** | Blocks all tags until consent, no data without consent |
| **Advanced** | Loads tags immediately, sends cookieless pings when denied, enables behavioral modeling |

**Modeling requirements**: 1,000+ events/day with `analytics_storage='denied'` for 7 days + 1,000+ daily users with `analytics_storage='granted'` for 7 of last 28 days.

### Server-Side Tagging Architecture (Whiteboard This)

```
┌─ Client Side ─────────────────────────────────────┐
│  Website → GTM Web Container → First-Party Domain │
│                    (srv.example.com)              │
└───────────────────────────────────────────────────┘
                        │
                        ▼
┌─ Server Side (Cloud Run) ─────────────────────────┐
│  GTM Server Container                             │
│   Clients → Triggers → Tags (GA4, Ads, CAPI, BQ) │
└───────────────────────────────────────────────────┘
```

**Benefits**: Cookie durability (HttpOnly, bypasses ITP/ETP), data control (scrub PII), performance (less client JS).

---

## Meta → Google Translation Table

| Meta Term | Google Equivalent |
|-----------|------------------|
| Pixel ID | GA4 Measurement ID / Conversion ID |
| fbclid | gclid |
| _fbp / _fbc cookies | _ga / _gid / _gcl_aw cookies |
| Event Match Quality | Tag Assistant diagnostics |
| Custom Conversions | Key Events / Conversion Actions |
| Advantage+ campaigns | Performance Max |
| CAPI Gateway | Server-side GTM |
| 7-day click / 1-day view | 30-day click (adjustable to 90) |
| Meta Pixel | Google Tag (gtag.js) + GA4 |
| Conversions API (CAPI) | Enhanced Conversions + server-side GTM |
| Events Manager | GTM + GA4 Admin + Google Ads |
| Aggregated Event Measurement | Consent Mode + Conversion Modeling |

### Attribution Philosophy Difference

- **Meta**: Platform-centric (only sees Meta touchpoints, self-crediting)
- **GA4**: Cross-channel (sees all traffic sources)

Conversions will NEVER match between platforms - this is attribution methodology, not tracking error.

### Interview Talking Points (Leverage Your Meta Experience)

> "I've used GTM to manage both Meta Pixel and GA4 from a unified dataLayer, ensuring consistent conversion values across platforms."

> "My CAPI implementation via server-side GTM directly transfers to Google Enhanced Conversions—same infrastructure, different endpoint tags."

> "I understand why platform-reported conversions differ—it's attribution methodology, not measurement gaps. In Meta I optimized Event Match Quality; in Google I'd focus on Enhanced Conversions data quality and match rates."

---

## Google Merchant Center MCA Hierarchy (If Asked)

```
Multi-Client Account (MCA) - Manager Account
├── Sub-Account (Single-Seller) - High-profile merchants
├── Sub-Account (Single-Seller) - Needs seller-specific attributes
├── Sub-Account (Multi-Seller) - Aggregates smaller sellers (max 40M items)
└── 1P Account (Marketplace-owned) - Only one per MCA
```

Initial limit: 50 sub-accounts per MCA, expandable to 800,000 for marketplaces.

---

## Interview Scoring Rubric

Google uses 1-4 scale across four categories:

| Score | Meaning |
|-------|---------|
| 4 | Well-thought-out solution, time for trade-offs and alternatives |
| 3 | Good solution with minor gaps |
| 2 | Functional but significant issues |
| 1 | Unable to reach working solution |

**Categories scored**: Algorithms, Coding, Communication, Problem-Solving

Hiring committee weighs coding and problem-solving most heavily for L3/L4.

---

## Whiteboard Best Practices

1. Start drawing ~1/3 into interview (after clarifying requirements)
2. Talk through diagrams so interviewer follows reasoning
3. Label everything with technology choices and data types
4. Note trade-offs explicitly (consistency vs availability, SQL vs NoSQL)
5. Leave white space - keep diagrams readable
6. Start high-level context before drilling into components

**C4 Model Levels**: Context → Container → Component → Code

---

## Quick Reference: Your Study Files

| File | Purpose |
|------|---------|
| `PREP-GUIDE.md` | 8-step framework, 5-day schedule, general concepts |
| `GLOSSARY.md` | Technical term definitions |
| `GTECH-ROLE-GUIDE.md` | Role-specific depth, Meta translations, L4 language |
| `PEOPLE-SKILLS.md` | XFN management, "I don't know" framework, story bank |

---

*Your Meta background is an asset - frame it as complementary cross-platform expertise.*
