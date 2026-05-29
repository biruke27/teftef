# API Contracts

> Full endpoint contracts for TefTef backend.
> Paste the relevant section into every LLM prompt that touches routes or fetch calls.
> Update after every new or changed route.

**Last updated:** 2026-05-29 (M4-T2 admin routes)

---

## Auth

### POST `/auth/verify`
- **Auth required:** None
- **Request body:** `{ initData: string }` — raw Telegram WebApp initData string (URL-encoded, do NOT decode before passing)
- **Response (200):** `{ user: User, sessionToken: string }` — JWT, 7-day expiry
- **Response (401):** `{ error: 'Invalid initData' }`
- **Notes:** Verifies HMAC-SHA256. Upserts User record on success. BOT_TOKEN used as HMAC key via `HMAC-SHA256('WebAppData', botToken)`.

---

## Jobs

### GET `/jobs`
- **Auth required:** JWT
- **Query params:** `page?: number` (default: 1)
- **Response (200):** `{ jobs: JobCard[], total: number, page: number }`
- **JobCard shape:** `{ id, title, description, budget, status, trustTier, postedAt, proposalCount, clientName }`
- **Notes:** 20 per page. Only `OPEN` jobs. Indexed on `[status, created_at DESC]`. Never return the full description in list view.

### POST `/jobs`
- **Auth required:** JWT
- **Request body:** `{ title: string, description: string, budget: number }`
- **Validation:** `title.length >= 5`, `description.length > 0`, `budget > 0`
- **Rate limit:** Max 3 jobs per user per hour → `429 { error: 'Too many jobs. Maximum 3 jobs per hour.' }`
- **Response (201):** `{ job: Job }`

### GET `/jobs/:id`
- **Auth required:** JWT
- **Response (200):** `{ id, title, description, budget, status, clientName, clientId, trustTier, postedAt, proposalCount, myProposal?, clientContact?, freelancerContact? }`
- **Notes:** Returns full job detail. If the current user is the client and an accepted proposal exists, `freelancerContact` is included. If the current user is the freelancer with an accepted proposal, `clientContact` is included.
- **Response (404):** `{ error: 'Job not found' }`

### POST `/jobs/:id/feedback`
- **Auth required:** JWT — must be the job client or the accepted freelancer
- **Request body:** `{ action: 'CONFIRM' | 'REPORT' }`
- **Valid when:** `job.status === 'IN_PROGRESS'` and an accepted proposal exists
- **Response (200):** `{ job: { id, status }, trustUpdated: { clientTier, freelancerTier } }`
- **Side effects on CONFIRM:** Sets `job.status = COMPLETED`. Adds +8 to both client and freelancer `trust_score` (clamped 0–100).
- **Side effects on REPORT:** Sets `job.status = DISPUTED`. Subtracts 15 from the counterparty's `trust_score` (client reports → freelancer penalized; freelancer reports → client penalized).
- **Response (400):** Invalid action, job not `IN_PROGRESS`, or no accepted proposal
- **Response (403):** Caller is not a participant in the deal
- **Response (404):** `{ error: 'Job not found' }`

---

## Proposals

### POST `/proposals`
- **Auth required:** JWT
- **Request body:** `{ jobId: string, amount: number, message: string }`
- **Validation:** `amount > 0`, `message.length` between 20–500 chars, job must exist and be `OPEN`, freelancer cannot submit to their own job
- **Response (201):** `{ proposal: Proposal }`
- **Response (409):** `{ error: 'You have already submitted a proposal for this job.' }`

### GET `/jobs/:id/proposals`
- **Auth required:** JWT
- **Notes:** Job owner only.
- **Response (200):** `{ proposals: ProposalCard[], total: number, page: number }`
- **ProposalCard shape:** `{ id, amount, message, status, createdAt, freelancerName, trustTier }`

### PATCH `/proposals/:id`
- **Auth required:** JWT (client only — must own the job)
- **Request body:** `{ status: 'ACCEPTED' | 'REJECTED' }`
- **Response (200):** `{ proposal: Proposal }`
- **Side effects on ACCEPTED:** Sets `proposal.status = ACCEPTED`, rejects other pending proposals for the same job, and sets `job.status = IN_PROGRESS`.
- **Notes:** Telegram notification is planned, but current implementation logs a placeholder message for accepted proposals.

---

## Payments

Phase 1 uses an OTC matchmaker model. The platform does not hold funds or process payments directly in this phase. Clients and freelancers exchange Telegram handles after proposal acceptance and confirm delivery with behavioral feedback actions.

_Any payment gateway or transaction verification routes are Phase 2 work and not part of the MVP._

---

## Admin

All `/admin/*` routes require JWT plus a hardcoded admin Telegram ID in `teftef-api/src/middleware/admin.ts` (not env vars during MVP).

### GET `/admin/me`
- **Auth required:** JWT + admin
- **Response (200):** `{ isAdmin: true }`
- **Response (401):** Missing or invalid JWT
- **Response (403):** Authenticated user is not an admin

### GET `/admin/disputes`
- **Auth required:** JWT + admin
- **Query params:** `page?: number` (default: 1, 20 per page)
- **Response (200):** `{ disputes: DisputeCard[], total: number, page: number }`
- **DisputeCard shape:** `{ jobId, title, budget, status, postedAt, client, freelancer? }`
- **Party shape:** `{ id, username, telegramId, trustTier, is_banned }`
- **Notes:** Lists jobs with `status = DISPUTED`. `freelancer` is null if no accepted proposal exists.

### GET `/admin/users`
- **Auth required:** JWT + admin
- **Query params:** `telegramId` (required) — numeric Telegram user ID string
- **Response (200):** `{ user: { id, telegramId, username, trust_score, trustTier, is_banned, role_mode, created_at } }`
- **Response (400):** Missing `telegramId`
- **Response (404):** User not found

### PATCH `/admin/users/:id`
- **Auth required:** JWT + admin
- **Request body:** `{ is_banned: boolean }`
- **Response (200):** `{ user: { id, telegramId, username, is_banned, trust_score, trustTier } }`
- **Response (404):** User not found

### POST `/admin/users/:id/trust`
- **Auth required:** JWT + admin
- **Request body:** `{ trust_score: number }` — integer 0–100
- **Response (200):** `{ user: { id, telegramId, username, trust_score, trustTier, is_banned } }`
- **Response (400):** Invalid `trust_score`
- **Response (404):** User not found

### PATCH `/admin/jobs/:id`
- **Auth required:** JWT + admin
- **Request body:** `{ status: 'COMPLETED' | 'CLOSED' }`
- **Valid when:** Current job status is `DISPUTED`
- **Response (200):** `{ job: { id, status } }`
- **Response (400):** Invalid status or job is not `DISPUTED`
- **Response (404):** Job not found

### DELETE `/admin/jobs/:id`
- **Auth required:** JWT + admin
- **Response (204):** Empty body on success (deletes proposals then job)
- **Response (404):** Job not found

_Payment verification admin routes are Phase 2 and not implemented._

---

## Health

### GET `/health`
- **Auth required:** None
- **Response (200):** `{ status: 'ok', timestamp: number }`
