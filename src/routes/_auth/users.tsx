import axios from 'axios'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, useMemo, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Search, TriangleAlert } from 'lucide-react'
import {
  getAllUsers,
  getUserDisableCheck,
  updateUserStatus,
  type DisableCheckResponse,
  type DisableConflict,
  type User,
} from '@/services/userServices'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/users')({
  validateSearch: (search: Record<string, unknown>) => ({
    deshabilitar: typeof search.deshabilitar === 'string'
      ? search.deshabilitar
      : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.user.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: UsersPage,
})

interface DisableDialogState {
  user: User
  check: DisableCheckResponse
  view: 'confirm' | 'conflicts'
}

type UserStatusFilter = 'all' | 'active' | 'disabled'

function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data
    if (typeof responseData?.error === 'string') return responseData.error
    if (typeof responseData?.detail === 'string') return responseData.detail
  }
  return fallback
}

function isDisableConflict(value: unknown): value is DisableConflict {
  if (typeof value !== 'object' || value === null) return false
  const conflict = value as Record<string, unknown>
  return (
    (conflict.type === 'conference' || conflict.type === 'session') &&
    typeof conflict.id === 'number' &&
    typeof conflict.title === 'string'
  )
}

function getConflictDescription(conflict: DisableConflict): string {
  if (conflict.type === 'session') {
    return `Este usuario es el único chair de la sesión "${conflict.title}". Asigná un nuevo chair a esa sesión antes de deshabilitarlo.`
  }
  return `Este usuario es el único chair de la conferencia "${conflict.title}". Asigná un nuevo chair a esa conferencia antes de deshabilitarlo.`
}

// Helper function to extract initials from full name
function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?'
  return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '')
}

// Generate a random color for avatar background
function getRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#F59E0B', // amber
    '#10B981', // emerald
    '#EF4444', // red
    '#06B6D4', // cyan
    '#F97316', // orange
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#A855F7', // violet
    '#84CC16', // lime
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

interface UserRowProps {
  user: User
  isCurrentAdmin: boolean
  isUpdating: boolean
  onDisable: () => void
  onEnable: () => void
}

function UserRow({
  user,
  isCurrentAdmin,
  isUpdating,
  onDisable,
  onEnable,
}: UserRowProps) {
  const [avatarColor] = useState(() => getRandomColor())
  const initials = getInitials(user.full_name)

  return (
    <tr className={`border-t ${user.is_active ? 'bg-white' : 'bg-red-50/40'}`}>
      <td className="px-4 py-3 sm:px-5">
        <div className="flex min-w-56 items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: avatarColor }}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.full_name}{isCurrentAdmin ? ' (Tú)' : ''}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          {user.role === 'admin' && (
            <Badge className="shrink-0 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
              Administrador
            </Badge>
          )}
        </div>
      </td>
      <td className="min-w-52 px-4 py-3 text-sm text-slate-600 sm:px-5">
        {user.affiliation || 'Sin afiliación'}
      </td>
      <td className="px-4 py-3 sm:px-5">
        <span className={`inline-flex min-w-20 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ${
          user.is_active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <span className={`size-1.5 rounded-full ${user.is_active ? 'bg-green-600' : 'bg-red-600'}`} />
          {user.is_active ? 'Activo' : 'Deshabilitado'}
        </span>
      </td>
      <td className="px-4 py-3 text-right sm:px-5">
        {isCurrentAdmin ? (
          <Button
            type="button"
            variant="outline"
            disabled
            className="min-w-28 border-slate-200 bg-slate-50 text-slate-400"
          >
            Protegida
          </Button>
        ) : (
          <Button
            type="button"
            variant={user.is_active ? 'outline' : 'default'}
            onClick={user.is_active ? onDisable : onEnable}
            disabled={isUpdating}
            className={`min-w-28 ${
              user.is_active
                ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isUpdating
              ? 'Procesando...'
              : user.is_active ? 'Deshabilitar' : 'Habilitar'}
          </Button>
        )}
      </td>
    </tr>
  )
}

