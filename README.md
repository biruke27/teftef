# TefTef

Telegram Mini App for an Ethiopian OTC freelance marketplace.

## Current status

- Mission 4 (OTC reputation loops) is complete: feedback, trust deltas, and admin dispute panel.
- Admin UI: open **`/admin`** in the Mini App (Telegram ID must be in `teftef-api/src/middleware/admin.ts`).
- Next up: Telegram bot notifications and other Phase 2 items.

## Key docs

- `docs/context/current_task.md` — current mission and next task.
- `docs/context/feature_status.md` — feature completion status.
- `docs/context/api_contracts.md` — backend endpoint contracts.
- `docs/context/active_bugs.md` — bug tracking.

## Project structure

- `teftef-app/` — React + Vite + Tailwind frontend.
- `teftef-api/` — Fastify + TypeScript backend with Prisma.
- `docs/context/` — planning, tracking, and status files.

## Next work

1. Telegram bot notifications for proposals and admin actions.
2. Reject banned users on `POST /jobs` and `POST /proposals`.
3. Real-device pass on `/admin` with a `DISPUTED` job in the queue.
