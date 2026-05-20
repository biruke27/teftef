# Payment Flow

> Read before any task touching payments, transactions, or escrow.
> Phase 1 uses an OTC matchmaker model. The platform does not hold funds or process payments directly.

This document is retained for future payment-phase documentation, but current development should prioritize OTC contact exchange and behavioral trust flows instead of platform-managed payment state machines.

---

## Phase 1 Payment Guidance

- Clients and freelancers agree on payment terms off-platform via Telegram or phone.
- When a proposal is accepted, the job transitions to `IN_PROGRESS`.
- The platform reveals mutual contact details so parties can complete payment externally.
- After delivery, both parties can mark the deal as confirmed or report ghosting/breach.
- Trust score changes are behavioral, not tied to escrow or payment settlement in Phase 1.

---

## What to build now

1. Proposal acceptance should reveal contact details immediately.
2. Job status should move to `IN_PROGRESS` on acceptance.
3. Add UI actions for `Deal Confirmed` and `Report Ghosting/Breach`.
4. Use those actions to trigger trust score updates and job completion flows.

---

## Future phases

- Platform-managed payment routes and gateway integration belong to Phase 2.
- This document can be expanded later when the product moves beyond OTC matchmaking.

See `TefTef_CTO_Execution_OS_v2.1.md` §10.2 for full table.
