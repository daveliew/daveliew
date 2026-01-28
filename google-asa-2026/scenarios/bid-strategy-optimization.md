# Practice Scenario: Bid Strategy Optimization

**Type**: Technical + Strategic Advisory
**Difficulty**: Medium
**Time**: 25-35 minutes
**Pillars Tested**: RRK (Google Ads), GCA, Leadership

---

## Context

You're supporting a large e-commerce retailer in SEA. They sell electronics with varying margins:
- High-ticket items (TVs, laptops): High revenue, LOW margin (5-10%)
- Accessories (cables, cases): Low revenue, HIGH margin (40-60%)

Current setup:
- Google Ads campaigns using **Target ROAS** at 400%
- Sending **gross revenue** as conversion value
- Performance looks good on ROAS, but CFO says "We're not making money on Google Ads"

**The problem**: They're hitting ROAS targets but not profit targets. The algorithm is optimizing for revenue, not profitability.

---

## Turn 1

**Interviewer**: "The client's marketing manager says 'Our ROAS is 400% which is great, but Finance says we're barely breaking even. What's going on?'"

**Your Response**: _(Practice out loud, then reveal)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is a diagnostic question. Show you understand the gap between revenue optimization and profit optimization.

**Sample Response**:
"This is a classic symptom of optimizing for the wrong metric. Let me explain what's likely happening:

**The diagnosis**:
Target ROAS optimizes for revenue, not profit. If you're sending gross revenue as your conversion value, Google's algorithm will chase high-revenue sales regardless of margin.

**Example**:
- Customer A buys a $1000 TV with 5% margin = $50 profit
- Customer B buys $100 in accessories with 50% margin = $50 profit
- Same profit, but Google sees $1000 vs $100 and heavily prefers Customer A

**The math that's hurting them**:
- 400% ROAS on a 10% margin product = 40% of revenue is ad cost
- If margin is only 10%, they're losing money on every sale
- 400% ROAS on a 50% margin product = profitable

**My hypothesis**:
The algorithm is filling their ROAS target with low-margin, high-revenue products. Finance sees the real picture - ad costs are eating the thin margins."

**What this demonstrates**: Understanding of ROAS mechanics, margin economics, algorithm behavior.
</details>

---

## Turn 2

**Interviewer**: "Good diagnosis. The client asks: 'So what do we do? Should we stop advertising high-ticket items?'"

**Your Response**: _(Present options, not just one answer)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: Don't give a binary answer. Present options with trade-offs.

**Sample Response**:
"Stopping high-ticket items is one option, but let me give you three approaches:

**Option 1: Campaign segmentation by margin tier**
- Separate campaigns for high-margin vs low-margin products
- Set different ROAS targets based on margin (low margin = higher ROAS target)
- Pro: Quick to implement
- Con: Doesn't solve the fundamental problem, just manages around it

**Option 2: Profit-based bidding (recommended)**
- Send profit (not revenue) as your conversion value
- Google optimizes for profit directly
- Pro: Algorithm now aligned with business goal
- Con: Requires passing margin data at transaction level

**Option 3: Raise ROAS target for low-margin products**
- If 10% margin, you need 1000% ROAS to break even (excluding other costs)
- This effectively de-prioritizes low-margin products
- Pro: No technical changes
- Con: May lose volume on high-ticket items entirely

**My recommendation**: Option 2 - profit-based bidding. It's the structural fix. The algorithm should optimize for what you actually care about: profit, not revenue."

**What this demonstrates**: Multiple solutions, trade-off analysis, clear recommendation.
</details>

---

## Turn 3

**Interviewer**: "Let's go with profit-based bidding. Walk me through how we'd implement this."

**Your Response**: _(Technical implementation walkthrough)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: Show you understand the data flow required for profit-based bidding.

**Sample Response**:
"For profit-based bidding, we need to change what value we send with each conversion. Here's the implementation:

**Current state**:
```
Conversion event: purchase
Value sent: order_total (gross revenue)
Example: $1000
```

**Target state**:
```
Conversion event: purchase
Value sent: order_profit (revenue minus COGS)
Example: $50 (if margin is 5%)
```

**Implementation steps**:

