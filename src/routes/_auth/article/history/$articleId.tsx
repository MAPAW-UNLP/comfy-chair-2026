import { createFileRoute } from '@tanstack/react-router'
import { ArticleHistory } from '@/components/article/ArticleHistory'
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
  const { history } = Route.useLoaderData()

  // 3. Pasarle el array de eventos de historial cargado al componente
  return <ArticleHistory history={history} />
}