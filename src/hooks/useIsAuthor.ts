import { useQuery } from '@tanstack/react-query';
import { getUserFullData } from '@/services/userServices';

// Indica si el usuario autenticado tiene el rol autor en al menos una conferencia.
// Comparte query key con el acceso rápido del dashboard para reusar la misma cache.
export function useIsAuthor(enabled = true) {
  const { data } = useQuery({
    queryKey: ['user-full-data'],
    queryFn: getUserFullData,
    enabled,
  });

  return (data ?? []).some((conferencia) => conferencia.roles.includes('autor'));
}
