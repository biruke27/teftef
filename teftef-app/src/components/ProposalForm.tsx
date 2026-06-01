import React, { useState, useEffect } from 'react';
import { saveDraft, loadDraft, clearDraft } from '../lib/draftStorage';
import { useUser } from '../hooks/useUser';
import { updateMasterConsent } from '../lib/auth';
import { MasterConsentGateway, MicroConsentBanner, AccountabilityCheck } from './LegalConsentSuite';

interface ProposalFormProps {
  jobId: string;
  onCancel: () => void;
  onSubmit: (amount: number, message: string, verification?: { fullName: string; nationalId: string }) => Promise<void>;
}

export function ProposalForm({ jobId, onCancel, onSubmit }: ProposalFormProps) {
  const { data: user } = useUser();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState<'proposal' | 'verify'>('proposal');
  const [verifyData, setVerifyData] = useState({ fullName: '', nationalId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  useEffect(() => {
    const fetchDraft = async () => {
      const draft = await loadDraft<{ amount: string; message: string }>(`proposal-${jobId}`);
      if (draft) { setAmount(draft.amount); setMessage(draft.message); }
    };
    fetchDraft();
  }, [jobId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await saveDraft(`proposal-${jobId}`, { amount, message });
    }, 500);
    return () => clearTimeout(timer);
  }, [jobId, amount, message]);

  const isIdentityVerified = user?.nationalId !== null && user?.nationalId !== undefined;
  const isIdentityValid = verifyData.fullName.trim().length > 2 && verifyData.nationalId.trim().length > 5;
  const isValidProposal = amount && Number(amount) > 0 && message.length >= 20;

  const handleSubmissionIntercept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isIdentityVerified && viewMode === 'proposal') {
      setViewMode('verify');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(
        Number(amount),
        message,
        !isIdentityVerified ? { fullName: verifyData.fullName, nationalId: verifyData.nationalId } : undefined
      );
      await clearDraft(`proposal-${jobId}`);
      onCancel();
    } catch (error) {
      console.error('[PROPOSAL-GATE] Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmissionIntercept} className="space-y-4">
      <MasterConsentGateway
        acceptedMasterTerms={user?.acceptedMasterTerms ?? false}
        onAccept={updateMasterConsent}
      />

      {viewMode === 'proposal' ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Proposed Amount (ETB)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Your Proposal</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your experience... (min 20 chars)" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none h-32 resize-none" required />
            <p className={`text-xs ${message.length >= 20 ? 'text-green-600' : 'text-slate-400'}`}>{message.length} / 500 characters</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <p className="text-xs text-amber-800 font-medium">Identity verification is required to submit a bid on this marketplace.</p>
          </div>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Full Legal Name</span>
              <input type="text" value={verifyData.fullName} onChange={(e) => setVerifyData({ ...verifyData, fullName: e.target.value })} placeholder="Enter full legal name" className="w-full p-2 border rounded text-sm" required />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">National ID Number</span>
              <input type="text" value={verifyData.nationalId} onChange={(e) => setVerifyData({ ...verifyData, nationalId: e.target.value })} placeholder="Enter unique ID string" className="w-full p-2 border rounded text-sm" required />
            </label>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <MicroConsentBanner />
        <AccountabilityCheck accepted={legalAccepted} onToggle={setLegalAccepted} />
      </div>

      <div className="flex gap-3 pt-2">
        {viewMode === 'verify' && (
          <button type="button" onClick={() => setViewMode('proposal')} className="flex-1 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition rounded-full">Back to letter</button>
        )}
        <button type="submit" disabled={(!isValidProposal || (!isIdentityVerified && !isIdentityValid)) || !legalAccepted || isSubmitting} className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800">
          {isSubmitting ? 'Submitting...' : viewMode === 'verify' ? 'Verify & Send' : 'Send Proposal'}
        </button>
        {viewMode === 'proposal' && (
          <button type="button" onClick={onCancel} className="flex-1 rounded-full py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
        )}
      </div>
    </form>
  );
}
