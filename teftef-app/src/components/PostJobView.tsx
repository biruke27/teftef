import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createJob } from '../lib/jobs';
import { clearDraft, loadDraft, saveDraft } from '../lib/draftStorage';

const DRAFT_KEY = 'post-job';

type DraftData = {
  title: string;
  description: string;
  budget: string;
};

export function PostJobView({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    loadDraft<DraftData>(DRAFT_KEY).then((draft) => {
      if (draft?.title || draft?.description || draft?.budget) {
        setTitle(draft.title ?? '');
        setDescription(draft.description ?? '');
        setBudget(draft.budget ?? '');
        setDraftSaved(true);
        setDraftLoaded(true);
      }
    });
  }, []);

  useEffect(() => {
    setDraftSaved(false);
    const timer = window.setTimeout(async () => {
      try {
        if (title || description || budget) {
          await saveDraft(DRAFT_KEY, { title, description, budget });
          setDraftSaved(true);
        } else {
          await clearDraft(DRAFT_KEY);
        }
      } catch (error) {
        console.error('[M1-T3] draft persistence failed:', error);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [title, description, budget]);

  const canPost = Boolean(title && description && budget);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    if (!canPost) {
      setStatus('error');
      setMessage('Please complete the form and open this app from Telegram.');
      return;
    }

    try {
      await createJob({
        title,
        description,
        budget: Number(budget),
      });

      await clearDraft(DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });

      setStatus('success');
      setMessage('Job posted successfully.');
      setTitle('');
      setDescription('');
      setBudget('');
      onBack();
    } catch (error) {
      setStatus('error');
      setMessage((error as Error)?.message ?? 'Unable to submit job.');
    }
  }

  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Post a job</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Create your job listing</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Describe the work, set a budget, and save the draft automatically while you type.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to job feed
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Job title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="E.g. Build a small business booking page"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Budget (ETB)
            <input
              type="number"
              min="0"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="15000"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          Job description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explain the work, deliverables, and timeline."
            rows={8}
            className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-slate-500">Your draft is saved automatically after 500ms of inactivity.</p>
            {draftSaved ? (
              <p className="text-sm text-slate-600">
                {draftLoaded ? 'Draft restored from browser storage.' : 'Draft saved locally.'}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!canPost || status === 'submitting'}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'submitting' ? 'Posting…' : 'Post job'}
          </button>
        </div>

        {message ? (
          <div
            className={`rounded-3xl px-4 py-3 text-sm ${status === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
          >
            {message}
          </div>
        ) : null}
      </form>
    </div>
  );
}
