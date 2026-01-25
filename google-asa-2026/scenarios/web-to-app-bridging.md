# Practice Scenario: Web-to-App Bridging & Attribution

**Type**: Web Tech + Measurement Architecture
**Difficulty**: Medium-Hard
**Time**: 30-40 minutes
**Pillars Tested**: RRK (Web Tech), GCA, Leadership

---

## Context

You're supporting a major SEA e-commerce marketplace. Their user journey is complex:

- **Discovery**: Users find products via Google Shopping Ads → land on mobile web (msite)
- **Conversion goal**: Get users to install the app (better retention, higher LTV)
- **Purchase**: 60% of purchases happen in-app, but attribution is broken

Current setup:
- Mobile web (msite) with GTM + GA4
- Native apps (iOS/Android) with Firebase Analytics
- Google Ads campaigns driving traffic to msite
- Deferred deep links via Firebase Dynamic Links
- Shopping Ads linking to product pages

**The problem**: Marketing team says "We can't tell which ad campaigns are driving app installs and in-app purchases. Our ROAS looks terrible but we think it's a measurement gap, not real performance."

---

## Turn 1

**Interviewer**: "The marketing lead says their app install campaigns show low conversion rates, but anecdotally they hear users saying 'I found you on Google.' Where would you start investigating?"

**Your Response**: _(Practice out loud, then reveal)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is a troubleshooting question. Use CLARIFY → ISOLATE → HYPOTHESIZE. Don't jump to solutions.

**Sample Response**:
"Before diving in, I need to understand the measurement setup:

**CLARIFY**:
- 'What attribution window are you using for app installs?' (7-day? 30-day?)
- 'Are you using Firebase Dynamic Links for deferred deep linking?'
- 'Is the Firebase SDK properly passing the gclid to the app?'
- 'Are app events being imported back to Google Ads for conversion tracking?'

**ISOLATE**:
The gap is likely in one of three places:
1. **Web → App handoff** - gclid not persisting through the install flow
2. **App-side tracking** - Firebase not capturing the attribution data
3. **Google Ads import** - App conversions not flowing back to the ad platform

**My first check**:
I'd walk through a test conversion myself:
- Click a Shopping Ad with ?gclid=test123
- Land on msite, click 'Get the App'
- Install, open app
- Check Firebase DebugView: Is the gclid present?

If gclid isn't in Firebase, the break is in the handoff. If it is, the break is in the import to Google Ads."

**What this demonstrates**: Structured troubleshooting, knowledge of the attribution chain, hands-on debugging approach.
</details>

---

## Turn 2

**Interviewer**: "Good instinct. You tested it and found the gclid IS reaching Firebase, but Google Ads isn't showing the conversions. What's happening?"

**Your Response**: _(Dig into the Google Ads ↔ Firebase integration)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: Now you're isolating to the Firebase → Google Ads connection. Show you know how this integration works.

**Sample Response**:
"If gclid is in Firebase but conversions aren't in Google Ads, the issue is in the **conversion import pipeline**. Let me check:

**Possible causes**:

1. **Firebase-Google Ads linking not configured**
   - In Firebase: Settings → Integrations → Google Ads
   - Need to link the Firebase project to the Google Ads account

2. **Conversion events not marked for export**
   - In GA4/Firebase: specific events need to be marked as 'Key Events'
   - Then in Google Ads: import those as conversion actions

3. **Attribution window mismatch**
   - Firebase might be using 30-day attribution
   - Google Ads might be set to 7-day
   - Conversions outside the Google Ads window won't show

4. **App campaign vs Shopping campaign attribution**
   - If user clicked a Shopping Ad (web) but installed via app store, Google Ads might attribute to organic
   - Need Web-to-App Connect or proper deferred deep link attribution

**My next step**:
Check Google Ads → Tools → Conversions → see if app install/purchase events are listed. If not, the Firebase-Google Ads link isn't set up. If yes but showing zero, check the attribution window settings."

**What this demonstrates**: Deep knowledge of Firebase-Google Ads integration, systematic debugging, specific next steps.
</details>

---

## Turn 3

**Interviewer**: "The client asks: 'We want users who click Shopping Ads to land on msite, but if they don't have our app, we want to prompt them to install. If they do install, we want them to land on the same product in-app, not the app home screen. How does that work?'"

**Your Response**: _(Explain deferred deep linking architecture)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is asking you to explain deferred deep linking. Whiteboard-worthy - draw it if you can.

**Sample Response**:
"This is exactly what **deferred deep linking** solves. Let me walk through the flow:

```
User clicks Shopping Ad (gclid=abc123)
        ↓
Lands on msite product page (/product/shoe-123)
        ↓
Sees 'Open in App' or 'Get the App' banner
        ↓
[If app installed] → App opens directly to shoe-123
[If app NOT installed] → Goes to App Store
        ↓
User installs app, opens for first time
        ↓
Firebase Dynamic Link 'defers' the deep link
        ↓
App opens to shoe-123 (not home screen)
        + gclid=abc123 is passed for attribution
```

**How to implement**:

1. **Create Firebase Dynamic Link** for each product page
   - Long URL: `https://yourapp.page.link/?link=https://msite.com/product/shoe-123&apn=com.yourapp&ibi=com.yourapp&gclid=abc123`

2. **On msite**: When user taps 'Get App', redirect to this Dynamic Link

3. **In app code**: On first launch, Firebase SDK checks for deferred deep link and navigates to the product

4. **For attribution**: The gclid parameter persists through the entire flow

**Key gotcha**:
On iOS, this requires the App Store to pass data through, which is increasingly restricted. Firebase uses fingerprinting as a fallback, but it's probabilistic, not deterministic. This is why some attribution is 'lost.'"

