import { createFileRoute } from '@tanstack/react-router';
import ReviewArticle from "@/components/reviewer/ReviewArticle";

export const Route = createFileRoute('/_auth/reviewer/review/$articleId')({
  component: () => {
    const { articleId } = Route.useParams();
    const id = Number(articleId);
    return <ReviewArticle articleId={id} />;
  },
});

