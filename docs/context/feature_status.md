# Feature Status

> Valid values: `NOT_STARTED` · `IN_PROGRESS` · `DONE` · `BLOCKED`
> Update this after every session. Mark DONE only when verified on a real device.
> Do not try to "improve" DONE features unless explicitly asked.
> Every completed task should be tested and committed before progress is recorded.

**Last updated:** 2026-05-28 (M3-T2 complete, M4 next)

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
| JobFeedView + React Query | DONE ✅ | M1-T2 |
| PostJobView + IndexedDB draft | DONE ✅ | M1-T3 |
| Backend GET /jobs | DONE ✅ | M1-T2 |
| Backend POST /jobs | DONE ✅ | M1-T3 |

## Mission 2: Auth Bridge

| Feature | Status | Mission-Task |
|---|---|---|
| Telegram auth (initData verify) | DONE ✅ | M2-T1 |

## Mission 3: Proposals

| Feature | Status | Mission-Task |
|---|---|---|
| JobDetailView | DONE ✅ | M3-T1 |
| ProposalForm + IndexedDB draft | DONE ✅ | M3-T1 |
| Backend POST /proposals | DONE ✅ | M3-T1 |
| Backend PATCH /proposals/:id | DONE ✅ | M3-T2 |

## Mission 4: OTC Reputation Loops

| Feature | Status | Mission-Task |
|---|---|---|
| OTC contact reveal | DONE ✅ | M3-T2 |
| P2P feedback loops | NOT_STARTED | M4-T1 |
| Admin panel (ID-gated, hardcoded) | NOT_STARTED | M4-T2 |

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
