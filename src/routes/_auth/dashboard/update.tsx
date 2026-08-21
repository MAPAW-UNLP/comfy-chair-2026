import { createFileRoute, useNavigate, useRouteContext } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { updateUserDataSchema, updatePasswordSchema, type UpdateUserDataFormData, type UpdatePasswordFormData } from '@/lib/validations'
import { updateUserData, updateUserPassword } from '@/services/userServices'

export const Route = createFileRoute('/_auth/dashboard/update')({
  component: UpdateProfilePage,
})

function UpdateProfilePage() {
  const navigate = useNavigate()
  const { user } = useRouteContext({ from: '/_auth/dashboard/update' })

  // User Data Form State
  const [userDataForm, setUserDataForm] = useState<UpdateUserDataFormData>({
    fullName: user.full_name,
    affiliation: user.affiliation,
    email: user.email,
    emailConfirmation: user.email,
  })
  const [userDataErrors, setUserDataErrors] = useState<Partial<UpdateUserDataFormData>>({})
  const [userDataFormError, setUserDataFormError] = useState<string>('')
  const [userDataSuccess, setUserDataSuccess] = useState<string>('')
  const [isUserDataLoading, setIsUserDataLoading] = useState(false)

  // Password Form State
  const [passwordForm, setPasswordForm] = useState<UpdatePasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Partial<UpdatePasswordFormData>>({})
  const [passwordFormError, setPasswordFormError] = useState<string>('')
  const [passwordSuccess, setPasswordSuccess] = useState<string>('')
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)

  // User Data Form Handlers
  const handleUserDataChange = (field: keyof UpdateUserDataFormData, value: string) => {
    setUserDataForm((prev) => ({ ...prev, [field]: value }))
    if (userDataErrors[field]) {
      setUserDataErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (userDataFormError) {
      setUserDataFormError('')
    }
    if (userDataSuccess) {
      setUserDataSuccess('')
    }
  }

  const handleUserDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const result = updateUserDataSchema.safeParse(userDataForm)
    if (!result.success) {
      const fieldErrors: Partial<UpdateUserDataFormData> = {}
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof UpdateUserDataFormData] = error.message
        }
      })
      setUserDataErrors(fieldErrors)
      return
    }

    setIsUserDataLoading(true)
    setUserDataFormError('')
    setUserDataSuccess('')
    try {
      const response = await updateUserData({
        full_name: userDataForm.fullName,
        affiliation: userDataForm.affiliation,
        email: userDataForm.email,
      })
      setUserDataSuccess(response.message || 'Datos actualizados correctamente')
      setUserDataErrors({}) // Clear all field errors on success
      // Update form with new data
      setUserDataForm({
        fullName: response.user.full_name,
        affiliation: response.user.affiliation,
        email: response.user.email,
        emailConfirmation: response.user.email,
      })
    } catch (error) {
      console.error('Update user data failed:', error)
      
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        setUserDataFormError('Error del servidor. Por favor, intenta nuevamente más tarde.')
      } else {
        // Use backend error message if available
        const errorMessage = axiosError.response?.data?.error || 'No se pudieron actualizar los datos. Por favor, verifica la información.'
        setUserDataFormError(errorMessage)
      }
    } finally {
      setIsUserDataLoading(false)
    }
  }

  // Password Form Handlers
  const handlePasswordChange = (field: keyof UpdatePasswordFormData, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (passwordFormError) {
      setPasswordFormError('')
    }
    if (passwordSuccess) {
      setPasswordSuccess('')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const result = updatePasswordSchema.safeParse(passwordForm)
    if (!result.success) {
      const fieldErrors: Partial<UpdatePasswordFormData> = {}
      result.error.issues.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof UpdatePasswordFormData] = error.message
        }
      })
      setPasswordErrors(fieldErrors)
      return
    }

    setIsPasswordLoading(true)
    setPasswordFormError('')
    setPasswordSuccess('')
    try {
      const response = await updateUserPassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      })
      setPasswordSuccess(response.message || 'Contraseña actualizada correctamente')
      setPasswordErrors({}) // Clear all field errors on success
      // Clear password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error) {
      console.error('Update password failed:', error)
      
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } }
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        setPasswordFormError('Error del servidor. Por favor, intenta nuevamente más tarde.')
      } else {
        // Use backend error message if available
        const errorMessage = axiosError.response?.data?.error || 'No se pudo actualizar la contraseña. Por favor, verifica la información.'
        setPasswordFormError(errorMessage)
      }
    } finally {
      setIsPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end  gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/dashboard' })}
          >
            ← Volver al Panel
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Actualizar Datos</h1>
          </div>
        </div>

        {/* Update User Data Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tu nombre, afiliación y email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUserDataSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={userDataForm.fullName}
                  onChange={(e) => handleUserDataChange('fullName', e.target.value)}
                  className={userDataErrors.fullName ? 'border-destructive' : ''}
                />
                {userDataErrors.fullName && (
                  <p className="text-sm text-destructive">{userDataErrors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliation">Afiliación</Label>
                <Input
                  id="affiliation"
                  type="text"
                  value={userDataForm.affiliation}
                  onChange={(e) => handleUserDataChange('affiliation', e.target.value)}
                  className={userDataErrors.affiliation ? 'border-destructive' : ''}
                />
                {userDataErrors.affiliation && (
                  <p className="text-sm text-destructive">{userDataErrors.affiliation}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userDataForm.email}
                  onChange={(e) => handleUserDataChange('email', e.target.value)}
                  className={userDataErrors.email ? 'border-destructive' : ''}
                />
                {userDataErrors.email && (
                  <p className="text-sm text-destructive">{userDataErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailConfirmation">Confirmar Email</Label>
                <Input
                  id="emailConfirmation"
                  type="email"
                  value={userDataForm.emailConfirmation}
                  onChange={(e) => handleUserDataChange('emailConfirmation', e.target.value)}
                  className={userDataErrors.emailConfirmation ? 'border-destructive' : ''}
                />
                {userDataErrors.emailConfirmation && (
                  <p className="text-sm text-destructive">{userDataErrors.emailConfirmation}</p>
                )}
              </div>

              {userDataSuccess && (
                <div className="p-3 text-sm text-green-800 bg-green-100 border border-green-300 rounded-md">
                  {userDataSuccess}
                </div>
              )}

              {userDataFormError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
                  {userDataFormError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isUserDataLoading}>
                {isUserDataLoading ? 'Actualizando...' : 'Actualizar Información'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Update Password Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="show-passwords" className="cursor-pointer font-normal">
                  Mostrar contraseñas
                </Label>
                <Switch
                  id="show-passwords"
                  checked={showPasswords}
                  onCheckedChange={setShowPasswords}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className={passwordErrors.newPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {passwordSuccess && (
                <div className="p-3 text-sm text-green-800 bg-green-100 border border-green-300 rounded-md">
                  {passwordSuccess}
                </div>
              )}

              {passwordFormError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive rounded-md">
                  {passwordFormError}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPasswordLoading}>
                {isPasswordLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

