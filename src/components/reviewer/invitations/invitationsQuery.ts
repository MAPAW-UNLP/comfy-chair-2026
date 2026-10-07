// GRUPO 1: consultas compartidas de invitaciones (listado y contador del botón)
import { queryOptions } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { getMyInvitations, type InvitationStatus } from '@/services/reviewerServices';

// Misma queryKey en el listado y en el contador: React Query las comparte y no hay request extra
export const invitationsQueryOptions = (status?: InvitationStatus) =>
  queryOptions({
    queryKey: ['reviewer', 'invitations', status ?? 'all'],
    queryFn: () => getMyInvitations(status),
  });

export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

export function isUnauthorizedError(error: unknown): boolean {
  return getErrorStatus(error) === 401;
}

// Mensaje de error que manda el backend ({"error": "..."}) o uno genérico
export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const backendMessage = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof backendMessage === 'string' && backendMessage) return backendMessage;
    if (!error.response) return 'No se pudo conectar con el servidor';
  }
  return 'Ocurrió un error inesperado';
}

// Fechas sin hora del backend ("2026-11-02"): se formatean sin pasar por Date para no correr el día por zona horaria
export function formatDate(value: string): string {
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
