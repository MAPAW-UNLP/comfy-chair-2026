// GRUPO 1: detalle de una invitación (/reviewer/invitations/$invitationId)
import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useCanGoBack, useNavigate, useParams, useRouter } from '@tanstack/react-router';
import { ArrowLeft, CalendarClock, CalendarDays, EyeOff, RotateCw, Send, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getInvitation, type BlindKind, type InvitationDetail as Detail } from '@/services/reviewerServices';
import { AcceptInvitationButton } from './AcceptInvitationButton';
import { RejectInvitationButton } from './RejectInvitationButton';
import { InvitationStatusBadge } from './InvitationStatusBadge';
import { INVITATION_STATUS_STYLES } from './invitationStatus';
import { formatDate, formatDateTime, getApiErrorMessage, getErrorStatus } from './invitationsQuery';

const BLIND_KIND_LABELS: Record<BlindKind, string> = {
  'single blind': 'Simple ciego',
  'double blind': 'Doble ciego',
  completo: 'Completo',
};

// No se reintenta cuando el error no se va a resolver solo
const NO_RETRY_STATUSES = [401, 403, 404];

export default function InvitationDetail() {
  const { invitationId } = useParams({ from: '/_auth/reviewer/invitations/$invitationId' });
  const id = Number(invitationId);
  const isValidId = Number.isInteger(id) && id > 0;

  const navigate = useNavigate();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const goToList = useCallback(() => navigate({ to: '/reviewer/invitations' }), [navigate]);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['reviewer', 'invitations', id],
    queryFn: () => getInvitation(id),
    enabled: isValidId,
    retry: (failureCount, err) => !NO_RETRY_STATUSES.includes(getErrorStatus(err) ?? 0) && failureCount < 3,
  });

  const errorStatus = getErrorStatus(error);

  useEffect(() => {
    if (!error || errorStatus === 401 || errorStatus === 404) return; // 401: interceptor; 404: se muestra abajo
    if (errorStatus === 403) {
      toast.error('No tenés acceso a esta invitación');
      goToList();
      return;
    }
    toast.error(getApiErrorMessage(error));
  }, [error, errorStatus, goToList]);

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6">
      {/* Vuelve a la pestaña desde la que se entró (el filtro está en la URL anterior) */}
      <Button
        variant="ghost"
        size="icon"
        className="mb-2 -ml-2"
        aria-label="Volver a invitaciones"
        title="Volver a invitaciones"
        onClick={() => (canGoBack ? router.history.back() : goToList())}
      >
        <ArrowLeft />
      </Button>

      {!isValidId || errorStatus === 404 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <p className="font-medium">La invitación no existe</p>
            <Button asChild variant="outline">
              <Link to="/reviewer/invitations">Volver a invitaciones</Link>
            </Button>
          </CardContent>
        </Card>
      ) : isPending || errorStatus === 403 ? (
        <DetailSkeleton />
      ) : isError ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <p className="font-medium text-destructive">No se pudo cargar la invitación</p>
            <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RotateCw className={isFetching ? 'animate-spin' : undefined} />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <InvitationDetailCard invitation={data} onResponded={goToList} />
      )}
    </div>
  );
}

function InvitationDetailCard({ invitation, onResponded }: { invitation: Detail; onResponded: () => void }) {
  const { conference, status } = invitation;
  const isPendingInvitation = status === 'pending';

  return (
    <Card className={cn('border-l-4', INVITATION_STATUS_STYLES[status].borderClassName)}>
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="mb-1 text-sm text-muted-foreground">Invitación al comité de revisores</p>
            <CardTitle className="text-xl break-words sm:text-2xl">{conference.title}</CardTitle>
          </div>
          <InvitationStatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-4 sm:px-6">
        {conference.description && (
          <p className="text-sm break-words whitespace-pre-line">{conference.description}</p>
        )}
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <DetailItem icon={<CalendarDays />} label="Fechas de la conferencia">
            {formatDate(conference.start_date)} al {formatDate(conference.end_date)}
          </DetailItem>
          <DetailItem icon={<EyeOff />} label="Tipo de revisión">
            {BLIND_KIND_LABELS[conference.blind_kind] ?? conference.blind_kind}
          </DetailItem>
          <DetailItem icon={<UserRound />} label="Invitado por">
            {invitation.invited_by?.full_name ?? 'Un chair'}
          </DetailItem>
          <DetailItem icon={<Send />} label="Recibida">
            {formatDateTime(invitation.sent_at)}
          </DetailItem>
          <DetailItem icon={<CalendarClock />} label={timeLabel(invitation)}>
            {timeValue(invitation)}
          </DetailItem>
        </dl>
        {status === 'rejected' && invitation.rejection_reason && (
          <div className="rounded-md bg-red-50 p-3 text-sm">
            <p className="mb-1 font-medium text-red-800">Motivo del rechazo</p>
            <p className="break-words whitespace-pre-line text-red-900">{invitation.rejection_reason}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3 border-t px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">{footerMessage(invitation)}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <RejectInvitationButton
            invitationId={invitation.id}
            conferenceTitle={conference.title}
            disabled={!isPendingInvitation}
            onRejected={onResponded}
          />
          <AcceptInvitationButton
            invitationId={invitation.id}
            conferenceTitle={conference.title}
            disabled={!isPendingInvitation}
            onAccepted={onResponded}
          />
        </div>
      </CardFooter>
    </Card>
  );
}

function DetailItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <div className="min-w-0">
        <dt className="text-muted-foreground">{label}</dt>
        <dd className="font-medium break-words">{children}</dd>
      </div>
    </div>
  );
}

function timeLabel(invitation: Detail): string {
  switch (invitation.status) {
    case 'pending':
      return 'Fecha límite para responder';
    case 'expired':
      return 'Venció';
    case 'accepted':
    case 'rejected':
      return 'Respondida';
  }
}

function timeValue(invitation: Detail): string {
  if (invitation.status === 'accepted' || invitation.status === 'rejected') {
    return invitation.responded_at ? formatDateTime(invitation.responded_at) : '—';
  }
  return invitation.expires_at ? formatDateTime(invitation.expires_at) : 'Sin fecha límite';
}

function footerMessage(invitation: Detail): string {
  switch (invitation.status) {
    case 'pending':
      return '¿Querés formar parte del comité de revisores de esta conferencia?';
    case 'accepted':
      return 'Ya aceptaste esta invitación.';
    case 'rejected':
      return 'Rechazaste esta invitación.';
    case 'expired':
      return 'La invitación venció sin respuesta.';
  }
}

function DetailSkeleton() {
  return (
    <Card aria-busy="true" aria-label="Cargando invitación">
      <CardContent className="animate-pulse space-y-4 px-4 sm:px-6">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-7 w-2/3 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded bg-muted" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
