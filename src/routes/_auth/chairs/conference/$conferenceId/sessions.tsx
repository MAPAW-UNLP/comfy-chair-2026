import { createFileRoute } from '@tanstack/react-router';
import { ChairConferenceSessions } from '@/components/panel-session/ChairConferenceSessions';

export const Route = createFileRoute('/_auth/chairs/conference/$conferenceId/sessions')({
  component: ChairConferenceSessions,
});
