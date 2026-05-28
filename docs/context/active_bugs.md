# Active Bugs

> If a bug is listed here, it takes priority over new feature work.
> One active bug at a time. Do not bring multiple bugs into one LLM session.
> Clear resolved bugs with a RESOLVED status and the fix.

---

## Status: NO ACTIVE BUGS

Project is freshly initialized. No bugs yet.

---

## RESOLVED BUGS

## BUG: ngrok tunnel port mismatch caused blank page and failed job fetch
**Mission-Task:** M1-T3 / Dev tunnel verification
**Status:** RESOLVED
**Symptom:** Public ngrok URL opened to a blank or stuck page and the app showed "Unable to load jobs" with retry prompt.
**Suspected Cause:** ngrok was forwarding to port `3200` while the Vite dev server was running on `5174`; additionally, the frontend used an absolute localhost backend URL instead of a relative path, which broke tunnel-based requests.
**What Was Tried:** Verified Vite and backend ports, checked local LAN access, confirmed API responses on `http://10.255.255.254:5174/jobs`, and inspected the tunnel health endpoint.
**Fix (if resolved):** Added Vite proxy settings in `teftef-app/vite.config.ts` and changed `teftef-app/src/lib/jobs.ts` to use a relative base URL. Verified `https://pouch-finisher-expand.ngrok-free.dev/` and `/jobs` return `200 OK`.
**Prevent future recurrence:** always align tunnel port with Vite's host port, use relative API paths with dev proxy config for tunnel deployments, and add a tunnel health checklist before remote testing.

---

## Bug Template (copy when adding a new bug)

```
## BUG: [Short Description]
**Mission-Task:** M0-T1
**Status:** OPEN | RESOLVED
**Symptom:** What the user/dev sees
**Suspected Cause:** Your best hypothesis
**What Was Tried:** List of attempts
**Fix (if resolved):** What actually fixed it
**Debugging prompt:** Paste into LLM to get help
```
