import { createFileRoute } from '@tanstack/react-router';
import { ConferencePeriodsConfig } from '@/components/panel-session/ConferencePeriodsConfig';

export const Route = createFileRoute('/_auth/chairs/configuration')({
  component: ConferencePeriodsConfig,
});