
**Telegram-First · East African Freelance Marketplace · Solo Dev + Small LLM**

_Battle-tested. Mission-driven. No arbitrary timelines._

  

# PART 1 — REDEFINE THE REAL MVP

The TefTef MVP is a Telegram Mini App (TMA). In Ethiopia, Telegram is the internet. Onboarding a user to a new website costs money and friction. Onboarding them inside a bot they already use costs nearly nothing.

## 1.1 Must-Haves for Telegram MVP

•        **One-Tap Auth:** Telegram's initData — no passwords, no JWT complexity at launch.

•        **Dual-Mode Profiles:** A user is both Client and Freelancer simultaneously. One account, one toggle, no forced separation.

•        **Mobile-First Job Feed:** Vertical scroll, SVGs only, sub-2s load on 3G.

•        **Escrow-Lite Workflow:** Client pays → Platform holds → Freelancer submits → Admin or Client releases.

•        **Payment Fallback:** "I Have Paid" button + manual transaction ID submission + pending state + admin verification.

•        **Offline Draft Mode:** Job posting and proposal forms must save drafts to localStorage/IndexedDB automatically.

•        **Behavioral Trust Score:** Calculated silently from account age, completions, payment consistency, cancellations, spam reports, response rate.

•        **Native Notifications:** Telegram Bot pushes alerts directly into the user's chat list.

•        **Hidden Admin Panel:** Visible only to whitelisted Telegram IDs. Spam deletion, banning, payment verification, trust override.

## 1.2 Feature Phase Matrix

|**Phase 1: Telegram MVP**|**Phase 2: Post-MVP**|**Phase 3: Expansion**|**KILL (Never Build)**|
|---|---|---|---|
|Telegram Auth (initData)|Skill Badges|Standalone Web App|Smart Contracts|
|Dual-Mode Job Feed|In-App Chat (Telegram links for now)|iOS/Android Native|Governance Tokens|
|Job Posting & Bidding|Review System|Advanced Matching AI|Decentralized Identity|
|Chapa/Telebirr Pay|Dispute Resolution UI|Multi-currency|Multi-chain Support|
|Escrow-Lite + Manual Release|Trust Score Dashboard|API for Third Parties|DAO Governance|
|Offline Draft Mode|Skill Verification|Employer Branding|Microservices|
|Payment Fallback Flow|Automated Escrow Release|Analytics Suite|Native App|
|Behavioral Trust Score|Portfolio Media Upload|SEO (post-web)|Recommendation AI|
|Admin Panel (Telegram ID-gated)|Scheduled Jobs|Team Accounts|In-App Messaging|

# PART 2 — TELEGRAM-FIRST ARCHITECTURE

We are building a Modular Monolith. This is not a compromise — it is the correct architecture for a solo developer using a 7B–14B local LLM. Every architectural decision must optimize for one thing: the ability of a small model to hold the entire relevant context in a single prompt.

## 2.1 The Tech Stack

|**Layer**|**Technology**|**Why**|
|---|---|---|
|Frontend|React + Vite + Tailwind CSS|Vite is fast locally. Tailwind keeps style co-located with markup — one file for the LLM to read.|
|Backend|Node.js + Fastify + TypeScript|Single language across stack. Small LLMs handle TS/JS better than Python ORM abstractions.|
|Database|PostgreSQL via Prisma ORM|Prisma schema is the single source of truth. Give it to the LLM and it understands all data structures instantly.|
|Auth|Telegram WebApp SDK (initData)|No passwords. No JWT rotation. Backend verifies HMAC hash on every request.|
|Payments|Chapa + Telebirr deep links|Deep-link to app or show QR. Never ask for card numbers.|
|Offline|localStorage + IndexedDB|IndexedDB for form drafts. localStorage for UI state. Both survive network loss.|
|Hosting|Railway or Render|Git-push deployment. No DevOps overhead. Auto-restart on crash.|
|Notifications|Telegram Bot API|Push alerts into the user's own chat list. Zero extra onboarding.|

## 2.2 Architecture Constraints — MANDATORY RULES

|   |
|---|
|**RULE 1**<br><br>Files must stay under ~200 lines. If a component grows beyond this, split it immediately. Small LLMs lose coherence on long files.|

|   |
|---|
|**RULE 2**<br><br>Always build with mock data before connecting to a real backend. Never test business logic against a live database until the UI is stable.|

|   |
|---|
|**RULE 3**<br><br>Manual operations before automation. Admin manually verifies payments before any automation is built. Moderation is manual before any flagging algorithm exists.|

|   |
|---|
|**RULE 4**<br><br>No premature abstractions. Do not create a 'service layer,' 'repository pattern,' or 'plugin system' until you have built the same thing at least three times in raw form.|

|   |
|---|
|**RULE 5**<br><br>No recommendation AI, no in-app messaging, no native apps, no microservices during MVP. These are scope termination events.|

|   |
|---|
|**RULE 6**<br><br>Every new feature must fit entirely within a single LLM context window (4k–8k tokens). If it does not, break it into smaller tasks before writing any code.|

|   |
|---|
|**RULE 7**<br><br>No feature takes more than 3 focused coding sessions to complete. If it does, cut scope or re-design the approach.|

## 2.3 Dual-Mode User Architecture

Users are not forced to choose between Client and Freelancer. Every user record has a single account with a role_mode field that can be toggled. The UI shows the relevant view based on this mode. This eliminates onboarding friction and mirrors how real East African freelancers work — they hire and work simultaneously.

|**DB Field**|**Values**|**UI Effect**|
|---|---|---|
|role_mode|CLIENT \| FREELANCER|Switches between 'Post a Job' and 'Find Work' home screens|
|can_hire|boolean (default: true)|Controls access to job posting UI|
|can_freelance|boolean (default: true)|Controls access to proposal submission UI|
|trust_score|0–100 (calculated)|Shown as badge tier; affects search ranking|

# PART 3 — COMPLETE SYSTEM DECOMPOSITION

## 3.1 Backend Modules

|**Module**|**Responsibility**|**Max File Size**|
|---|---|---|
|Auth Module|Verifies Telegram initData HMAC. Returns session token.|~80 lines|
|Profile Module|CRUD for User data. Trust score calculation trigger.|~150 lines|
|Job Module|Job posting, listing, filtering, status transitions.|~180 lines|
|Proposal Module|Bid submission, status updates (pending/accepted/rejected).|~140 lines|
|Payment Module|Chapa/Telebirr webhook handlers. Manual verification state machine.|~160 lines|
|Admin Module|Whitelisted-ID-only routes. Ban, delete, verify, trust override.|~150 lines|
|Trust Module|Recalculates trust score on any relevant event.|~100 lines|
|Notification Module|Telegram Bot API push messages for job alerts and status changes.|~80 lines|
|Draft Module|Receives and stores offline drafts when connectivity restores.|~60 lines|

## 3.2 Frontend Screens

|**Screen**|**Purpose**|**State Source**|
|---|---|---|
|LandingView|First-time user welcome. Shows 'Get Started' and Telegram auth trigger.|initData|
|JobFeedView|Infinite scroll list. Cached by React Query. Shows offline-cached jobs on no-connection.|React Query + cache|
|JobDetailView|Full description, trust badge, 'Apply' or 'Manage' button.|URL param + query|
|PostJobView|Job posting form with auto-save to IndexedDB on every keystroke.|IndexedDB draft + state|
|ProposalView|Bid submission form. Auto-saves draft. Shows current proposal status.|IndexedDB draft + state|
|ProfileView|Trust score, completed jobs, active listings, mode toggle.|Profile query|
|PaymentView|Chapa QR or Telebirr deep link + 'I Have Paid' fallback button + manual TX ID field.|Payment state machine|
|AdminPanelView|Hidden. Accessible only if user's Telegram ID is in ADMIN_IDS env var.|Admin API|
|PaymentPendingView|Shows 'Awaiting admin verification' state after manual submission.|Payment state|

## 3.3 Prisma Database Schema

**schema.prisma — The Single Source of Truth**

