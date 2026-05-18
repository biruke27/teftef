import { useQuery } from '@tanstack/react-query';
import { fetchJobs, mockJobs } from '../lib/jobs';

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: fetchJobs,
    placeholderData: mockJobs,
    staleTime: 5 * 60 * 1000,
  });
}
