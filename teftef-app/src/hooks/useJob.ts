import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessionToken } from '../lib/session';
import { updateProposalStatus, fetchJobProposals } from '../lib/proposals';
import type { JobDetail, Proposal } from '../lib/proposals';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useJob(id: string) {
  return useQuery<JobDetail>({
    queryKey: ['job', id],
    queryFn: async () => {
      const token = getSessionToken();
      const res = await fetch(`${API_URL}/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch job details');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubmitProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { jobId: string; amount: number; message: string }) => {
      const token = getSessionToken();
      const res = await fetch(`${API_URL}/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        throw new Error('You have already submitted a proposal for this job.');
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit proposal');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUpdateProposal(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: 'ACCEPTED' | 'REJECTED' }) => {
      return updateProposalStatus(proposalId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-proposals', jobId] });
    },
  });
}

export function useJobProposals(jobId: string, enabled: boolean) {
  return useQuery<Proposal[]>({
    queryKey: ['job-proposals', jobId],
    queryFn: () => fetchJobProposals(jobId),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
