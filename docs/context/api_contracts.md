# API Contracts

> Full endpoint contracts for TefTef backend.
> Paste the relevant section into every LLM prompt that touches routes or fetch calls.
> Update after every new or changed route.

**Last updated:** 2026-05-28

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

Admin routes are planned but not currently implemented in the backend. All admin work in Phase 1 is manual and gated by hardcoded `ADMIN_IDS` when added.

---

## Health

### GET `/health`
- **Auth required:** None
- **Response (200):** `{ status: 'ok', timestamp: number }`
