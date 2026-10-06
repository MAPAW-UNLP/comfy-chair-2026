// GRUPO 1: acciones de una invitación dentro de su notificación (página Notificaciones).
// Si la notificación no es de una invitación no muestra nada; si está pendiente, Rechazar y Aceptar;
// si ya se respondió o venció, su estado.
import { useQuery } from '@tanstack/react-query';
import { getMyInvitationNotifications } from '@/services/reviewerServices';
import { AcceptInvitationButton } from './AcceptInvitationButton';
import { InvitationStatusBadge } from './InvitationStatusBadge';
import { RejectInvitationButton } from './RejectInvitationButton';

// Bajo ['reviewer', 'invitations']: aceptar/rechazar ya invalida ese prefijo y esto se actualiza solo
const invitationNotificationsQuery = {
  queryKey: ['reviewer', 'invitations', 'notifications'],
  queryFn: getMyInvitationNotifications,
};

export function InvitationNotificationActions({ notificationId }: { notificationId: number }) {
  // Todas las tarjetas comparten la misma query: un solo request para la página
  const { data } = useQuery(invitationNotificationsQuery);
  const link = data?.find((l) => l.notification === notificationId);
  if (!link) return null;

  if (link.status !== 'pending') {
    return (
      <div className="mt-2 ml-6 flex items-center gap-2 text-xs text-muted-foreground">
        Invitación <InvitationStatusBadge status={link.status} />
      </div>
    );
  }

  return (
    <div className="mt-3 ml-6 flex flex-wrap gap-2">
      <RejectInvitationButton invitationId={link.invitation} conferenceTitle={link.conference_title} />
      <AcceptInvitationButton invitationId={link.invitation} conferenceTitle={link.conference_title} />
    </div>
  );
}
