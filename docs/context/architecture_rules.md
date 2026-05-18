# Architecture Rules

> READ-ONLY. Never modify these rules.
> If a proposed approach conflicts with any rule here, reject the approach — not the rule.

---

## Mandatory Rules (from CTO Execution OS §2.2 and CLAUDE.md §2)

### RULE 1 — File Size Limit
Files must stay under ~200 lines. If a component grows beyond this, split it immediately.
**Why:** Small LLMs lose coherence on long files. This keeps every file within a single context window.

### RULE 2 — Mock Data Before Backend
Always build with mock data before connecting to a real backend. Never test business logic against a live database until the UI is stable.
**Why:** Mixing UI bugs with backend bugs makes both unfixable. Isolate each layer.

### RULE 3 — Manual Before Automation
Admin manually verifies payments before any automation is built. Moderation is manual before any flagging algorithm exists.
**Why:** Premature automation that fails silently destroys trust. Manual paths are always observable and correctable.

### RULE 4 — No Premature Abstractions
Do not create a 'service layer,' 'repository pattern,' or 'plugin system' until you have built the same thing at least three times in raw form.
**Why:** Abstractions created before their need is proven always over-fit the first use case and break on the second.

### RULE 5 — No Scope Creep (Kill List)
No recommendation AI, no in-app messaging, no native apps, no microservices, no blockchain, no DAO during MVP. These are scope termination events.
**Kill list:** Recommendation AI · In-app messaging · Native iOS/Android · Microservices · Smart contracts · Crypto payments · DAO governance · Decentralized identity · Complex analytics

### RULE 6 — LLM Context Window Budget
Every new feature must fit entirely within a single LLM context window (4k–8k tokens). If it does not, break it into smaller tasks before writing any code.

### RULE 7 — Three Session Maximum
No feature takes more than 3 focused coding sessions to complete. If it does, cut scope or re-design the approach.

### RULE 8 — Single Language
TypeScript/JavaScript only. No Python in the backend. Single language across the full stack.

### RULE 9 — Modular Monolith Only
One backend process. No separate services. No microservices. Everything in one Fastify server.

---

## Deployment Constraints (non-negotiable)

- App must listen on `process.env.PORT` — Railway injects this dynamically.
- `prisma migrate deploy` must run in the start command before the server starts.
- Never run `prisma migrate reset` in production.
- All `/admin/*` routes verified against hardcoded `ADMIN_IDS` in middleware — not env vars during MVP.

---

## Ethiopian Reality (design defaults, not edge cases)

- Assume 3G, not WiFi.
- All images must be SVG. No PNG/WebP in core UI.
- API list responses max 10KB. List views never include full descriptions.
- Chapa/Telebirr webhooks will fail. Retry logic is mandatory. Manual fallback is always active.
- All forms auto-save to IndexedDB on every keystroke (500ms debounce).
- React Query `staleTime` minimum 5 minutes. Job feed must be readable when offline.