|   |
|---|
|model User {<br><br>  id            String   @id @default(cuid())<br><br>  telegramId    String   @unique<br><br>  username      String?<br><br>  role_mode     RoleMode @default(FREELANCER)<br><br>  can_hire      Boolean  @default(true)<br><br>  can_freelance Boolean  @default(true)<br><br>  trust_score   Int      @default(50)<br><br>  bio           String?<br><br>  is_banned     Boolean  @default(false)<br><br>  phone_verified Boolean  @default(false)<br><br>  created_at    DateTime @default(now())<br><br>  jobs          Job[]<br><br>  proposals     Proposal[]<br><br>  transactions  Transaction[]<br><br>}<br><br>model Job {<br><br>  id            String    @id @default(cuid())<br><br>  clientId      String<br><br>  title         String<br><br>  description   String<br><br>  budget        Int<br><br>  status        JobStatus @default(OPEN)<br><br>  created_at    DateTime  @default(now())<br><br>  proposals     Proposal[]<br><br>  client        User       @relation(...)<br><br>}<br><br>model Proposal {<br><br>  id            String          @id @default(cuid())<br><br>  jobId         String<br><br>  freelancerId  String<br><br>  amount        Int<br><br>  message       String<br><br>  status        ProposalStatus  @default(PENDING)<br><br>  created_at    DateTime        @default(now())<br><br>}<br><br>model Transaction {<br><br>  id               String            @id @default(cuid())<br><br>  userId           String<br><br>  jobId            String?<br><br>  amount           Int<br><br>  method           PayMethod         // CHAPA \| TELEBIRR \| MANUAL<br><br>  status           TxStatus          @default(PENDING)<br><br>  gateway_ref      String?           // Chapa/Telebirr reference<br><br>  manual_tx_id     String?           // User-submitted ID for fallback<br><br>  admin_verified   Boolean           @default(false)<br><br>  admin_note       String?<br><br>  created_at       DateTime          @default(now())<br><br>}<br><br>enum JobStatus    { OPEN IN_PROGRESS COMPLETED DISPUTED CLOSED }<br><br>enum ProposalStatus { PENDING ACCEPTED REJECTED WITHDRAWN }<br><br>enum TxStatus     { PENDING AWAITING_VERIFICATION CONFIRMED FAILED REFUNDED }<br><br>enum RoleMode     { CLIENT FREELANCER }<br><br>enum PayMethod    { CHAPA TELEBIRR MANUAL }|

# PART 4 — CORE FEATURE DEEP DIVES

## 4.1 Offline Draft Mode

Every job posting form and proposal form must auto-save to IndexedDB on every keystroke with a 500ms debounce. On load, the form checks for an existing draft and pre-populates it. Drafts are cleared only after successful server submission.

|**Event**|**Action**|**Storage Target**|
|---|---|---|
|User types in form field|Debounced 500ms → save to IndexedDB|IndexedDB: 'teftef-drafts' store|
|Network drops mid-form|Form continues to function. Draft persists.|IndexedDB|
|User revisits form|Load draft from IndexedDB. Show 'Draft restored' toast.|IndexedDB|
|Successful submission|Clear IndexedDB draft for that form key.|IndexedDB|
|User manually discards|Show 'Discard draft?' confirmation. Clear on confirm.|IndexedDB|

## 4.2 Payment Fallback Flow — State Machine

Chapa/Telebirr webhooks fail in Ethiopia. This is not an edge case — it is the default scenario. The fallback flow treats manual verification as the primary path, not a last resort.

|**State**|**User Sees**|**Admin Action Required**|
|---|---|---|
|PAYMENT_INITIATED|QR code or deep link to Telebirr/Chapa|None|
|WEBHOOK_CONFIRMED|✅ 'Payment Received' auto-confirmed|None (automatic)|
|USER_CLAIMED|User tapped 'I Have Paid' and entered TX ID. Shows 'Awaiting Verification'.|Must verify TX ID in admin panel|
|AWAITING_VERIFICATION|Spinner + 'Your payment is being verified by our team (usually within 2 hours)'|Admin sees pending queue|
|ADMIN_CONFIRMED|✅ 'Funds Secured' banner appears on job page|None (done)|
|ADMIN_REJECTED|❌ 'Transaction ID not found. Please resubmit or contact support.'|Optional: send Telegram message|
|REFUNDED|Transaction reversed. Escrow released back to client.|Admin manually initiates|

## 4.3 Behavioral Trust Score

The trust score is never shown as a number to regular users — only as a tier badge (Verified, Trusted, Rising, New). It is calculated automatically on any relevant event and stored as an integer 0–100 on the User model.

|**Signal**|**Weight**|**Direction**|**Calculation Event**|
|---|---|---|---|
|Account age (days)|+1 per 30 days, max +20|Positive|Daily cron or on login|
|Completed jobs|+8 per completion, max +40|Positive|On job status → COMPLETED|
|Payment consistency|+5 if 0 late/failed payments|Positive|On payment CONFIRMED|
|Payment failure|-10 per failed/disputed payment|Negative|On payment FAILED|
|Cancellation frequency|-5 per cancellation after acceptance|Negative|On proposal WITHDRAWN after ACCEPTED|
|Spam reports|-15 per confirmed spam report|Negative|On admin confirms spam report|
|Response rate|+5 if replies to proposals within 24h|Positive|Measured on proposal status change|
|Admin trust override|Admin can set score directly|Both|Admin panel action|

|**Score Range**|**Badge Tier**|**UI Treatment**|
|---|---|---|
|80–100|🔵 Verified|Blue badge. Priority in search results.|
|60–79|🟢 Trusted|Green badge. Normal visibility.|
|40–59|🟡 Rising|Yellow badge. No restrictions.|
|0–39|⚪ New|No badge. May have posting limits.|

## 4.4 Hidden Admin Panel

The admin panel is a React route (/admin) that renders a 'Page Not Found' message unless window.Telegram.WebApp.initDataUnsafe.user.id is present in a ADMIN_IDS environment variable array. No separate login. No separate app.

|**Admin Tool**|**Function**|**Backend Route**|
|---|---|---|
|Payment Verification Queue|List all AWAITING_VERIFICATION transactions. Show TX ID. Confirm or Reject.|GET/POST /admin/transactions|
|Spam Reports Queue|List reported users/jobs. View details. Delete job or ban user.|GET/POST /admin/reports|
|User Management|Search by Telegram ID. View trust score. Ban/unban. Override trust.|GET/PATCH /admin/users/:id|
|Job Moderation|View any job. Delete, close, or mark as suspicious.|GET/DELETE /admin/jobs/:id|
|Trust Override|Manually set a user's trust score with an admin note.|PATCH /admin/users/:id/trust|
|Escrow Release|Manually release escrowed funds for a completed job.|POST /admin/escrow/release/:jobId|

# PART 5 — MISSION-BASED EXECUTION SYSTEM

There are no arbitrary 4-week deadlines. There are Missions. Each Mission has a clear success condition. You move to the next Mission only when the current Mission's success condition is fully met on a real device in the Telegram app.

## Mission 0: The Shell — Success: Bot opens Mini App with your name

  **M0-T1**    **Initialize Vite + React + Tailwind Project**

**🎯 Objective:** Create a working React app that loads inside Telegram Mini App and displays the authenticated user's first name.

|   |
|---|
|**📋 Implementation Steps**<br><br>npm create vite@latest teftef-app -- --template react-ts<br><br>cd teftef-app && npm install<br><br>npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p<br><br>Add Telegram script tag to index.html: <script src="https://telegram.org/js/telegram-web-app.js"></script><br><br>In App.tsx, read window.Telegram.WebApp.initDataUnsafe.user?.first_name<br><br>Display: <h1 className="text-2xl font-bold">Hello, {name}!</h1><br><br>Run locally with ngrok tunnel. Open in Telegram via BotFather test URL.|

|   |
|---|
|**✅ Expected Output**<br><br>Telegram Mini App opens. Displays authenticated user's first name. No console errors. Tailwind classes render correctly.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Open Mini App on real phone. Name displays.<br><br>Open DevTools via Telegram desktop. No 404 or CORS errors.<br><br>Check that window.Telegram.WebApp.ready() was called.|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If name is undefined, check: did you call WebApp.ready()? Is the script tag in <head>? Is the bot set to allow Mini Apps in BotFather settings?<br><br>If Tailwind styles don't apply, verify content array in tailwind.config.js includes './src/**/*.{ts,tsx}'|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>Delete node_modules and re-run npm install.<br><br>Revert to plain HTML in index.html to confirm Telegram SDK loads correctly without React.<br><br>Start fresh from Vite template if config is corrupt.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "I am building a Telegram Mini App with React + Vite + Tailwind. Create the App.tsx file that reads window.Telegram.WebApp.initDataUnsafe.user.first_name and displays 'Hello [name]' in a centered Tailwind layout. Keep it under 40 lines."<br><br>DEBUG: "My Telegram Mini App shows undefined for the user name. Here is my App.tsx: [paste code]. Here is the initDataUnsafe object I see in console: [paste]. What is wrong?"|

  **M0-T2**    **Initialize Node.js + Fastify Backend with /health Route**

**🎯 Objective:** A backend server that responds to GET /health and is accessible from the internet via Railway or Render deployment.

|   |
|---|
|**📋 Implementation Steps**<br><br>mkdir teftef-api && cd teftef-api && npm init -y<br><br>npm install fastify @fastify/cors dotenv && npm install -D typescript ts-node @types/node<br><br>Create src/server.ts with Fastify instance and GET /health route returning {status:'ok',timestamp:Date.now()}<br><br>Add CORS plugin: app.register(cors, {origin: '*'}) — tighten this later.<br><br>Create Procfile: web: ts-node src/server.ts<br><br>Push to GitHub. Connect repo to Railway. Deploy.<br><br>Test: curl https://your-railway-url.railway.app/health|

|   |
|---|
|**✅ Expected Output**<br><br>Deployed URL responds to GET /health with {status:'ok'}. Railway shows running status.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>curl the /health endpoint and confirm JSON response.<br><br>Check Railway logs show no crash on startup.<br><br>Confirm PORT is read from process.env.PORT (Railway injects this).|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If PORT binding fails, ensure: const port = Number(process.env.PORT) \| 3000. Railway requires the app to listen on process.env.PORT.<br><br>If CORS errors appear in frontend, verify @fastify/cors is registered before any routes.|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>Rollback to previous Railway deployment via dashboard. Railway keeps last 3 deployments.<br><br>Run locally with: ts-node src/server.ts to isolate cloud vs code issues.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Create a Fastify server in TypeScript with a single GET /health route. It should read PORT from process.env.PORT with a fallback to 3000, register @fastify/cors with origin:'*', and return {status:'ok',timestamp:Date.now()}. Keep under 40 lines."<br><br>DEBUG: "My Fastify server crashes on Railway with error: [paste error]. Here is my server.ts: [paste]. What is wrong?"|

  **M0-T3**    **Setup Prisma with User and Job Models**

**🎯 Objective:** PostgreSQL database connected via Prisma. Running migrations. Prisma Studio opens and shows empty User and Job tables.

|   |
|---|
|**📋 Implementation Steps**<br><br>npm install prisma @prisma/client && npx prisma init<br><br>Set DATABASE_URL in .env to Railway-provided PostgreSQL connection string.<br><br>Write schema.prisma with User, Job, Proposal, Transaction models and all enums (from Part 3.3).<br><br>Run: npx prisma migrate dev --name init<br><br>Run: npx prisma studio — verify tables exist and are empty.<br><br>Create src/db.ts: export const prisma = new PrismaClient()<br><br>Add a seed script that creates one test User with telegramId='TEST123'.|

|   |
|---|
|**✅ Expected Output**<br><br>npx prisma studio shows User, Job, Proposal, Transaction tables. Seed script creates test User successfully.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Run npx prisma migrate status — all migrations applied.<br><br>npx prisma studio shows correct column types.<br><br>Query: prisma.user.count() returns 0 (or 1 after seed).|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If migration fails, check DATABASE_URL format: postgresql://user:password@host:port/dbname?schema=public<br><br>If Prisma generates wrong types, delete node_modules/.prisma and run npx prisma generate|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>npx prisma migrate reset — drops all tables and reruns from scratch. Safe in development.<br><br>Do not run migrate reset in production. Use migrate deploy instead.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Here is my target Prisma schema: [paste schema]. Write the complete schema.prisma file including datasource, generator, all models, and all enums. Do not add any fields not listed."<br><br>DEBUG: "npx prisma migrate dev fails with: [paste error]. My schema.prisma is: [paste]. My DATABASE_URL format is: [paste format without credentials]. What is wrong?"|

## Mission 1: The Job Board — Success: Post a job from phone, see it in the list

  **M1-T1**    **Build JobCard Component with Mock Data**

**🎯 Objective:** A React component that renders a job card with title, 2-line description, budget in ETB, trust badge tier, and a 'View' button. Works with hardcoded mock data.

|   |
|---|
|**📋 Implementation Steps**<br><br>Create src/components/JobCard.tsx<br><br>Props: { id, title, description, budget, trustTier, createdAt }<br><br>Use Tailwind: rounded-xl shadow-sm border border-gray-100 p-4 mb-3<br><br>Show title in font-semibold, description truncated to 2 lines with line-clamp-2<br><br>Show budget formatted as: ETB {budget.toLocaleString()}<br><br>Show trust badge: small colored pill based on tier<br><br>Keep file under 60 lines.<br><br>Render 3 hardcoded mock cards in App.tsx to verify.|

|   |
|---|
|**✅ Expected Output**<br><br>Three JobCard components render in Telegram Mini App. Title, budget, description, badge all display correctly. 'View' button is tappable.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Test on actual phone inside Telegram. Check touch targets are large enough (min 44px height).<br><br>Check that long descriptions are truncated cleanly.<br><br>Check budget shows commas for large numbers.|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If line-clamp-2 doesn't work, add @tailwindcss/line-clamp plugin or use CSS: overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical<br><br>If budget is NaN, ensure budget prop is a number, not a string.|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>Revert to plain div if Tailwind classes cause layout issues. Inline styles are acceptable fallback for MVP.<br><br>Keep mock data as a separate mockJobs.ts file so it can be reused in tests.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "I am building a Telegram Mini App for a freelance marketplace. Create a React + Tailwind JobCard component. Props: id (string), title (string), description (string), budget (number), trustTier ('Verified'\|'Trusted'\|'Rising'\|'New'), createdAt (string). Show title bold, description in 2 lines max, budget as 'ETB X,XXX', a colored badge for trustTier, and a 'View' button. Under 60 lines. Mobile-friendly padding."|

  **M1-T2**    **Build JobFeedView with React Query and Mock API**

**🎯 Objective:** A scrollable list of JobCards powered by React Query fetching from a mock /jobs endpoint. Shows loading state and empty state.

|   |
|---|
|**📋 Implementation Steps**<br><br>npm install @tanstack/react-query<br><br>Wrap App in QueryClientProvider with staleTime: 5 * 60 * 1000<br><br>Create src/views/JobFeedView.tsx — fetch from /api/jobs using useQuery<br><br>Show skeleton loading cards while query is pending<br><br>Show 'No jobs yet' message when data is empty array<br><br>Map over jobs array and render <JobCard> for each<br><br>Create a mock GET /jobs endpoint on backend that returns 5 hardcoded job objects<br><br>Connect frontend fetch to backend URL via VITE_API_URL env variable|

|   |
|---|
|**✅ Expected Output**<br><br>JobFeedView loads, shows 3-second skeleton, then renders 5 mock job cards. Empty state shows when array is empty. No 'map of undefined' errors.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Check Network tab: GET /api/jobs returns 200 with array.<br><br>Manually set return value to [] and verify empty state renders.<br><br>Disconnect network and confirm React Query shows cached data (staleTime).|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If 'map of undefined' error occurs: add defensive check: const jobs = data?.jobs ?? [] before mapping. Never map directly on data.<br><br>If fetch fails with CORS, confirm backend has @fastify/cors registered with correct origin.|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>Switch back to fully hardcoded mock data array directly in component if backend is unstable. Never block UI progress on backend issues.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Create a React component JobFeedView.tsx that uses @tanstack/react-query to fetch from process.env.VITE_API_URL + '/jobs'. Show a loading skeleton while pending. Show 'No jobs yet' when the array is empty. Render a JobCard for each job. Add a defensive check: const jobs = data?.jobs ?? [] before mapping. Under 80 lines."<br><br>DEBUG: "I get 'Cannot read properties of undefined (reading map)' in my JobFeedView. Here is the component: [paste]. Here is what /api/jobs returns: [paste JSON]. Fix the error."|

  **M1-T3**    **PostJobView with IndexedDB Auto-Save Draft**

**🎯 Objective:** A job posting form that auto-saves to IndexedDB on every keystroke. On reload, the draft is restored. On successful submit, the draft is cleared.

|   |
|---|
|**📋 Implementation Steps**<br><br>npm install idb (lightweight IndexedDB wrapper)<br><br>Create src/lib/draftStorage.ts with functions: saveDraft(key, data), loadDraft(key), clearDraft(key)<br><br>Create src/views/PostJobView.tsx with form fields: title, description, budget, category<br><br>On every onChange, call saveDraft('post-job', formData) with 500ms debounce<br><br>On component mount (useEffect), call loadDraft('post-job') and pre-populate form if draft exists<br><br>Show a 'Draft restored' toast if draft was loaded<br><br>On successful POST to /jobs, call clearDraft('post-job')<br><br>On manual discard, show confirm dialog, then clearDraft|

|   |
|---|
|**✅ Expected Output**<br><br>Fill in form, close app, reopen — form is pre-populated with previous input. Toast says 'Draft restored'. Successful submit clears draft.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Fill form, kill process in Telegram, reopen — draft must be present.<br><br>Submit successfully — check IndexedDB in DevTools: teftef-drafts store should be empty for 'post-job' key.<br><br>Check debounce: typing fast should not cause excessive IndexedDB writes.|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If idb is unavailable, fall back to localStorage: localStorage.setItem('draft-post-job', JSON.stringify(formData)). Less reliable for large data but acceptable for MVP.<br><br>If IndexedDB shows permission error, check browser security settings (rare in Telegram WebView).|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>If draft storage causes bugs, disable it by wrapping all draft calls in try-catch and silently failing. The form still works; it just won't save drafts.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Create a draftStorage.ts module using the 'idb' npm package. Export three async functions: saveDraft(key: string, data: object), loadDraft(key: string): Promise<object\|null>, clearDraft(key: string). Use a database called 'teftef-drafts' with a store called 'drafts'. Under 50 lines."<br><br>IMPLEMENT: "Create PostJobView.tsx with form fields title, description, budget (number), category. On every onChange, debounce 500ms and call saveDraft. On mount, call loadDraft and pre-populate. On submit, call clearDraft. Under 100 lines."|

## Mission 2: Auth Bridge — Success: Telegram ID is the identity

  **M2-T1**    **Implement Telegram initData Verification on Backend**

**🎯 Objective:** Backend endpoint that verifies the Telegram initData HMAC signature and upserts a User record. Returns a session token.

|   |
|---|
|**📋 Implementation Steps**<br><br>Create src/modules/auth/verifyInitData.ts<br><br>Algorithm: HMAC-SHA256 with key = HMAC-SHA256('WebAppData', BOT_TOKEN). Verify against hash field in initData.<br><br>Parse initData string into URLSearchParams. Sort keys alphabetically. Build data-check-string.<br><br>If verification passes, upsert User where telegramId = parsed.user.id. Return user record.<br><br>Create POST /auth/verify route that accepts {initData: string} and returns {user, sessionToken}.<br><br>Use a simple session: sign user.id with JWT_SECRET. Expiry: 7 days.<br><br>Store BOT_TOKEN and JWT_SECRET in Railway environment variables. Never in code.|

|   |
|---|
|**✅ Expected Output**<br><br>POST /auth/verify with valid initData returns {user: {...}, sessionToken: 'jwt...'}. Invalid initData returns 401. New user is created in DB. Existing user is found.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Test with real initData from Telegram (copy from Mini App DevTools console: window.Telegram.WebApp.initData).<br><br>Test with tampered initData — must return 401.<br><br>Check DB: user record created with correct telegramId.|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If HMAC fails on valid data, check that you are NOT decoding the initData URL before verification. Telegram sends it URL-encoded.<br><br>If JWT is invalid on subsequent requests, check JWT_SECRET is the same between restarts (use env var, not random generation).|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>Disable auth temporarily by returning a fake user in verifyInitData for local development. Add process.env.SKIP_AUTH guard. Remove before production.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Write a TypeScript function verifyTelegramInitData(initData: string, botToken: string): boolean. It should use Node.js crypto module with HMAC-SHA256. The key is HMAC-SHA256('WebAppData', botToken). The data-check-string is the sorted key=value pairs joined by newlines, excluding the 'hash' field. Return true if computed hash matches the hash field in initData."<br><br>DEBUG: "My Telegram auth verification always returns false even with valid initData. Here is my verification function: [paste]. Here is the initData I am testing with (hash removed): [paste]. What is the algorithm error?"|

## Mission 3: Proposals — Success: Freelancer bids, client sees the bid

  **M3-T1**    **Build Proposal Submission Flow with Offline Draft**

**🎯 Objective:** Freelancer views a job, fills a proposal form (amount + message), submits it. Form auto-saves draft to IndexedDB. Draft is per-job (key: 'proposal-{jobId}').

|   |
|---|
|**📋 Implementation Steps**<br><br>Create src/views/JobDetailView.tsx — fetch GET /jobs/:id, show full description, budget, client trust badge<br><br>Add 'Apply' button if user is in FREELANCER mode and has not already applied<br><br>Create ProposalForm.tsx with fields: amount (number), message (textarea)<br><br>Auto-save draft with key 'proposal-{jobId}' using draftStorage.ts from M1-T3<br><br>Submit POST /proposals with {jobId, amount, message} + Authorization header<br><br>On success, show 'Proposal submitted!' toast and clear draft<br><br>Backend: Create POST /proposals route. Validate: amount > 0, message length 20–500 chars, user not already proposed.<br><br>Backend: Insert Proposal record with status PENDING.|

|   |
|---|
|**✅ Expected Output**<br><br>Freelancer opens job, fills form, submits. Proposal appears in DB with status PENDING. Client sees proposal count increase on their job. Draft clears on success. Draft restores on revisit.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Check DB: proposal record exists with correct jobId, freelancerId, amount.<br><br>Check constraint: same user cannot submit two proposals for same job.<br><br>Check draft: close app mid-form, reopen — draft restored.|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If duplicate proposal error, add unique constraint to Prisma: @@unique([jobId, freelancerId]) and handle 409 Conflict response in frontend.<br><br>If amount field accepts negative numbers, add Zod validation: z.number().positive() on backend.|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>If proposal route is unstable, store proposals in localStorage as a queue and sync when online. Acceptable for early beta.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Create a Fastify POST /proposals route in TypeScript. It expects body: {jobId: string, amount: number, message: string} and a JWT Authorization header. Validate: amount > 0, message length between 20–500 chars, no existing proposal from same freelancerId for this jobId. Use the attached Prisma schema. Return the created Proposal or a 409 if duplicate. Under 60 lines."|

## Mission 4: The Money — Success: Full flow from job post to mock payment

  **M4-T1**    **Payment Initiation with Chapa + Telebirr Fallback**

**🎯 Objective:** Client accepts a proposal. A payment session is created. User is shown Chapa QR or Telebirr deep link. If not confirmed in 30 minutes, 'I Have Paid' button appears.

|   |
|---|
|**⚠️ CRITICAL: Payment Testing Order**<br><br>Do not connect Chapa or Telebirr until you have tested the fallback flow completely. Testing two unknown systems at once guarantees failure.<br><br>**Step Order - Follow exactly:**<br><br>1. First, implement the "I Have Paid" button with fake transaction IDs<br>2. Test that admin panel shows AWAITING_VERIFICATION status<br>3. Test that admin can confirm and reject transactions<br>4. Test that user receives Telegram notification on confirmation<br>5. Only then connect Chapa test mode<br><br>**Why this order:** If you connect Chapa first and something fails, you will not know if the failure is Chapa's webhook, your fallback logic, or your database state. Isolate each variable. Test fallback in isolation. Add real payments after fallback works.<br><br>**Test credentials for development:** Use any string as a fake transaction ID. "TEST123" works. Do not waste time generating realistic IDs. The system should accept any non-empty string during development.|

|   |
|---|
|**📋 Implementation Steps**<br><br>On proposal acceptance (PATCH /proposals/:id status=ACCEPTED), create Transaction record with status PENDING.<br><br>Build PaymentView.tsx: show Chapa QR code image (use Chapa test mode) AND Telebirr deep link button.<br><br>Telebirr deep link format: telebirr://pay?amount={amount}&ref={txId}<br><br>Set a 30-minute timer in localStorage: payment_initiated_at = Date.now()<br><br>If Date.now() - payment_initiated_at > 30min, show 'I Have Paid' button.<br><br>On click, show text input for manual transaction ID. Submit POST /payments/manual-claim.<br><br>Backend: Update Transaction status to AWAITING_VERIFICATION, store manual_tx_id.<br><br>Send Telegram Bot message to all ADMIN_IDS: 'New payment to verify: TX ID [id], Amount [amt] ETB'.|

|   |
|---|
|**✅ Expected Output**<br><br>Client sees payment screen with QR and Telebirr button. After 30 minutes (test with 1 minute), 'I Have Paid' button appears. On manual submission, DB record shows AWAITING_VERIFICATION. Admin receives Telegram message.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Confirm Transaction status transitions correctly in DB.<br><br>Confirm admin Telegram message arrives on real phone.<br><br>Test with 1-minute timeout for development. Restore 30 minutes before production.|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If Telegram Bot message fails, log the error but do not block the payment flow. Admin will check the queue manually.<br><br>If Chapa test mode QR does not render, use a placeholder image. The fallback flow is what matters for MVP.|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>If payment flow is broken, revert to 100% manual: client pays outside app, admin manually sets Transaction to CONFIRMED. Document this as 'Manual Mode' in admin panel.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Create a Fastify POST /payments/manual-claim route. It expects body: {transactionId: string, manualTxId: string} and Authorization header. Update the Transaction record: set status=AWAITING_VERIFICATION and manual_tx_id=manualTxId. Then call the Telegram Bot API to send a message to ADMIN_CHAT_ID (from env): 'Payment verification needed: TX [transactionId], Manual ID: [manualTxId], Amount: [amount] ETB.' Return the updated transaction. Under 60 lines."|

  **M4-T2**    **Admin Panel — Payment Verification Workflow**

**🎯 Objective:** Admin opens /admin in Mini App. Sees AWAITING_VERIFICATION payments. Can confirm or reject each one. On confirm, Transaction becomes CONFIRMED and Telegram message sent to client.

|   |
|---|
|**📋 Implementation Steps**<br><br>**Implementation Step 0 (before any other step):**<br><br>Hardcode your admin Telegram ID. Do not use environment variables for MVP.<br><br>```typescript<br>// In your admin middleware file<br>const ADMIN_IDS = ['123456789']; // Replace with your numeric Telegram ID<br><br>// How to find your Telegram ID:<br>// 1. Open Telegram Web version<br>// 2. Send a message to @userinfobot<br>// 3. Bot will reply with your numeric ID<br><br>export function isAdmin(telegramId: string): boolean {<br>  return ADMIN_IDS.includes(telegramId);<br>}<br>```<br><br>**Why hardcode:** Environment variables can have typos, trailing spaces, or incorrect formatting. If your .env file has ADMIN_IDS="123456789" (with quotes) but your code expects a number, you are locked out. If you forget to set the variable in Railway, you are locked out. Hardcoding eliminates these failure modes.<br><br>**When to move to environment variables:** After you have at least two admins and the platform is live with real users. At that point, add a second admin and migrate to env vars with a fallback hardcoded list as backup.<br><br>Create src/views/AdminPanelView.tsx<br><br>On mount, check: if hardcoded ADMIN_IDS does not include current user's telegramId, render 'Page Not Found'.<br><br>Fetch GET /admin/transactions?status=AWAITING_VERIFICATION<br><br>Render list: for each, show TX ID, manual_tx_id, amount, user, timestamp.<br><br>Add 'Confirm' and 'Reject' buttons. POST /admin/transactions/:id/verify with {approved: boolean, note: string}<br><br>On confirm: set status=CONFIRMED, admin_verified=true. Send Telegram message to client: 'Your payment of ETB [amount] has been verified. Your job is now active.'<br><br>On reject: set status=FAILED. Send Telegram message to client: 'Your payment could not be verified. Transaction ID [id] was not found. Please resubmit.'<br><br>Keep AdminPanelView.tsx under 150 lines. Split into AdminTransactionRow.tsx if needed.|

|   |
|---|
|**✅ Expected Output**<br><br>Admin sees pending payments list. Confirm/reject updates DB and sends Telegram message to user. Non-admin users see 'Page Not Found'.|

|   |
|---|
|**🔍 Verification Criteria**<br><br>Test with non-admin Telegram ID — must see 404 view, not admin data.<br><br>Test confirm flow: DB shows CONFIRMED, admin_verified=true, user receives Telegram message.<br><br>Test reject flow: DB shows FAILED, user receives Telegram message.|

|   |
|---|
|**🐛 Debugging Fallback**<br><br>If Telegram message fails silently, add a 'Resend Notification' button in the admin panel to retry the Bot message for a specific transaction.<br><br>If admin ID check feels insecure, add a second check on the backend: all /admin/* routes must verify that the JWT belongs to a user whose telegramId is in ADMIN_IDS.|

|   |
|---|
|**⏮ Rollback Guidance**<br><br>If admin panel breaks, use Prisma Studio as a temporary admin interface. It is not user-facing. Update records directly as emergency fallback.|

|   |
|---|
|**🤖 LLM Prompts**<br><br>IMPLEMENT: "Create an AdminPanelView.tsx React component. On mount, fetch the current user's Telegram ID from window.Telegram.WebApp.initDataUnsafe.user.id. Then call GET /admin/me to verify admin status. If not admin, render a <div>Page not found</div>. If admin, fetch GET /admin/transactions?status=AWAITING_VERIFICATION and render a list where each row shows: manual_tx_id, amount, username, and two buttons: Confirm and Reject. Under 120 lines."|

# PART 6 — COMPLETE USER STORY MAPS

## 6.1 User Story: Client Posts First Job

|**Step**|**Layer**|**What Happens**|**Dependency**|
|---|---|---|---|
|1. Open Mini App|Frontend|Telegram SDK loads. initData is available.|Telegram Bot set up in BotFather|
|2. Auth|Backend|POST /auth/verify sends initData. User record upserted. JWT returned.|Auth module (M2-T1)|
|3. View Job Feed|Frontend|GET /jobs. React Query caches. Empty state shown (no jobs yet).|Job module GET route|
|4. Tap 'Post a Job'|Frontend|Switches to PostJobView. Loads any IndexedDB draft.|Draft storage (M1-T3)|
|5. Fill Form|Frontend|Every keystroke triggers 500ms debounced IndexedDB save.|IndexedDB draft|
|6. Submit|Backend|POST /jobs. Validates title (min 5) and budget (>0). Inserts Job.|Job module POST route|
|7. Confirmation|Frontend|Toast: 'Job posted successfully.' Draft cleared. Redirect to feed.|React Query invalidation|
|8. Job Appears|Frontend|GET /jobs refetches. New job card visible.|Job feed query|

## 6.2 User Story: Freelancer Applies and Gets Paid

|**Step**|**Layer**|**What Happens**|**Dependency**|
|---|---|---|---|
|1. Browse Feed|Frontend|Freelancer sees open jobs. Filters by category.|Job feed (M1-T2)|
|2. Open Job|Frontend|GET /jobs/:id. Full description, client trust badge, budget.|JobDetailView (M3-T1)|
|3. Submit Proposal|Frontend + Backend|ProposalForm auto-saves draft. POST /proposals. DB record: status=PENDING.|Proposal module (M3-T1)|
|4. Client Notified|Backend|Telegram Bot sends message to client: 'New proposal on your job [title]'.|Notification module|
|5. Client Accepts|Backend|PATCH /proposals/:id status=ACCEPTED. Transaction record created: status=PENDING.|Proposal + Payment modules|
|6. Freelancer Notified|Backend|Telegram Bot: 'Your proposal was accepted. Client is paying.'|Notification module|
|7. Client Pays|Frontend|PaymentView shows Chapa QR + Telebirr link + fallback timer.|Payment module (M4-T1)|
|8. Webhook or Manual|Backend|Chapa webhook auto-confirms OR user submits manual TX ID.|Payment fallback (M4-T1)|
|9. Admin Verifies|Admin Panel|Admin confirms manual TX ID. Transaction: status=CONFIRMED.|Admin module (M4-T2)|
|10. Work Begins|Both|'Funds Secured' banner on job. Freelancer delivers work.|Job status=IN_PROGRESS|
|11. Client Releases|Backend|POST /escrow/release/:jobId. Admin confirms. Transaction: status=CONFIRMED.|Admin escrow release|
|12. Trust Updated|Backend|Both users' trust scores recalculated. Job status=COMPLETED.|Trust module|

# PART 7 — DEBUGGING DICTIONARY

A reference for the most common failures. Each entry has symptoms, root cause, isolation steps, rollback strategy, and a debugging prompt optimized for small local models.

## 7.1 Telegram Auth Failure

|**Field**|**Details**|
|---|---|
|Symptom|POST /auth/verify returns 401. Valid initData fails HMAC check. User never logs in.|
|Root Cause A|initData is URL-decoded before verification. It must be passed as-is.|
|Root Cause B|Data-check-string fields are not sorted alphabetically.|
|Root Cause C|BOT_TOKEN in env has trailing whitespace or newline.|
|Isolation|console.log the raw initData string. Paste into Telegram's official verification test tool.|
|Rollback|Add process.env.SKIP_AUTH=true guard that returns a mock user in dev. Never ship to prod.|
|LLM Debug Prompt|"Here is my Telegram initData verification function in TypeScript: [paste]. Here is the raw initData string (with hash removed for safety): [paste]. The verification always returns false. Check my HMAC computation step by step against Telegram's official docs algorithm."|

## 7.2 Prisma Migration Conflict

|**Field**|**Details**|
|---|---|
|Symptom|npx prisma migrate dev fails. Error: 'migration X was modified after it was applied'.|
|Root Cause|A previously applied migration file was edited. Prisma detects the checksum mismatch.|
|Isolation|Run: npx prisma migrate status. Identify which migration shows 'migration modified'.|
|Fix (Dev)|npx prisma migrate reset — drops all data and reruns all migrations. Safe in development.|
|Fix (Production)|Never run migrate reset in production. Create a new migration that fixes the schema.|
|Rollback|Restore the original migration file from git: git checkout migrations/[migration_name]/migration.sql|
|LLM Debug Prompt|"npx prisma migrate dev fails with: [paste exact error]. My current schema.prisma is: [paste]. My migration history shows: [paste migrate status output]. What is the correct fix without losing production data?"|

## 7.3 Webhook Failure (Chapa/Telebirr)

|**Field**|**Details**|
|---|---|
|Symptom|Payment completed on Chapa/Telebirr but Transaction status stays PENDING. Webhook endpoint not hit.|
|Root Cause A|Webhook URL is localhost, not the public Railway URL. Chapa cannot reach it.|
|Root Cause B|HTTPS required. Railway provides HTTPS by default. Self-signed certs will fail.|
|Root Cause C|Webhook secret mismatch. Chapa sends X-Chapa-Signature header. Backend does not verify or uses wrong secret.|
|Isolation|Use RequestBin or webhook.site to capture raw webhook payloads from Chapa test mode.|
|Fallback — Always Active|The 'I Have Paid' manual fallback is always available. Webhook failure does not block business.|
|LLM Debug Prompt|"My Chapa webhook endpoint POST /payments/webhook is never called. My Railway URL is [url]. Here is my webhook handler: [paste]. Here is the Chapa webhook configuration I set up: [paste]. What could prevent Chapa from reaching my endpoint?"|

## 7.4 Stale React State / Stale React Query Data

|**Field**|**Details**|
|---|---|
|Symptom|User submits a job. Redirected to feed. New job does not appear. Feed shows old data.|
|Root Cause|React Query cache not invalidated after mutation. Shows stale cached response.|
|Fix|After successful POST /jobs, call: queryClient.invalidateQueries({queryKey: ['jobs']})|
|Symptom 2|State update in one component does not propagate to another.|
|Root Cause 2|Local component state used instead of shared React Query cache or context.|
|Isolation|Install React Query DevTools. Watch cache keys and observe stale/fresh status.|
|LLM Debug Prompt|"After submitting a new job in PostJobView, my JobFeedView does not update. Here is my mutation handler: [paste]. Here is my useQuery in JobFeedView: [paste]. How do I invalidate the jobs query after a successful post?"|

## 7.5 CORS Errors

|**Field**|**Details**|
|---|---|
|Symptom|Browser console: 'Access to fetch at [url] has been blocked by CORS policy'.|
|Root Cause A|@fastify/cors not registered, or registered after routes are defined.|
|Root Cause B|CORS origin does not include the Mini App's origin. Telegram Mini Apps run from t.me domain.|
|Fix|Register cors before any route: app.register(cors, {origin: true}) in development. Restrict to specific origins in production.|
|Isolation|Check Network tab: look for OPTIONS preflight request. If it returns 4xx, CORS is misconfigured.|
|LLM Debug Prompt|"My Fastify backend returns CORS errors. Here is how I register @fastify/cors: [paste]. My frontend runs at origin: [paste origin]. What is the correct CORS configuration?"|

## 7.6 'Cannot read properties of undefined (reading map)'

|**Field**|**Details**|
|---|---|
|Symptom|Runtime error when rendering job list or proposal list. App crashes.|
|Root Cause|Attempting to .map() on undefined. The API response has a different shape than expected.|
|Fix — Always Do This|const jobs = data?.jobs ?? []; — never map directly on data or data.jobs without null safety.|
|Isolation|console.log(data) before the map call. Compare shape to what the API actually returns.|
|Pattern to Avoid|❌ data.map(...)   ❌ data.jobs.map(...)   ✅ (data?.jobs ?? []).map(...)|
|LLM Debug Prompt|"I get 'Cannot read properties of undefined (reading map)' in this component: [paste]. The API returns this JSON: [paste]. Fix the data access pattern to be null-safe."|

## 7.7 Deployment Failure on Railway

|**Field**|**Details**|
|---|---|
|Symptom|Railway build succeeds but app crashes on start. Health check fails.|
|Root Cause A|App does not listen on process.env.PORT. Railway assigns a dynamic port.|
|Root Cause B|DATABASE_URL not set in Railway environment variables.|
|Root Cause C|npx prisma migrate deploy not run on Railway. Tables do not exist.|
|Fix|Add to package.json scripts: 'start': 'npx prisma migrate deploy && node dist/server.js'|
|Isolation|Railway provides deployment logs. Read the full crash log — the actual error is always in the last 20 lines.|
|LLM Debug Prompt|"My Railway deployment fails with this error in the logs: [paste last 30 lines]. My package.json start script is: [paste]. What is causing the crash?"|

## 7.8 Payment Callback Mismatch

|**Field**|**Details**|
|---|---|
|Symptom|Chapa webhook fires but Transaction is not updated. Or the wrong Transaction is updated.|
|Root Cause A|Chapa callback does not include the internal transactionId. Only the gateway reference (tx_ref) is in the payload.|
|Root Cause B|When initializing Chapa payment, the tx_ref (your internal Transaction ID) was not stored on the Transaction record.|
|Fix|When creating Transaction, set gateway_ref = the tx_ref you send to Chapa. In webhook, look up Transaction by gateway_ref, not by ID.|
|Isolation|Log the full raw webhook payload to your Railway logs. Compare fields to Prisma Transaction fields.|
|LLM Debug Prompt|"My Chapa webhook receives this payload: [paste payload]. My Transaction model has these fields: [paste model]. My webhook handler does: [paste handler]. The wrong transaction is being updated. What is the correct lookup field?"|

# PART 8 — DOCS/CONTEXT MEMORY SYSTEM

The small local LLM has no memory between sessions. Your /docs/context/ folder is its brain. Every file in this folder must be updated at the end of every coding session. If these files are stale, the LLM will hallucinate architecture, invent endpoints, and contradict the schema.

## 8.1 Memory Files — Full Specification

|**File**|**Purpose**|**Update Trigger**|**Max Size**|
|---|---|---|---|
|current_task.md|What is being built right now. One task only. Mission ID + Task ID + goal.|Start of every coding session|~1 page|
|schema_snapshot.md|The full current Prisma schema. Copy-paste from schema.prisma.|After every Prisma migration|~2 pages|
|api_contracts.md|All routes: method, path, auth required, request body shape, response shape.|After every new route is created|~3 pages|
|active_bugs.md|Current open bugs: symptom, suspected cause, what was tried, status.|When a bug appears; clear when resolved|~1 page|
|architecture_rules.md|The mandatory constraints from Part 2.2. Never modify these.|Never — read-only reference|~1 page|
|ui_rules.md|Component naming conventions, Tailwind patterns used, mobile spacing rules.|After new UI conventions are established|~1 page|
|deployment_notes.md|Railway URL, env vars needed (not values), last successful deploy hash, known deployment quirks.|After each deployment|~1 page|
|payment_flow.md|The full payment state machine. Current gateway mode (test/live). Webhook URL. Known failure modes.|After any payment change|~1 page|
|feature_status.md|All features with status: NOT_STARTED / IN_PROGRESS / DONE / BLOCKED. One line each.|Weekly review|~1 page|

## 8.2 How to Write Effective Context Files for Small LLMs

•        **Be Declarative, Not Narrative:** Write 'POST /jobs requires: {title: string, budget: number}. Returns: Job object.' Not 'The job posting endpoint accepts a title and a budget field and returns the job.'

•        **Include the Schema in Every LLM Prompt:** Paste the full schema_snapshot.md into every prompt that touches the database. Do not assume the model remembers it.

•        **State What NOT To Do:** In architecture_rules.md, write: 'DO NOT use microservices. DO NOT create a messaging system. DO NOT add AI recommendation features.' Negative constraints prevent hallucination.

•        **Mark Completed Work Clearly:** In feature_status.md, mark DONE features as done. The LLM should not try to 'improve' them unless asked.

•        **One Active Bug at a Time:** Do not bring multiple bugs into a single LLM session. The model will conflate them. Fix one bug, update active_bugs.md, then start the next session.

## 8.3 Sample current_task.md

|   |
|---|
|**# Current Task**<br><br>Mission: M2 — Auth Bridge<br><br>Task: M2-T1 — Telegram initData verification<br><br>Goal: Backend verifies HMAC. Upserts User. Returns JWT.<br><br>Status: IN PROGRESS<br><br>Completed today:<br><br>- [x] verifyInitData.ts created and tested with real Telegram initData<br><br>Next session starts at:<br><br>- POST /auth/verify route creation|

# PART 9 — DAILY SOLO DEVELOPER RITUAL

## 9.1 Morning Ritual (15–30 minutes)

1.     Open current_task.md. Read the 'Next session starts at' section. This is your only objective today.

2.     Open active_bugs.md. If there is an active bug, it takes priority over new features.

3.     Open feature_status.md. Confirm your task is IN_PROGRESS. If it is BLOCKED, resolve the blocker first.

4.     Write your LLM context prompt: paste current_task.md + schema_snapshot.md + the relevant api_contracts.md sections into your local model's context.

5.     State your task to the LLM: 'Analyze the attached context and tell me what already exists and what needs to be built for [task].' Wait for its analysis before writing any code.

## 9.2 Coding Session (60–90 minutes)

6.     One task per session. If the task is not complete in 90 minutes, either break it into a smaller sub-task or simplify the implementation.

7.     Git commit after every working unit: git commit -m 'feat: M2-T1 add initData verification function'. Never commit broken code.

8.     After writing a component, immediately test it on a real phone via Telegram before moving to the next step.

8.5.   Add a mission-task label to every console.error. Write `console.error('[M4-T1] payment verification failed:', error)` every time. When something breaks at 10 PM, you will know exactly which function failed without reading the entire stack trace. This is a five-second habit that saves twenty minutes of debugging.

9.     If you get a blocking error you cannot resolve in 20 minutes, add it to active_bugs.md and implement the fallback path instead. Never stop progress because of one bug.

## 9.3 End-of-Session Cleanup (15 minutes)

10.  **Update current_task.md:** Mark completed items. Write exactly what the next session starts at.

11.  **Update active_bugs.md:** Add any new bugs discovered. Mark resolved bugs as RESOLVED with the fix.

12.  **Update schema_snapshot.md:** If any migration ran, copy the new schema.prisma content.

12.5. Run `npx prisma studio` and visually confirm the last transaction or job you worked on has the correct status in the actual database. Do not assume your code worked. Do not trust the API response. Look at the raw row. Most bugs become obvious the moment you see the data directly.

13.  **Update api_contracts.md:** If any routes were added or changed, document them.

14.  **Update feature_status.md:** Change any DONE features to DONE. Update IN_PROGRESS.

15.  **Git push:** Always push to GitHub at end of session. This is your backup.

16.  **Burnout check:** Did this session feel productive? If not, write one sentence about why in current_task.md. Adjust scope for tomorrow.

## 9.4 Git Commit Strategy

|**Prefix**|**Use When**|**Example**|
|---|---|---|
|feat:|New working feature added|feat: M1-T3 add IndexedDB draft auto-save to PostJobView|
|fix:|Bug resolved|fix: M2-T1 correct HMAC data-check-string sort order|
|wip:|Incomplete work — end of session, code does not fully work yet|wip: M4-T1 payment view layout in progress|
|refactor:|Cleaned up existing code, no new behavior|refactor: split AdminPanelView into smaller components|
|schema:|Prisma schema or migration changed|schema: add manual_tx_id and admin_verified to Transaction|
|docs:|Context files updated|docs: update current_task and api_contracts after M2-T1|

## 9.5 Architecture Review (Weekly — Sunday)

•        Open feature_status.md. Review all IN_PROGRESS and DONE items.

•        Ask: 'Does any completed feature need to be split because it is over 200 lines?' If yes, refactor.

•        Ask: 'Is any feature becoming a microservice in disguise?' If yes, collapse it.

•        Deploy the current working state to Railway. The app must have at least one new working thing compared to last Sunday.

•        Post one screenshot or screen recording of the new feature in a private Telegram group. This is your demo ritual. It forces you to actually ship.

## 9.6 Burnout Prevention Rules

|   |
|---|
|**RULE: No Feature > 3 Sessions**<br><br>If a feature takes more than 3 focused coding sessions, it is too complex. Cut scope, simplify the implementation, or defer it to Phase 2.|

|   |
|---|
|**RULE: Ship Something Every Week**<br><br>Every Sunday, the deployed Telegram bot must have at least one new working capability. Even if it is just a new button that shows a toast. Shipping is the antidote to burnout.|

|   |
|---|
|**RULE: The 20-Minute Escape Hatch**<br><br>If you are stuck on the same error for 20 minutes, stop. Add the bug to active_bugs.md. Implement the manual/fallback version. Move on. Do not spend 3 hours debugging a webhook on day 3.|

|   |
|---|
|**RULE: One Thing**<br><br>current_task.md has exactly one task. Not two. Not 'and also.' One.|

# PART 10 — EAST AFRICAN OPERATIONAL REALITY

## 10.1 Unstable Internet — Design Assumptions

•        **Assume 3G, not WiFi.** Test everything on 3G throttling in Chrome DevTools before considering a feature done.

•        **React Query caching is not optional.** staleTime: 5 minutes minimum. The job feed must be readable when offline.

•        **All forms auto-save to IndexedDB.** A power cut mid-form is not an edge case. It is Tuesday.

•        **Never use image backgrounds.** SVG icons only. No photo assets in the core UI. Every kilobyte costs someone real money.

•        **API responses must be small.** The job list endpoint should return a maximum of 20 jobs per page with only the fields needed for the card. Never return full descriptions in list views.

## 10.2 Partial Payment Failures

|**Scenario**|**What Happens**|**Resolution Path**|
|---|---|---|
|Telebirr deducted, webhook never fires|Transaction stays PENDING. User is frustrated. They paid real money.|User taps 'I Have Paid'. Submits TX ID. Admin verifies within 2 hours.|
|User claims payment but did not pay|Admin rejects manual TX ID. Transaction set to FAILED. User notified.|Admin sends Telegram message explaining. User can retry.|
|Chapa session times out mid-payment|User sees 'Payment failed' from Chapa. Transaction stays PENDING.|Show 'Try Again' button. Reinitialize Chapa session with same Transaction ID.|
|Double payment (user paid twice)|Two AWAITING_VERIFICATION transactions for same job.|Admin detects duplicate, marks one as REFUNDED, sends note to user.|

## 10.3 Fraud Attempts & Fake Freelancers

|**Attack Pattern**|**Detection Signal**|**Admin Response**|
|---|---|---|
|Fake portfolio links|New account, trust_score < 40, multiple jobs applied in < 1 hour|Admin reviews proposals from low-trust accounts. Can require phone verification.|
|Spam job posting (fake jobs to harvest contacts)|Multiple jobs posted by same account in < 24 hours with no activity|Trust module flags. Admin reviews and deletes. Ban user if pattern repeats.|
|Escrow bypass (claim payment outside platform)|Client and freelancer agree to skip escrow. Job never funded.|This is a business risk, not a security vulnerability. Platform loses commission. Reduce by showing clear 'Funds Secured' value prop.|
|Account sharing (one person, multiple Telegram IDs)|Multiple accounts with same IP (not detectable in TMA) but same writing style|Not detectable at MVP scale. Address at 500+ users.|
|False 'I Have Paid' claims|Submitted TX IDs that don't exist in Chapa/Telebirr records|Admin rejects. Repeated false claims → trust score penalty → eventual ban.|

## 10.4 Escrow Confusion — User Education

Most Ethiopian freelancers and clients have never used an escrow system. They will be confused. Explain it every time, not once.

•        Show a 3-step visual on the PaymentView: '1. Client pays TefTef → 2. You complete the work → 3. TefTef pays you.' Use icons, not text.

•        The 'Funds Secured' banner must be prominent and green on the job detail page once payment is confirmed. This is the trust signal.

•        When client releases funds, send a Telegram message to the freelancer: 'ETB [amount] has been sent to your account. Check your Telebirr/Chapa wallet.'

•        When payment is AWAITING_VERIFICATION, show freelancer: 'Your client has submitted payment. It is being verified. This usually takes less than 2 hours. You will receive a Telegram notification.'

## 10.5 Admin Manual Intervention Protocols

|**Situation**|**Admin Action**|**Telegram Messages to Send**|
|---|---|---|
|Disputed payment (client says paid, no evidence)|Set Transaction: status=DISPUTED. Freeze job.|To client: 'Your payment is being investigated.' To freelancer: 'Job paused pending payment verification.'|
|Freelancer delivers bad work|Admin mediates. Can set job status=DISPUTED.|Message both parties with instructions. Manual resolution for MVP.|
|Client disappears after freelancer delivers|Admin reviews case. If work was clearly delivered, can manually release escrow.|To freelancer: 'Funds released based on admin review.'|
|Spam job with many false bids|Admin deletes job. Bans poster. Notifies affected bidders.|To bidders: 'Job [title] was removed for policy violation. Your proposal has been cancelled.'|
|Platform-level payment gateway outage|Switch entire platform to MANUAL mode. All payments via 'I Have Paid' flow.|Bot broadcast to all active users: 'Payment gateway is temporarily in manual mode. Use the I Have Paid button. Processing may take up to 4 hours.'|

## 10.6 Critical Thresholds Before Launch

Three thresholds will break your platform if you ignore them. Each has a specific fix that takes less than one hour to implement. Do these before your first real user.

**Threshold One: 20 Jobs Per Day**

When you reach 20 jobs posted per day, manual payment verification becomes impossible for a solo admin. One admin cannot verify 20+ transactions within 2 hours while also moderating spam and responding to disputes.

**Fix before launch:** Add two simple automated systems before you hit 10 jobs per day.

First, a webhook retry queue. Chapa and Telebirr webhooks fail in Ethiopia. Do not assume they will work. Create a simple retry function:

```typescript
// In your webhook handler
async function handleWebhookWithRetry(payload, retryCount = 0) {
  try {
    await processPayment(payload);
  } catch (error) {
    if (retryCount < 3) {
      setTimeout(() => {
        handleWebhookWithRetry(payload, retryCount + 1);
      }, 1000 * Math.pow(2, retryCount)); // 1s, 2s, 4s backoff
    } else {
      // Save failed webhook to database for manual review
      await prisma.failedWebhook.create({ data: { payload, error: error.message }});
      sendAdminAlert('Webhook failed after 3 retries');
    }
  }
}
```

Second, simple spam detection. Add this rule to your POST /jobs middleware:

```typescript
const recentJobs = await prisma.job.count({
  where: {
    clientId: user.id,
    created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) } // last hour
  }
});

if (recentJobs >= 3) {
  return reply.code(429).send({ error: 'Too many jobs. Maximum 3 jobs per hour.' });
}
```

This stops automated spam without requiring admin intervention.

**Threshold Two: Bot Token Confusion**

Using one Telegram bot for development and production will eventually cause you to send test notifications to real users. You will do this at 11 PM after a long coding session. It is not a matter of if, but when.

**Fix before writing any code:** Create two bots immediately.

Open BotFather. Create @TefTef_Dev_Bot and @TefTef_Prod_Bot. Save both tokens. Add this to your .env:

```
BOT_TOKEN_DEV=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
BOT_TOKEN_PROD=987654:XYZ-ABC5678ijKlm-nop90Q3w2r456ty22
BOT_MODE=DEV
```

In your code:

```typescript
const botToken = process.env.BOT_MODE === 'PROD' 
  ? process.env.BOT_TOKEN_PROD 
  : process.env.BOT_TOKEN_DEV;
```

Set BOT_MODE=DEV on your local machine. Set BOT_MODE=PROD only in Railway production environment. Never the other way around.

**Threshold Three: Database Slowdown**

Without indexes, your job feed query will take 2-3 seconds after 5000 jobs. Users will think the app is broken and close it.

**Fix before first real user:** Add these indexes to your Prisma schema. Do this now, not later.

```prisma
model Job {
  // ... existing fields ...
  @@index([status, created_at(sort: Desc)])
}

model Transaction {
  // ... existing fields ...
  @@index([status])
  @@index([user_id])
}

model Proposal {
  // ... existing fields ...
  @@index([job_id])
  @@index([freelancer_id])
}
```

After adding these, run:

```bash
npx prisma migrate dev --name add_indexes
```

This adds five minutes to your setup time and saves five days of firefighting later.

# PART 11 — IMPLEMENTATION ORDER (SAFE BUILD SEQUENCE)

Never build out of this order. Every step produces a working product. No step creates a dead-end.

|**#**|**Milestone**|**What You Can Demo**|**What Breaks If Skipped**|
|---|---|---|---|
|1|Bot opens Mini App shell (M0)|Telegram bot opens blank app with your name|Nothing else builds without Telegram SDK connection|
|2|Backend /health + DB (M0-T2, M0-T3)|curl /health returns OK|Auth and all data routes have no foundation|
|3|Mock job feed (M1-T1, M1-T2)|Scrollable list of hardcoded job cards|Auth complexity distracts from UI validation|
|4|PostJobView + draft (M1-T3)|Post a job, close app, draft restored|Offline resilience is much harder to retrofit|
|5|Real backend + DB jobs (M1-T3 connect)|Post a real job from phone, see it in feed|Cannot validate full flow without real data|
|6|Telegram auth (M2-T1)|User identity tied to Telegram ID|Cannot associate jobs with users without auth|
|7|Proposals (M3-T1)|Freelancer bids on a job|Cannot test payment flow without proposal acceptance|
|8|Payment + fallback (M4-T1)|Client pays (mock) or uses 'I Have Paid'|Core business model not validated|
|9|Admin panel (M4-T2)|Admin verifies payment, releases escrow|Platform unoperational without manual verification|
|10|Trust score (calculated)|User profiles show badge tier|Trust is a background service, safe to add late|
|11|Telegram Bot notifications|Users receive alerts in Telegram chat|Low priority — manual checking works for early users|

# FINAL WORD FROM THE CTO

**TefTef is not a technical problem. It is an execution problem.**

The architecture is defined. The tasks are atomic enough for a 9B model to handle. The order is safe. The fallbacks are built in. The memory system prevents hallucination. The debugging dictionary handles the common failures. The East African deployment reality is accounted for.

You have one job now: open current_task.md, write 'Mission M0 — Task M0-T1', and initialize the Vite project.

The LLM writes bricks. You lay them. Every session. Every day.

**Now go to Task M0-T1 and initialize the project.**

_TefTef Execution OS — v2.0 — Solo Dev Edition — Telegram-First — East Africa_