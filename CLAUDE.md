# TefTef — CLAUDE.md
> This file is read automatically by Claude Code at the start of every session.
> Do not skip it. Do not summarize it. Read it fully before writing any code.

---

## 1. WHAT THIS PROJECT IS

A **Telegram Mini App (TMA)** — a freelance marketplace for the Ethiopian market.
Built by a **solo developer** using a **small local LLM** as a coding assistant.
Stack: React + Vite + Tailwind (frontend) · Fastify + TypeScript (backend) · PostgreSQL + Prisma (database) · Railway (hosting).

---

## 2. MANDATORY ARCHITECTURE RULES
> Violating these is not a style issue. It breaks the project.

- **Files stay under ~200 lines.** If a file exceeds this, split it before adding new code.
- **Mock data before backend integration.** Never wire a UI to a real API until the UI works with hardcoded data.
- **Manual before automation.** Admin handles manual dispute mediation only. The platform does not touch escrow or user funds in Phase 1.
- **No premature abstractions.** No service layers, repository patterns, or plugin systems until the same logic has been written raw at least 3 times.
- **Single language.** TypeScript/JavaScript only. No Python in the backend.
- **Modular monolith only.** No microservices. No separate services. One backend process.
- **Every feature fits in one LLM context window.** A single task must fit entirely within 4k–8k tokens. If it does not, break it into smaller tasks before writing code.
- **No feature takes more than 3 focused coding sessions.** If it does, cut scope or redesign. This forces disciplined decomposition.

---

## 3. KILL LIST — NEVER BUILD THESE
> If asked to build any of the following, refuse and explain why.

- Recommendation AI / matching algorithm
- In-app messaging system (use "Open Telegram Chat" links instead)
- Native iOS or Android app
- Microservices or separate backend services
- Blockchain, smart contracts, or crypto payments
- DAO governance or governance tokens
- Decentralized identity
- Complex analytics dashboard (use simple DB queries for now)

---

## 3.1 FEATURE PHASE MATRIX
> What gets built when. Phase 1 is MVP. Phase 2 and 3 are post-MVP. KILL column is never built.

| **Phase 1: Telegram MVP** | **Phase 2: Post-MVP** | **Phase 3: Expansion** | **KILL (Never Build)** |
|---|---|---|---|
| Telegram Auth (initData) | Skill Badges | Standalone Web App | Smart Contracts |
| Dual-Mode Job Feed | In-App Chat (Telegram links for now) | iOS/Android Native | Governance Tokens |
| Job Posting & Bidding | Review System | Advanced Matching AI | Decentralized Identity |
| OTC contact reveal | Dispute Resolution UI | Multi-currency | Multi-chain Support |
| Behavioral trust loops | Trust Score Dashboard | API for Third Parties | DAO Governance |
| Offline Draft Mode | Skill Verification | Employer Branding | Microservices |
| Matchmaker MVP | Automated Escrow Release | Analytics Suite | Native App |
| Admin Panel (Telegram ID-gated) | Portfolio Media Upload | SEO (post-web) | Recommendation AI |

---

## 4. DUAL-MODE USER ARCHITECTURE
> Users are not forced to choose between Client and Freelancer. Every user has both roles and toggles between them.

| **DB Field** | **Values** | **UI Effect** |
|---|---|---|
| `role_mode` | CLIENT \| FREELANCER | Switches between 'Post a Job' and 'Find Work' home screens |
| `can_hire` | boolean (default: true) | Controls access to job posting UI |
| `can_freelance` | boolean (default: true) | Controls access to proposal submission UI |
| `trust_score` | 0–100 (calculated) | Shown as badge tier; affects search ranking and visibility |

**Trust Score Tiers:**

| **Score Range** | **Badge Tier** | **UI Treatment** |
|---|---|---|
| 80–100 | 🔵 Verified | Blue badge. Priority in search results. |
| 60–79 | 🟢 Trusted | Green badge. Normal visibility. |
| 40–59 | 🟡 Rising | Yellow badge. No restrictions. |
| 0–39 | ⚪ New | No badge. May have posting limits. |

