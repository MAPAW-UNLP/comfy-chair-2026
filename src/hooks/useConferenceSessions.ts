import { useQuery } from '@tanstack/react-query';
import { getSessionsByConference } from '@/services/sessionServices';

export function useConferenceSessions(conferenceId: number | null | undefined) {
  const validConferenceId = conferenceId != null && Number.isSafeInteger(conferenceId) && conferenceId > 0;
  return useQuery({
    queryKey: ['conference-sessions', validConferenceId ? conferenceId : 0],
    queryFn: () => getSessionsByConference(conferenceId!),
    enabled: validConferenceId,
    staleTime: 30_000,
    refetchOnMount: 'always',
    retry: false,
  });
}