function UserMobileCard({
  user,
  isCurrentAdmin,
  isUpdating,
  onDisable,
  onEnable,
}: UserRowProps) {
  const [avatarColor] = useState(() => getRandomColor())
  const initials = getInitials(user.full_name)

  return (
    <Card className={`rounded-xl p-3.5 shadow-none ${
      isCurrentAdmin
        ? 'border-indigo-200 bg-white'
        : user.is_active
          ? 'border-slate-200 bg-white'
          : 'border-red-200 bg-red-50/60'
    }`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ backgroundColor: avatarColor }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900">
            {user.full_name}{isCurrentAdmin ? ' (Tú)' : ''}
          </p>
          <p className="truncate text-sm text-slate-500">{user.email}</p>
        </div>
        <Badge className={`shrink-0 border-0 bg-slate-100 text-slate-700 hover:bg-slate-100 ${
          user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-50' : ''
        }`}>
          {user.role === 'admin' ? 'Admin' : 'Usuario'}
        </Badge>
      </div>

      <div className="mt-3 flex min-h-7 flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm font-semibold ${
          user.is_active
            ? 'border-green-300 bg-green-100 text-green-800'
            : 'border-red-300 bg-red-100 text-red-800'
        }`}>
          <span className={`size-2.5 rounded-full ${
            user.is_active ? 'bg-green-700' : 'bg-red-700'
          }`} />
          {user.is_active ? 'Activo' : 'Deshabilitado'}
        </span>
        {isCurrentAdmin && (
          <span className="text-xs font-medium text-indigo-600">
            Cuenta protegida anti-bloqueo
          </span>
        )}
      </div>

      {isCurrentAdmin ? (
        <Button
          type="button"
          variant="outline"
          disabled
          className="mt-4 h-12 w-full border-slate-300 bg-slate-50 text-slate-400"
        >
          Protegida
        </Button>
      ) : (
        <Button
          type="button"
          variant={user.is_active ? 'outline' : 'default'}
          onClick={user.is_active ? onDisable : onEnable}
          disabled={isUpdating}
          className={`mt-4 h-12 w-full text-base font-semibold ${
            user.is_active
              ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isUpdating
            ? 'Procesando...'
            : user.is_active ? 'Deshabilitar Cuenta' : 'Habilitar Cuenta'}
        </Button>
      )}
    </Card>
  )
}

