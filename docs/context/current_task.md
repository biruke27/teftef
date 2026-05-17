# Current Task

Mission: M0 — The Shell
Task: M0-T3 — Setup Prisma with User and Job Models

**Goal:** Add Prisma schema and client support for User, Job, Proposal, and Transaction models; prepare the backend for database migrations.

**Status:** DONE ✅

**Completed today:**
- [x] Install prisma and @prisma/client
- [x] Create prisma/schema.prisma with User, Job, Proposal, Transaction models
- [x] Add Prisma generate to backend build pipeline
- [x] Create Prisma client helper in teftef-api/src/prisma.ts
- [x] Validate Prisma schema
- [x] Generate initial migration SQL from schema
- [x] Connect a DATABASE_URL and run the first migration
- [x] Add DATABASE_URL to Railway backend service variables
- [x] Redeploy backend to Railway — migration applied successfully

**Next session starts at:**
- M1-T1: Mock job feed / JobCard component

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
3. [ ] Mock job feed (M1-T1, M1-T2) ← YOU ARE HERE NEXT
4. [ ] PostJobView + draft (M1-T3)
5. [ ] Real backend + DB jobs
6. [ ] Telegram auth (M2-T1)
7. [ ] Proposals (M3-T1)
8. [ ] Payment + fallback (M4-T1)
9. [ ] Admin panel (M4-T2)
10. [ ] Trust score
11. [ ] Telegram Bot notifications
