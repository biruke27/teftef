import { JobCard } from './JobCard';
import { mockJobs } from '../lib/jobs';

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
