import { JobCard } from './JobCard';
import { useJobs } from '../hooks/useJobs';

export function JobFeedView() {
  const { data: jobs = [] } = useJobs();

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {jobs.map((job, index) => (
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
