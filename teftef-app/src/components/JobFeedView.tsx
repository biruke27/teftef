import { JobCard } from './JobCard';
import type { JobCardProps } from './JobCard';

const mockJobs: JobCardProps[] = [
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

export function JobFeedView() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {mockJobs.map((job, index) => (
        <JobCard
          key={`${job.title}-${index}`}
          title={job.title}
          budget={job.budget}
          description={job.description}
          clientName={job.clientName}
          status={job.status}
          postedAt={job.postedAt}
        />
      ))}
    </section>
  );
}
