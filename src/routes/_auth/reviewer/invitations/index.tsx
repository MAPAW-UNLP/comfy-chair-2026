// GRUPO 1: invitaciones del revisor. La pestaña elegida queda en la URL (?status=)
import { createFileRoute } from '@tanstack/react-router';
import InvitationsPage from '@/components/reviewer/invitations/InvitationsPage';
import { parseInvitationsTab, type InvitationsTab } from '@/components/reviewer/invitations/invitationStatus';

export const Route = createFileRoute('/_auth/reviewer/invitations/')({
  // Opcional para que los links a /reviewer/invitations no tengan que pasarlo
  validateSearch: (search: Record<string, unknown>): { status?: InvitationsTab } => ({
    status: parseInvitationsTab(search.status),
  }),
  component: InvitationsPage,
});
