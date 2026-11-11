import { createFileRoute } from '@tanstack/react-router'
import { ArticleHistory } from '@/components/article/ArticleHistory'
import Breadcrumb from '@/components/ui/breadcrumb'
import { useFetchArticle } from '@/hooks/Grupo1/useFetchArticle'
import { getArticleHistory } from '@/services/articleServices'

export const Route = createFileRoute('/_auth/article/history/$articleId')({
  // 1. Cargar los datos asíncronamente antes de renderizar la vista
  loader: async ({ params }) => {
    const articleId = Number(params.articleId)
    const history = await getArticleHistory(articleId)
    console.log("Historial cargado para el artículo:", history)
    return { history, articleId }
  },
  component: RouteComponent,
})

function RouteComponent() {
  // 2. Obtener los datos resueltos directamente del loader de la ruta
  const { history, articleId } = Route.useLoaderData()

  // Artículo para el breadcrumb y el título (no bloquea la vista del historial)
  const { article } = useFetchArticle(articleId)
  const conference = article?.session?.conference

  // 3. Pasarle el array de eventos de historial cargado al componente
  return (
    <div className="mx-4 my-4 flex flex-col items-center gap-4">

      {/* Breadcrumb para la navegación */}
      <div className="flex justify-center w-full">
        <Breadcrumb
          items={[
            { label: 'Inicio', to: '/dashboard' },
            { label: conference?.title ?? 'Conferencia', to: conference ? `/articles/${conference.id}` : undefined },
            { label: article?.title ?? 'Artículo', to: `/article/detail/${articleId}` },
            { label: 'Historial' },
          ]}
        />
      </div>

      <ArticleHistory history={history} articleTitle={article?.title} />
    </div>
  )
}
