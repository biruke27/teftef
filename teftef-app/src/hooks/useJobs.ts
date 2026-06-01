import { useQuery } from '@tanstack/react-query';
import { fetchJobs } from '../lib/jobs';

export function useJobs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}
