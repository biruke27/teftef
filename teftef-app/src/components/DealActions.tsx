import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { submitJobFeedback, type FeedbackAction } from '../lib/proposals';

interface DealActionsProps {
  jobId: string;
  jobStatus: string;
}

export function DealActions({ jobId, jobStatus }: DealActionsProps) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (jobStatus === 'COMPLETED') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        Deal confirmed. This job is marked complete.
      </div>
    );
  }

  if (jobStatus === 'DISPUTED') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        A report was filed. An admin will review this job.
      </div>
    );
  }

  if (jobStatus !== 'IN_PROGRESS') {
    return null;
  }

  const handleFeedback = async (action: FeedbackAction) => {
    if (action === 'REPORT') {
      const confirmed = window.confirm(
        'Report ghosting or breach? The other party may receive a trust penalty and this job will be flagged for admin review.',
      );
      if (!confirmed) return;
    }

    setError(null);
    setIsPending(true);
    try {
      await submitJobFeedback(jobId, action);
      await queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });
    } catch (err) {
      console.error('[M4-T1] job feedback submission failed:', err);
      setError((err as Error)?.message ?? 'Something went wrong');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleFeedback('CONFIRM')}
          className="inline-flex items-center justify-center gap-1 rounded-full border border-green-200 bg-white px-4 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 transition disabled:opacity-50"
        >
          {isPending ? 'Saving…' : '✔️ Deal Confirmed'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleFeedback('REPORT')}
          className="inline-flex items-center justify-center gap-1 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition disabled:opacity-50"
        >
          ⚠️ Report Ghosting / Breach
        </button>
      </div>
    </div>
  );
}
