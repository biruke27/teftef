# Current Task

Mission: M1 — The Job Board
Task: M1-T1 — Mock job feed / JobCard component

**Goal:** Build a working mock job feed UI and reusable JobCard component before wiring the feed to the backend.

**Status:** DONE ✅

**Completed today:**
- [x] Create reusable `JobCard` component
- [x] Add mock job feed data to `App.tsx`
- [x] Render the job feed in a responsive grid layout
- [x] Verify frontend build succeeds with the new UI

**Next session starts at:**
- M1-T2: JobFeedView + React Query

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
3. [x] Mock job feed (M1-T1) ✅
4. [ ] JobFeedView + React Query (M1-T2) ← YOU ARE HERE NEXT
5. [ ] PostJobView + draft (M1-T3)
6. [ ] Real backend + DB jobs
6. [ ] Telegram auth (M2-T1)
7. [ ] Proposals (M3-T1)
8. [ ] Payment + fallback (M4-T1)
9. [ ] Admin panel (M4-T2)
10. [ ] Trust score
11. [ ] Telegram Bot notifications
