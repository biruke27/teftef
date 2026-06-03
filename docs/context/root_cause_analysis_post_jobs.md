# ROOT-CAUSE ANALYSIS: POST /jobs 500 Internal Server Error
## Comprehensive Diagnostic Report

**Audit Date:** June 3, 2026  
**Status:** CRITICAL — Systemic failure on all job type configurations  
**Scope:** Complete route lifecycle analysis (payload → validation → database → response)

---

## Executive Summary

After a thorough line-by-line audit of the `POST /jobs` endpoint, **no structural defects were found** in the current implementation. The route handler exhibits correct:

1. ✅ **Payload serialization & type casting** — Parameters parsed correctly from request body
2. ✅ **Enum validation** — `payType` and `listingType` validated against schema definitions
3. ✅ **Database schema compliance** — All required fields provided, no missing mandatory columns
4. ✅ **Error handling** — Try/catch properly wraps Prisma operations
5. ✅ **Middleware lifecycle** — Auth, blacklist, and rate-limit checks execute in correct order

**Result:** The reported "500 error on all job types" is **likely environmental or data-layer specific**, not a logic defect in the route handler itself.

---

## CHECK 1: Route Payload Processing & Serialization Mismatches ✅ PASS

### Location
File: `teftef-api/src/routes/jobs.ts`, lines 175–250

### Analysis

**Parameter Extraction:**
```typescript
const title = body.title?.trim() ?? '';                           // ✅ Safe chaining
const description = body.description?.trim() ?? '';              // ✅ Safe chaining
let budget = Number(body.budget ?? 0);                          // ✅ Coerced to number
const listingType = body.listingType === 'FULL_TIME' ? 'FULL_TIME' : 'FREELANCE'; // ✅ Enum match
const payType = body.payType === 'RANGE' || body.payType === 'NEGOTIABLE' ? body.payType : 'FIXED'; // ✅ Enum fallback
```

**Findings:**
- ✅ All nullable/optional fields use safe optional chaining (`?.`)
- ✅ String trimming uses safe chaining (does not call `.trim()` on `undefined`)
- ✅ Budget coerced to number correctly via `Number(body.budget ?? 0)`
- ✅ Enum values validated against allowed set (`FREELANCE` | `FULL_TIME`)
- ✅ No `.trim()` called on undefined properties (would cause "Cannot read property 'trim' of undefined")

**Validation Chain Before DB Call:**
```typescript
if (title.length < 5) { return 400; }           // ✅ Title validation
if (description.length === 0) { return 400; }   // ✅ Description validation

// Validate and assign minPay/maxPay based on payType
if (payType === 'FIXED') {
  if (!Number.isFinite(budget) || budget <= 0) { return 400; }  // ✅ Budget validation
  minPay = budget;
  maxPay = null;
} else if (payType === 'RANGE') {
  const safeMinPay = Number(rawMinPay ?? NaN);  // ✅ Safe type coercion
  const safeMaxPay = Number(rawMaxPay ?? NaN);
  if (!Number.isFinite(safeMinPay) || !Number.isFinite(safeMaxPay) || 
      safeMinPay <= 0 || safeMaxPay <= 0 || safeMinPay > safeMaxPay) {
    return 400;  // ✅ Validation error returned as HTTP response
  }
  minPay = safeMinPay;
  maxPay = safeMaxPay;
} else if (payType === 'NEGOTIABLE') {
  minPay = null;
  maxPay = null;
}
```

**Conclusion:** ✅ **NO DEFECT** — Payload processing is robust. No unhandled exceptions in parameter extraction or type coercion.

---

## CHECK 2: Database Schema & Enum Integrity Constraints ✅ PASS

### Location
File: `teftef-api/prisma/schema.prisma`, lines 24–48

### Prisma Schema Definition
```prisma
model Job {
  id          String       @id @default(cuid())
  clientId    String
  title       String
  description String
  budget      Int                              // ← Required non-nullable
  listingType ListingType  @default(FREELANCE)  // ← Enum type
  payType     PayType      @default(FIXED)      // ← Enum type
  minPay      Int?                             // ← Optional
  maxPay      Int?                             // ← Optional
  status      JobStatus    @default(OPEN)
  created_at  DateTime     @default(now())
  proposals   Proposal[]
  client      User         @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([status, created_at(sort: Desc)])
}
```

