import { createFileRoute } from "@tanstack/react-router"
import { ReviewedArticlesList } from "@/components/reviews/chair/list"

export const Route = createFileRoute("/_auth/review/chair/reviewed")({
  component: ReviewedArticlesList,
})
