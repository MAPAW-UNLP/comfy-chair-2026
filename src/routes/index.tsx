import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl mb-2">Bienvenido</CardTitle>
          <CardDescription className="text-base">
            Sistema de gestión de conferencias académicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Gestiona conferencias, artículos y revisiones académicas de manera eficiente.
          </p>
          <div className="flex flex-col gap-3 pt-4">
            <Link to="/login" search={{ redirect: undefined, registered: undefined }}>
              <Button className="w-full" variant="default">
                Ingresar
              </Button>
            </Link>
            <Link to="/register" search={{ redirect: undefined, registered: undefined }}>
              <Button className="w-full" variant="outline">
                Registrarse
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
