// GRUPO 1: solo un revisor asignado al artículo puede ver su formulario de revisión
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { RotateCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { checkReviewAssignment } from '@/services/reviewerServices';
import { getApiErrorMessage, getErrorStatus } from '@/components/reviewer/invitations/invitationsQuery';

// No se reintenta cuando el error no se va a resolver solo
const NO_RETRY_STATUSES = [401, 403, 404];

interface Props {
  articleId: number;
  children: React.ReactNode;
}

export function ReviewAccessGuard({ articleId, children }: Props) {
  const isValidId = Number.isInteger(articleId) && articleId > 0;

  const { isPending, error, refetch, isFetching } = useQuery({
    queryKey: ['reviewer', 'assignment', articleId],
    queryFn: () => checkReviewAssignment(articleId),
    enabled: isValidId,
    retry: (failureCount, err) => !NO_RETRY_STATUSES.includes(getErrorStatus(err) ?? 0) && failureCount < 3,
  });
  const errorStatus = getErrorStatus(error);

  if (!isValidId || errorStatus === 404) {
    return <AccessMessage title="El artículo no existe" />;
  }
  if (errorStatus === 403) {
    return (
      <AccessMessage
        title="No estás asignado para revisar este artículo"
        description="Solo los revisores asignados por el chair pueden ver y enviar la revisión de un artículo."
      />
    );
  }
  if (errorStatus === 401) return null; // lo maneja el interceptor de api
  if (error) {
    return (
      <AccessMessage title="No se pudo verificar el acceso" description={getApiErrorMessage(error)}>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RotateCw className={isFetching ? 'animate-spin' : undefined} />
          Reintentar
        </Button>
      </AccessMessage>
    );
  }
  if (isPending) {
    return <p className="px-6 py-8 text-slate-600">Verificando acceso…</p>;
  }
  return <>{children}</>;
}

function AccessMessage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container mx-auto max-w-xl p-4 sm:p-6">
      <Card>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <ShieldAlert className="size-8 text-slate-500" />
          <p className="font-medium">{title}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
          <div className="flex flex-wrap justify-center gap-2">
            {children}
            <Button asChild className="bg-slate-700 font-medium text-white hover:bg-slate-600">
              <Link to="/reviewer">Volver a Revisor</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
