// GRUPO 1: manejo de errores al aceptar/rechazar una invitación
import type { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage, getErrorStatus } from './invitationsQuery';

export const INVITATIONS_QUERY_KEY = ['reviewer', 'invitations'] as const;
export const REVIEWER_CONFERENCES_QUERY_KEY = ['reviewer', 'conferences'] as const;

const EXPIRED_MESSAGE = 'La invitación está vencida';

interface Options {
  queryClient: QueryClient;
  goToList: () => void;
  // Solo al rechazar: un 400 que no sea "vencida" es un error del campo motivo
  onInvalidReason?: (message: string) => void;
}

export function handleInvitationActionError(error: unknown, { queryClient, goToList, onInvalidReason }: Options) {
  const refresh = () => queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });

  switch (getErrorStatus(error)) {
    case 401:
      return; // lo maneja el interceptor de api
    case 400: {
      const message = getApiErrorMessage(error);
      if (message !== EXPIRED_MESSAGE && onInvalidReason) {
        onInvalidReason(message);
        return;
      }
      toast.error(EXPIRED_MESSAGE);
      refresh();
      return;
    }
    case 403:
      toast.error('No tenés permiso sobre esta invitación');
      refresh();
      goToList();
      return;
    case 404:
      toast.error('La invitación no existe');
      refresh();
      goToList();
      return;
    case 409:
      toast.error('Esta invitación ya fue respondida');
      refresh();
      return;
    default:
      toast.error(getApiErrorMessage(error));
  }
}
