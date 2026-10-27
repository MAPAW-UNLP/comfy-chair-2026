import ASession from '@/components/conference/ASession'
import { getSession } from '@/services/sessionServices'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/conference/session/$id')({
  validateSearch: (search: Record<string, unknown>) => ({
    editar: typeof search.editar === 'string' ? search.editar : undefined,
    resolverRevisiones: typeof search.resolverRevisiones === 'string'
      ? search.resolverRevisiones
      : undefined,
    deshabilitar: typeof search.deshabilitar === 'string'
      ? search.deshabilitar
      : undefined,
  }),
  component: ASession,
  loader: async ({ params }) => { return await getSession(params.id) },
})
