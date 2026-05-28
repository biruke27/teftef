import React, { useState, useEffect } from 'react';
import { saveDraft, loadDraft, clearDraft } from '../lib/draftStorage';

interface ProposalFormProps {
  jobId: string;
  onCancel: () => void;
  onSubmit: (amount: number, message: string) => Promise<void>;
}

export function ProposalForm({ jobId, onCancel, onSubmit }: ProposalFormProps) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDraft = async () => {
      const draft = await loadDraft<{ amount: string; message: string }>(`proposal-${jobId}`);
      if (draft) {
        setAmount(draft.amount);
        setMessage(draft.message);
      }
    };
    fetchDraft();
  }, [jobId]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      await saveDraft(`proposal-${jobId}`, { amount, message });
    }, 500);
    return () => clearTimeout(timer);
  }, [jobId, amount, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(Number(amount), message);
      await clearDraft(`proposal-${jobId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = amount && Number(amount) > 0 && message.length >= 20;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Proposed Amount (ETB)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 5000"
          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Your Proposal</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your experience and how you'll solve this... (min 20 chars)"
          className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-slate-900 outline-none h-32 resize-none"
          required
        />
        <p className={`text-xs ${message.length >= 20 ? 'text-green-600' : 'text-slate-400'}`}>
          {message.length} / 500 characters
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800"
        >
          {isSubmitting ? 'Submitting...' : 'Send Proposal'}
        </button>
      </div>
    </form>
  );
}
