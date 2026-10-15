// GRUPO 1: texto y colores de cada estado de invitación (badge y franja de la tarjeta)
// y pestañas del listado, cuyo valor vive en la URL (?status=)
import type { InvitationStatus } from '@/services/reviewerServices';

export type InvitationsTab = InvitationStatus | 'all';

export const INVITATIONS_TABS: { value: InvitationsTab; label: string; empty: string }[] = [
  { value: 'pending', label: 'Pendientes', empty: 'No tenés invitaciones pendientes' },
  { value: 'accepted', label: 'Aceptadas', empty: 'No tenés invitaciones aceptadas' },
  { value: 'rejected', label: 'Rechazadas', empty: 'No tenés invitaciones rechazadas' },
  { value: 'expired', label: 'Vencidas', empty: 'No tenés invitaciones vencidas' },
  { value: 'all', label: 'Todas', empty: 'Todavía no recibiste invitaciones' },
];

// Un ?status= ausente o inválido queda como "Pendientes"
export function parseInvitationsTab(value: unknown): InvitationsTab {
  return INVITATIONS_TABS.find((tab) => tab.value === value)?.value ?? 'pending';
}

export const INVITATION_STATUS_STYLES: Record<
  InvitationStatus,
  { label: string; badgeClassName: string; borderClassName: string }
> = {
  pending: { label: 'Pendiente', badgeClassName: 'bg-amber-100 text-amber-800', borderClassName: 'border-l-amber-400' },
  accepted: { label: 'Aceptada', badgeClassName: 'bg-green-100 text-green-800', borderClassName: 'border-l-green-500' },
  rejected: { label: 'Rechazada', badgeClassName: 'bg-red-100 text-red-800', borderClassName: 'border-l-red-500' },
  expired: { label: 'Vencida', badgeClassName: 'bg-slate-200 text-slate-700', borderClassName: 'border-l-slate-400' },
};
