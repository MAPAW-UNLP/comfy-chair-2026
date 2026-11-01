import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginSchema, type LoginFormData } from '@/lib/validations'
import { useAuth } from '@/contexts/AuthContext'
import { ContactSupportDialog } from '@/components/auth/ContactSupportDialog'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string) || undefined,
      registered: (search.registered as string) || undefined,
      ...(search.disabled === 'true' ? { disabled: 'true' } : {}),
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { redirect, registered, disabled } = Route.useSearch()
  const { login, user } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<LoginFormData>>({})
  const [formError, setFormError] = useState<string>('')
  const [accountDisabled, setAccountDisabled] = useState(disabled === 'true')
  const [disabledEmail, setDisabledEmail] = useState<string | null>(null)
  const [supportOpen, setSupportOpen] = useState(false)
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
    setAccountDisabled(false)
    setDisabledEmail(null)
    try {
      await login(formData.email, formData.password)
      console.log('Login successful')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Login failed:', {
          status: error.response?.status,
          code: error.code,
        })
      } else {
        console.error('Login failed with an unexpected error')
      }

      if (axios.isAxiosError(error) &&
          error.response?.status === 403 &&
          error.response?.data?.code === 'account_disabled') {
        setAccountDisabled(true)
        setDisabledEmail(formData.email)
        return
      }

      if (axios.isAxiosError(error) && !error.response) {
        setFormError(
          'No se pudo conectar con el servidor. Verifica que el backend esté funcionando e inténtalo nuevamente.'
        )
        return
      }

      const status = axios.isAxiosError(error) ? error.response?.status : undefined
      if (status && status >= 500) {
        window.alert('Error del servidor. Por favor, intenta nuevamente más tarde.')
      } else if (status === 401) {
        setFormError('Email o contraseña incorrectos. Por favor, verifica tus datos.')
      } else {
        setFormError(
          'No se pudo completar el inicio de sesión. Inténtalo nuevamente o contacta al soporte.'
        )
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
          {accountDisabled && (
            <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
              Su cuenta se encuentra deshabilitada.{' '}
              {disabledEmail ? (
                <>
                  Si querés conocer el motivo o pedir que la habiliten,{' '}
                  <button
                    type="button"
                    onClick={() => setSupportOpen(true)}
                    className="font-medium underline cursor-pointer"
                  >
                    contactá al soporte
                  </button>
                  .
                </>
              ) : (
                'Para contactar al soporte, ingresá con tu email y contraseña.'
              )}
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
      {disabledEmail && (
        <ContactSupportDialog
          open={supportOpen}
          onOpenChange={setSupportOpen}
          email={disabledEmail}
        />
      )}
    </div>
  )
}
