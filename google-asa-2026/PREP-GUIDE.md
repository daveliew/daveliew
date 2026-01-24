# Google ASA L4 Interview Prep Guide

**Interview Date**: 5 days from now
**Level**: L4 (Mid-level)
**Focus Areas**: Systems Design, Web Technology

---

## What Google L4 Expects

At L4, Google does NOT expect:
- Planet-scale distributed systems design
- Deep architectural ownership

Google DOES expect:
- Clean, maintainable, scalable service design
- Strong fundamentals over complexity
- Clear trade-off reasoning (not memorized patterns)
- Structured, confident communication

---

## L4 System Design Framework (8 Steps)

### 1. CLARIFY Requirements (2-3 min)
- "Is this for internal or external users?"
- "Real-time responses needed?"
- "What are the success metrics?"
- "Expected QPS? Latency goals?"

### 2. Define APIs (3-5 min)
```
POST /resource - Create
GET /resource/{id} - Read
PUT /resource/{id} - Update
DELETE /resource/{id} - Delete
```
Mention: pagination, idempotency, auth, error codes

### 3. Identify Core Components
- Load balancer
- API Gateway
- Application service (stateless)
- Database (SQL/NoSQL)
- Cache (Redis/Memcache)
- Message queue
- Background workers
- Monitoring pipeline

### 4. Data Model
- Main entities + primary keys
- Relationships
- Indexing strategy

### 5. High-Level Architecture
- Request flow from client to response
- Where data is stored
- Async workflows
- Logs/metrics flow

### 6. Scaling Strategy
- Horizontal scaling (stateless services)
- Sharding (hash-based, range-based)
- Read replicas
- Cache hit-rate optimization
- Rate limiting

### 7. Reliability & Fault Tolerance
- Idempotent operations
- Retries with exponential backoff
- Circuit breakers
- Graceful degradation
- Health checks

### 8. Trade-offs
Always say: "Here's one approach, but alternative is X based on Y trade-off"

---

## Key Concepts to Know

### Scalability
- Horizontal vs vertical scaling
- Stateless services scale linearly
- Sharding strategies (hash, range, directory)
- Consistent hashing

### Latency
- Target: low tens of milliseconds for user-facing
- Distinguish P50 vs P99 (tail latency)
- Caching layers: CDN, app-level, DB

### Consistency vs Availability
- When strong consistency required
- When eventual consistency acceptable
- CAP theorem trade-offs

### Caching Strategies
- Read-through cache
- Write-through cache
- Write-back cache
- TTL and invalidation
- Cache stampede prevention (jittering)

### Storage Choices
| Type | Use Case |
|------|----------|
| SQL | Strong consistency, transactions |
| Key-Value | Fast lookups, large scale |
| Document | Flexible schemas |
| Wide-column | Analytical workloads |

### Reliability (SRE concepts)
- SLI: What you measure (latency, error rate)
- SLO: The goal (99.9% success)
- Error budget: Acceptable threshold

---

## Web Technology Essentials

### HTTP Fundamentals
- Request/response cycle
- Status codes (200, 400, 404, 500, 503)
- Headers (Cache-Control, Content-Type, Authorization)
- Methods (GET, POST, PUT, DELETE, PATCH)

### Cookies & Sessions
- First-party vs third-party cookies
- Session management
- Security flags (HttpOnly, Secure, SameSite)

### Browser Dev Tools
- Network tab analysis
- Console debugging
- Performance profiling

### Tag Management
- GTM container structure
- Tag firing rules
- Debug mode usage

### JavaScript Debugging
- Async/await patterns
- Event listeners
- DOM manipulation
- Error handling

---

## Googleyness Traits (Culture Fit)

**The 6 Phrases** (per Sundar Pichai):
1. Mission First
2. Make Helpful Things
3. Be Bold and Responsible
4. Stay Scrappy
5. Hustle and Have Fun
6. Team Google

**Prepare Stories For**:
- Using data to make decisions
- Giving constructive feedback / challenging status quo
- Collaborating across teams
- Showing growth pattern

**Common Questions**:
- "Tell me about a time you had a disagreement with a colleague"
- "Describe when a project was reassigned before deadline"
- "Give example of influencing another team"
- "Time you missed a deadline - what did you learn?"

---

## 5-Day Prep Schedule

### Day 1: Foundation
- [ ] Review this guide completely
- [ ] Practice 8-step framework with URL shortener example
- [ ] Review HTTP fundamentals

### Day 2: System Design Deep Dive
- [ ] Practice: "Design a rate-limiting service"
- [ ] Practice: "Design a URL shortener"
- [ ] Review caching strategies

### Day 3: Web Tech Focus
- [ ] Review cookie/session management
- [ ] Practice troubleshooting scenarios (conversion tracking)
- [ ] Review browser dev tools workflow

### Day 4: Googleyness + Mock
- [ ] Prepare 3-4 behavioral stories (STAR format)
- [ ] Do full mock interview (time yourself)
- [ ] Review weak areas

### Day 5: Light Review + Rest
- [ ] Quick review of framework
- [ ] Review your notes
- [ ] Get good sleep

---

## Interview Day Tips

**DO**:
- Ask clarifying questions BEFORE diving in
- Talk through your thinking out loud
- State constraints and assumptions
- Show trade-offs, not memorized patterns
- Say "I don't know, but here's how I'd approach it"

**DON'T**:
- Start coding/designing immediately
- Go silent while thinking
- Fake past experiences
- Over-engineer the solution

---

## Quick Reference: Troubleshooting Framework

**CLARIFY** → **ISOLATE** → **HYPOTHESIZE** → **VERIFY** → **RESOLVE**

1. Clarify: Gather facts, scope the problem
2. Isolate: Narrow down where in the stack
3. Hypothesize: Rank possible causes
4. Verify: Test hypothesis with data
5. Resolve: Actionable fix + prevention

---

## Resources

**Your Study Files:**
- `GLOSSARY.md` - Technical term definitions
- `GTECH-ROLE-GUIDE.md` - Role-specific depth, L4 vs L3, Meta→Google translations
- `PEOPLE-SKILLS.md` - Stakeholder management, "I don't know" framework, story bank

**External:**
- [System Design Handbook - L4 Guide](https://www.systemdesignhandbook.com/guides/google-l4-system-design/)
- [IGotAnOffer - Google L4 Guide](https://igotanoffer.com/en/advice/google-l4-interview)
- Google-tagged LeetCode (medium difficulty)
- Your scenarios folder for practice drills

---

*Good luck! You've got this.*