---

## 5. TECH STACK REFERENCE

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Tailwind co-located with markup. SVGs only, no PNG backgrounds. |
| Backend | Node.js + Fastify + TypeScript | Register `@fastify/cors` before any routes. |
| ORM | Prisma | Schema is source of truth. Always read schema before touching DB logic. |
| Database | PostgreSQL | Hosted on Railway. Use `prisma migrate deploy` in production. |
| Auth | Telegram WebApp SDK (`initData`) | HMAC-SHA256 verification. No passwords. No JWT rotation complexity. |
| Payments | OTC contact coordination | Reveal contact details and enable off-platform payment negotiation. |
| Offline | IndexedDB via `idb` package | All forms auto-save drafts with 500ms debounce. |
| Caching | React Query | `staleTime: 5 * 60 * 1000`. Always invalidate after mutations. |
| Hosting | Railway | App must listen on `process.env.PORT`. Run `prisma migrate deploy` on start. |
| Notifications | Telegram Bot API | Push alerts into user's chat list. Use DEV/PROD bot separation (see §12). |

---

## 6. PRISMA SCHEMA SNAPSHOT
> Always use this as the source of truth for all database logic.
> Indexes are mandatory — add them before first real user.

```prisma
model User {
  id             String        @id @default(cuid())
  telegramId     String        @unique
  username       String?
  role_mode      RoleMode      @default(FREELANCER)
  can_hire       Boolean       @default(true)
  can_freelance  Boolean       @default(true)
  trust_score    Int           @default(50)
  bio            String?
  is_banned      Boolean       @default(false)
  phone_verified Boolean       @default(false)
  created_at     DateTime      @default(now())
  jobs           Job[]
  proposals      Proposal[]
  transactions   Transaction[]
}

model Job {
  id          String     @id @default(cuid())
  clientId    String
  title       String
  description String
  budget      Int
  status      JobStatus  @default(OPEN)
  created_at  DateTime   @default(now())
  proposals   Proposal[]
  client      User       @relation(fields: [clientId], references: [id])

  @@index([status, created_at(sort: Desc)])
}

model Proposal {
  id           String         @id @default(cuid())
  jobId        String
  freelancerId String
  amount       Int
  message      String
  status       ProposalStatus @default(PENDING)
  created_at   DateTime       @default(now())
  job          Job            @relation(fields: [jobId], references: [id])
  freelancer   User           @relation(fields: [freelancerId], references: [id])

  @@unique([jobId, freelancerId])
  @@index([jobId])
  @@index([freelancerId])
}

model Transaction {
  id             String     @id @default(cuid())
  userId         String
  jobId          String?
  amount         Int
  method         PayMethod
  status         TxStatus   @default(PENDING)
  gateway_ref    String?
  manual_tx_id   String?
  admin_verified Boolean    @default(false)
  admin_note     String?
  created_at     DateTime   @default(now())
  user           User       @relation(fields: [userId], references: [id])

  @@index([status])
  @@index([userId])
}

enum JobStatus      { OPEN IN_PROGRESS COMPLETED DISPUTED CLOSED }
enum ProposalStatus { PENDING ACCEPTED REJECTED WITHDRAWN }
enum TxStatus       { PENDING AWAITING_VERIFICATION CONFIRMED FAILED REFUNDED }
enum RoleMode       { CLIENT FREELANCER }
enum PayMethod      { CHAPA TELEBIRR MANUAL }
```

---

