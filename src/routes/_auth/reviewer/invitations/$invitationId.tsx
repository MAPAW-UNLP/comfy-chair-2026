// GRUPO 1: detalle de una invitación del revisor
import { createFileRoute } from '@tanstack/react-router';
import InvitationDetail from '@/components/reviewer/invitations/InvitationDetail';

export const Route = createFileRoute('/_auth/reviewer/invitations/$invitationId')({
  component: InvitationDetail,
});
