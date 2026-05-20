import { useState } from 'react';
import { JobFeedView } from './components/JobFeedView';
import { PostJobView } from './components/PostJobView';

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

function App() {
  window.Telegram?.WebApp?.ready();

  const name =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? 'there';
  const [activeView, setActiveView] = useState<'feed' | 'post'>('feed');
  const isPostView = activeView === 'post';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                {isPostView ? 'Post a Job' : 'Find Work'}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Hello, {name}! 👋
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {isPostView
                  ? 'Tell freelancers what you need and save your draft automatically while you type.'
                  : 'Browse active jobs posted by Ethiopian businesses. This is your first glance at the TefTef job feed.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 rounded-3xl bg-slate-50 p-4 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveView('feed')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  !isPostView
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Browse jobs
              </button>
              <button
                type="button"
                onClick={() => setActiveView('post')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isPostView
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Post a job
              </button>
            </div>
          </div>
        </header>

        {isPostView ? (
          <PostJobView onBack={() => setActiveView('feed')} />
        ) : (
          <JobFeedView />
        )}
      </div>
    </div>
  );
}

export default App;
