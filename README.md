# TefTef

Telegram Mini App for an Ethiopian OTC freelance marketplace.

## Current status

- Mission 3 work is complete.
- Next task: **M4-T1 — P2P Feedback Loops and Trust Score updates**.
- Phase 2 features such as payments and Telegram bot notifications are not yet started.

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

1. Implement P2P feedback actions for accepted deals.
2. Update trust score tiers based on deal confirmation or dispute reports.
3. Start admin panel for manual review and dispute handling.
