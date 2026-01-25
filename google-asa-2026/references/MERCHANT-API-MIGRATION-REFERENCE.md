# Merchant API Migration Reference

**For**: Sales Engineers, Solutions Architects, Client Technical Teams
**Last Updated**: January 2026
**Source**: [Google Merchant API Documentation](https://developers.google.com/merchant/api/guides/compatibility/overview)

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

## Resources

- [Migration Overview](https://developers.google.com/merchant/api/guides/compatibility/overview)
- [Products Migration Guide](https://developers.google.com/merchant/api/guides/compatibility/products)
- [Data Sources Migration](https://developers.google.com/merchant/api/guides/compatibility/data-sources)
- [Start Migration Guide](https://developers.google.com/merchant/api/guides/compatibility/start-migration)
- [Merchant API Reference](https://developers.google.com/merchant/api/reference/rest)
- [Code Samples](https://developers.google.com/merchant/api/samples)
- [Client Libraries](https://developers.google.com/merchant/api/client-libraries)

---

## Support Escalation

**For Google Internal**: File through standard support channels
**For Clients**: Merchant Center Help → Contact Support
**Known Issues**: Check [Release Notes](https://developers.google.com/merchant/api/latest-updates)

---

*This reference is for internal use and client enablement. Verify details against official documentation before implementation.*
