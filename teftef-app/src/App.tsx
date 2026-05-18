import { JobCard } from './components/JobCard';

// [M0-T1] Telegram Mini App Shell — reads user name from initData
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        initDataUnsafe: {
          user?: { first_name: string; id: number; username?: string };
        };
      };
    };
  }
}

const mockJobs = [
  {
    id: 'job-01',
    title: 'Design a landing page for a local fintech startup',
    budget: 18000,
    description:
      'Create a clean, fast landing page for a digital savings app. Focus on simple copy, strong CTA, and mobile-first layout.',
    clientName: 'Ethiopia FinTech',
    status: 'OPEN' as const,
    postedAt: '2 hours ago',
  },
  {
    id: 'job-02',
    title: 'Translate product descriptions to Amharic',
    budget: 7500,
    description:
      'Translate 20 short product descriptions into natural Amharic for a new marketplace listing.',
    clientName: 'Marketplace Team',
    status: 'IN_PROGRESS' as const,
    postedAt: 'Today',
  },
  {
    id: 'job-03',
    title: 'Social media graphic set for small business campaign',
    budget: 9500,
    description:
      'Design 5 branded social graphics for Instagram and Facebook with local market style.',
    clientName: 'Sheba Creative',
    status: 'OPEN' as const,
    postedAt: 'Yesterday',
  },
];

function App() {
  window.Telegram?.WebApp?.ready();

  const name =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? 'there';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                Find Work
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Hello, {name}! 👋
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Browse active jobs posted by Ethiopian businesses. This is your first glance at the TefTef job feed.
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 shadow-inner">
              <p className="font-semibold text-slate-900">Live job feed</p>
              <p className="mt-1">3 open opportunities ready for bidding.</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {mockJobs.map((job) => (
            <JobCard
              key={job.id}
              title={job.title}
              budget={job.budget}
              description={job.description}
              clientName={job.clientName}
              status={job.status}
              postedAt={job.postedAt}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

export default App;
