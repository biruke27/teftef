# Feature Status

> Valid values: `NOT_STARTED` · `IN_PROGRESS` · `DONE` · `BLOCKED`
> Update this after every session. Mark DONE only when verified on a real device.
> Do not try to "improve" DONE features unless explicitly asked.

**Last updated:** 2026-05-16 (M0-T1 complete)

---

## Mission 0: The Shell

| Feature | Status | Mission-Task |
|---|---|---|
| Vite + React + Tailwind shell | DONE ✅ | M0-T1 |
| Telegram SDK connection | DONE ✅ | M0-T1 |
| Fastify backend + /health | DONE ✅ | M0-T2 |
| Prisma schema + migrations + indexes | DONE ✅ | M0-T3 |

## Mission 1: The Job Board

| Feature | Status | Mission-Task |
|---|---|---|
| JobCard component | DONE ✅ | M1-T1 |
| JobFeedView + React Query | NOT_STARTED | M1-T2 |
| PostJobView + IndexedDB draft | NOT_STARTED | M1-T3 |
| Backend GET /jobs | NOT_STARTED | M1-T2 |
| Backend POST /jobs | NOT_STARTED | M1-T3 |

## Mission 2: Auth Bridge

| Feature | Status | Mission-Task |
|---|---|---|
| Telegram auth (initData verify) | NOT_STARTED | M2-T1 |

## Mission 3: Proposals

| Feature | Status | Mission-Task |
|---|---|---|
| JobDetailView | NOT_STARTED | M3-T1 |
| ProposalForm + IndexedDB draft | NOT_STARTED | M3-T1 |
| Backend POST /proposals | NOT_STARTED | M3-T1 |
| Backend PATCH /proposals/:id | NOT_STARTED | M3-T1 |

## Mission 4: The Money

| Feature | Status | Mission-Task |
|---|---|---|
| Payment initiation (Chapa/Telebirr) | NOT_STARTED | M4-T1 |
| Payment fallback "I Have Paid" flow | NOT_STARTED | M4-T1 |
| Webhook retry handler | NOT_STARTED | M4-T1 |
| Admin panel (ID-gated, hardcoded) | NOT_STARTED | M4-T2 |
| Admin payment verification workflow | NOT_STARTED | M4-T2 |

## Phase 2 (Post-MVP — Do Not Build Until MVP is Live)

| Feature | Status |
|---|---|
| Trust score calculation | NOT_STARTED |
| Telegram Bot notifications | NOT_STARTED |
| Trust Score Dashboard | NOT_STARTED |
| Review System | NOT_STARTED |
| Dispute Resolution UI | NOT_STARTED |
| Skill Verification | NOT_STARTED |
| Portfolio Media Upload | NOT_STARTED |
| Automated Escrow Release | NOT_STARTED |
| Scheduled Jobs | NOT_STARTED |
