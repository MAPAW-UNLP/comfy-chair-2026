import { useQuery } from '@tanstack/react-query';
import { getUserFullData } from '@/services/userServices';

// IDs de las conferencias donde el usuario autenticado tiene rol autor.
// Comparte query key con el acceso rápido del dashboard para reusar la misma cache.
export function useAuthorConferenceIds(enabled = true) {
  const { data } = useQuery({
    queryKey: ['user-full-data'],
    queryFn: getUserFullData,
    enabled,
  });

  return new Set(
    (data ?? []).filter((conferencia) => conferencia.roles.includes('autor')).map((conferencia) => conferencia.conference_id)
  );
}
