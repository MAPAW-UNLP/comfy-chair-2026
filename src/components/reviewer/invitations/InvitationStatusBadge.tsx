// GRUPO 1: badge con el estado de una invitación
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InvitationStatus } from '@/services/reviewerServices';
import { INVITATION_STATUS_STYLES } from './invitationStatus';

export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const { label, badgeClassName } = INVITATION_STATUS_STYLES[status];
  return <Badge className={cn('border-transparent', badgeClassName)}>{label}</Badge>;
}
