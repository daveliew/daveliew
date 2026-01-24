# Technical Glossary for L4 Interview

Quick reference for terms in PREP-GUIDE.md.

---

## System Design Terms

### Scalability

| Term | Definition |
|------|------------|
| **Horizontal scaling** | Adding more machines to handle load (e.g., 10 servers instead of 1) |
| **Vertical scaling** | Making one machine more powerful (more RAM, faster CPU) |
| **Stateless service** | A service that doesn't store session data - any server can handle any request |
| **QPS** | Queries Per Second - how many requests a system handles per second |

### Sharding (Splitting Data)

| Term | Definition |
|------|------------|
| **Sharding** | Splitting a database across multiple machines so each holds part of the data |
| **Hash-based sharding** | Use a hash of the key (e.g., user_id % 10) to decide which shard holds the data |
| **Range-based sharding** | Split by ranges (e.g., users A-M on shard 1, N-Z on shard 2) |
| **Consistent hashing** | A sharding technique where adding/removing servers only moves minimal data |

### Caching

| Term | Definition |
|------|------------|
| **Cache** | Fast temporary storage (like RAM) to avoid hitting slow storage (like disk) |
| **Redis** | Popular in-memory cache/database - very fast, stores data in RAM |
| **Memcache** | Another in-memory cache - simpler than Redis, just key-value |
| **CDN** | Content Delivery Network - servers worldwide that cache static files (images, JS) close to users |
| **TTL** | Time To Live - how long a cached item stays valid before expiring |
| **Cache hit** | When requested data IS in cache (fast) |
| **Cache miss** | When requested data is NOT in cache (must fetch from database) |
| **Cache stampede** | When cache expires and 1000s of requests all hit the database at once |
| **Jittering** | Adding randomness to TTLs so caches don't all expire at the same moment |
| **Read-through cache** | App reads from cache; if miss, cache fetches from DB and stores it |
| **Write-through cache** | Writes go to cache AND database at the same time |
| **Write-back cache** | Writes go to cache first, then asynchronously to database (faster but riskier) |

### Load Balancing & Traffic

| Term | Definition |
|------|------------|
| **Load balancer** | Distributes incoming requests across multiple servers |
| **API Gateway** | Single entry point that handles auth, rate limiting, routing to services |
| **Rate limiting** | Blocking users who make too many requests (e.g., max 100 requests/minute) |

### Message Queues & Async

| Term | Definition |
|------|------------|
| **Message queue** | A buffer where tasks wait to be processed (like Kafka, RabbitMQ, SQS) |
| **Background worker** | A process that handles queued tasks asynchronously |
| **Async workflow** | Tasks that don't need immediate response - process in background |

### Reliability

| Term | Definition |
|------|------------|
| **Idempotent** | An operation that gives the same result no matter how many times you run it. Example: "Set user name to Dave" is idempotent. "Add $10 to balance" is NOT idempotent. |
| **Exponential backoff** | After a failure, wait 1s, then 2s, then 4s, then 8s before retrying |
| **Circuit breaker** | If a service keeps failing, stop calling it temporarily to let it recover |
| **Graceful degradation** | When something fails, provide reduced functionality instead of crashing |
| **Health check** | Periodic "are you alive?" pings to detect failed servers |
| **Read replica** | A copy of the database used only for reads - spreads the load |

### Latency

| Term | Definition |
|------|------------|
| **Latency** | Time from request sent to response received (in milliseconds) |
| **P50 latency** | Median - 50% of requests are faster than this |
| **P99 latency** | 99th percentile - only 1% of requests are slower than this (tail latency) |
| **Tail latency** | The slowest requests (P99, P99.9) - often matters more than average |

### Consistency vs Availability (CAP Theorem)

| Term | Definition |
|------|------------|
| **CAP theorem** | You can only guarantee 2 of 3: Consistency, Availability, Partition tolerance |
| **Strong consistency** | All users see the same data at the same time (like a bank balance) |
| **Eventual consistency** | Data may be temporarily out of sync but will converge (like social media likes) |

### SRE (Site Reliability Engineering)

| Term | Definition |
|------|------------|
| **SLI** | Service Level Indicator - what you measure (e.g., "% of requests under 200ms") |
| **SLO** | Service Level Objective - your goal (e.g., "99.9% of requests under 200ms") |
| **Error budget** | How much failure is acceptable (if SLO is 99.9%, you can have 0.1% errors) |

---

## Database Terms

| Term | Definition |
|------|------------|
| **SQL database** | Relational, tables with rows/columns, strong consistency (PostgreSQL, MySQL) |
| **NoSQL** | Non-relational databases - various types below |
| **Key-Value store** | Simple: key → value. Very fast lookups (Redis, DynamoDB) |
| **Document store** | Stores JSON-like documents. Flexible schema (MongoDB, Firestore) |
| **Wide-column store** | Like a spreadsheet with dynamic columns. Good for analytics (Cassandra, BigTable) |
| **Primary key** | Unique identifier for a row (e.g., user_id) |
| **Index** | A data structure that speeds up queries on specific columns |

---

## Web Technology Terms

### HTTP

