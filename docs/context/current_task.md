# Current Task

Mission: M3 — Proposals and OTC Flow
Task: M3-T1 — JobDetailView + Proposal Form

**Goal:** Build a job detail page that shows full job information and lets freelancers submit proposals.

**Status:** IN_PROGRESS

**Completed today:**
- [x] Create reusable `JobCard` component
- [x] Add mock job feed data to `App.tsx`
- [x] Render the job feed in a responsive grid layout
- [x] Verify frontend build succeeds with the new UI
- [x] Add `JobFeedView` with React Query and backend GET /jobs
- [x] Add PostJobView with automatic draft saving
- [x] Connect PostJobView to backend POST /jobs
- [x] Finalize draft persistence and local dev fallback
- [x] Implement Telegram auth verify and JWT session flow

**Note:** Every completed task must be tested and committed before moving to the next one.

**Next session starts at:**
- M3-T1: Job detail + proposal flow

---

## ✅ DONE

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
8. [ ] Proposals (M3-T1) ← YOU ARE HERE NEXT
9. [ ] Payment + fallback (M4-T1)
10. [ ] Admin panel (M4-T2)
11. [ ] Trust score
12. [ ] Telegram Bot notifications
