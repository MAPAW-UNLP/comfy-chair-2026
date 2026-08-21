import ConferenceEdit from '@/components/conference/ConferenceEdit'
import { getConference } from '@/services/conferenceServices'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/conference/edit/$id')({
  component: ConferenceEdit,
  loader: async ({ params }) => { return await getConference(params.id) }
})
