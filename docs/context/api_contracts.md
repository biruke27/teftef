# API Contracts

> Full endpoint contracts for TefTef backend.
> Paste the relevant section into every LLM prompt that touches routes or fetch calls.
> Update after every new or changed route.

**Last updated:** 2026-05-16 (initial — no routes implemented yet)

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
- **Query params:** `page?: number` (default: 1), `category?: string`
- **Response (200):** `{ jobs: JobCard[], total: number, page: number }`
- **JobCard shape:** `{ id, title, description_preview (max 120 chars), budget, status, trustTier, createdAt, proposalCount }`
- **Notes:** 20 per page. Only `OPEN` jobs. Indexed on `[status, created_at DESC]`. Never return full description in list view.

### POST `/jobs`
- **Auth required:** JWT
- **Request body:** `{ title: string, description: string, budget: number, category?: string }`
- **Validation:** `title.length >= 5`, `budget > 0`
- **Rate limit:** Max 3 jobs per user per hour → 429 `{ error: 'Too many jobs. Maximum 3 jobs per hour.' }`
- **Response (201):** `{ job: Job }`

### GET `/jobs/:id`
- **Auth required:** JWT
- **Response (200):** `{ job: Job & { proposals: Proposal[], client: User } }` — full detail
- **Response (404):** `{ error: 'Job not found' }`

---

## Proposals

### POST `/proposals`
- **Auth required:** JWT
- **Request body:** `{ jobId: string, amount: number, message: string }`
- **Validation:** `amount > 0`, `message.length` between 20–500 chars, no existing proposal from same freelancerId for this jobId
- **Response (201):** `{ proposal: Proposal }`
- **Response (409):** `{ error: 'Already applied to this job' }` — enforced by `@@unique([jobId, freelancerId])`

### PATCH `/proposals/:id`
- **Auth required:** JWT (client only — must own the job)
- **Request body:** `{ status: 'ACCEPTED' | 'REJECTED' }`
- **Response (200):** `{ proposal: Proposal }`
- **Side effects on ACCEPTED:** Creates Transaction record with `status: PENDING`. Sends Telegram notification to freelancer.

---

## Payments

### POST `/payments/manual-claim`
- **Auth required:** JWT
- **Request body:** `{ transactionId: string, manualTxId: string }`
- **Response (200):** `{ transaction: Transaction }`
- **Side effects:** Sets `status: AWAITING_VERIFICATION`, stores `manual_tx_id`. Sends Telegram Bot message to all ADMIN_IDS.

### POST `/payments/webhook`
- **Auth required:** Chapa/Telebirr signature header (not JWT)
- **Request body:** Chapa/Telebirr webhook payload (varies by gateway)
- **Notes:** Must use retry logic (3 retries, exponential backoff). Look up Transaction by `gateway_ref`, not by ID. Save failed webhooks to DB.

---

## Admin (all routes require JWT + telegramId in hardcoded ADMIN_IDS)

### GET `/admin/transactions`
- **Query params:** `status?: TxStatus` (default: `AWAITING_VERIFICATION`)
- **Response (200):** `{ transactions: Transaction[] }`

### POST `/admin/transactions/:id/verify`
- **Request body:** `{ approved: boolean, note?: string }`
- **Response (200):** `{ transaction: Transaction }`
- **Side effects on approved:** Sets `status: CONFIRMED`, `admin_verified: true`. Sends Telegram message to client.
- **Side effects on rejected:** Sets `status: FAILED`. Sends Telegram message to client.

### GET `/admin/users/:id`
- **Response (200):** `{ user: User }`

### PATCH `/admin/users/:id`
- **Request body:** `{ is_banned?: boolean, trust_score?: number, admin_note?: string }`
- **Response (200):** `{ user: User }`

### DELETE `/admin/jobs/:id`
- **Response (204):** No content

### POST `/admin/escrow/release/:jobId`
- **Response (200):** `{ transaction: Transaction }`
- **Side effects:** Sets Transaction status to CONFIRMED. Sends Telegram notification to freelancer.

---

## Health

### GET `/health`
- **Auth required:** None
- **Response (200):** `{ status: 'ok', timestamp: number }`
