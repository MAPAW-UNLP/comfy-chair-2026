import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getGeneralMetrics, type GeneralMetrics } from '@/services/metricsServices'

export const Route = createFileRoute('/_auth/metrics')({
  component: MetricsPage,
})

function MetricsPage() {
  const [metrics, setMetrics] = useState<GeneralMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setMetrics(await getGeneralMetrics())
      } catch (err) {
        console.error('Error fetching metrics:', err)
        setError('Error al cargar las métricas.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (isLoading) return <p className="p-8 text-center text-muted-foreground">Cargando métricas...</p>
  if (error || !metrics) return <p className="p-8 text-center text-destructive">{error}</p>

  const totals = [
    { label: 'Usuarios', value: metrics.total_users },
    { label: 'Artículos', value: metrics.total_articles },
    { label: 'Revisiones', value: metrics.total_reviews },
    { label: 'Bids', value: metrics.total_bids },
  ]

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Métricas generales</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {totals.map((t) => (
            <Card key={t.label}>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{t.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{t.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Artículos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.articles.map((art) => (
              <div key={art.id} className="flex items-center justify-between border-b pb-2">
                <span>{art.title}</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">{art.type}</Badge>
                  <Badge>{art.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revisiones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.reviews.map((rev) => (
              <div key={rev.id} className="border-b pb-2">
                <p className="font-medium">Puntaje: {rev.score}</p>
                <p className="text-sm text-muted-foreground">{rev.opinion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}