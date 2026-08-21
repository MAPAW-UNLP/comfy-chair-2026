import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { registerSchema, type RegisterFormData } from '@/lib/validations'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState<RegisterFormData>({
    fullName: '',
    affiliation: '',
    email: '',
    password: '',
    confirmation: '',
  })
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({})
  const [formError, setFormError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev: RegisterFormData) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: Partial<RegisterFormData>) => ({ ...prev, [field]: undefined }))
    }
    // Clear form error when user starts typing
    if (formError) {
      setFormError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const result = registerSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<RegisterFormData> = {}
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof RegisterFormData] = error.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)
    setFormError('')
    try {
      await register(formData)
      console.log('Registration successful')
      navigate({ to: '/login', search: { redirect: undefined, registered: 'true' } })
    } catch (error) {
      console.error('Registration failed:', error)
      
      // Check if it's a 5xx server error
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        window.alert('Error del servidor. Por favor, intenta nuevamente más tarde.')
      } else {
        // For 4xx errors (email already exists, etc.), show a generic form error
        setFormError('No se pudo crear la cuenta. Por favor, verifica tus datos o intenta nuevamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>¡Bienvenido!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="affiliation">Afiliación</Label>
              <Input
                id="affiliation"
                type="text"
                value={formData.affiliation}
                onChange={(e) => handleInputChange('affiliation', e.target.value)}
                className={errors.affiliation ? 'border-destructive' : ''}
              />
              {errors.affiliation && (
                <p className="text-sm text-destructive">{errors.affiliation}</p>
              )}
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmación</Label>
              <Input
                id="confirmation"
                type="password"
                value={formData.confirmation}
                onChange={(e) => handleInputChange('confirmation', e.target.value)}
                className={errors.confirmation ? 'border-destructive' : ''}
              />
              {errors.confirmation && (
                <p className="text-sm text-destructive">{errors.confirmation}</p>
              )}
            </div>

            {formError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
                {formError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" search={{ redirect: undefined, registered: undefined }} className="text-primary underline">
              Ingresar
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
