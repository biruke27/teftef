import type { JobCardProps } from '../components/JobCard';

export const JOBS_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export async function fetchJobs(): Promise<JobCardProps[]> {
  const response = await fetch(`${JOBS_API_BASE_URL}/jobs`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load jobs: ${response.status}`);
  }

  const payload = await response.json();
  const jobs = payload?.jobs ?? payload;

  if (!Array.isArray(jobs)) {
    throw new Error('Unexpected jobs response format');
  }

  return jobs;
}

export const mockJobs: JobCardProps[] = [
  {
    title: 'Design a landing page for a local fintech startup',
    budget: 18000,
    description:
      'Create a clean, fast landing page for a digital savings app. Focus on simple copy, strong CTA, and mobile-first layout.',
    clientName: 'Ethiopia FinTech',
    status: 'OPEN',
    postedAt: '2 hours ago',
  },
  {
    title: 'Translate product descriptions to Amharic',
    budget: 7500,
    description:
      'Translate 20 short product descriptions into natural Amharic for a new marketplace listing.',
    clientName: 'Marketplace Team',
    status: 'IN_PROGRESS',
    postedAt: 'Today',
  },
  {
    title: 'Social media graphic set for small business campaign',
    budget: 9500,
    description:
      'Design 5 branded social graphics for Instagram and Facebook with local market style.',
    clientName: 'Sheba Creative',
    status: 'OPEN',
    postedAt: 'Yesterday',
  },
];
