# UI Rules

> Read before any task touching React components.
> These are established conventions — do not invent alternatives.

**Last updated:** 2026-05-16 (initial setup)

---

## Component Conventions

| Rule | Detail |
|---|---|
| File size | Max ~200 lines per component. Split if larger. |
| File naming | PascalCase for components: `JobCard.tsx`, `PostJobView.tsx` |
| Location | `src/components/` for reusable UI, `src/views/` for full-screen views |
| Props | Always type explicitly with TypeScript interface. No `any`. |
| Mock data | Keep in `src/mock/mockJobs.ts` etc. Never inline in component. |

---

## Tailwind Patterns

**Job card:**
```tsx
<div className="rounded-xl shadow-sm border border-gray-100 p-4 mb-3">
```

**Trust badge pills:**
```tsx
// Verified (blue)
<span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">🔵 Verified</span>

// Trusted (green)
<span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">🟢 Trusted</span>

// Rising (yellow)
<span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">🟡 Rising</span>

// New (gray)
<span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">⚪ New</span>
```

**Budget display:**
```tsx
<span>ETB {budget.toLocaleString()}</span>
```

**Description truncation:**
```tsx
// CSS fallback if line-clamp plugin not available:
// overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
<p className="line-clamp-2 text-gray-600 text-sm">{description}</p>
```

---

## Mobile-First Rules

- Minimum touch target: 44px height on all interactive elements
- Padding: `p-4` minimum for card containers
- No horizontal scroll — all layouts stack vertically on mobile
- SVG icons only — no PNG/WebP image backgrounds
- Test every component on real phone inside Telegram before marking DONE

---

## Data Access Patterns

Always null-safe — never map directly:
```tsx
// ✅ Correct
const jobs = data?.jobs ?? [];

// ❌ Never do this
data.jobs.map(...)
data.map(...)
```

---

## Toast Notifications

- 'Draft restored' — shown when IndexedDB draft is loaded on mount
- 'Job posted successfully.' — shown after successful POST /jobs
- 'Proposal submitted!' — shown after successful POST /proposals
- 'Discard draft?' — confirmation dialog before clearDraft

---

## Offline State

- Forms must continue to function when network drops
- Show 'Saving draft...' indicator while IndexedDB write is in progress (optional, but nice)
- React Query shows cached data when offline — do not show error state on network drop if data is cached

---

## Admin Panel

- Route: `/admin`
- If current user's telegramId is NOT in ADMIN_IDS → render `<div>Page not found</div>` (plain, no 404 styling — security through obscurity)
- Admin ID check happens on BOTH frontend (early return) and backend (middleware)
