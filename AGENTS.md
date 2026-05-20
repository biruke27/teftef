# TefTef Agent Instructions

> **AI agents: Read [CLAUDE.md](CLAUDE.md) fully before writing any code.** This file summarizes key constraints. CLAUDE.md is the source of truth.

---

## Project Overview

**TefTef** is a Telegram Mini App (TMA) — a freelance marketplace for Ethiopia.
- **Solo developer** + small local LLM
- **Stack:** React + Vite + Tailwind (frontend) · Fastify + TypeScript (backend) · PostgreSQL + Prisma (database) · Railway (hosting)
- **Architecture:** Modular monolith. All decisions optimize for small-context-window LLM productivity.

---

## 🚨 Mandatory Architecture Rules

These are not style guidelines. Violating them breaks the project.

| Rule | Impact |
|------|--------|
| **Files < ~200 lines** | Split files before exceeding this. Helps agents stay in context. |
| **Mock data first** | Build UI with hardcoded data. Integrate backend APIs only after UI works. |
| **P2P OTC Connection** | Platform acts as matchmaker. No financial custody or payment tracking in Phase 1. |
| **No premature abstractions** | No service layers, repository patterns, or plugin systems. Write raw 3 times first. |
| **TypeScript/JavaScript only** | No Python in backend. |
| **Modular monolith** | One backend process. No microservices. |
| **Every feature fits in one LLM context window** | 4k–8k tokens max per task. Break it down if it doesn't fit. |
| **No feature takes more than 3 coding sessions** | Cut scope or redesign if it does. |

---

## 🛑 Kill List — Refuse These

If asked to build **any** of these, refuse and cite this list:

- Recommendation AI / matching algorithm
- In-app messaging system (use "Open Telegram Chat" links instead)
- Native iOS or Android app
- Microservices or separate backend services
- Blockchain, smart contracts, or crypto payments
- DAO governance or governance tokens
- Decentralized identity
- Complex analytics dashboard

---

## 📋 Tech Stack Quick Reference

| Layer | Tech | Notes |
|---|---|---|
| **Frontend** | React + Vite + Tailwind | Tailwind co-located. SVGs only, no PNG backgrounds. |
| **Backend** | Node.js + Fastify + TypeScript | Register `@fastify/cors` before routes. |
| **ORM** | Prisma | Schema is source of truth. Read schema before DB logic. |
| **Database** | PostgreSQL | On Railway. Use `prisma migrate deploy` in production. |
| **Auth** | Telegram SDK (`initData`) | HMAC-SHA256 verification. No passwords or JWT rotation. |
| **Payments** | OTC contact coordination | Reveal Telegram/phone contacts; do not custody funds. |
| **Offline** | IndexedDB via `idb` | Auto-save form drafts with 500ms debounce. |
| **Caching** | React Query | `staleTime: 5 * 60 * 1000`. Always invalidate after mutations. |
| **Hosting** | Railway | Listen on `process.env.PORT`. Run migrations on start. |
| **Notifications** | Telegram Bot API | Push alerts to user's chat list. Use DEV/PROD bot separation — see Deployment section below. |

---

## 📊 Database Models (Prisma)

