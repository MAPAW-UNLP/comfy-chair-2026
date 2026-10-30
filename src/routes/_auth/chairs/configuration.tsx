import { createFileRoute } from '@tanstack/react-router';
import { ConferencePeriodsConfig } from '@/components/panel-session/ConferencePeriodsConfig';

type SearchParams = {
  conferenceId?: string;
};

export const Route = createFileRoute('/_auth/chairs/configuration')({
  component: ConferencePeriodsConfig,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    conferenceId: search.conferenceId ? String(search.conferenceId) : undefined,
  }),
});