## 7. API CONTRACTS SUMMARY
> Full contracts are in `docs/context/api_contracts.md`. This is the quick reference.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/verify` | None | Verify Telegram initData, upsert User, return JWT |
| GET | `/jobs` | JWT | List open jobs (paginated, 20 per page) |
| POST | `/jobs` | JWT | Create a job. Validate: title ≥ 5 chars, budget > 0. Rate-limit: max 3 per user per hour. |
| GET | `/jobs/:id` | JWT | Full job detail |
| POST | `/proposals` | JWT | Submit proposal. No duplicates (@@unique enforced) |
| PATCH | `/proposals/:id` | JWT | Update proposal status (client only) |
| GET | `/admin/users/:id` | JWT + Admin | View user. Ban/unban. Trust override. |
| DELETE | `/admin/jobs/:id` | JWT + Admin | Delete spam job |
| POST | `/admin/reports/:jobId` | JWT + Admin | Flag a job for dispute review |
| POST | `/admin/users/:id/trust` | JWT + Admin | Adjust trust score or ban user |


**Admin check — backend:** All `/admin/*` routes verify that the JWT user's `telegramId` is in the hardcoded `ADMIN_IDS` array (see §11). Do not rely on env vars for this during MVP.

---

## 8. CURRENT TASK
> Read `docs/context/current_task.md` for the active task before writing any code.
> If that file does not exist yet, ask the developer: "What are we building in this session?"

---

## 9. ACTIVE BUGS
> Read `docs/context/active_bugs.md` before starting.
> If a bug is listed there, it takes priority over new feature work.

---

## 10. FEATURE STATUS REFERENCE

| Feature | Status |
|---|---|
| Vite + React + Tailwind shell | NOT_STARTED |
| Telegram SDK connection | NOT_STARTED |
| Fastify backend + /health | NOT_STARTED |
| Prisma schema + migrations + indexes | NOT_STARTED |
| JobCard component | NOT_STARTED |
| JobFeedView + React Query | NOT_STARTED |
| PostJobView + IndexedDB draft | NOT_STARTED |
| Backend GET/POST /jobs | NOT_STARTED |
| Telegram auth (initData verify) | NOT_STARTED |
| ProposalForm + draft | NOT_STARTED |
| Backend POST /proposals | NOT_STARTED |
| OTC contact reveal | NOT_STARTED |
| P2P feedback loops | NOT_STARTED |
| Admin panel (ID-gated, hardcoded) | NOT_STARTED |
| Trust score calculation | NOT_STARTED |
| Telegram Bot notifications | NOT_STARTED |

> Update this table when status changes. Valid values: `NOT_STARTED` · `IN_PROGRESS` · `DONE` · `BLOCKED`

---

## 11. KEY IMPLEMENTATION PATTERNS
> Always follow these. Do not invent alternatives.

**Null-safe data access — always:**
```ts
const jobs = data?.jobs ?? [];  // NEVER: data.jobs.map(...)
```

**Draft storage pattern:**
```ts
// On every form onChange (debounced 500ms):
await saveDraft('post-job', formData);          // IndexedDB via idb

// On component mount:
const draft = await loadDraft('post-job');
if (draft) prefillForm(draft);

// On successful submit:
await clearDraft('post-job');
```

**Payment state machine — never skip states:**
```
PENDING → AWAITING_VERIFICATION → CONFIRMED
                                → FAILED → (retry or REFUNDED)
```

**Trust score tiers:**
```
80–100 → 🔵 Verified
60–79  → 🟢 Trusted
40–59  → 🟡 Rising
0–39   → ⚪ New
```

**Admin ID check — hardcoded for MVP (backend middleware):**
```ts
// In src/middleware/admin.ts
// DO NOT use env vars for this during MVP — typos and formatting issues lock you out.
const ADMIN_IDS = ['YOUR_NUMERIC_TELEGRAM_ID_HERE'];

export function isAdmin(telegramId: string): boolean {
  return ADMIN_IDS.includes(telegramId);
}
// How to find your Telegram ID: message @userinfobot on Telegram.
// Migrate to env vars only after you have 2+ admins and real users on the platform.
```

**Spam detection — on POST /jobs middleware:**
```ts
const recentJobs = await prisma.job.count({
  where: {
    clientId: user.id,
    created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) } // last hour
  }
});
if (recentJobs >= 3) {
  return reply.code(429).send({ error: 'Too many jobs. Maximum 3 jobs per hour.' });
}
```

**Payment and webhook patterns are Phase 2 guidance only.**

Phase 1 does not include platform-managed payments, Chapa/Telebirr webhooks, or manual transaction verification. Build the OTC contact reveal and trust/feedback loop first.

**console.error labeling — every single time:**
```ts
// Always prefix with mission-task ID. Never use a bare console.error.
console.error('[M2-T1] initData HMAC check failed:', error);
```

**React Query invalidation after mutations — always:**
```ts
await queryClient.invalidateQueries({ queryKey: ['jobs'] });
```

**MVP testing order — follow exactly:**
1. Implement job posting, proposals, and proposal acceptance first
2. Show contact details immediately on accept
3. Add `Deal Confirmed` and `Report Ghosting/Breach`
4. Add admin dispute review and trust score updates
5. Keep payment gateway integration out of Phase 1

---

## 12. DEPLOYMENT NOTES
> Full notes in `docs/context/deployment_notes.md`.

- **Railway URL:** (set in deployment_notes.md after first deploy)
- **Required env vars:** `DATABASE_URL` · `BOT_TOKEN_DEV` · `BOT_TOKEN_PROD` · `BOT_MODE` · `JWT_SECRET` · `ADMIN_IDS` · `CHAPA_SECRET_KEY`
- **Start command:** `npx prisma migrate deploy && node dist/server.js`
- **PORT:** Must read from `process.env.PORT` — Railway injects this dynamically.
- **Never** run `prisma migrate reset` in production.

**Bot token separation — mandatory before writing any bot code:**
```
# .env (local dev)
BOT_TOKEN_DEV=<your dev bot token from @TefTef_Dev_Bot>
BOT_TOKEN_PROD=<your prod bot token from @TefTef_Prod_Bot>
BOT_MODE=DEV
```
```ts
// In bot initialisation
const botToken = process.env.BOT_MODE === 'PROD'
  ? process.env.BOT_TOKEN_PROD
  : process.env.BOT_TOKEN_DEV;
```
- Set `BOT_MODE=DEV` locally. Set `BOT_MODE=PROD` in Railway only.
- Create both bots in BotFather **before writing any notification code**. Mixing them sends test messages to real users.

---

## 13. ETHIOPIAN DEPLOYMENT CONSTRAINTS
> These are not edge cases. Design for them as the default.

- Assume 3G, not WiFi. Keep API responses under 10KB for list views.
- Never return full job descriptions in list endpoints. Cards only.
- All images must be SVG. No PNG/WebP backgrounds.
- OTC Connection Rule: When a client accepts a proposal, instantly transition the job status to `IN_PROGRESS` and reveal mutual communication handles (Telegram username/Phone number) to both parties.
- P2P Completion Loop: Trust updates are purely behavioral. Users manually click 'Deal Confirmed' or 'Report Ghosting/Breach' to trigger background Trust Score modifications.
- Spam rate limit is on by default: max 3 job posts per user per hour (see §11).
- At the end of every coding session, open Prisma Studio and visually verify the last record you touched has the correct status. Do not trust the API response alone.

---

## 14. DOCS/CONTEXT FILE MAP

| File | Read when |
|---|---|
| `docs/context/current_task.md` | Every session — before any code |
| `docs/context/active_bugs.md` | Every session — bugs take priority |
| `docs/context/schema_snapshot.md` | Any task touching the database |
| `docs/context/api_contracts.md` | Any task touching routes or fetch calls |
| `docs/context/architecture_rules.md` | When unsure if an approach is allowed |
| `docs/context/ui_rules.md` | Any task touching React components |
| `docs/context/deployment_notes.md` | Any task involving Railway or env vars |
| `docs/context/payment_flow.md` | Any task touching payments or transactions |
| `docs/context/feature_status.md` | Weekly review or when planning next task |
