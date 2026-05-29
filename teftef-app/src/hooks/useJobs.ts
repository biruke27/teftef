import { useQuery } from '@tanstack/react-query';
import { fetchJobs, mockJobs } from '../lib/jobs';

export function useJobs(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    enabled: options?.enabled ?? true,
    placeholderData: mockJobs,
    staleTime: 5 * 60 * 1000,
  });
}
