import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  deleteAdminJob,
  resolveDisputeJob,
  setUserBanned,
  setUserTrust,
  type AdminParty,
  type DisputeCard,
} from '../lib/admin';

function PartyActions({ party, label }: { party: AdminParty; label: string }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });

  const handleBan = async () => {
    setError(null);
    setPending(true);
    try {
      await setUserBanned(party.id, !party.is_banned);
      await refresh();
    } catch (err) {
      console.error('[M4-T2] admin ban toggle failed:', err);
      setError((err as Error)?.message ?? 'Update failed');
    } finally {
      setPending(false);
    }
  };

  const handleTrust = async () => {
    const raw = window.prompt(`Set trust score (0–100) for ${label}:`, '50');
    if (raw === null) return;
    const score = Number(raw);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      setError('Trust score must be an integer from 0 to 100');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await setUserTrust(party.id, score);
      await refresh();
    } catch (err) {
      console.error('[M4-T2] admin trust override failed:', err);
      setError((err as Error)?.message ?? 'Update failed');
    } finally {
      setPending(false);
    }
  };

  const displayName = party.username ? `@${party.username}` : party.telegramId;

  return (
    <div className="rounded-2xl bg-white/80 p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
        <span className="text-sm font-medium text-slate-900">{displayName}</span>
        <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
          {party.trustTier}
        </span>
        {party.is_banned && (
          <span className="text-xs rounded-full bg-red-100 px-2 py-0.5 text-red-700">Banned</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={handleBan}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {party.is_banned ? 'Unban' : 'Ban'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={handleTrust}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Set trust
        </button>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function AdminDisputeRow({ dispute }: { dispute: DisputeCard }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });

  const runJobAction = async (action: () => Promise<void>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    setPending(true);
    try {
      await action();
      await refresh();
    } catch (err) {
      console.error('[M4-T2] admin job action failed:', err);
      setError((err as Error)?.message ?? 'Action failed');
    } finally {
      setPending(false);
    }
  };

  return (
    <article className="rounded-3xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{dispute.title}</h3>
        <p className="mt-1 text-xs text-slate-500">
          ETB {dispute.budget.toLocaleString()} · {dispute.postedAt} · {dispute.status}
        </p>
      </div>
      <PartyActions party={dispute.client} label="Client" />
      {dispute.freelancer ? (
        <PartyActions party={dispute.freelancer} label="Freelancer" />
      ) : (
        <p className="text-xs text-slate-500">No accepted freelancer on record.</p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => runJobAction(() => resolveDisputeJob(dispute.jobId, 'COMPLETED').then(() => undefined))}
          className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Mark completed
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runJobAction(() => resolveDisputeJob(dispute.jobId, 'CLOSED').then(() => undefined))}
          className="rounded-full bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Close job
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            runJobAction(
              () => deleteAdminJob(dispute.jobId),
              'Delete this job and all proposals? This cannot be undone.',
            )
          }
          className="rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </article>
  );
}
