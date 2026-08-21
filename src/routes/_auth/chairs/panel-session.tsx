import { createFileRoute } from "@tanstack/react-router"
import { PanelSessionChair } from '@/components/panel-session/PanelSessionChair'

export const Route = createFileRoute("/_auth/chairs/panel-session")({
  component: PanelSessionChair,
})
