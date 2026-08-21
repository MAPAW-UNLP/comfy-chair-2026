import ASession from '@/components/conference/ASession'
import { getSession } from '@/services/sessionServices'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/conference/session/$id')({
  component: ASession,
  loader: async ({ params }) => { return await getSession(params.id) },
})