1. **Data layer update**
   - Engineering needs to calculate profit at checkout
   - Profit = order_total - sum(item_COGS)
   - Push to dataLayer: `{ 'profit': 50.00 }`

2. **GTM configuration**
   - Update the Google Ads conversion tag
   - Change conversion value from `{{order_total}}` to `{{order_profit}}`

3. **Validation**
   - Use GTM Preview to verify correct value is sent
   - Check Google Ads conversion tracking for realistic profit values
   - Flag if values seem off (e.g., negative profit, unusually high)

4. **Ramp-up period**
   - Don't change ROAS target immediately
   - Let the algorithm learn with new profit signals (1-2 weeks)
   - Then adjust Target ROAS based on profit, not revenue

**Key consideration**:
COGS data is usually in the backend (ERP, inventory system). Engineering needs to surface this at checkout time. This is often the hardest part."

**What this demonstrates**: Technical depth, understanding of data flow, practical implementation steps.
</details>

---

## Turn 4

**Interviewer**: "The CFO pushes back: 'I don't want to share our margin data with Google. Is that safe?'"

**Your Response**: _(Address privacy/business concern)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is a stakeholder concern, not a technical question. Address the concern directly.

**Sample Response**:
"Completely valid concern. Let me address it directly:

**What Google actually sees**:
- A conversion value number (e.g., $50)
- Google does NOT see: 'This is 5% margin on a $1000 sale'
- They see: 'This conversion is worth $50 to this advertiser'

**You're not sharing**:
- Your cost structure
- Your supplier pricing
- Your margin percentages
- Individual product profitability

**What competitors could infer**: Nothing. They can't see your conversion values.

**Options if still uncomfortable**:

1. **Indexed values** (obfuscation)
   - Instead of sending actual profit ($50), send an index (e.g., 500)
   - As long as relative values are correct, algorithm still works
   - $50 profit = 500 index, $30 profit = 300 index

2. **Margin tiers instead of exact profit**
   - High margin products = value of 3
   - Medium margin = value of 2
   - Low margin = value of 1
   - Less precise but no actual financials shared

**My recommendation**:
The indexed approach gives you full optimization benefit without sharing actual dollar figures. It's a common practice for exactly this concern."

**What this demonstrates**: Addresses business concern, offers alternatives, doesn't dismiss the worry.
</details>

---

## Turn 5

**Interviewer**: "After implementing profit-based bidding, their ROAS drops from 400% to 150%. The marketing manager panics. How do you respond?"

**Your Response**: _(Expectation management, reframe metrics)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is expected! ROAS will drop because you're measuring differently now. Reframe the metric.

**Sample Response**:
"This is completely expected - and actually good news. Let me explain:

**Why ROAS dropped**:
- Before: 400% ROAS on REVENUE ($1000 sale, $250 ad cost = 400%)
- After: 150% ROAS on PROFIT ($50 profit, $33 ad cost = 150%)
- The MATH changed, not the performance

**The reframe**:
- Old metric: Revenue ROAS of 400% (sounds great, but unprofitable)
- New metric: Profit ROAS of 150% (sounds worse, but actually profitable)

**What to look at now**:

| Old Metric | New Metric |
|------------|------------|
| Revenue ROAS | Profit ROAS |
| Total revenue | Total profit |
| CPA | Cost per profit dollar (CPP) |

**The real question**:
'Is 150% profit ROAS good?'

Let's calculate:
- Spending $1 to get $1.50 in profit = 50 cents profit per dollar spent
- That's a 50% return on ad spend IN ACTUAL PROFIT
- Most businesses would take that all day

**Action**:
Create a new dashboard showing profit metrics alongside revenue metrics. Finance will love this - it speaks their language."

**What this demonstrates**: Anticipates the panic, reframes correctly, provides new metrics framework.
</details>

---

## Turn 6 (Wrap-up)

**Interviewer**: "What's the one thing they should monitor going forward to ensure profit-based bidding is working?"

**Your Response**: _(Synthesis)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: ONE metric, with clear rationale.

**Sample Response**:
"**One metric: Blended Contribution Margin on Google Ads traffic.**

Here's why:

Contribution margin = (Revenue - COGS - Ad Cost) / Revenue

This tells you: 'For every dollar of revenue from Google Ads, how much actually drops to the bottom line?'

