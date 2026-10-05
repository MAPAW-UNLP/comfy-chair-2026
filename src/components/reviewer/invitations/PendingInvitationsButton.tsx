// GRUPO 1: botón "Invitaciones" con contador de pendientes (página Revisor)
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invitationsQueryOptions } from './invitationsQuery';

export function PendingInvitationsButton() {
  const { data } = useQuery(invitationsQueryOptions('pending'));
  const count = data?.length ?? 0;

  return (
    <Button asChild className="bg-slate-700 font-medium text-white hover:bg-slate-600">
      <Link
        to="/reviewer/invitations"
        aria-label={count > 0 ? `Invitaciones, ${count} pendientes` : 'Invitaciones'}
      >
        <Mail />
        Invitaciones
        {count > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
