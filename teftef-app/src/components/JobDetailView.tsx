import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchJobDetail, submitProposal } from '../lib/proposals';
import { ProposalForm } from './ProposalForm';
import { DealActions } from './DealActions';
import { PayBadgeRenderer } from './PayBadgeRenderer';
import { useUser } from '../hooks/useUser';
import { useJobProposals, useUpdateProposal } from '../hooks/useJob';

interface JobDetailViewProps {
  jobId: string;
  onBack: () => void;
}

const TRUST_BADGE: Record<string, string> = {
  Verified: 'bg-green-100 text-green-800',
  Trusted: 'bg-blue-100 text-blue-800',
  Rising: 'bg-amber-100 text-amber-800',
  New: 'bg-slate-100 text-slate-800',
};

const PROPOSAL_STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-slate-100 text-slate-800',
  WITHDRAWN: 'bg-red-100 text-red-800',
};

export function JobDetailView({ jobId, onBack }: JobDetailViewProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: currentUser, isLoading: isUserLoading } = useUser();
  const { data: job, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJobDetail(jobId),
    staleTime: 5 * 60 * 1000,
  });

  const isClient = job ? job.clientId === currentUser?.userId : false;

  const { data: proposals, isLoading: isProposalsLoading } = useJobProposals(jobId, isClient);
  const { mutateAsync: updateProposal, isPending: isUpdating } = useUpdateProposal(jobId);

  const handleSubmit = async (amount: number, message: string) => {
    setSubmitError(null);
    try {
      await submitProposal({ jobId, amount, message });
      setSubmitted(true);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    } catch (err) {
      const msg = (err as Error)?.message ?? 'Submission failed';
      if (msg.includes('409') || msg.toLowerCase().includes('duplicate')) {
        setSubmitError('You have already submitted a proposal for this job.');
      } else {
        setSubmitError(msg);
      }
      throw err;
    }
  };

  const handleUpdateProposal = async (proposalId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await updateProposal({ proposalId, status });
    } catch (err) {
      console.error(`[M3-T2] failed to update proposal status to ${status}:`, err);
    }
  };

  if (isLoading || isUserLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-3/4 rounded-xl bg-slate-200" />
          <div className="mt-4 h-20 rounded-xl bg-slate-100" />
          <div className="mt-4 h-32 rounded-xl bg-slate-100" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition">
          ← Back to jobs
        </button>
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <p className="font-semibold">Unable to load job details.</p>
          <p className="mt-2">{(error as Error)?.message ?? 'Please try again.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const badgeColor = TRUST_BADGE[job.trustTier] ?? TRUST_BADGE.New;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        ← Back to jobs
      </button>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-slate-900">{job.title}</h2>

          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
              {job.clientName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{job.clientName}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>
                {job.trustTier}
              </span>
            </div>
            <div className="ml-auto text-right space-y-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Budget</p>
              <p className="text-lg font-bold text-slate-900">ETB {job.budget.toLocaleString()}</p>
              <PayBadgeRenderer
                job={{
                  listingType: job.listingType,
                  payType: job.payType,
                  minPay: job.minPay,
                  maxPay: job.maxPay,
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Description</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-wrap">{job.description}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Posted {job.postedAt}</span>
              <span>{job.proposalCount} proposal{job.proposalCount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {job.status === 'PENDING_MATCH' && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">Pending match verification</h3>
              <p className="text-sm leading-6 text-slate-600">
                Cross-check the plain-text Name and ID string listed on this dashboard against a physical smartphone photo of the ID card inside your external Telegram private message thread before confirming the contract.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Client contact</p>
                  {job.clientUsername ? (
                    <a
                      href={`https://t.me/${job.clientUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-sm font-medium text-slate-900 underline underline-offset-2"
                    >
                      {`t.me/${job.clientUsername}`}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">Client Telegram username unavailable.</p>
                  )}
                </div>
                <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Candidate contact</p>
                  {job.pendingMatchCandidate?.username ? (
                    <a
                      href={`https://t.me/${job.pendingMatchCandidate.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-sm font-medium text-slate-900 underline underline-offset-2"
                    >
                      {`t.me/${job.pendingMatchCandidate.username}`}
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">Candidate Telegram username unavailable.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {submitError}
            </div>
          )}

          {/* Client Specific Accepted Info */}
          {isClient && job.freelancerContact && (
            <div className="mt-4 p-4 bg-green-50 rounded-2xl border border-green-200 space-y-3">
              <p className="text-sm font-medium text-green-800">
                🎉 Proposal accepted! Connect with the freelancer to finalize details.
              </p>
              <div className="flex flex-wrap gap-2">
                {job.freelancerContact.username ? (
                  <a
                    href={`https://t.me/${job.freelancerContact.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
                  >
                    💬 Chat on Telegram
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">No Telegram username available</span>
                )}
              </div>
              <DealActions jobId={jobId} jobStatus={job.status} />
            </div>
          )}

          {/* Freelancer Specific View */}
          {!isClient && (
            <>
              {job.myProposal ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Your Submitted Proposal</h4>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROPOSAL_STATUS_BADGE[job.myProposal.status] ?? 'bg-slate-100 text-slate-800'}`}>
                      {job.myProposal.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Bid: <strong className="text-slate-900">ETB {job.myProposal.amount.toLocaleString()}</strong></p>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{job.myProposal.message}</p>
                  
                  {job.myProposal.status === 'ACCEPTED' && job.clientContact && (
                    <div className="p-4 bg-green-50 rounded-2xl border border-green-200 space-y-3">
                      <p className="text-sm font-medium text-green-800">
                        🎉 Your proposal was accepted! Contact the client to start working.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {job.clientContact.username ? (
                          <a
                            href={`https://t.me/${job.clientContact.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm"
                          >
                            💬 Chat on Telegram
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">No Telegram username available</span>
                        )}
                      </div>
                      <DealActions jobId={jobId} jobStatus={job.status} />
                    </div>
                  )}
                </div>
              ) : (
                !submitted ? (
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 w-full rounded-full bg-slate-900 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-lg shadow-slate-200"
                  >
                    Submit Proposal
                  </button>
                ) : (
                  <div className="mt-4 rounded-full bg-green-50 py-4 text-center text-sm font-semibold text-green-700 border border-green-100">
                    ✅ Proposal Submitted
                  </div>
                )
              )}
            </>
          )}
        </div>
      </article>

      {/* Client Proposals List View */}
      {isClient && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Proposals Received</h3>
          {isProposalsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-10 bg-slate-100 rounded-xl" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ) : !proposals || proposals.length === 0 ? (
            <p className="text-sm text-slate-500">No proposals received yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{proposal.freelancerName}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TRUST_BADGE[proposal.trustTier] ?? TRUST_BADGE.New}`}>
                        {proposal.trustTier}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Bid Amount</p>
                      <p className="text-sm font-bold text-slate-900">ETB {proposal.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{proposal.message}</p>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PROPOSAL_STATUS_BADGE[proposal.status] ?? 'bg-slate-100 text-slate-800'}`}>
                      {proposal.status}
                    </span>
                    
                    {proposal.status === 'PENDING' && job.status === 'OPEN' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateProposal(proposal.id, 'ACCEPTED')}
                          disabled={isUpdating}
                          className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateProposal(proposal.id, 'REJECTED')}
                          disabled={isUpdating}
                          className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Submit Proposal</h2>
            <ProposalForm
              jobId={jobId}
              onCancel={() => setShowForm(false)}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
