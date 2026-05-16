# Payment Flow

> Read before any task touching payments, transactions, or escrow.
> This is the authoritative payment state machine for TefTef.

**Last updated:** 2026-05-16 (initial)
**Current gateway mode:** NOT YET CONNECTED (test mode pending)
**Webhook URL:** (not yet deployed)

---

## Payment State Machine

```
PENDING
  ├── [Chapa/Telebirr webhook fires] → CONFIRMED (automatic, rare in Ethiopia)
  └── [User taps "I Have Paid"] → AWAITING_VERIFICATION
        ├── [Admin confirms TX ID] → CONFIRMED
        └── [Admin rejects TX ID] → FAILED
              └── [User retries] → AWAITING_VERIFICATION (new attempt)
              └── [Admin initiates] → REFUNDED
```

Never skip states. A PENDING transaction must not jump directly to CONFIRMED without going through the correct path.

---

## Implementation Testing Order (MANDATORY — never reverse)

1. Implement "I Have Paid" button with fake transaction IDs
2. Confirm admin panel shows `AWAITING_VERIFICATION`
3. Confirm admin can confirm and reject
4. Confirm user receives Telegram notification on confirmation
5. **Only then** connect Chapa test mode

**Why:** If you connect Chapa first and something fails, you cannot isolate whether the bug is in Chapa's webhook, your fallback logic, or your database state.

---

## Gateway Reference (gateway_ref)

When creating a Transaction for a Chapa payment:
- Set `gateway_ref = tx_ref` you send to Chapa (your internal Transaction ID)
- In webhook handler: look up Transaction by `gateway_ref`, NOT by Transaction.id
- The raw Chapa webhook payload will not contain your internal Transaction ID — only the `tx_ref` you passed to Chapa

---

## User-Facing States

| DB Status | User Sees |
|---|---|
| `PENDING` | QR code or Telebirr deep link |
| `AWAITING_VERIFICATION` | "Your payment is being verified (usually < 2 hours)" + spinner |
| `CONFIRMED` | ✅ "Funds Secured" banner (prominent green) on job page |
| `FAILED` | ❌ "Transaction ID not found. Please resubmit or contact support." |
| `REFUNDED` | Transaction reversed. Admin manually initiates. |

---

## Admin-Facing States

| DB Status | Admin Sees |
|---|---|
| `AWAITING_VERIFICATION` | TX ID, manual_tx_id, amount, username, timestamp + Confirm/Reject buttons |
| `CONFIRMED` | Verified. No action needed. |
| `FAILED` | Rejected. Optional: resend notification button. |

---

## Webhook Retry Logic (mandatory on all webhook handlers)

```ts
async function handleWebhookWithRetry(payload, retryCount = 0) {
  try {
    await processPayment(payload);
  } catch (error) {
    if (retryCount < 3) {
      setTimeout(() => {
        handleWebhookWithRetry(payload, retryCount + 1);
      }, 1000 * Math.pow(2, retryCount)); // 1s, 2s, 4s
    } else {
      await prisma.failedWebhook.create({ data: { payload, error: error.message } });
      sendAdminAlert('Webhook failed after 3 retries');
    }
  }
}
```

---

## Known Failure Modes

| Scenario | Resolution |
|---|---|
| Telebirr deducted, webhook never fires | User taps "I Have Paid". Submits TX ID. Admin verifies within 2 hours. |
| User claims payment but did not pay | Admin rejects. Transaction → FAILED. User notified via Telegram. |
| Chapa session times out | Show "Try Again". Reinitialize Chapa session with same Transaction ID. |
| Double payment | Admin detects duplicate, marks one REFUNDED, sends note to user. |
| Full gateway outage | Switch to MANUAL mode. All payments via "I Have Paid". Broadcast to active users. |

---

## Partial Payment Failure Scenarios (from Part 10.2)

See `TefTef_CTO_Execution_OS_v2.1.md` §10.2 for full table.