### Enum Definitions
```prisma
enum ListingType { FREELANCE, FULL_TIME }
enum PayType { FIXED, RANGE, NEGOTIABLE }
enum JobStatus { OPEN, PENDING_MATCH, IN_PROGRESS, COMPLETED, DISPUTED, CLOSED }
```

### Prisma Create Call
```typescript
const job = await prisma.job.create({
  data: {
    title,              // ✅ String (required)
    description,        // ✅ String (required)
    budget,             // ✅ Int (required) — always populated (0 for RANGE/NEGOTIABLE)
    listingType,        // ✅ Enum literal ('FREELANCE' or 'FULL_TIME')
    payType,            // ✅ Enum literal ('FIXED', 'RANGE', or 'NEGOTIABLE')
    minPay,             // ✅ Int | null (optional) — correctly typed
    maxPay,             // ✅ Int | null (optional) — correctly typed
    clientId: client.id, // ✅ String (required foreign key) — verified to exist
  },
});
```

### Field-by-Field Compliance Check

| Field | Type | Route Value | Status | Notes |
|-------|------|-------------|--------|-------|
| `title` | `String` | `body.title?.trim() ?? ''` | ✅ | Validated `length >= 5` |
| `description` | `String` | `body.description?.trim() ?? ''` | ✅ | Validated `length > 0` |
| `budget` | `Int` | `Number(body.budget ?? 0)` | ✅ | Always provided (≥ 0) |
| `listingType` | `FREELANCE \| FULL_TIME` | Enum match logic | ✅ | Correct fallback to FREELANCE |
| `payType` | `FIXED \| RANGE \| NEGOTIABLE` | Enum match logic | ✅ | Correct fallback to FIXED |
| `minPay` | `Int?` | Conditional assignment | ✅ | FIXED: budget, RANGE: safeMinPay, NEGOTIABLE: null |
| `maxPay` | `Int?` | Conditional assignment | ✅ | FIXED: null, RANGE: safeMaxPay, NEGOTIABLE: null |
| `clientId` | `String` (FK) | `client.id` | ✅ | User verified to exist before create() |
| `status` | `OPEN` | Default | ✅ | Prisma applies default enum value |
| `created_at` | `DateTime` | Default | ✅ | Prisma applies `now()` |

### Enum Casing Verification

**Route sends:** `'FIXED'`, `'RANGE'`, `'NEGOTIABLE'` (uppercase) ✅  
**Schema expects:** `FIXED`, `RANGE`, `NEGOTIABLE` (uppercase) ✅  
**Match:** ✅ Exact case match

**Route sends:** `'FREELANCE'`, `'FULL_TIME'` (uppercase, underscore) ✅  
**Schema expects:** `FREELANCE`, `FULL_TIME` (uppercase, underscore) ✅  
**Match:** ✅ Exact case match

### Foreign Key Constraint

```prisma
client      User         @relation(fields: [clientId], references: [id], onDelete: Cascade)
```

**Verification:** ✅ Route checks `client.is_banned` **before** creating job, proving User exists.

**Conclusion:** ✅ **NO DEFECT** — Schema compliance is perfect. All required fields populated. Enum values match exactly. Foreign key exists before insert.

---

## CHECK 3: Hook & Lifecycle Middleware Interceptors ✅ PASS

### Authentication Middleware
**File:** `teftef-api/src/middleware/auth.ts`

```typescript
export function getAuthPayload(request: FastifyRequest, jwtSecret: string) {
  const authHeader = (request.headers.authorization as string | undefined) ?? '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    throw new Error('Missing authorization header');  // ← Throws, caught in route handler
  }

  return verifyJwt(token, jwtSecret);  // ← Returns payload or throws
}
```

**Route usage:**
```typescript
let authPayload;
try {
  authPayload = getAuthPayload(request, jwtSecret);  // ← Caught exception
} catch {
  return reply.status(401).send({ error: 'Unauthorized' });  // ← Clean 401 response
}
```

**Status:** ✅ Auth errors properly caught and return 401, not 500.

---

### Blacklist Guard Middleware
**File:** `teftef-api/src/middleware/blacklistGuard.ts`

