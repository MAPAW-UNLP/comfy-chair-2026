// GRUPO 1: texto del link "Invitaciones" del menú, con el contador de pendientes
import { useQuery } from '@tanstack/react-query';
import { invitationsQueryOptions } from './invitationsQuery';

export function InvitationsNavLabel() {
  // Misma query que la pestaña "Pendientes" del listado: no hay request extra
  const { data } = useQuery(invitationsQueryOptions('pending'));
  const count = data?.length ?? 0;

  return (
    <span className="inline-flex items-center gap-1.5">
      Invitaciones
      {count > 0 && (
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white"
          aria-label={`${count} pendientes`}
        >
          {count}
        </span>
      )}
    </span>
  );
}
