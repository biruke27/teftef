# Current Task

Mission: M0 — The Shell
Task: M0-T2 — Initialize Node.js + Fastify Backend with /health Route

**Goal:** A backend server that responds to GET /health and is accessible from the internet via Railway or Render deployment.

**Status:** IN_PROGRESS

**Completed today:**
- [x] mkdir teftef-api && npm init -y
- [x] npm install fastify @fastify/cors dotenv
- [x] npm install -D typescript ts-node @types/node
- [x] Create src/server.ts with GET /health route
- [x] Register @fastify/cors before any routes
- [x] Read PORT from process.env.PORT with fallback to 3000
- [x] Push to GitHub, connect to Railway, deploy
- [x] curl https://teftef-production.up.railway.app/health → confirm {status:'ok'}

**Next session starts at:**
- M0-T3: Setup Prisma with User and Job Models

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
2. [→] Backend /health + DB (M0-T2, M0-T3) ← YOU ARE HERE
3. [ ] Mock job feed (M1-T1, M1-T2)
4. [ ] PostJobView + draft (M1-T3)
5. [ ] Real backend + DB jobs
6. [ ] Telegram auth (M2-T1)
7. [ ] Proposals (M3-T1)
8. [ ] Payment + fallback (M4-T1)
9. [ ] Admin panel (M4-T2)
10. [ ] Trust score
11. [ ] Telegram Bot notifications