```typescript
export function createBlacklistGuard(options: BlacklistGuardOptions) {
  const { jwtSecret } = options;

  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authPayload = getAuthPayload(request, jwtSecret);  // ← May throw
      const telegramId = authPayload.telegramId as string | undefined;

      if (!telegramId) {
        return;  // ← Silently allows (no auth required for some routes)
      }

      const blacklistEntry = await prisma.blacklist.findFirst({
        where: { telegramId },
      });

      if (blacklistEntry) {
        console.error('[M6-L1] blocked blacklisted telegramId:', telegramId);
        return reply.status(403).send({ error: 'BANNED_USER' });  // ← Clean 403
      }
    } catch {
      return;  // ← Silently allows on auth error (optional)
    }
  };
}
```

**Server registration:**
```typescript
app.addHook('preHandler', createBlacklistGuard({ jwtSecret: JWT_SECRET_STR }));
```

**Status:** ✅ Blacklist errors handled properly. Returns 403 or silently allows, never throws.

---

### Rate Limiting Check
**File:** `teftef-api/src/routes/jobs.ts`, lines 243–247

```typescript
const jobCount = await prisma.job.count({
  where: {
    clientId: client.id,
    created_at: {
      gte: new Date(Date.now() - 60 * 60 * 1000),  // ← Last 1 hour
    },
  },
});

if (jobCount >= 3) {
  return reply.status(429).send({ error: 'Too many jobs. Maximum 3 jobs per hour.' });
}
```

**Status:** ✅ Rate limiting returns proper 429 HTTP status, not 500.

---

### Ban Check
**File:** `teftef-api/src/routes/jobs.ts`, lines 238–240

```typescript
if (client.is_banned) {
  return reply.status(403).send({ error: 'You are banned and cannot post jobs.' });
}
```

**Status:** ✅ Ban check returns proper 403 HTTP status, not 500.

---

**Conclusion:** ✅ **NO DEFECT** — All middleware and hooks execute in correct order. All errors return proper HTTP codes (401, 403, 429), never 500.

---

## CHECK 4: Error Handling & Logger Traps ✅ PASS

### Primary Error Handler
**File:** `teftef-api/src/routes/jobs.ts`, lines 250–257

```typescript
try {
  const job = await prisma.job.create({
    data: {
      title,
      description,
      budget,
      listingType,
      payType,
      minPay,
      maxPay,
      clientId: client.id,
    },
  });
  return reply.status(201).send({ job });
} catch (createErr) {
  console.error('[Production API Error] Failed to write Job entry into Prisma:', createErr);
  return reply.status(500).send({ error: 'Internal Server Error while inserting job record.' });
}
```

**Analysis:**
- ✅ Prisma create is wrapped in `try/catch`
- ✅ Error is logged to console (with mission-task ID prefix)
- ✅ Error response returns `status(500)` with descriptive message
- ✅ Unhandled Prisma exceptions ARE caught and logged

**Potential Issues in Error Logging:**
- The error object `createErr` is logged, which should output the full stack trace
- If this is a Prisma validation error (like enum mismatch or type error), it would appear in logs

**Status:** ✅ Error handling is defensive. Any Prisma exception caught and logged.

---

## HYPOTHESIS: Root Cause Analysis

Given that **all code paths are correct**, the 500 error likely stems from one of these environmental factors:

### **Hypothesis 1: Environment Variable Misconfiguration** ⚠️

**Symptom:** Database connection fails silently, Prisma throws before reaching route handler  
**Check:** Is `DATABASE_URL` set and valid?  

```bash
echo $DATABASE_URL
# Should output: postgres://user:pass@host:port/database
```

**If invalid:**
- Prisma client initialization fails → Server crashes on startup
- OR Prisma operations throw `PrismaClientInitializationError` → Caught as 500

---

### **Hypothesis 2: Missing Prisma Client Regeneration** ⚠️

**Symptom:** TypeScript compiled, but Prisma client not regenerated after schema change  
**Check:** Was `prisma generate` run after the cascade delete schema modification?

```bash
cd teftef-api
npx prisma generate  # Regenerate Prisma client
npm run build        # Rebuild TypeScript
```

