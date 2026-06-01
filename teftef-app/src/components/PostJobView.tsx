import { useEffect, useState, type FormEvent, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createJob } from '../lib/jobs';
import { clearDraft, loadDraft, saveDraft } from '../lib/draftStorage';
import { useUser } from '../hooks/useUser';
import { updateMasterConsent } from '../lib/auth';
import { JobTypeSelector, type ListingType } from './JobTypeSelector';
import { PolymorphicPricingController } from './PolymorphicPricingController';
import { MasterConsentGateway, MicroConsentBanner, AccountabilityCheck } from './LegalConsentSuite';

const DRAFT_KEY = 'post-job';

type DraftData = {
  title: string;
  description: string;
  payType: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
  minPay: number | null;
  maxPay: number | null;
  listingType?: ListingType;
};

export function PostJobView({ onBack }: { onBack: () => void }) {
  const { data: user } = useUser();
  const isMounted = useRef(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [payType, setPayType] = useState<'FIXED' | 'RANGE' | 'NEGOTIABLE'>('FIXED');
  const [minPay, setMinPay] = useState<number | null>(null);
  const [maxPay, setMaxPay] = useState<number | null>(null);
  const [listingType, setListingType] = useState<ListingType>('FREELANCE');
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    loadDraft<DraftData>(DRAFT_KEY).then((draft) => {
      if (draft) {
        setTitle(draft.title ?? '');
        setDescription(draft.description ?? '');
        setPayType(draft.payType ?? 'FIXED');
        setMinPay(draft.minPay ?? null);
        setMaxPay(draft.maxPay ?? null);
        setListingType(draft.listingType ?? 'FREELANCE');
      }
    });
  }, []);

  useEffect(() => {
    setDraftSaved(false);
    const timer = window.setTimeout(async () => {
      try {
        if (title || description || minPay !== null || maxPay !== null) {
          await saveDraft(DRAFT_KEY, { title, description, payType, minPay, maxPay, listingType });
          setDraftSaved(true);
        } else {
          await clearDraft(DRAFT_KEY);
        }
      } catch (error) {
        console.error('[M1-T3] Draft persistence failed:', error);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [title, description, payType, minPay, maxPay, listingType]);

  const isIdentityVerified = user?.nationalId !== null && user?.nationalId !== undefined;
  const isIdentityFormFilled = !isIdentityVerified ? (fullName.trim().length > 2 && nationalId.trim().length > 5) : true;
  const canPost = Boolean(title && description && (payType === 'NEGOTIABLE' || minPay !== null)) && isIdentityFormFilled && legalAccepted;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');

    if (!canPost) {
      setStatus('error');
      setMessage('Please complete all fields, including identity verification and legal consent.');
      return;
    }

    try {
      await createJob({
        title,
        description,
        budget: minPay ?? 0,
        listingType,
        payType,
        minPay,
        maxPay,
        ...(!isIdentityVerified && {
          fullName: fullName.trim(),
          nationalId: nationalId.trim()
        })
      } as any);
      await clearDraft(DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: ['jobs'] });

      if (isMounted.current) {
        setStatus('success');
        setMessage('Job posted successfully.');
      }
      onBack();
    } catch (error) {
      if (isMounted.current) {
        setStatus('error');
        setMessage((error as Error)?.message ?? 'Unable to submit job request.');
      }
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
        <button onClick={onBack} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Back to job feed
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <JobTypeSelector listingType={listingType} onTypeChange={setListingType} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700 block">
            Job title
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="E.g. Build a small business booking page" className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
          </label>
          <PolymorphicPricingController
            listingType={listingType}
            onPayloadChange={(payload: { payType: 'FIXED' | 'RANGE' | 'NEGOTIABLE'; minPay: number | null; maxPay: number | null }) => {
              setPayType(payload.payType);
              setMinPay(payload.minPay);
              setMaxPay(payload.maxPay);
            }}
          />
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700 block">
          Job description
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain the work, deliverables, and timeline." rows={6} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200" />
        </label>

        <MasterConsentGateway
          acceptedMasterTerms={user?.acceptedMasterTerms ?? false}
          onAccept={updateMasterConsent}
        />

        {!isIdentityVerified && (
          <div className="p-5 bg-slate-50 border-l-4 border-blue-600 rounded-r-2xl space-y-4 animate-in fade-in duration-300">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Identity Details Required</h4>
              <p className="text-xs text-slate-500">TefTef requires a verified name and digital identification to open escrow parameters for your very first post.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Legal Name" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500" />
              <input type="text" required value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="National ID / Digital ID String" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500" />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <MicroConsentBanner />
          <AccountabilityCheck accepted={legalAccepted} onToggle={setLegalAccepted} />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">{draftSaved ? '✓ Draft saved locally' : 'Saving...'}</span>
          <button type="submit" disabled={!canPost || status === 'submitting'} className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {status === 'submitting' ? 'Posting…' : 'Post job'}
          </button>
        </div>

        {message && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${status === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
