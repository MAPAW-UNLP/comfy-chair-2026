import { createFileRoute } from '@tanstack/react-router';
import { ReviewedArticleList } from '@/components/selection/ReviewedArticleList'; 

type SearchParams = {
  status: 'accepted' | 'rejected';
};

export const Route = createFileRoute('/_auth/chairs/selection/reviewed-article-list')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const status = search.status as 'accepted' | 'rejected';
    
    // Validación
    if (status !== 'accepted' && status !== 'rejected') {
      throw new Error('El parámetro status debe ser "accepted" o "rejected"');
    }

    return {
      status: status,
    };
  },
});

function RouteComponent() {
  const { status } = Route.useSearch();

  return <ReviewedArticleList status={status} />;
}