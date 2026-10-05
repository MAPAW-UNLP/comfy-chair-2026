// GRUPO 1: página de invitaciones del revisor (/reviewer/invitations)
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvitationCard } from './InvitationCard';
import { getApiErrorMessage, invitationsQueryOptions, isUnauthorizedError } from './invitationsQuery';
import { INVITATIONS_TABS, parseInvitationsTab } from './invitationStatus';

export default function InvitationsPage() {
  // La pestaña vive en la URL: se mantiene al recargar y al volver del detalle
  const { status } = useSearch({ from: '/_auth/reviewer/invitations/' });
  const tab = parseInvitationsTab(status);
  const current = INVITATIONS_TABS.find((t) => t.value === tab) ?? INVITATIONS_TABS[0];
  const navigate = useNavigate();

  const { data: invitations, isPending, isError, error, refetch, isFetching } = useQuery(
    invitationsQueryOptions(tab === 'all' ? undefined : tab)
  );
  // Para el número de la pestaña "Pendientes" (misma query que el botón de la página Revisor)
  const { data: pending } = useQuery(invitationsQueryOptions('pending'));

  // Un toast por cada error nuevo; el 401 lo maneja el interceptor de api
  useEffect(() => {
    if (error && !isUnauthorizedError(error)) {
      toast.error(getApiErrorMessage(error));
    }
  }, [error]);

  return (
    <div className="container mx-auto max-w-3xl p-4 sm:p-6">
      <Button asChild variant="ghost" size="icon" className="mb-2 -ml-2">
        <Link to="/reviewer" aria-label="Volver a Revisor" title="Volver a Revisor">
          <ArrowLeft />
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold sm:text-3xl">Invitaciones</h1>
        <p className="text-muted-foreground">
          Invitaciones para formar parte del comité de revisores de una conferencia.
        </p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate({ to: '/reviewer/invitations', search: { status: parseInvitationsTab(value) }, replace: true })
        }
        className="mb-4"
      >
        <TabsList className="h-auto w-full flex-wrap">
          {INVITATIONS_TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="min-w-24 data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              {t.label}
              {t.value === 'pending' && pending && pending.length > 0 && ` (${pending.length})`}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isPending ? (
        <InvitationsSkeleton />
      ) : isError ? (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center gap-3 text-center">
            <p className="font-medium text-destructive">No se pudieron cargar las invitaciones</p>
            <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RotateCw className={isFetching ? 'animate-spin' : undefined} />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : invitations.length === 0 ? (
        <Card>
          <CardContent className="text-center text-muted-foreground">{current.empty}</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <InvitationCard key={invitation.id} invitation={invitation} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando invitaciones">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="gap-3 py-4">
          <CardContent className="animate-pulse space-y-3 px-4 sm:px-6">
            <div className="flex justify-between gap-2">
              <div className="h-5 w-1/2 rounded bg-muted" />
              <div className="h-5 w-20 rounded bg-muted" />
            </div>
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
