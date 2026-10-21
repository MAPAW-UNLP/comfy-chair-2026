import { createFileRoute } from '@tanstack/react-router';
import ReviewArticle from "@/components/reviewer/ReviewArticle";
import { ReviewAccessGuard } from "@/components/reviewer/ReviewAccessGuard";

// GRUPO 1: el formulario solo se muestra si el usuario está asignado al artículo
function ReviewRoute() {
  const { articleId } = Route.useParams();
  return (
    <ReviewAccessGuard articleId={Number(articleId)}>
      <ReviewArticle />
    </ReviewAccessGuard>
  );
}

export const Route = createFileRoute('/_auth/reviewer/review/$articleId')({
  component: ReviewRoute,
});
