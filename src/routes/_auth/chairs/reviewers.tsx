import { createFileRoute } from "@tanstack/react-router"
import { SessionReviewers } from '@/components/reviewer/SessionReviewers'

export const Route = createFileRoute("/_auth/chairs/reviewers")({
  component: SessionReviewers,
})