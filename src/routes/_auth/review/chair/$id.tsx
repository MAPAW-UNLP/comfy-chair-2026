import { createFileRoute } from "@tanstack/react-router"
import { ArticleReviewsDetail } from "@/components/reviews/chair/detail"

export const Route = createFileRoute("/_auth/review/chair/$id")({
  component: ArticleReviewsComponent,
})

function ArticleReviewsComponent() {
  const { id } = Route.useParams()
  return <ArticleReviewsDetail articleId={Number(id)} />
}
