import { createFileRoute, Link, useRouteContext } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_auth/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const { user } = useRouteContext({ from: '/_auth/profile' })

  return (
    <div className="min-h-[calc(100dvh-64px)] bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Afiliación</p>
              <p className="font-medium">{user.affiliation}</p>
            </div>

            <Link to="/dashboard/update" className="block pt-1">
              <Button variant="outline" size="sm" className="w-full">
                Actualizar Datos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
