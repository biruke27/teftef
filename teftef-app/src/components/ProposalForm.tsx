import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { saveDraft, loadDraft, clearDraft } from '../lib/draftStorage';
import { useUser } from '../hooks/useUser';
import { MasterConsentGateway, MicroConsentBanner, AccountabilityWall } from './LegalConsentSuite';

interface ProposalFormProps {
  jobId: string;
  onCancel: () => void;
  onSubmit: (amount: number, message: string, verification?: { fullName: string; nationalId: string; acceptedMasterTerms: boolean }) => Promise<void>;
}

export function ProposalForm({ jobId, onCancel, onSubmit }: ProposalFormProps) {
  const { data: user, isLoading: authLoading } = useUser();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  
  // Identity state
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tier detection
  const hasAcceptedTerms = user?.acceptedMasterTerms || localStorage.getItem('teftef_user_acceptedTerms') === 'true';
  const hasVerifiedId = !!(user?.nationalId || localStorage.getItem('teftef_user_nationalId'));
  const isVerifiedUser = hasAcceptedTerms && hasVerifiedId;

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

  const isValidProposal = amount && Number(amount) > 0 && message.length >= 20;
  const isIdentityValid = fullName.trim().length > 2 && nationalId.trim().length > 5;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(
        Number(amount),
        message,
        !isVerifiedUser ? { fullName: fullName.trim(), nationalId: nationalId.trim(), acceptedMasterTerms: true } : undefined
      );
      await clearDraft(`proposal-${jobId}`);
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      onCancel();
    } catch (error) {
      console.error('[PROPOSAL-GATE] Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) return <div className="p-4 text-xs text-slate-500 font-mono">Verifying authorization profile...</div>;

  return (
    <div className="space-y-4">
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

      {!isVerifiedUser && (
        <div className="space-y-4 animate-in slide-in-from-top duration-300">
          <MasterConsentGateway
            isChecked={consentChecked}
            onToggle={setConsentChecked}
          />
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <p className="text-xs text-amber-800 font-medium">Identity verification is required to submit a bid on this marketplace.</p>
          </div>
          <div className="space-y-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Full Legal Name</span>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full legal name" className="w-full p-2 border rounded text-sm" required />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">National ID Number</span>
              <input type="text" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="Enter unique ID string" className="w-full p-2 border rounded text-sm" required />
            </label>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <MicroConsentBanner />
        <AccountabilityWall
          accepted={legalAccepted}
          onToggle={setLegalAccepted}
          buttonLabel={!isVerifiedUser ? 'Accept Terms & Submit Bid' : 'Submit Bid'}
          disabled={!isValidProposal || (!isVerifiedUser && (!isIdentityValid || !consentChecked))}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onBack={onCancel}
        />
      </div>
    </div>
  );
}
