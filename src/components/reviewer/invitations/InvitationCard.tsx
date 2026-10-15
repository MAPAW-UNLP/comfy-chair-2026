// GRUPO 1: tarjeta de una invitación en el listado
import { Link } from '@tanstack/react-router';
import { CalendarClock, MessageSquareText, Send, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Invitation } from '@/services/reviewerServices';
import { AcceptInvitationButton } from './AcceptInvitationButton';
import { InvitationStatusBadge } from './InvitationStatusBadge';
import { INVITATION_STATUS_STYLES } from './invitationStatus';
import { RejectInvitationButton } from './RejectInvitationButton';
import { formatDateTime } from './invitationsQuery';

function statusLine(invitation: Invitation): string {
  switch (invitation.status) {
    case 'pending':
      return invitation.expires_at
        ? `Responder antes del ${formatDateTime(invitation.expires_at)}`
        : 'Sin fecha límite';
    case 'expired':
      return invitation.expires_at ? `Venció el ${formatDateTime(invitation.expires_at)}` : 'Vencida';
    case 'accepted':
    case 'rejected':
      return invitation.responded_at ? `Respondida el ${formatDateTime(invitation.responded_at)}` : 'Respondida';
  }
}

export function InvitationCard({ invitation }: { invitation: Invitation }) {
  const isPending = invitation.status === 'pending';

  return (
    <Card className={cn('border-l-4 py-4', INVITATION_STATUS_STYLES[invitation.status].borderClassName)}>
      {/* En celular los botones van abajo; desde sm, en columna a la derecha */}
      <CardContent className="flex flex-col gap-4 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base break-words">{invitation.conference.title}</CardTitle>
            <InvitationStatusBadge status={invitation.status} />
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <UserRound className="size-4 shrink-0" />
              <span className="break-words">Invitado por {invitation.invited_by?.full_name ?? 'un chair'}</span>
            </p>
            <p className="flex items-center gap-2">
              <Send className="size-4 shrink-0" />
              Recibida el {formatDateTime(invitation.sent_at)}
            </p>
            <p className="flex items-center gap-2">
              <CalendarClock className="size-4 shrink-0" />
              {statusLine(invitation)}
            </p>
            {invitation.status === 'rejected' && invitation.rejection_reason && (
              <p className="flex items-start gap-2">
                <MessageSquareText className="mt-0.5 size-4 shrink-0" />
                <span className="line-clamp-2 break-words">Motivo: {invitation.rejection_reason}</span>
              </p>
            )}
          </div>

          <Button asChild size="sm" className="bg-slate-700 font-medium text-white hover:bg-slate-600">
            <Link to="/reviewer/invitations/$invitationId" params={{ invitationId: String(invitation.id) }}>
              Ver detalle
            </Link>
          </Button>
        </div>

        {isPending && (
          <div className="flex gap-2 sm:w-32 sm:shrink-0 sm:flex-col">
            <AcceptInvitationButton
              invitationId={invitation.id}
              conferenceTitle={invitation.conference.title}
              className="flex-1 sm:w-full sm:flex-none"
            />
            <RejectInvitationButton
              invitationId={invitation.id}
              conferenceTitle={invitation.conference.title}
              className="flex-1 sm:w-full sm:flex-none"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
