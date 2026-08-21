import ConferenceCreate from '@/components/conference/ConferenceCreate'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/conference/create')({
  component: ConferenceCreate,
})

