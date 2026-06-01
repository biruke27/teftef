import { JobCard } from './JobCard';
import { useJobs } from '../hooks/useJobs';

interface JobFeedViewProps {
  onJobClick: (id: string) => void;
  authReady: boolean;
}

export function JobFeedView({ onJobClick, authReady }: JobFeedViewProps) {
  const { data: jobs = [], isLoading, isError, error, refetch } = useJobs({ enabled: authReady });

  if (!authReady) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Waiting for Telegram authentication…</p>
        <p className="mt-2">Open this app inside Telegram or refresh after completing the login flow.</p>
      </div>
    );
  }

  if (isLoading && jobs.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-3xl border border-gray-200 bg-white p-5"
          />
        ))}
      </div>
    );
  }

  if (isError && jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        <p className="font-semibold">Unable to load jobs.</p>
        <p className="mt-2">{(error as Error)?.message ?? 'Please try again.'}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isError ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Problem loading the latest jobs.</p>
          <p className="mt-1">Showing saved feed items while we reconnect.</p>
        </div>
      ) : null}

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-900">No jobs available right now.</p>
          <p className="mt-2">Check back soon or refresh the app to see the latest opportunities.</p>
        </div>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job, index) => (
            <JobCard
              key={`${job.title}-${index}`}
              {...job}
              onClick={() => onJobClick(job.id!)}
            />
          ))}
        </section>
      )}
    </div>
  );
}
