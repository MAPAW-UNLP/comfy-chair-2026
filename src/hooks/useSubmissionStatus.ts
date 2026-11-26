import { useQuery } from '@tanstack/react-query';
import { getSubmissionStatus } from '@/services/articleServices';

export const submissionStatusKey = (sessionId: number) => ['submission-status', sessionId] as const;

export function useSubmissionStatus(sessionId: number | null | undefined) {
  const validSessionId = sessionId != null && Number.isSafeInteger(sessionId) && sessionId > 0;
  return useQuery({
    queryKey: submissionStatusKey(validSessionId ? sessionId : 0),
    queryFn: ({ signal }) => getSubmissionStatus(sessionId!, signal),
    enabled: validSessionId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchInterval: 60_000,
    retry: false,
  });
}