// Main page component
function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogState, setDialogState] = useState<DisableDialogState | null>(null)
  const [isCheckingDisable, setIsCheckingDisable] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const { deshabilitar } = Route.useSearch()
  const handledReturnUserId = useRef<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAllUsers()
        setUsers(data)
      } catch (err) {
        console.error('Error fetching users:', err)
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setError('No tenés permisos para consultar la lista de usuarios.')
        } else {
          setError('Error al cargar los usuarios. Por favor, intenta nuevamente.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const checkBeforeDisable = async (
    targetUser: User,
    returnedAfterResolution = false
  ) => {
    setIsCheckingDisable(true)
    setDialogState(null)
    try {
      const check = await getUserDisableCheck(targetUser.id)
      setDialogState({
        user: targetUser,
        check,
        view: check.can_disable ? 'confirm' : 'conflicts',
      })
      if (returnedAfterResolution && check.can_disable) {
        toast.success('Conflicto resuelto. Ya podés deshabilitar a este usuario.')
      }
    } catch (err) {
      console.error('Error checking whether user can be disabled:', err)
      toast.error(getRequestErrorMessage(err, 'No se pudo comprobar si el usuario puede deshabilitarse.'))
    } finally {
      setIsCheckingDisable(false)
    }
  }

  useEffect(() => {
    if (!deshabilitar) {
      handledReturnUserId.current = null
      return
    }
    if (isLoading || handledReturnUserId.current === deshabilitar) return

    handledReturnUserId.current = deshabilitar
    const targetUser = users.find((candidate) => candidate.id === Number(deshabilitar))
    void navigate({
      to: '/users',
      search: { deshabilitar: undefined },
      replace: true,
    })
    if (!targetUser) {
      toast.error('No se encontró el usuario que estabas intentando deshabilitar.')
      return
    }
    void checkBeforeDisable(targetUser, true)
  }, [deshabilitar, isLoading, users, navigate])

  const handleDisable = async () => {
    if (!dialogState) return
    setUpdatingUserId(dialogState.user.id)
    try {
      const response = await updateUserStatus(dialogState.user.id, false)
      setUsers((current) => current.map((item) =>
        item.id === response.user.id ? response.user : item
      ))
      toast.success(response.message || 'Usuario deshabilitado correctamente.')
      setDialogState(null)
    } catch (err) {
      console.error('Error disabling user:', err)
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const responseConflicts: unknown = err.response.data?.conflicts
        if (
          Array.isArray(responseConflicts) &&
          responseConflicts.every(isDisableConflict)
        ) {
          setDialogState({
            ...dialogState,
            check: {
              ...dialogState.check,
              can_disable: false,
              conflicts: responseConflicts,
            },
            view: 'conflicts',
          })
          return
        }
      }
      toast.error(getRequestErrorMessage(err, 'No se pudo deshabilitar al usuario.'))
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleEnable = async (targetUser: User) => {
    setUpdatingUserId(targetUser.id)
    try {
      const response = await updateUserStatus(targetUser.id, true)
      setUsers((current) => current.map((item) =>
        item.id === response.user.id ? response.user : item
      ))
      toast.success(response.message || 'Usuario habilitado correctamente.')
      toast.info('La habilitación no recupera sus roles de chair; volvé a asignarlos si corresponde.')
    } catch (err) {
      console.error('Error enabling user:', err)
      toast.error(getRequestErrorMessage(err, 'No se pudo habilitar al usuario.'))
    } finally {
      setUpdatingUserId(null)
    }
  }

  const resolveConflict = (conflict: DisableConflict) => {
    if (!dialogState) return
    const userId = String(dialogState.user.id)
    if (conflict.type === 'conference') {
      void navigate({
        to: `/conference/edit/${conflict.id}`,
        search: { deshabilitar: userId },
      })
      return
    }
    void navigate({
      to: `/conference/session/${conflict.id}`,
      search: { editar: 'true', deshabilitar: userId },
    })
  }

  // Apply search and status filters to the loaded admin user list.
  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return users.filter((user) => {
      const matchesQuery = !query || [
        user.full_name,
        user.email,
        user.affiliation || '',
        user.role === 'admin' ? 'administrador' : 'usuario',
      ].some((value) => value.toLowerCase().includes(query))
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'disabled' && !user.is_active)

      return matchesQuery && matchesStatus
    })
  }, [users, searchQuery, statusFilter])

  const activeUsersCount = users.filter((user) => user.is_active).length
  const disabledUsersCount = users.length - activeUsersCount
  const pageSize = 6
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const visiblePage = Math.min(currentPage, pageCount)
  const paginatedUsers = filteredUsers.slice(
    (visiblePage - 1) * pageSize,
    visiblePage * pageSize
  )

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-3">
        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardHeader className="px-5 py-4 sm:px-6">
            <CardTitle className="text-xl font-bold text-slate-900">
              Administracion y Control de Usuarios
            </CardTitle>
            <p className="-mt-2 text-xs text-slate-500">
              Gestiona el estado de las cuentas. Habilitar o deshabilitar cuentas de usuario bloqueando su inicio de sesión sin eliminar sus articulos, reviciones ni datos históricos.
            </p>
          </CardHeader>
        </Card>

        <Card className="rounded-xl border-slate-200 shadow-none">
          <div className="flex flex-col gap-2 p-2 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Buscar por nombre, email o institución..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value)
                  setCurrentPage(1)
                }}
                className="h-10 border-slate-300 bg-slate-50 pl-9 text-base md:h-8 md:text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                aria-pressed={statusFilter === 'all'}
                onClick={() => { setStatusFilter('all'); setCurrentPage(1) }}
                className={statusFilter === 'all'
                  ? 'rounded-full bg-slate-900 px-4 text-white hover:bg-slate-800'
                  : 'rounded-full bg-slate-100 px-4 text-slate-700 hover:bg-slate-200'}
              >
                Todos ({users.length})
              </Button>
              <Button
                type="button"
                size="sm"
                aria-pressed={statusFilter === 'active'}
                onClick={() => { setStatusFilter('active'); setCurrentPage(1) }}
                className={statusFilter === 'active'
                  ? 'rounded-full border border-green-300 bg-green-100 px-4 text-green-800 hover:bg-green-200'
                  : 'rounded-full border border-green-200 bg-green-50 px-4 text-green-700 hover:bg-green-100'}
              >
                <span className="size-2 rounded-full bg-green-600" />
                Activos ({activeUsersCount})
              </Button>
              <Button
                type="button"
                size="sm"
                aria-pressed={statusFilter === 'disabled'}
                onClick={() => { setStatusFilter('disabled'); setCurrentPage(1) }}
                className={statusFilter === 'disabled'
                  ? 'rounded-full border border-red-300 bg-red-100 px-4 text-red-800 hover:bg-red-200'
                  : 'rounded-full border border-red-200 bg-red-50 px-4 text-red-700 hover:bg-red-100'}
              >
                <span className="size-2 rounded-full bg-red-600" />
                Deshabilitados ({disabledUsersCount})
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden rounded-xl border-slate-200 shadow-none">
          {users.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No se encontraron usuarios registrados.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No hay usuarios que coincidan con la búsqueda o el filtro seleccionado.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-50 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 sm:px-5">Participante / Correo</th>
                      <th className="px-4 py-3 sm:px-5">Afiliación institucional</th>
                      <th className="px-4 py-3 sm:px-5">Estado de acceso</th>
                      <th className="px-4 py-3 text-right sm:px-5">Acción operativa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((listedUser) => (
                      <UserRow
                        key={listedUser.id}
                        user={listedUser}
                        isCurrentAdmin={String(listedUser.id) === String(currentUser?.id)}
                        isUpdating={updatingUserId === listedUser.id}
                        onDisable={() => void checkBeforeDisable(listedUser)}
                        onEnable={() => void handleEnable(listedUser)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 p-3 md:hidden">
                {paginatedUsers.map((listedUser) => (
                  <UserMobileCard
                    key={listedUser.id}
                    user={listedUser}
                    isCurrentAdmin={String(listedUser.id) === String(currentUser?.id)}
                    isUpdating={updatingUserId === listedUser.id}
                    onDisable={() => void checkBeforeDisable(listedUser)}
                    onEnable={() => void handleEnable(listedUser)}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t bg-slate-50 px-3 py-3 text-xs text-slate-500 sm:px-5 md:flex-row md:items-center md:justify-between">
                <p className="text-center md:text-left">
                  Mostrando {(visiblePage - 1) * pageSize + 1}–{Math.min(visiblePage * pageSize, filteredUsers.length)} de {filteredUsers.length} usuarios
                  {' '}• {activeUsersCount} activos, {disabledUsersCount} deshabilitados
                </p>
                <nav aria-label="Paginación de usuarios" className="flex flex-wrap items-center justify-center gap-0.5 md:justify-end md:gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={visiblePage === 1}
                    onClick={() => setCurrentPage(visiblePage - 1)}
                    className="text-slate-600"
                  >
                    <ChevronLeft className="size-3" />
                    Anterior
                  </Button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                    <Button
                      key={page}
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-current={visiblePage === page ? 'page' : undefined}
                      onClick={() => setCurrentPage(page)}
                      className={visiblePage === page
                        ? 'min-w-8 bg-slate-200 px-2 text-slate-900'
                        : 'min-w-8 px-2 text-slate-600'}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={visiblePage === pageCount}
                    onClick={() => setCurrentPage(visiblePage + 1)}
                    className="text-slate-600"
                  >
                    Siguiente
                    <ChevronRight className="size-3" />
                  </Button>
                </nav>
              </div>
            </>
          )}
        </Card>
      </div>

      <Dialog
        open={dialogState !== null || isCheckingDisable}
        onOpenChange={(open) => {
          if (!open && updatingUserId === null) setDialogState(null)
        }}
      >
        <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90dvh] overflow-y-auto p-4 sm:max-w-lg sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-start gap-2 text-base leading-snug sm:text-lg">
              {dialogState?.view === 'conflicts'
                ? 'No se puede deshabilitar todavía'
                : dialogState
                  ? (
                    <>
                      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
                      <span>
                        ¿Deshabilitar la cuenta de {dialogState.user.full_name}? ({dialogState.user.email})
                      </span>
                    </>
                  )
                  : 'Deshabilitar usuario'}
            </DialogTitle>
            {isCheckingDisable ? (
              <DialogDescription>
                Comprobando si hay conflictos...
              </DialogDescription>
            ) : dialogState && (
              <DialogDescription>
                {dialogState.view === 'confirm'
                  ? (
                    <>
                      Esta acción suspenderá el acceso del usuario a la plataforma de inmediato.
                      Sus sesiones JWT activas serán rechazadas automáticamente.
                    </>
                  )
                  : 'Resolvé los conflictos siguientes antes de deshabilitar esta cuenta.'}
              </DialogDescription>
            )}
          </DialogHeader>

          {dialogState?.view === 'confirm' && (
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
                <ul className="list-disc space-y-1 pl-4 leading-snug">
                  <li>La cuenta permanecerá en la base de datos sin pérdida de artículos ni dictámenes.</li>
                  <li>El usuario verá un mensaje de cuenta suspendida si intenta iniciar sesión.</li>
                  <li>Puedes revertir esta acción y rehabilitar la cuenta en cualquier momento.</li>
                </ul>
              </div>
              {dialogState.check.chair_removals.length > 0 && (
                <section>
                  <p className="font-semibold">También se lo quitará como chair de:</p>
                  <ul className="list-disc pl-5">
                    {dialogState.check.chair_removals.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        {item.type === 'session' ? 'Sesión' : 'Conferencia'}: {item.title}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {dialogState.check.pending_reviews.length > 0 && (
                <section>
                  <p className="font-semibold">Tiene revisiones pendientes en:</p>
                  <ul className="list-disc pl-5">
                    {dialogState.check.pending_reviews.map((item) => (
                      <li key={item.session_id}>
                        {item.session_title} → {item.articles.map((article) => article.title).join(', ')}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    Se notificará a los chairs para que las reasignen.
                  </p>
                </section>
              )}
            </div>
          )}

          {dialogState?.view === 'conflicts' && (
            <div className="max-h-[55dvh] space-y-3 overflow-y-auto overscroll-contain pr-1">
              {dialogState.check.conflicts.map((conflict) => (
                <div
                  key={`${conflict.type}-${conflict.id}`}
                  className="flex min-w-0 flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="break-words text-sm leading-relaxed">{getConflictDescription(conflict)}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resolveConflict(conflict)}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    Resolver
                  </Button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            {dialogState?.view === 'confirm' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogState(null)}
                  disabled={updatingUserId !== null}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleDisable()}
                  disabled={updatingUserId !== null}
                >
                  {updatingUserId === dialogState.user.id
                    ? 'Deshabilitando...'
                    : 'Deshabilitar'}
                </Button>
              </>
            ) : dialogState?.view === 'conflicts' ? (
              <Button
                type="button"
                onClick={() => setDialogState(null)}
              >
                Cerrar
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
