import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminDisputeRow } from './AdminDisputeRow';
import {
  fetchAdminDisputes,
  fetchAdminMe,
  lookupAdminUser,
  setUserBanned,
  setUserTrust,
  type AdminUser,
} from '../lib/admin';

function UserLookupResult({ user, onUpdated }: { user: AdminUser; onUpdated: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBan = async () => {
    setPending(true);
    setError(null);
    try {
      await setUserBanned(user.id, !user.is_banned);
      onUpdated();
    } catch (err) {
      console.error('[M4-T2] lookup ban failed:', err);
      setError((err as Error)?.message ?? 'Update failed');
    } finally {
      setPending(false);
    }
  };

  const handleTrust = async () => {
    const raw = window.prompt('Set trust score (0–100):', String(user.trust_score));
    if (raw === null) return;
    const score = Number(raw);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      setError('Trust score must be an integer from 0 to 100');
      return;
    }
    setPending(true);
    setError(null);
    try {
      await setUserTrust(user.id, score);
      onUpdated();
    } catch (err) {
      console.error('[M4-T2] lookup trust failed:', err);
      setError((err as Error)?.message ?? 'Update failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
      <p className="text-sm font-semibold text-slate-900">
        {user.username ? `@${user.username}` : 'User'} · {user.trustTier}
      </p>
      <p className="text-xs text-slate-500">Telegram ID {user.telegramId} · score {user.trust_score}</p>
      {user.is_banned && <p className="text-xs font-medium text-red-700">Currently banned</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleBan}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold disabled:opacity-50"
        >
          {user.is_banned ? 'Unban' : 'Ban'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleTrust}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold disabled:opacity-50"
        >
          Set trust
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function AdminPanelView() {
  const [searchId, setSearchId] = useState('');
  const [lookupUser, setLookupUser] = useState<AdminUser | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupPending, setLookupPending] = useState(false);

  const adminCheck = useQuery({
    queryKey: ['admin-me'],
    queryFn: fetchAdminMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const disputesQuery = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: () => fetchAdminDisputes(1),
    enabled: adminCheck.data === true,
    staleTime: 60 * 1000,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = searchId.trim();
    if (!id) return;
    setLookupPending(true);
    setLookupError(null);
    setLookupUser(null);
    try {
      const user = await lookupAdminUser(id);
      setLookupUser(user);
    } catch (err) {
      console.error('[M4-T2] user lookup failed:', err);
      setLookupError((err as Error)?.message ?? 'Lookup failed');
    } finally {
      setLookupPending(false);
    }
  };

  if (adminCheck.isLoading) {
    return <p className="text-sm text-slate-500">Checking access…</p>;
  }

  if (adminCheck.isError || adminCheck.data !== true) {
    return <div>Page not found</div>;
  }

  const disputes = disputesQuery.data?.disputes ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Dispute review</h1>
        <p className="mt-2 text-sm text-slate-600">
          Resolve reported jobs, adjust trust, or ban users. This page is not linked from the main app.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Find user by Telegram ID</h2>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="e.g. 8548332856"
            className="flex-1 min-w-[12rem] rounded-full border border-slate-200 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={lookupPending}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {lookupPending ? 'Searching…' : 'Search'}
          </button>
        </form>
        {lookupError && <p className="text-sm text-red-700">{lookupError}</p>}
        {lookupUser && (
          <UserLookupResult
            user={lookupUser}
            onUpdated={async () => {
              try {
                setLookupUser(await lookupAdminUser(lookupUser.telegramId));
              } catch (err) {
                console.error('[M4-T2] refresh lookup user failed:', err);
              }
            }}
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 px-1">
          Open disputes ({disputesQuery.data?.total ?? 0})
        </h2>
        {disputesQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading disputes…</p>
        ) : disputesQuery.isError ? (
          <p className="text-sm text-red-700">Unable to load disputes.</p>
        ) : disputes.length === 0 ? (
          <p className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No disputed jobs right now.
          </p>
        ) : (
          disputes.map((d) => <AdminDisputeRow key={d.jobId} dispute={d} />)
        )}
      </section>
    </div>
  );
}