See [CLAUDE.md §6](CLAUDE.md#6-prisma-schema-snapshot) for the full schema. Key models:

- **User:** `telegramId`, `role_mode` (CLIENT/FREELANCER), `trust_score`, `is_banned`, `phone_verified`
- **Job:** `clientId`, `title`, `description`, `budget`, `status` (OPEN/IN_PROGRESS/COMPLETED/DISPUTED/CLOSED) — indexed on `[status, created_at DESC]`
- **Proposal:** `jobId`, `freelancerId`, `amount`, `message`, `status` (PENDING/ACCEPTED/REJECTED/WITHDRAWN) — indexed on `jobId` and `freelancerId`
- **Transaction:** `userId`, `jobId`, `method` (CHAPA/TELEBIRR/MANUAL), `status` (PENDING/AWAITING_VERIFICATION/CONFIRMED/FAILED/REFUNDED) — indexed on `status` and `userId`

> **Indexes are mandatory.** Add all `@@index` directives before the first real user. Without them, the job feed degrades to 2–3s at 5000 rows.

---

## 🔌 API Contracts

See [CLAUDE.md §7](CLAUDE.md#7-api-contracts-summary) for full details. Key routes:

- **POST `/auth/verify`** — Verify Telegram initData, upsert User, return JWT
- **GET `/jobs`** — List open jobs. Paginated, 20 per page.
- **POST `/jobs`** — Create job. Rate-limited: max 3 per user per hour (429 if exceeded).
- **POST `/proposals`** — Submit proposal. No duplicates (enforced via `@@unique`).
- **POST `/payments/manual-claim`** — Submit manual TX ID after user pays manually.
- **POST `/payments/webhook`** — Chapa/Telebirr webhook. Must use retry logic (see Patterns below).
- **GET/POST `/admin/*`** — Admin-only. Verified against **hardcoded** `ADMIN_IDS` array — not env vars (see Patterns below).

---

## 🏗️ Implementation Patterns

**Null-safe data access:**
```ts
const jobs = data?.jobs ?? [];  // NEVER: data.jobs.map(...)
```

**Draft storage (500ms debounce):**
```ts
// On form change:
await saveDraft('post-job', formData);  // IndexedDB

// On mount:
const draft = await loadDraft('post-job');
if (draft) prefillForm(draft);

// On submit:
await clearDraft('post-job');
```

**Payment state machine:**
```
PENDING → AWAITING_VERIFICATION → CONFIRMED
                                → FAILED → (retry or REFUNDED)
```

**Admin ID check — hardcoded for MVP (not env vars):**
```ts
// In src/middleware/admin.ts
// DO NOT use env vars during MVP — typos/quotes/trailing spaces lock you out.
const ADMIN_IDS = ['YOUR_NUMERIC_TELEGRAM_ID_HERE'];

export function isAdmin(telegramId: string): boolean {
  return ADMIN_IDS.includes(telegramId);
}
// Find your Telegram ID: message @userinfobot on Telegram.
// Migrate to env vars only after 2+ admins and real users on the platform.
```

**Spam detection — on POST /jobs middleware:**
```ts
const recentJobs = await prisma.job.count({
  where: {
    clientId: user.id,
    created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) }
  }
});
if (recentJobs >= 3) {
  return reply.code(429).send({ error: 'Too many jobs. Maximum 3 jobs per hour.' });
}
```

**Webhook retry — on all payment webhook handlers:**
```ts
async function handleWebhookWithRetry(payload, retryCount = 0) {
  try {
    await processPayment(payload);
  } catch (error) {
    if (retryCount < 3) {
      setTimeout(() => {
        handleWebhookWithRetry(payload, retryCount + 1);
      }, 1000 * Math.pow(2, retryCount)); // 1s, 2s, 4s backoff
    } else {
      await prisma.failedWebhook.create({ data: { payload, error: error.message } });
      sendAdminAlert('Webhook failed after 3 retries');
    }
  }
}
```

**console.error labeling — every single time:**
```ts
// Always prefix with mission-task ID. Never use a bare console.error.
console.error('[M4-T1] payment verification failed:', error);
console.error('[M2-T1] initData HMAC check failed:', error);
```

**React Query invalidation after mutations:**
```ts
await queryClient.invalidateQueries({ queryKey: ['jobs'] });
```

**Payment testing order — follow exactly, never reverse:**
1. Implement "I Have Paid" with fake TX IDs first
2. Confirm admin panel shows `AWAITING_VERIFICATION`
3. Confirm admin can confirm and reject
4. Confirm user receives Telegram notification
5. Only then connect Chapa test mode

---

## 📚 Documentation Files

Once the project initializes, these files should exist in `docs/context/`:

- `current_task.md` — Active work. **Read this first before coding.**
- `active_bugs.md` — Bugs take priority over features.
- `schema_snapshot.md` — Prisma schema details.
- `api_contracts.md` — Full endpoint contracts.
- `architecture_rules.md` — Rationale behind mandatory rules.
- `ui_rules.md` — React/Tailwind conventions.
- `deployment_notes.md` — Railway setup + env vars.
- `feature_status.md` — Feature completion tracking.

---

## 🌍 Ethiopian Deployment Constraints

Design for these as the **default**, not edge cases:

- **Assume 3G, not WiFi.** API responses stay under 10KB for list views.
- **List endpoints omit full descriptions.** Cards only — details in separate endpoint.
- **All images are SVG.** No PNG/WebP backgrounds.
- **OTC connection first.** When a proposal is accepted, show both parties' Telegram username or phone. The platform does not hold funds.
- **Trust updates are behavioral.** Users manually click 'Deal Confirmed' or 'Report Ghosting/Breach' to trigger background trust score changes.
- **Spam rate limit is on by default.** Max 3 job posts per user per hour (see Patterns above).
- **Admin manual verification.** Admins verify payments within 2 hours. This is the primary path.
- **"Funds Secured" banner.** Show prominently (green) once payment confirmed. This is the trust signal.
- **Verify DB state directly.** At the end of every coding session, open Prisma Studio and visually confirm the last transaction or job has the correct status. Do not trust the API response alone.

---

## 🚀 Deployment Notes

**Required env vars:**
`DATABASE_URL` · `BOT_TOKEN_DEV` · `BOT_TOKEN_PROD` · `BOT_MODE` · `JWT_SECRET` · `ADMIN_IDS` · `CHAPA_SECRET_KEY`

**Bot token separation — set up before writing any notification code:**
```
# .env (local dev)
BOT_TOKEN_DEV=<token from @TefTef_Dev_Bot>
BOT_TOKEN_PROD=<token from @TefTef_Prod_Bot>
BOT_MODE=DEV
```
```ts
const botToken = process.env.BOT_MODE === 'PROD'
  ? process.env.BOT_TOKEN_PROD
  : process.env.BOT_TOKEN_DEV;
```
- `BOT_MODE=DEV` locally. `BOT_MODE=PROD` in Railway only. Never reversed.
- Mixing bots sends test notifications to real users. Create both in BotFather first.

**Start command:** `npx prisma migrate deploy && node dist/server.js`
**Never** run `prisma migrate reset` in production.

---

## 🚀 Workflow for AI Agents

1. **Before coding:** Read [CLAUDE.md](CLAUDE.md) fully.
2. **If unsure about feasibility:** Check the Kill List. If it's there, refuse.
3. **If working on features:** Check `docs/context/current_task.md` (and `active_bugs.md`) for priority.
4. **When integrating with backend:** Follow the API contracts from `docs/context/api_contracts.md` or [CLAUDE.md §7](CLAUDE.md#7-api-contracts-summary).
5. **When building state loops for Jobs or Proposals:** Ensure the state mapping bypasses funding. The transition flows directly from `PROPOSAL_ACCEPTED` → `IN_PROGRESS` (with contact detail exposure) → `COMPLETED_PENDING_RATING`.
6. **When touching database:** Verify schema in `prisma/schema.prisma` or [CLAUDE.md §6](CLAUDE.md#6-prisma-schema-snapshot). Confirm all `@@index` directives are present.
6. **Before deploying:** Ensure `prisma migrate deploy` is in the start command.
7. **End of every session:** Run `npx prisma studio` and visually confirm the last record has the correct DB status.

---

## ✅ Feature Status

See [CLAUDE.md §10](CLAUDE.md#10-feature-status-reference) for full tracking. All features start as `NOT_STARTED`.

---

## Questions?

- **Architecture rationale?** See [CLAUDE.md §2](CLAUDE.md#2-mandatory-architecture-rules).
- **Detailed tech decisions?** See [CLAUDE.md §5](CLAUDE.md#5-tech-stack-reference).
- **Payment flow?** See [CLAUDE.md §11](CLAUDE.md#11-key-implementation-patterns).
- **Deployment & env vars?** See [CLAUDE.md §12](CLAUDE.md#12-deployment-notes).
- **What to build next?** See [CLAUDE.md §8](CLAUDE.md#8-current-task) or `docs/context/current_task.md` once created.
