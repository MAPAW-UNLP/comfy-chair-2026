import { createFileRoute, useRouter } from '@tanstack/react-router'
import { ArticleHistory } from '@/components/article/ArticleHistory'
import { ArticleHistoryError, getArticleHistory } from '@/services/articleServices'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_auth/article/history/$articleId')({
  // 1. Cargar los datos asíncronamente antes de renderizar la vista
  loader: async ({ params }) => {
    const articleId = Number(params.articleId)
    const history = await getArticleHistory(articleId)
    console.log("Historial cargado para el artículo:", history)
    return { history, articleId }
  },
  component: RouteComponent,
  errorComponent: HistoryErrorComponent,
})

function RouteComponent() {
  // 2. Obtener los datos resueltos directamente del loader de la ruta
  const { history } = Route.useLoaderData()

  // 3. Pasarle el array de eventos de historial cargado al componente
  return <ArticleHistory history={history} />
}

function HistoryErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter()
  const status = error instanceof ArticleHistoryError ? error.status : undefined
  const message =
    status === 404
      ? 'Artículo no encontrado.'
      : status === 401
        ? 'Inicia sesión para consultar el historial.'
        : 'No se pudo cargar el historial del artículo. Intenta nuevamente.'

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-64px)] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">No se pudo cargar el historial</h1>
      <p className="text-muted-foreground">{message}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" onClick={() => router.history.back()}>
          Volver
        </Button>
      </div>
    </main>
  )
}
