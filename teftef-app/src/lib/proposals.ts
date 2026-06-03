import { getSessionToken } from './session';
import { JOBS_API_BASE_URL } from './jobs';

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export type JobDetail = {
  id: string;
  title: string;
  description: string;
  budget: number;
  listingType: 'FREELANCE' | 'FULL_TIME';
  payType: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
  minPay: number | null;
  maxPay: number | null;
  status: string;
  clientName: string;
  clientUsername?: string | null;
  trustTier: string;
  postedAt: string;
  proposalCount: number;
  clientId: string;
  myProposal?: {
    id: string;
    amount: number;
    message: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  };
  clientContact?: {
    username: string | null;
    telegramId: string;
  };
  freelancerContact?: {
    username: string | null;
    telegramId: string;
    proposalId: string;
  };
  pendingMatchCandidate?: {
    username: string | null;
    telegramId: string;
  };
};

export type Proposal = {
  id: string;
  freelancerId: string;
  freelancerName: string;
  trustTier: string;
  amount: number;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  createdAt: string;
};

export async function fetchJobDetail(jobId: string): Promise<JobDetail> {
  const res = await fetch(`${JOBS_API_BASE_URL}/jobs/${jobId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load job: ${res.status}`);
  return res.json();
}

export async function submitProposal(data: { jobId: string; amount: number; message: string; fullName?: string; nationalId?: string; acceptedMasterTerms?: boolean }) {
  const res = await fetch(`${JOBS_API_BASE_URL}/proposals`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `Failed to submit proposal: ${res.status}`);
  }
  return res.json();
}

export async function updateProposalStatus(
  proposalId: string,
  status: 'ACCEPTED' | 'REJECTED'
): Promise<Proposal> {
  const res = await fetch(`${JOBS_API_BASE_URL}/proposals/${proposalId}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `Failed to update proposal: ${res.status}`);
  }
  return res.json();
}

export async function fetchJobProposals(jobId: string): Promise<Proposal[]> {
  const res = await fetch(`${JOBS_API_BASE_URL}/jobs/${jobId}/proposals`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `Failed to fetch proposals: ${res.status}`);
  }
  const payload = await res.json();
  return payload?.proposals ?? [];
}

export type FeedbackAction = 'CONFIRM' | 'REPORT';

export type JobFeedbackResult = {
  job: { id: string; status: string };
  trustUpdated: { clientTier: string; freelancerTier: string };
};

export async function submitJobFeedback(
  jobId: string,
  action: FeedbackAction,
): Promise<JobFeedbackResult> {
  const res = await fetch(`${JOBS_API_BASE_URL}/jobs/${jobId}/feedback`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `Failed to submit feedback: ${res.status}`);
  }
  return res.json();
}

