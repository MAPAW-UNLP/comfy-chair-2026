import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
      registered: (search.registered as string) || undefined,
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect, registered } = Route.useSearch()
  const { login, user } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [formError, setFormError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData((prev: LoginFormData) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: Partial<LoginFormData>) => ({ ...prev, [field]: undefined }))
    }
    // Clear form error when user starts typing
    if (formError) {
      setFormError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const result = loginSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<LoginFormData> = {}
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginFormData] = error.message
        }
      })
      setErrors(fieldErrors)
      return
    }
    setIsLoading(true)
    setFormError('')
    try {
      await login(formData.email, formData.password)
      console.log('Login successful')
    } catch (error) {
      console.error('Login failed:', error)
      
      // Check if it's a 5xx server error
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        window.alert('Error del servidor. Por favor, intenta nuevamente más tarde.')
      } else {
        // For 4xx errors (wrong credentials, etc.), show a generic form error
        setFormError('Email o contraseña incorrectos. Por favor, verifica tus datos.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user && !isLoading) {
      // Redirect to the original destination or default to dashboard
      navigate({ to: redirect || '/dashboard' })
    }
  }, [user, navigate, redirect, isLoading])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Ingresar</CardTitle>
          <CardDescription>¡Que bueno volver a verte!</CardDescription>
        </CardHeader>
        <CardContent>
          {registered === 'true' && (
            <div className="mb-4 p-3 text-sm text-green-800 bg-green-100 border border-green-300 rounded-md">
              ¡Cuenta creada exitosamente! Por favor, inicia sesión con tus credenciales.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            {formError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
                {formError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" search={{ redirect: undefined, registered: undefined }} className="text-primary underline">
              Registrarse
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
