import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllNotifications, markNotificationAsRead } from '@/services/userServices'
import type { Notification, NotificationType } from '@/services/userServices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Info, Check } from 'lucide-react'
import { InvitationNotificationActions } from '@/components/reviewer/invitations/InvitationNotificationActions'
import { toast } from 'sonner'

export const Route = createFileRoute('/_auth/notifications')({
  component: RouteComponent,
})

const reviewerResolutionTitles = new Set([
  'Revisor deshabilitado',
  'Reasignar revisiones pendientes',
])

function getNotificationSessionId(notification: Notification): number | null {
  if (notification.session) return notification.session
  if (notification.title !== 'Reasignar revisiones pendientes') return null

  const sessionId = notification.message.match(/En la sesión ".*?" \(ID: (\d+)\)/)?.[1]
  return sessionId ? Number(sessionId) : null
}

function RouteComponent() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | NotificationType>('all')

  // Fetch notifications
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: getAllNotifications,
  })

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const goToRelatedUser = (notification: Notification) => {
    if (!notification.related_user) return
    if (!notification.read) markAsReadMutation.mutate(notification.id)
    void navigate({
      to: '/users',
      search: { deshabilitar: String(notification.related_user) },
    })
  }

  const resolveSessionNotification = async (notification: Notification) => {
    const sessionId = getNotificationSessionId(notification)
    if (!sessionId) return

    if (!notification.read) {
      try {
        await markAsReadMutation.mutateAsync(notification.id)
      } catch (markError) {
        console.error('Could not mark session notification as read:', markError)
        toast.error('No se pudo marcar la notificación como leída.')
      }
    }

    void navigate({
      to: `/conference/session/${sessionId}`,
      search: reviewerResolutionTitles.has(notification.title)
        ? {
            editar: undefined,
            deshabilitar: undefined,
            resolverRevisiones: 'true',
            resolverNotificacion: String(notification.id),
          }
        : {
            editar: 'true',
            deshabilitar: undefined,
            resolverRevisiones: undefined,
            resolverNotificacion: undefined,
          },
    })
  }

  // Client-side filtering
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications]

    // Filter by read status
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read)
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read)
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter)
    }

    return filtered
  }, [notifications, filter, typeFilter])

  const unreadCount = notifications.filter(n => !n.read).length

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Cargando notificaciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error al cargar notificaciones</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : 'Ocurrió un error desconocido'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Notificaciones</h1>
        <p className="text-muted-foreground">
          {unreadCount > 0 ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer` : 'No tienes notificaciones sin leer'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                No leídas ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Leídas ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todos los tipos</TabsTrigger>
              <TabsTrigger value="info">Informativas</TabsTrigger>
              <TabsTrigger value="critical">Críticas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Notifications list */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No hay notificaciones para mostrar</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                isMarking={markAsReadMutation.isPending}
                onResolveSession={() => void resolveSessionNotification(notification)}
                onGoToUser={() => goToRelatedUser(notification)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface NotificationCardProps {
  notification: Notification
  onMarkAsRead: () => void
  isMarking: boolean
  onResolveSession: () => void
  onGoToUser: () => void
}

function NotificationCard({
  notification,
  onMarkAsRead,
  isMarking,
  onResolveSession,
  onGoToUser,
}: NotificationCardProps) {
  const [isResolved] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return window.sessionStorage.getItem(`resolved-session-notification-${notification.id}`) === 'true'
    } catch (storageError) {
      console.error('Could not read session notification completion state:', storageError)
      return false
    }
  })
  const isCritical = notification.type === 'critical'
  const isRead = notification.read
  const formattedDate = new Date(notification.created_at).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Card className={`transition-all py-4 hover:shadow-md ${isRead ? 'opacity-80 bg-muted/80' : ''}`}>
      <div className="p-3 py-0">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`shrink-0 ${isCritical ? 'text-destructive' : 'text-blue-500'}`}>
              {isCritical ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </div>
            <h3 className={`text-sm ${isRead ? 'font-normal' : 'font-semibold'} truncate`}>
              {notification.title}
            </h3>
            <Badge variant={isCritical ? 'destructive' : 'default'} className="text-xs shrink-0">
              {isCritical ? 'Crítica' : 'Info'}
            </Badge>
            {isRead && (
              <Badge variant="secondary" className="text-xs shrink-0">
                Leída
              </Badge>
            )}
            <span className="text-xs text-muted-foreground shrink-0 ml-auto">{formattedDate}</span>
          </div>
          {!isRead && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkAsRead}
              disabled={isMarking}
              className="shrink-0 h-7 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar leída
            </Button>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap ml-6 text-muted-foreground">{notification.message}</p>
        {(notification.title === 'Sesión sin chair' ||
          reviewerResolutionTitles.has(notification.title)) &&
          getNotificationSessionId(notification) && (
          <div className="ml-6 mt-3 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                onResolveSession()
              }}
              disabled={reviewerResolutionTitles.has(notification.title) && isResolved}
            >
              {reviewerResolutionTitles.has(notification.title)
                ? 'Reasignar revisiones'
                : 'Ir a sesión'}
            </Button>
          </div>
        )}
        {notification.title === 'Conflicto resuelto' && notification.related_user && (
          <div className="ml-6 mt-3 flex justify-end">
            <Button size="sm" onClick={onGoToUser}>
              Ir al usuario
            </Button>
          </div>
        )}
        {notification.article && (
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            Artículo ID: {notification.article}
          </p>
        )}
        {/* GRUPO 1: aceptar/rechazar si la notificación es de una invitación a revisar */}
        <InvitationNotificationActions notificationId={notification.id} />
      </div>
    </Card>
  )
}