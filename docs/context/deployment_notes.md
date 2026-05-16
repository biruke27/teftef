# Deployment Notes

> Read before any task involving Railway, env vars, or deployment.
> Full deployment reference for TefTef.

**Last updated:** 2026-05-16 (initial — not yet deployed)

---

## Railway URLs

| Service | URL | Status |
|---|---|---|
| Backend API | (not yet deployed) | NOT_STARTED |
| Frontend | (not yet deployed — served as static or via Railway) | NOT_STARTED |

---

## Required Environment Variables

| Variable | Where Used | Notes |
|---|---|---|
| `DATABASE_URL` | Backend (Prisma) | Format: `postgresql://user:pass@host:port/dbname?schema=public` |
| `BOT_TOKEN_DEV` | Backend (Telegram Bot) | From @TefTef_Dev_Bot in BotFather |
| `BOT_TOKEN_PROD` | Backend (Telegram Bot) | From @TefTef_Prod_Bot in BotFather |
| `BOT_MODE` | Backend | `DEV` locally · `PROD` in Railway only. Never reversed. |
| `JWT_SECRET` | Backend (auth) | Use env var, NOT randomly generated at runtime — must be stable across restarts |
| `ADMIN_IDS` | Backend (admin middleware) | Hardcoded in `src/middleware/admin.ts` for MVP — NOT from env vars |
| `CHAPA_SECRET_KEY` | Backend (payments) | Chapa test key for dev, live key for prod |

---

## Start Command (Railway)

```
npx prisma migrate deploy && node dist/server.js
```

> ⚠️ NEVER run `prisma migrate reset` in production. Use `prisma migrate deploy` only.

---

## Bot Token Separation

Create both bots in BotFather BEFORE writing any notification code:
- `@TefTef_Dev_Bot` → `BOT_TOKEN_DEV`
- `@TefTef_Prod_Bot` → `BOT_TOKEN_PROD`

```
# .env (local dev)
BOT_TOKEN_DEV=<token from @TefTef_Dev_Bot>
BOT_TOKEN_PROD=<token from @TefTef_Prod_Bot>
BOT_MODE=DEV
```

```ts
// In bot initialisation
const botToken = process.env.BOT_MODE === 'PROD'
  ? process.env.BOT_TOKEN_PROD
  : process.env.BOT_TOKEN_DEV;
```

- `BOT_MODE=DEV` locally. `BOT_MODE=PROD` in Railway only.
- Mixing bots will send test notifications to real users. Create both first.

---

## PORT Binding

Railway injects `PORT` dynamically. The app MUST listen on `process.env.PORT`:

```ts
const port = Number(process.env.PORT) || 3000;
await app.listen({ port, host: '0.0.0.0' });
```

---

## Last Successful Deploy

| Date | Commit Hash | Notes |
|---|---|---|
| (not yet deployed) | — | — |

---

## Known Deployment Quirks

- None yet — update as discovered.
