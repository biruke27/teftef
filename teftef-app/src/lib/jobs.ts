import type { JobCardProps } from '../components/JobCard';
import { getSessionToken } from './session';

export const JOBS_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export type CreateJobPayload = {
  title: string;
  description: string;
  budget: number;
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
    budget: job.budget,
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

export const mockJobs: JobCardProps[] = [
  {
    id: 'mock-1',
    title: 'Design a landing page for a local fintech startup',
    budget: 18000,
    description:
      'Create a clean, fast landing page for a digital savings app. Focus on simple copy, strong CTA, and mobile-first layout.',
    clientName: 'Ethiopia FinTech',
    status: 'OPEN',
    postedAt: '2 hours ago',
  },
  {
    id: 'mock-2',
    title: 'Translate product descriptions to Amharic',
    budget: 7500,
    description:
      'Translate 20 short product descriptions into natural Amharic for a new marketplace listing.',
    clientName: 'Marketplace Team',
    status: 'IN_PROGRESS',
    postedAt: 'Today',
  },
  {
    id: 'mock-3',
    title: 'Social media graphic set for small business campaign',
    budget: 9500,
    description:
      'Design 5 branded social graphics for Instagram and Facebook with local market style.',
    clientName: 'Sheba Creative',
    status: 'OPEN',
    postedAt: 'Yesterday',
  },
];
