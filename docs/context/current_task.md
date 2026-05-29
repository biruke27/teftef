# Current Task

Mission: 5 — Notifications & polish (or next MVP slice)
Task: TBD — see feature_status.md

**Goal:** Pick the next post-MVP slice (e.g. Telegram bot notifications) after Mission 4 is verified on a real device.

**Status:** NOT_STARTED

**What’s completed:**
- [x] M4-T2 Admin panel (`/admin`, dispute queue, ban/trust/job actions, `ADMIN_IDS` hardcoded)
- [x] M4-T1 P2P feedback loops (`POST /jobs/:id/feedback`, `DealActions` UI, trust deltas)
- [x] M3 proposal flow and OTC contact reveal
- [x] Job posting, job feed, Telegram auth, and proposal submission
- [x] Client accept/reject flow with job state transition to `IN_PROGRESS`
- [x] Mutual contact details revealed once a proposal is accepted

**Next session starts at:**
- Telegram bot notifications (Phase 2) or banned-user guards on write routes

---

## ✅ DONE

### M4-T2 — Admin Panel (DONE 2026-05-29)
- [x] `middleware/admin.ts` with `ADMIN_IDS` (Telegram ID `8548332856`)
- [x] Admin API: `/admin/me`, `/admin/disputes`, user lookup/ban/trust, job resolve/delete
- [x] `AdminPanelView` at `/admin` (non-admins see “Page not found”)
- [x] Verification: `teftef-api/scripts/verify-m4t2.mjs` (full run needs DB reachable)

### M4-T1 — P2P Feedback Loops (DONE 2026-05-29)
- [x] `POST /jobs/:id/feedback` with `CONFIRM` (+8 both parties, job `COMPLETED`) and `REPORT` (−15 counterparty, job `DISPUTED`)
- [x] `DealActions` component wired in `JobDetailView` for client and freelancer OTC blocks
- [x] API verification script: `teftef-api/scripts/verify-m4t1.mjs` (CONFIRM/REPORT/duplicate guard)

### M0-T1 — Vite + React + Tailwind Shell (DONE 2026-05-16)
- [x] Vite + React + TypeScript project created
- [x] Tailwind v3 installed and configured
- [x] Telegram SDK script tag added to index.html
- [x] App.tsx reads window.Telegram.WebApp.initDataUnsafe.user.first_name
- [x] WebApp.ready() called on mount
- [x] Verified on real phone inside Telegram — shows authenticated user's first name ✅

---

**Build sequence:**
1. [x] Bot opens Mini App shell (M0-T1) ✅ DONE
2. [x] Backend /health + DB (M0-T2, M0-T3) ✅ DONE
3. [x] Mock job feed (M1-T1) ✅ DONE
4. [x] JobFeedView + React Query (M1-T2) ✅ DONE
5. [x] PostJobView + draft (M1-T3) ✅ DONE
6. [x] Real backend + DB jobs ✅ DONE
7. [x] Telegram auth (M2-T1) ✅ DONE
8. [x] Proposals (M3-T1) ✅ DONE
9. [x] OTC contact reveal (M3-T2) ✅ DONE
10. [x] P2P feedback loops (M4-T1) ✅ DONE
11. [x] Admin panel (M4-T2) ✅ DONE
12. [ ] Trust score
13. [ ] Telegram Bot notifications