Before profit-based bidding, this was probably near zero or negative.
After, it should be positive and stable.

If contribution margin is:
- Increasing → algorithm is learning, keep going
- Stable and positive → you've won
- Declining → investigate (COGS changes? Competition? Data issues?)

This is the metric the CFO actually cares about. ROAS is a proxy - contribution margin is the truth."

**What this demonstrates**: Financial fluency, connects to business outcomes, gives clear monitoring framework.
</details>

---

## Visual: Algorithm Behavior (TV vs Accessories)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 SAME $50 PROFIT, BUT GOOGLE SEES...                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   📺 $1000 TV (5% margin)          🔌 $100 Accessories (50% margin)        │
│   ─────────────────────            ────────────────────────────            │
│   Profit: $50                      Profit: $50                              │
│                                                                              │
│   Google sees: $1000 value         Google sees: $100 value                 │
│   Algorithm: LOVES THIS ✓          Algorithm: Ignores this ✗               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                        AT 400% ROAS TARGET:                                  │
│                                                                              │
│   TV: Spend $250 → Get $1000 revenue                                        │
│        $50 profit - $250 ad cost = -$200 LOSS                              │
│                                                                              │
│   Accessories: Spend $25 → Get $100 revenue                                 │
│        $50 profit - $25 ad cost = +$25 GAIN                                │
│                                                                              │
│   The algorithm fills your budget with TVs because they LOOK 10x better    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Visual: Privacy Options Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PRIVACY OPTIONS FOR PROFIT-BASED BIDDING               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   OPTION 1: Actual Profit          OPTION 2: Indexed Values (x10)          │
│   ─────────────────────            ───────────────────────────             │
│   Product A: $50                   Product A: 500                           │
│   Product B: $25                   Product B: 250                           │
│   Product C: $100                  Product C: 1000                          │
│                                                                              │
│   ✓ Full precision                 ✓ Full precision                        │
│   ✗ CFO sees real $                ✓ No real dollars exposed               │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   OPTION 3: Margin Tiers           │  HOW TIERS WORK                       │
│   ─────────────────────            │  ──────────────                       │
│   High margin (>40%):  3           │  Algorithm bids 3x harder for         │
│   Medium (20-40%):     2           │  "3" products vs "1" products         │
│   Low margin (<20%):   1           │                                        │
│                                    │  Like a bid adjustment multiplier,    │
│   ✓ No financials shared           │  but on conversion VALUE              │
│   ✗ Less precision                 │                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Learnings from This Scenario

1. **ROAS ≠ Profitability** - High ROAS on low-margin products can lose money
2. **Profit-based bidding** = sending profit as conversion value (subset of value-based)
3. **Algorithm aligns with the signal you give it** - give it revenue, it optimizes for revenue
4. **ROAS will drop when switching to profit values** - this is expected and good
5. **Indexed values** can protect sensitive margin data while still enabling optimization
6. **Margin tiers** (1, 2, 3) work like bid multipliers - less precise but no financials shared
7. **Contribution margin** is the true north metric, not ROAS

---

## Quick Reference: Bidding Strategy Cheat Sheet

| Strategy | Optimizes For | Good When |
|----------|--------------|-----------|
| Max Clicks | Traffic volume | Brand awareness, top of funnel |
| Max Conversions | Conversion count | All conversions equal value |
| Target CPA | Conv at target cost | Fixed value per conversion |
| Max Conv Value | Total value | Variable transaction values |
| Target ROAS | Value at target return | Need efficiency + scale |
| **Profit Bidding** | Total profit | Variable margins across products |

---

## Formula Reference

```
ROAS = Revenue / Ad Spend × 100%
Example: $4000 revenue / $1000 spend = 400% ROAS

Profit ROAS = Profit / Ad Spend × 100%
Example: $500 profit / $1000 spend = 50% Profit ROAS

Contribution Margin = (Revenue - COGS - Ad Cost) / Revenue
Example: ($4000 - $3600 - $1000) / $4000 = -15% (losing money!)

Break-even ROAS = 1 / Margin %
Example: 10% margin → need 1000% ROAS to break even
Example: 50% margin → need 200% ROAS to break even
```

---

*This scenario demonstrates both technical implementation AND strategic business thinking.*
