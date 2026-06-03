import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { JobFeedView } from './components/JobFeedView';
import { PostJobView } from './components/PostJobView';
import { JobDetailView } from './components/JobDetailView';
import { AdminPanelView } from './components/AdminPanelView';
import { verifyTelegramInitData } from './lib/auth';
import { getSessionToken, setSessionToken } from './lib/session';

// [M0-T1] Telegram Mini App Shell — reads user name from initData
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        initData: string;
        initDataUnsafe: {
          user?: { first_name: string; id: number; username?: string };
        };
      };
    };
  }
}

function isAdminPath() {
  return window.location.pathname.replace(/\/$/, '') === '/admin';
}

function App() {
  const queryClient = useQueryClient();
  const adminPath = isAdminPath();
  const [activeView, setActiveView] = useState<'feed' | 'post' | 'detail'>('feed');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const isPostView = activeView === 'post';
  const isDetailView = activeView === 'detail';
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionToken, setSessionTokenState] = useState(getSessionToken());

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
  }, []);

  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;

    if (!sessionToken && initData) {
      setAuthLoading(true);
      verifyTelegramInitData(initData)
        .then((response) => {
          setSessionToken(response.sessionToken);
          setSessionTokenState(response.sessionToken);
          queryClient.invalidateQueries({ queryKey: ['jobs'] });
        })
        .catch((error) => {
          console.error('[M2-T1] auth verify failed:', error);
          setAuthError((error as Error)?.message ?? 'Unable to verify Telegram auth.');
        })
        .finally(() => setAuthLoading(false));
    }
  }, [queryClient, sessionToken]);

  const name =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? 'there';

  if (adminPath) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        {authLoading ? (
          <p className="text-center text-sm text-slate-500">Verifying Telegram session…</p>
        ) : authError ? (
          <p className="text-center text-sm text-red-700">{authError}</p>
        ) : (
          <AdminPanelView />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                {isDetailView ? 'Job Details' : isPostView ? 'Post a Job' : 'Find Work'}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Hello, {name}!
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {isDetailView
                  ? 'Review the full job description and submit your proposal.'
                  : isPostView
                    ? 'Tell freelancers and job seekers what you need, and your draft will be saved automatically as you type.'
                    : 'Browse active freelance contracts and full-time jobs posted by Ethiopian businesses.'}
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
          {authLoading || authError ? (
            <div className="mt-4 rounded-3xl border px-4 py-3 text-sm text-slate-700 bg-slate-50">
              {authLoading ? 'Verifying Telegram session…' : authError}
            </div>
          ) : null}
        </header>

        {isPostView ? (
          <PostJobView onBack={() => setActiveView('feed')} />
        ) : isDetailView ? (
          <JobDetailView jobId={selectedJobId!} onBack={() => setActiveView('feed')} />
        ) : (
          <JobFeedView
            authReady={Boolean(sessionToken)}
            onJobClick={(id) => {
              setSelectedJobId(id);
              setActiveView('detail');
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