| Term | Definition |
|------|------------|
| **HTTP** | Protocol for web requests (browser → server → response) |
| **Status 200** | OK - request succeeded |
| **Status 400** | Bad Request - client sent invalid data |
| **Status 404** | Not Found - resource doesn't exist |
| **Status 500** | Internal Server Error - server crashed |
| **Status 503** | Service Unavailable - server overloaded or down |
| **GET** | Read data (should not change anything) |
| **POST** | Create new data |
| **PUT** | Update/replace data |
| **DELETE** | Remove data |
| **PATCH** | Partially update data |

### Headers

| Term | Definition |
|------|------------|
| **Cache-Control** | Tells browser how long to cache a response |
| **Content-Type** | What format the data is (application/json, text/html) |
| **Authorization** | Contains auth token (e.g., "Bearer xyz123") |

### Cookies & Sessions

| Term | Definition |
|------|------------|
| **Cookie** | Small data stored in browser, sent with every request to that domain |
| **First-party cookie** | Set by the site you're visiting (good for auth) |
| **Third-party cookie** | Set by other domains (ads, tracking - being phased out) |
| **Session** | Server-side storage of user state, identified by session cookie |
| **HttpOnly flag** | Cookie can't be accessed by JavaScript (prevents XSS stealing it) |
| **Secure flag** | Cookie only sent over HTTPS |
| **SameSite flag** | Controls if cookie is sent on cross-site requests (CSRF protection) |

### Google Measurement Stack

| Term | Definition |
|------|------------|
| **GTM** | Google Tag Manager - UI for adding tracking code to websites |
| **Container** | A GTM package of tags, triggers, and variables for a website |
| **Web Container** | GTM container running client-side in browser |
| **Server Container** | GTM container running on Cloud Run (GCP) as first-party endpoint |
| **Tag** | A piece of code GTM fires (e.g., Google Analytics tracking) |
| **Trigger** | Condition for when a tag fires (e.g., on page load, on click) |
| **Conversion Action** | What you're measuring as success (purchase, signup, etc.) |
| **GA4** | Google Analytics 4 - event-based analytics (replaced Universal Analytics) |
| **gtag.js** | Google's JavaScript library for tracking (the Google Tag) |
| **Measurement ID** | GA4 property identifier (format: G-XXXXXXX) |
| **gclid** | Google Click ID - tracks which ad click led to a conversion |
| **dataLayer** | JavaScript array where GTM reads event/variable data |

### Enhanced Conversions & Consent

| Term | Definition |
|------|------------|
| **Enhanced Conversions** | Sends hashed customer data (email, phone) to improve conversion matching |
| **Enhanced Conversions for Web** | Real-time matching on conversion pages (e-commerce) |
| **Enhanced Conversions for Leads** | Delayed matching via offline import (lead-gen) |
| **Consent Mode** | Google's framework for adjusting tag behavior based on user consent |
| **ad_storage** | Consent signal for advertising cookies |
| **analytics_storage** | Consent signal for analytics cookies |
| **Behavioral modeling** | ML that fills gaps when users deny consent (requires volume thresholds) |
| **SHA256** | Hash algorithm used to encrypt PII before sending to Google |

### Server-Side Tagging

| Term | Definition |
|------|------------|
| **Server-side GTM** | GTM running on your own server instead of user's browser |
| **Cloud Run** | GCP service that runs server containers (hosts server-side GTM) |
| **First-party domain** | Your own domain (e.g., sgtm.yoursite.com) - cookies last longer |
| **ITP** | Intelligent Tracking Prevention - Safari's cookie restrictions |
| **ETP** | Enhanced Tracking Protection - Firefox's cookie restrictions |

### Attribution

| Term | Definition |
|------|------------|
| **Attribution** | Deciding which touchpoint gets credit for a conversion |
| **Last-click attribution** | 100% credit to final touchpoint before conversion |
| **Data-Driven Attribution (DDA)** | ML distributes credit across touchpoints (Google Ads default since 2021) |
| **Cross-channel attribution** | Sees all traffic sources (GA4 approach) |
| **Platform-centric attribution** | Only sees own touchpoints (Meta/Facebook approach) |

### Google Ads Terms

| Term | Definition |
|------|------------|
| **MCC** | My Client Center - manager account that controls multiple Google Ads accounts |
| **MCA** | Multi-Client Account - Merchant Center equivalent of MCC |
| **Performance Max** | Automated campaign type across all Google inventory |
| **Key Event** | GA4 term for important events (formerly "conversions" in GA4) |

---

## Interview Terms

| Term | Definition |
|------|------------|
| **STAR format** | Situation, Task, Action, Result - structure for behavioral answers |
| **Trade-off** | Choosing between two options where each has pros and cons |
| **L4** | Google's mid-level engineer/specialist designation |

---

## Quick Formulas

```
Cache hit rate = hits / (hits + misses)
Error budget = 100% - SLO (e.g., 100% - 99.9% = 0.1%)
Availability = uptime / (uptime + downtime)
```

---

*Use alongside PREP-GUIDE.md, GTECH-ROLE-GUIDE.md, and PEOPLE-SKILLS.md for your 5-day prep.*
