# Merchant API Migration Reference

**For**: Sales Engineers, Solutions Architects, Client Technical Teams
**Last Updated**: January 2026
**Sources**:
- [Google Merchant API Documentation](https://developers.google.com/merchant/api/guides/compatibility/overview)
- Industry best practices from Stripe, Shopify, Twilio, Google Places API

---

## Critical Dates

| Milestone | Date | Action Required |
|-----------|------|-----------------|
| **Content API Shutdown** | August 2026 | All integrations must migrate to Merchant API |
| **Merchant API v1beta Shutdown** | February 28, 2026 | Must use stable v1 (not beta) |

---

## Executive Summary

The Merchant API is Google's redesigned replacement for the Content API for Shopping. Key benefits:
- Modular sub-APIs (version independently)
- gRPC support (faster, more efficient)
- Better product status integration
- Multiple API data sources (was limited to one)
- New features: Order tracking, Issue resolution, Product Studio (AI)

**Migration Effort**: Medium-High depending on implementation complexity
**Recommended Timeline**: Start 4-6 months before deadline

---

## For Account Managers: Client Communication Guide

### The 30-Second Pitch

> "Google is replacing the Content API with the Merchant API in August 2026. Your current integration will stop working after that date. We recommend starting migration now - this gives us buffer for testing without risking your Shopping ads revenue during peak season."

### Business Impact Summary

| If You Migrate | If You Don't Migrate |
|----------------|---------------------|
| Shopping ads continue running | Shopping ads stop serving |
| Product feeds keep updating | Products go stale, get disapproved |
| New features available (AI, better tracking) | Locked out of improvements |
| Controlled, tested transition | Emergency scramble or outage |

**Bottom line**: No migration = no Shopping ads after August 2026.

### Common Client Objections & Responses

**Q: "Can we wait until closer to the deadline?"**
> "You could, but here's the risk: if we discover issues during migration, we need time to fix them. Starting with 7 months buffer means we can test thoroughly. Starting with 2 months means one bug could impact your peak season revenue."

**Q: "How much engineering time does this need?"**
> "It depends on your setup complexity. A simple integration might be 2-3 weeks. If you have custom middleware, multi-market feeds, or heavy batch processing, plan for 6-8 weeks plus testing. We can do a quick audit to give you a more accurate estimate."

**Q: "What's the actual risk if we're a bit late?"**
> "After August 2026, Content API calls will fail. Your products won't update, new products won't upload, and existing products will eventually get disapproved as data goes stale. This directly impacts your Shopping ads serving and revenue."

**Q: "Is Google likely to extend the deadline?"**
> "Historically, Google has held firm on API deprecation dates. The safe assumption is August 2026 is final. Planning for an extension that doesn't come is much riskier than being ready early."

### Effort Sizing Guide (For Scoping Conversations)

| Client Setup | Complexity | Rough Effort |
|--------------|------------|--------------|
| Simple feed upload, single market | Low | 2-3 weeks |
| API integration, 2-3 markets | Medium | 4-6 weeks |
| Custom middleware, batch processing | Medium-High | 6-8 weeks |
| Enterprise (50K+ SKUs, 5+ markets, real-time inventory) | High | 8-12 weeks |

*Note: Add 2-4 weeks for testing and staged rollout regardless of complexity.*

---

## Quick Start for Developers (15 Minutes)

### Step 1: Get Your IDs Ready
```
Merchant Center ID: Find in Merchant Center → Settings → Account information
GCP Project ID: Find in Google Cloud Console
```

### Step 2: Register as Merchant API Developer
```bash
curl -X POST \
  "https://merchantapi.googleapis.com/accounts/v1/accounts/{MC_ID}/developerRegistration:registerGcp" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"developer_email": "your-email@company.com"}'
```

### Step 3: Test a Simple Product GET
```bash
# Content API (old way)
curl "https://shoppingcontent.googleapis.com/content/v2.1/{MC_ID}/products/online:en:US:sku123" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"

# Merchant API (new way)
curl "https://merchantapi.googleapis.com/products/v1/accounts/{MC_ID}/products/en~US~sku123" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"
```

### Step 4: Compare Responses

**What to look for:**
- [ ] Product ID format changed (`:` → `~`)
- [ ] Price now in `amountMicros` (not string)
- [ ] Attributes nested under `productAttributes`
- [ ] Status info included (no separate call needed)

**If both calls work**: Your auth is set up, you're ready to plan migration.
**If Merchant API fails**: Check error message, likely need to register as developer first.

### Minimum Viable Test

```javascript
// Quick validation: Can you read and write one product?
async function quickMigrationTest(productId) {
  // 1. Read from Content API
  const oldProduct = await contentApi.products.get(productId);

  // 2. Transform to new format
  const newProduct = transformProduct(oldProduct);

  // 3. Write to Merchant API
  const result = await merchantApi.productInputs.insert(newProduct);

  // 4. Verify
  console.log('Content API price:', oldProduct.price.value);
  console.log('Merchant API price:', result.amountMicros / 1000000);

  return oldProduct.price.value === (result.amountMicros / 1000000).toFixed(2);
}
```

---

## Risk Assessment Matrix

### Business Risk Summary

| Risk | Likelihood | Business Impact | Technical Impact | Mitigation |
|------|------------|-----------------|------------------|------------|
| **Missed deadline** | Medium | Critical - ads stop | API calls fail | Start now, phased approach |
| **Data loss during migration** | Low | High - products disapproved | Data inconsistency | Shadow traffic validation |
| **Revenue impact from disapprovals** | Medium | High - lost sales | Products not serving | Staged rollout, start with top SKUs |
| **Extended downtime during cutover** | Low | Medium - temporary gap | Service interruption | Kill switch, rollback plan |
| **Custom attribute migration fails** | Medium | Medium - some products affected | Validation errors | Pre-migration audit |
| **Batch processing bottleneck** | Medium | Low - slower updates | Performance degradation | Async refactor, load testing |

### Risk by Client Profile

| Client Type | Highest Risk | Priority Mitigation |
|-------------|--------------|---------------------|
| **Enterprise (50K+ SKUs)** | Scale issues, batch processing | Load test early, parallel migration |
| **Multi-market** | ID format across regions | Market-by-market rollout |
| **Real-time inventory** | Latency, data freshness | Shadow traffic with live comparison |
| **Heavy custom attributes** | Data transformation | Pre-migration attribute audit |
| **Simple feed upload** | Low risk overall | Standard migration path |

### Success Criteria (Definition of Done)

Migration is complete when:

- [ ] All products successfully migrated (0% on Content API)
- [ ] Approval rates match or exceed pre-migration baseline
- [ ] No increase in disapprovals for 7 consecutive days
- [ ] All markets serving correctly
- [ ] Monitoring and alerting in place for new API
- [ ] Rollback procedure documented and tested
- [ ] Team trained on new API patterns
- [ ] Content API code paths removed from codebase

---

## Shadow Traffic Strategy: Top SKU Approach

### Why Start with Top-Selling SKUs

Instead of random sampling, prioritize your highest-value products for shadow testing:

```
TRADITIONAL APPROACH (RISKY)
============================
Random 1% of products → Test → Expand

Problem: You might test low-value SKUs that work fine,
         then discover your top sellers have edge cases
         that break during full rollout.

TOP-SKU APPROACH (RECOMMENDED)
==============================
Top 100 revenue SKUs → Test → Top 1000 → Full catalog

Why:
├── Highest revenue impact if they break
├── Often most complex (more attributes, more markets)
├── Validates your most critical products first
└── If these work, simpler products likely work too
```

### Implementation

**Step 1: Identify Your Top SKUs**
```sql
-- Pull from your analytics/sales data
SELECT
  product_id,
  revenue_last_30d,
  order_count,
  num_markets,
  num_custom_attributes
FROM products
ORDER BY revenue_last_30d DESC
LIMIT 100;
```

**Step 2: Shadow Traffic with Top SKUs First**
```javascript
async function shadowTrafficTopSKUs() {
  // Get your top 100 revenue SKUs
  const topSKUs = await getTopSKUsByRevenue(100);

  const results = {
    matched: [],
    mismatched: [],
    failed: []
  };

  for (const sku of topSKUs) {
    try {
      // Send to both APIs
      const [contentResult, merchantResult] = await Promise.all([
        contentApi.products.insert(sku),
        merchantApi.productInputs.insert(transformProduct(sku))
      ]);

      // Compare approval status
      if (contentResult.approved === merchantResult.approved) {
        results.matched.push(sku.id);
      } else {
        results.mismatched.push({
          id: sku.id,
          revenue: sku.revenue,
          contentStatus: contentResult.approved,
          merchantStatus: merchantResult.approved
        });
      }
    } catch (error) {
      results.failed.push({ id: sku.id, error: error.message });
    }
  }

  // Alert if ANY top SKU fails
  if (results.failed.length > 0 || results.mismatched.length > 0) {
    alertTeam('Top SKU shadow traffic issues detected', results);
  }

  return results;
}
```

**Step 3: Expand Based on Results**

| Phase | SKUs to Test | Success Criteria | Next Step |
|-------|--------------|------------------|-----------|
| 1 | Top 100 by revenue | 100% match | Expand to top 1000 |
| 2 | Top 1000 by revenue | 99%+ match | Expand to full catalog |
| 3 | Full catalog (sampling) | 99%+ match | Begin staged cutover |
| 4 | Full cutover by market | No disapproval spike | Complete |

### Why This Matters

**Scenario A: Random sampling first**
- Test 1000 random products ✓
- All pass ✓
- Roll out to production
- Top 10 revenue SKUs fail due to edge case
- **Revenue impact: Immediate, high**

**Scenario B: Top SKUs first**
- Test top 100 revenue products
- Discover edge case in product #47
- Fix before broader rollout
- **Revenue impact: Zero (caught in testing)**

### Key Metrics to Track During Shadow Traffic

| Metric | Top SKUs Threshold | General Threshold |
|--------|-------------------|-------------------|
| Approval match rate | 100% required | 99%+ |
| Price accuracy | 100% required | 99.9%+ |
| Custom attribute preservation | 100% required | 99%+ |
| Response time delta | < 50ms | < 100ms |

---

## Breaking Changes Reference

### High Impact (Requires Code Changes)

| Area | Content API (Old) | Merchant API (New) | Migration Notes |
|------|-------------------|-------------------|-----------------|
| **Product IDs** | `channel:lang:targetCountry:offerId` | `contentLanguage~feedLabel~offerId` | Delimiter changes from `:` to `~`. Channel no longer in ID. |
| **Resource Names** | `id` (numeric) | `name` (RESTful: `accounts/{id}/products/{product}`) | All API calls must use new format |
| **Custom Attributes** | `type`, `unit` as separate fields | Removed - units appended to value | `{value: "5.6", unit: "cm"}` → `{value: "5.6 cm"}` |
| **Custom Grouping** | `customGroups` container (flat) | Recursive `customAttributes` with `groupValues` | Structure refactor required |
| **Price Format** | `value: string`, `currency: string` | `amountMicros: int64`, `currencyCode: string` | `"33.45"` → `33450000` (1M micros = 1 unit) |
| **Batch Methods** | `customBatch` supported | Removed - use async/parallel calls | Refactor to Promise.all() or async patterns |

### Medium Impact (API Call Changes)

| Area | Content API (Old) | Merchant API (New) | Migration Notes |
|------|-------------------|-------------------|-----------------|
| **Country Targeting** | `targetCountry` field | `feedLabel` field | More flexible, but ID format changes |
| **Inventory Service** | `inventory` service | `localInventory` + `regionalInventory` | Separate resources, new patterns |
| **Data Sources** | Auto-created "Content API" source | Must explicitly create before use | Setup step required |
| **Destinations** | `destinations` (single list) | `includedDestinations` + `excludedDestinations` | Field split |
| **Product Updates** | Could be overwritten by feed uploads | `productInputs.patch` is persistent | More predictable behavior |

### Low Impact (Response Changes)

| Area | Content API (Old) | Merchant API (New) | Migration Notes |
|------|-------------------|-------------------|-----------------|
| **Insert Response** | Full product returned | Only `id`, `offerId`, `channel`, `contentLanguage`, `targetCountry` | Less data returned |
| **Product Status** | Separate `productstatuses` service | Integrated in `Product` resource | Simplified - one fewer API call |
| **Page Size** | Max 250 rows | Max 1000 rows | Better for large catalogs |

---

## URL Format Changes

### Base URL
```
Content API:  https://shoppingcontent.googleapis.com/content/v2.1/{merchantId}/...
Merchant API: https://merchantapi.googleapis.com/{SUB_API}/{VERSION}/{RESOURCE_NAME}:{METHOD}
```

### Common Operations

| Operation | Content API | Merchant API |
|-----------|-------------|--------------|
| Get Product | `GET .../v2.1/{merchantId}/products/{productId}` | `GET .../products/v1/accounts/{account}/products/{product}` |
| List Products | `GET .../v2.1/{merchantId}/products` | `GET .../products/v1/accounts/{account}/products` |
| Insert Product | `POST .../v2.1/{merchantId}/products` | `POST .../products/v1/accounts/{account}/productInputs:insert` |
| Update Product | `PATCH .../v2.1/{merchantId}/products/{productId}` | `PATCH .../products/v1/accounts/{account}/productInputs/{productinput}` |
| Delete Product | `DELETE .../v2.1/{merchantId}/products/{productId}` | `DELETE .../products/v1/accounts/{account}/productInputs/{productinput}` |
| Get Status | `GET .../v2.1/{merchantId}/productstatuses/{productId}` | Included in `products.get` response |

---

## Migration Playbook

### Phase 1: Discovery & Setup (Week 1-2)

**Tasks:**
- [ ] Audit current Content API usage (endpoints, call volumes, error rates)
- [ ] Map feed structure and custom attributes
- [ ] Identify middleware transformations
- [ ] Register as Merchant API developer
- [ ] Create explicit API data source(s)

**Developer Registration:**
```
POST https://merchantapi.googleapis.com/accounts/v1/accounts/{ACCOUNT_ID}/developerRegistration:registerGcp
{
  "developer_email": "your-email@example.com"
}
```

### Phase 2: Gap Analysis (Week 2-3)

**Key Questions:**
1. Which custom attributes use `type`/`unit` fields? (Require transformation)
2. Are you using `customBatch`? (Requires async refactor)
3. What's your price format handling? (String → micros conversion)
4. How do you construct product IDs? (Delimiter change)

**Code Audit Checklist:**
- [ ] Product ID construction logic
- [ ] Price formatting/parsing
- [ ] Custom attribute handling
- [ ] Batch request patterns
- [ ] Error handling for new response formats

### Phase 3: Shadow Traffic (Week 3-5)

**Approach:**
1. Set up parallel Merchant API connection (don't cut over yet)
2. Send same products to both APIs
3. Compare approval rates and responses
4. Monitor for discrepancies

**Validation Points:**
- [ ] Product approval rates match
- [ ] Price values convert correctly (string → micros)
- [ ] Custom attributes parse correctly
- [ ] No new disapprovals from format issues

### Phase 4: Staged Rollout (Week 5+)

**Recommended Order** (for multi-market):
1. Lowest volume market first
2. 48-hour verification per market
3. Expand to higher volume markets
4. Keep Content API kill switch ready

**Monitoring:**
- Disapproval rate spike > 5% = pause and investigate
- Error rate increase = check ID format changes
- Missing products = verify data source assignment

---

## Common Pitfalls & Solutions

### 1. Product IDs Not Found
**Symptom**: 404 errors when fetching products
**Cause**: Using old ID format with colons
**Fix**: Convert `online:en:US:sku123` → `en~US~sku123`

### 2. Price Validation Failures
**Symptom**: Products rejected for invalid price
**Cause**: Sending string instead of micros
**Fix**: Convert `"33.45"` → `33450000` (multiply by 1,000,000)

### 3. customBatch Errors
**Symptom**: Method not found
**Cause**: `customBatch` removed in Merchant API
**Fix**: Use parallel async calls:
```javascript
// Before (Content API)
POST /products/customBatch { entries: [...] }

// After (Merchant API)
await Promise.all(products.map(p =>
  client.productInputs.insert(p)
))
```

### 4. Data Source Not Found
**Symptom**: Insert fails with "data source required"
**Cause**: Merchant API doesn't auto-create data sources
**Fix**: Explicitly create data source first:
```
POST https://merchantapi.googleapis.com/v1/accounts/{ACCOUNT_ID}/dataSources
```

### 5. Custom Attributes Lost
**Symptom**: Custom attributes missing after migration
**Cause**: Structure changed from flat to recursive
**Fix**: Transform `customGroups` → nested `customAttributes` with `groupValues`

---

## Quick Reference: Field Mappings

### Price
```json
// Content API
{ "value": "33.45", "currency": "USD" }

// Merchant API
{ "amountMicros": 33450000, "currencyCode": "USD" }
```

### Product Attributes
```json
// Content API - top level
{ "title": "...", "price": {...}, "link": "..." }

// Merchant API - nested under productAttributes
{ "productAttributes": { "title": "...", "price": {...}, "link": "..." } }
```

### Custom Attributes (with units)
```json
// Content API
{ "name": "length", "value": "5.6", "type": "number", "unit": "cm" }

// Merchant API
{ "name": "length", "value": "5.6 cm" }
```

---

## Testing Framework

### Validation Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING STRATEGY                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Unit Tests (Pre-Migration)                            │
│  ├── ID format conversion (: → ~)                               │
│  ├── Price transformation (string → micros)                     │
│  ├── Custom attribute flattening                                │
│  └── Response parsing for new format                            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Integration Tests (Shadow Traffic)                    │
│  ├── Send identical payloads to both APIs                       │
│  ├── Compare approval/disapproval rates                         │
│  ├── Validate product data consistency                          │
│  └── Monitor error rates and types                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Canary Testing (Staged Rollout)                       │
│  ├── 1% traffic → verify metrics → expand                       │
│  ├── Market-by-market rollout                                   │
│  ├── Automated rollback triggers                                │
│  └── SLA monitoring (latency, error rate)                       │
└─────────────────────────────────────────────────────────────────┘
```

### Test Cases Checklist

**Unit Tests (Run before any migration code deploys)**
- [ ] `convertProductId("online:en:US:sku123")` → `"en~US~sku123"`
- [ ] `convertPrice({value: "33.45", currency: "USD"})` → `{amountMicros: 33450000, currencyCode: "USD"}`
- [ ] `flattenCustomAttributes(nestedAttrs)` → correct `groupValues` structure
- [ ] `parseProductResponse(newFormat)` → extracts all required fields

**Integration Tests (Run during shadow traffic phase)**
```javascript
// Pseudo-code for shadow traffic validation
async function shadowTest(product) {
  const [contentResult, merchantResult] = await Promise.all([
    contentApi.products.insert(product),
    merchantApi.productInputs.insert(transformProduct(product))
  ]);

  // Compare results
  assert(contentResult.approved === merchantResult.approved);
  assert(contentResult.price === microsToDollars(merchantResult.amountMicros));
}
```

**Canary Metrics to Monitor**
| Metric | Threshold | Action if Exceeded |
|--------|-----------|-------------------|
| Disapproval rate delta | > 5% vs baseline | Pause rollout, investigate |
| API error rate | > 1% | Check ID format, auth |
| Latency p99 | > 2x baseline | Review batch patterns |
| Missing products | Any | Verify data source assignment |

### Rollback Criteria

**Automatic Rollback Triggers:**
1. Disapproval rate increases > 10% within 1 hour
2. API error rate > 5% for 15 minutes
3. Revenue impact detected (Shopping ads serving drops)

**Rollback Procedure:**
```
1. Switch traffic back to Content API (feature flag)
2. Preserve Merchant API data sources (don't delete)
3. Analyze failure logs
4. Fix and re-deploy with additional tests
5. Resume staged rollout from last successful market
```

### Recommended Tools

| Purpose | Tool Options |
|---------|--------------|
| API Testing | Postman, Google APIs Explorer, curl |
| Load Testing | k6, Artillery, Apache JMeter |
| Monitoring | Cloud Monitoring, Datadog, custom dashboards |
| Feature Flags | LaunchDarkly, ConfigCat, custom config |
| Diff Comparison | Custom logging + BigQuery for analysis |

---

## Complete Endpoint Mapping (Twilio-Style)

Full mapping of every Content API endpoint to Merchant API equivalent:

### Products Service

| Content API Endpoint | Merchant API Endpoint | Notes |
|---------------------|----------------------|-------|
| `GET /v2.1/{merchantId}/products/{productId}` | `GET /products/v1/accounts/{account}/products/{product}` | Returns processed product with status |
| `GET /v2.1/{merchantId}/products` | `GET /products/v1/accounts/{account}/products` | Pagination: max 1000 vs 250 |
| `POST /v2.1/{merchantId}/products` | `POST /products/v1/accounts/{account}/productInputs:insert` | Requires `dataSource` param |
| `PATCH /v2.1/{merchantId}/products/{productId}` | `PATCH /products/v1/accounts/{account}/productInputs/{productinput}` | Now persistent (not overwritten by feeds) |
| `DELETE /v2.1/{merchantId}/products/{productId}` | `DELETE /products/v1/accounts/{account}/productInputs/{productinput}` | Requires `dataSource` param |
| `POST /v2.1/products/batch` | **REMOVED** | Use async parallel calls |
| `POST /v2.1/products/custombatch` | **REMOVED** | Use async parallel calls |

### Product Statuses Service

| Content API Endpoint | Merchant API Endpoint | Notes |
|---------------------|----------------------|-------|
| `GET /v2.1/{merchantId}/productstatuses/{productId}` | `GET /products/v1/accounts/{account}/products/{product}` | Status now in `productStatus` field |
| `GET /v2.1/{merchantId}/productstatuses` | `GET /products/v1/accounts/{account}/products` | Status included in list response |
| `POST /v2.1/productstatuses/custombatch` | **REMOVED** | Use async parallel calls |

### Data Sources (formerly Datafeeds)

| Content API Endpoint | Merchant API Endpoint | Notes |
|---------------------|----------------------|-------|
| `POST /v2.1/{merchantId}/datafeeds` | `POST /datasources/v1/accounts/{account}/dataSources` | Method renamed to `create` |
| `GET /v2.1/{merchantId}/datafeeds/{datafeedId}` | `GET /datasources/v1/accounts/{account}/dataSources/{datasource}` | ID format: numeric → string name |
| `GET /v2.1/{merchantId}/datafeeds` | `GET /datasources/v1/accounts/{account}/dataSources` | |
| `PUT /v2.1/{merchantId}/datafeeds/{datafeedId}` | `PATCH /datasources/v1/accounts/{account}/dataSources/{datasource}` | Changed from PUT to PATCH |
| `DELETE /v2.1/{merchantId}/datafeeds/{datafeedId}` | `DELETE /datasources/v1/accounts/{account}/dataSources/{datasource}` | |
| `POST /v2.1/{merchantId}/datafeeds/{datafeedId}/fetchnow` | `POST /datasources/v1/accounts/{account}/dataSources/{datasource}:fetch` | |
| `GET /v2.1/{merchantId}/datafeedstatuses/{datafeedId}` | `GET /datasources/v1/accounts/{account}/dataSources/{datasource}/fileUploads/latest` | Separate resource now |
| `GET /v2.1/{merchantId}/datafeedstatuses` | **NO DIRECT EQUIVALENT** | List sources, then get each fileUpload |
| `POST /v2.1/datafeeds/custombatch` | **REMOVED** | Use async parallel calls |

### Inventory Services

| Content API Endpoint | Merchant API Endpoint | Notes |
|---------------------|----------------------|-------|
| `POST /v2.1/{merchantId}/inventory/{storeCode}/products/{productId}` | `POST /inventories/v1/accounts/{account}/products/{product}/localInventories:insert` | New resource structure |
| `POST /v2.1/{merchantId}/pos/{targetMerchantId}/inventory` | `POST /inventories/v1/accounts/{account}/products/{product}/localInventories:insert` | |
| Regional inventory | `POST /inventories/v1/accounts/{account}/products/{product}/regionalInventories:insert` | New in Merchant API |

### Accounts Service

| Content API Endpoint | Merchant API Endpoint | Notes |
|---------------------|----------------------|-------|
| `GET /v2.1/{merchantId}/accounts/{accountId}` | `GET /accounts/v1/accounts/{account}` | |
| `GET /v2.1/{merchantId}/accounts` | `GET /accounts/v1/accounts` | New filtering capability |
| `POST /v2.1/accounts/custombatch` | **REMOVED** | Use async parallel calls |

---

## Industry Best Practices (From Stripe, Shopify, Twilio, Google)

### Communication Standards

| Practice | Industry Example | Apply to Merchant API Migration |
|----------|------------------|--------------------------------|
| **Changelog subscription** | Shopify developer changelog | Subscribe to [Google Merchant API updates](https://developers.google.com/merchant/api/latest-updates) |
| **Version headers** | Shopify `X-Shopify-Api-Version` | Monitor response headers for version drift |
| **Dashboard warnings** | Shopify shows UI warnings for deprecated apps | Check Merchant Center for API warnings |
| **Deprecation in tooling** | GraphQL Explorer shows deprecated fields | Use Google APIs Explorer to spot deprecations |

### Versioning Model Comparison

| Company | Release Cadence | Support Window | Overlap Period |
|---------|-----------------|----------------|----------------|
| **Shopify** | Quarterly (Jan, Apr, Jul, Oct) | 12 months minimum | 9 months |
| **Google (Merchant)** | As needed | ~12 months typical | Varies |
| **Stripe** | Continuous + dated versions | Long-term support | Generous |
| **Twilio** | Major versions (v2 → v3) | Extended | Years |

**Key Insight**: Shopify's model is most predictable. Google's Merchant API follows similar patterns but with less rigid scheduling.

### Billing Best Practices

From Google Places API migration guide:

> "When migrating to a newer version of an API, you're also being billed for a different SKU. To avoid increased costs during the month of your transition, we recommend switching to the new APIs in production **as close to the beginning of the month as possible**."

**Apply to Merchant API**:
- API calls to Merchant API may have different pricing than Content API
- Time your production cutover for early in billing cycle
- Monitor costs during shadow traffic phase (you're paying for both APIs)

### Deprecation Timeline Best Practices

```
INDUSTRY STANDARD TIMELINE
==========================

Announcement ─────────────────────────────────────────────► Removal
     │                                                          │
     ├── 12+ months warning (Shopify standard)                  │
     │                                                          │
     ├── 9 months overlap between versions                      │
     │                                                          │
     ├── Release candidates 3 months before stable              │
     │                                                          │
     └── Grace period with warnings before hard cutoff          │

GOOGLE MERCHANT API TIMELINE
============================

Now ──────────────────────────────────────────────────► Aug 2026
 │                                                          │
 ├── Feb 28, 2026: v1beta shutdown                          │
 │                                                          │
 ├── ~7 months remaining (as of Jan 2026)                   │
 │                                                          │
 └── Content API fully deprecated ──────────────────────────┘
```

### Migration Team Model (Stripe Pattern)

Stripe offers dedicated migration support. For enterprise Merchant API migrations:

1. **Identify your Google contact** (TAM, SA, or Partner Manager)
2. **Request migration review session** before starting
3. **Establish escalation path** for production issues
4. **Schedule check-ins** at each phase milestone

### Fallback Behavior

Industry standard (Shopify model):
> "If your request doesn't include a version, then the API defaults to the oldest supported stable version."

**Merchant API behavior**: After Content API shutdown, requests will fail (not fall forward). Plan accordingly.

---

## Version Monitoring Checklist

Monitor these signals to detect version drift:

- [ ] **Response headers** - Check for version indicators in API responses
- [ ] **Deprecation warnings** - Log and alert on any deprecation notices
- [ ] **Error codes** - New error codes may indicate version issues
- [ ] **Changelog alerts** - Subscribe to Google's developer changelog
- [ ] **Merchant Center UI** - Check for migration banners/warnings

### Automated Monitoring Setup

```javascript
// Example: Log version-related response headers
async function monitoredApiCall(request) {
  const response = await merchantApi.call(request);

  // Log version info
  const apiVersion = response.headers['x-api-version'];
  const deprecationWarning = response.headers['x-deprecation-warning'];

  if (deprecationWarning) {
    alertOps(`Deprecation warning: ${deprecationWarning}`);
  }

  metrics.record('api_version', apiVersion);
  return response;
}
```

---

## Resources

- [Migration Overview](https://developers.google.com/merchant/api/guides/compatibility/overview)
- [Products Migration Guide](https://developers.google.com/merchant/api/guides/compatibility/products)
- [Data Sources Migration](https://developers.google.com/merchant/api/guides/compatibility/data-sources)
- [Start Migration Guide](https://developers.google.com/merchant/api/guides/compatibility/start-migration)
- [Merchant API Reference](https://developers.google.com/merchant/api/reference/rest)
- [Code Samples](https://developers.google.com/merchant/api/samples)
- [Client Libraries](https://developers.google.com/merchant/api/client-libraries)

---

## Support & Escalation

### Escalation Ladder

| Severity | Issue Type | First Contact | Escalation Path |
|----------|------------|---------------|-----------------|
| **P0** | Production down, revenue impact | Google Support + TAM immediately | TAM → Engineering on-call |
| **P1** | Migration blocker, deadline risk | TAM or Partner Manager | SA review → Product team |
| **P2** | Technical questions, clarification | Google APIs Explorer, Stack Overflow | Support ticket |
| **P3** | Documentation feedback, feature requests | [Feedback form](https://developers.google.com/merchant/api/support/give-feedback) | Changelog subscription |

### Useful Contacts & Resources

**For Google Internal (SAs/CSMs)**:
- File through standard support channels
- Use internal migration tracking tools
- Escalate via TAM for enterprise accounts

**For Clients**:
- Merchant Center Help → Contact Support
- [Stack Overflow: google-merchant-api](https://stackoverflow.com/questions/tagged/google-merchant-api)
- [Issue Tracker](https://issuetracker.google.com/issues?q=componentid:171084)

**Self-Service**:
- [Google APIs Explorer](https://developers.google.com/merchant/api/reference/rest) - Test API calls directly
- [Release Notes](https://developers.google.com/merchant/api/latest-updates) - Check for known issues
- [Developer Changelog](https://developers.google.com/merchant/api/release-notes) - Subscribe for updates

### When to Escalate

**Escalate immediately if**:
- Disapproval rate spikes >20% post-migration
- API returning 5xx errors consistently
- Data loss or corruption detected
- Deadline at risk due to Google-side issues

**Do NOT escalate for**:
- Documentation clarification (use feedback form)
- Feature requests (use feedback form)
- Issues caused by client-side code bugs

---

*Last updated: January 2026 | Based on official Google documentation + industry best practices from Stripe, Shopify, Twilio*
*Verify details against [official documentation](https://developers.google.com/merchant/api) before implementation.*