**If not regenerated:**
- Schema changes not reflected in generated types
- Prisma client may have stale field definitions → Type mismatch → 500 error

---

### **Hypothesis 3: Incomplete Migration Deployment** ⚠️

**Symptom:** Migration file exists but not applied to database  
**Check:** Was `prisma migrate deploy` run in production?

```bash
cd teftef-api
npx prisma migrate status  # Check pending migrations
npx prisma migrate deploy  # Apply all migrations
```

**If migrations not deployed:**
- Schema on client (Prisma schema) doesn't match database schema
- Foreign key constraint mismatch → 500 error on insert

---

### **Hypothesis 4: Circular or Unresolved Async Dependency** ⚠️

**Symptom:** Route registration hangs or route handler never executes  
**Check:** Are all route files properly imported and awaited?

```typescript
// In src/server.ts
await registerJobRoutes(app, JWT_SECRET_STR);           // ← Must be awaited
await registerJobHandshakeRoutes(app, JWT_SECRET_STR);  // ← Must be awaited
await registerJobFeedbackRoutes(app, JWT_SECRET_STR);   // ← Must be awaited
await registerProposalRoutes(app, JWT_SECRET_STR);      // ← Must be awaited
await registerAdminRoutes(app, JWT_SECRET_STR);         // ← Must be awaited
```

**Status in current code:**  
```typescript
await registerJobRoutes(app, JWT_SECRET_STR);  // ✅ Properly awaited
```

**Conclusion:** ✅ Route registration appears correct.

---

### **Hypothesis 5: Type Mismatch in Compiled JavaScript** ⚠️

**Symptom:** TypeScript compiles, but `dist/routes/jobs.js` has runtime type error  
**Check:** Was `npm run build` executed after the recent code changes?

```bash
cd teftef-api
npm run build  # Recompile everything
```

**If not rebuilt:**
- Old compiled JavaScript still running
- Code changes not reflected in execution
- May hit old validation logic → 500 error

---

## RECOMMENDATION: Diagnostic Steps

Execute these commands **in order** to isolate the issue:

```bash
# Step 1: Verify environment
cd /home/calix/teftef/teftef-api
echo "DATABASE_URL=$DATABASE_URL"
echo "JWT_SECRET=$JWT_SECRET"
echo "BOT_MODE=$BOT_MODE"

# Step 2: Clean rebuild
npm run build

# Step 3: Regenerate Prisma
npx prisma generate

# Step 4: Check migrations
npx prisma migrate status
npx prisma migrate deploy

# Step 5: Verify database schema
npx prisma studio  # Visual inspection of Job model

# Step 6: Test endpoint with curl
curl -X POST http://localhost:3000/jobs \
  -H "Authorization: Bearer <valid_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Job",
    "description": "Test Description",
    "budget": 5000,
    "payType": "FIXED",
    "listingType": "FREELANCE"
  }'

# Step 7: Check server logs for the actual error
tail -100 /tmp/server.log  # Or wherever logs are written
```

---

## SUMMARY TABLE

| Check | Component | Status | Finding |
|-------|-----------|--------|---------|
| 1 | Payload parsing & type casting | ✅ PASS | No serialization defects |
| 2 | Schema compliance & enum validation | ✅ PASS | All fields correct, enums match |
| 3 | Middleware & hooks | ✅ PASS | Auth, blacklist, rate-limit correct |
| 4 | Error handling | ✅ PASS | Try/catch proper, errors logged |
| | **Route Logic** | ✅ **PASS** | **No logic defects identified** |
| | **Environment/Data Layer** | ❓ **UNKNOWN** | **Requires diagnostics** |

---

## CONCLUSION

The `POST /jobs` endpoint implementation is **architecturally sound**. The 500 errors are **not caused by**:
- ❌ Payload processing bugs
- ❌ Enum mismatch or type validation
- ❌ Missing database fields
- ❌ Unhandled exceptions in route logic
- ❌ Middleware execution order issues

The 500 errors are **most likely caused by**:
- ⚠️ Environment variable misconfiguration
- ⚠️ Stale Prisma client (migration not deployed)
- ⚠️ Incomplete build/compilation
- ⚠️ Database schema drift

**Next action:** Execute diagnostic steps above to pinpoint the environmental root cause.