**What this demonstrates**: Can explain complex flow simply, knows implementation details, aware of platform limitations.
</details>

---

## Turn 4

**Interviewer**: "The client now asks: 'We want ONE dashboard that shows ROAS across web and app. How do we get a single source of truth?'"

**Your Response**: _(Measurement architecture design)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is a measurement architecture question. Show you understand the trade-offs.

**Sample Response**:
"This is the holy grail question - everyone wants it, and it's genuinely hard. Let me give you options with trade-offs:

**Option 1: GA4 as the hub**
- Use GA4 for both web (gtag.js) and app (Firebase SDK)
- Cross-platform reporting in GA4
- Import conversions to Google Ads from GA4
- **Pro**: Native integration, single property
- **Con**: GA4's attribution is cross-channel, Google Ads is platform-centric. Numbers won't match.

**Option 2: BigQuery unification**
- Export GA4 web data to BigQuery
- Export Firebase app data to BigQuery
- Build custom attribution model joining on user_pseudo_id
- **Pro**: Full control, custom logic
- **Con**: Engineering effort, need to maintain

**Option 3: Third-party MMP (AppsFlyer, Adjust, Branch)**
- Use MMP as the source of truth for app attribution
- MMP handles deferred deep links AND attribution
- Import MMP data to Google Ads
- **Pro**: Purpose-built for this problem, handles iOS SKAdNetwork
- **Con**: Additional cost, another vendor

**My recommendation**:
For a marketplace at this scale, I'd lean toward **Option 3** for app attribution (MMP handles the hard parts) + **GA4 for web analytics** + **BigQuery for unified reporting**.

The key mindset shift: There's no 'one number' that's 100% accurate. You're choosing which trade-offs to accept.

**For the client**:
'Let's define what decisions you need to make with this data. That tells us which measurement approach fits your needs.'"

**What this demonstrates**: Knows multiple solutions, trade-off analysis, practical recommendation, manages expectations.
</details>

---

## Turn 5

**Interviewer**: "The marketing lead pushes back: 'All this sounds expensive and complicated. Why can't we just trust the numbers in Google Ads?' How do you respond?"

**Your Response**: _(Stakeholder management + education)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is a stakeholder management question disguised as technical. Empathize first, then educate.

**Sample Response**:
"That's a fair pushback - let me explain why the numbers don't just 'work':

**Empathize first**:
'I get it. You want to log into Google Ads and see accurate ROAS. That's reasonable. Let me explain why it's not that simple for app conversions.'

**Educate (simply)**:
'When someone clicks your ad on web and buys on web, Google Ads sees the whole journey. Easy.

When someone clicks your ad on web, installs your app, and buys in-app - Google Ads only saw the click. It's waiting for someone to tell it about the purchase.

That 'someone' is Firebase. But Firebase needs to be configured to talk to Google Ads. And even then, iOS privacy changes mean some connections are broken by design.'

**Reframe the cost**:
'The question isn't 'is this expensive?' It's 'what's the cost of NOT measuring correctly?'

Right now, you might be:
- Cutting campaigns that are actually working (because you can't see the app conversions)
- Over-investing in campaigns that look good but aren't incremental
- Making decisions on incomplete data

Fixing measurement isn't a cost - it's the foundation for making better decisions.'

**Offer a middle ground**:
'We don't have to solve everything at once. Let's start with one thing: get Firebase-Google Ads linked properly. That's low effort, and it'll immediately show you app conversions in Google Ads. Then we decide if we need more.'"

**What this demonstrates**: Empathy, simplifies complexity, reframes cost as investment, offers incremental path.
</details>

---

## Turn 6 (Wrap-up)

**Interviewer**: "Good. Last question - if you could only give them ONE piece of advice to improve their web-to-app measurement, what would it be?"

**Your Response**: _(Synthesis)_

<details>
<summary>💡 Strategy & Sample Response</summary>

**Strategy**: This is testing if you can synthesize. Don't give a list - give ONE answer with conviction.

**Sample Response**:
"**One thing: Link Firebase to Google Ads and verify it's working.**

Here's why:

Everything else - MMPs, BigQuery, custom dashboards - is optimization. But if the basic Firebase-Google Ads link isn't working, you're flying blind on app conversions from day one.

It's a 15-minute setup, zero cost, and it immediately surfaces app installs and in-app purchases in Google Ads reporting.

After that's confirmed working, THEN we talk about deferred deep links, THEN we talk about unified dashboards.

First principles: Make sure the pipe is connected before you worry about what's flowing through it."

**What this demonstrates**: Can synthesize, prioritizes ruthlessly, practical first-principles thinking.
</details>

---

## Key Learnings from This Scenario

1. **Web-to-app attribution is inherently messy** - Set expectations accordingly
2. **Deferred deep linking** preserves both the product context AND the attribution data
3. **Firebase-Google Ads linking** is the first thing to check - low effort, high impact
4. **There's no 'one number'** - Help clients understand they're choosing trade-offs
5. **iOS privacy changes** (ATT, SKAdNetwork) have made deterministic attribution harder
6. **Empathize before educating** - Marketing teams aren't dumb, they're frustrated

---

## How This Maps to Interview Questions

| Question Type | Use This Scenario For |
|---------------|----------------------|
| "Tell me about a complex measurement challenge" | Full scenario |
| "How do you explain technical concepts to non-technical stakeholders?" | Turn 5 |
| "Walk me through a troubleshooting process" | Turns 1-2 |
| "How would you design a measurement architecture?" | Turn 4 |
| "Tell me about a time you had to push back on a stakeholder" | Turn 5 |

---

*This scenario plays to your web tech strength and shows cross-platform measurement expertise.*
