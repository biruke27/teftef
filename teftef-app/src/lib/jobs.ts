import type { JobCardProps } from '../components/JobCard';
import { getSessionToken } from './session';

export const JOBS_API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type CreateJobPayload = {
  title: string;
  description: string;
  budget: number;
  listingType?: 'FREELANCE' | 'FULL_TIME';
  payType?: 'FIXED' | 'RANGE' | 'NEGOTIABLE';
  minPay?: number | null;
  maxPay?: number | null;
  fullName?: string;
  nationalId?: string;
};

function authHeaders(): HeadersInit {
  const token = getSessionToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function fetchJobs(): Promise<JobCardProps[]> {
  const response = await fetch(`${JOBS_API_BASE_URL}/jobs`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load jobs: ${response.status}`);
  }

  const payload = await response.json();
  const jobs = payload?.jobs ?? payload;

  if (!Array.isArray(jobs)) {
    throw new Error('Unexpected jobs response format');
  }

  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    listingType: job.listingType ?? 'FREELANCE',
    payType: job.payType ?? 'FIXED',
    minPay: job.minPay ?? job.budget ?? 0,
    maxPay: job.maxPay ?? null,
    description: job.description ?? job.description_preview ?? '',
    clientName: job.clientName ?? 'Client',
    status: job.status,
    postedAt: job.postedAt ?? new Date(job.createdAt).toLocaleDateString('en-ET'),
  }));
}

export async function createJob(data: CreateJobPayload) {
  const response = await fetch(`${JOBS_API_BASE_URL}/jobs`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? `Failed to create job: ${response.status}`);
  }

  return response.json();
}
