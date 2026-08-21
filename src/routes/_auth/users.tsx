import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Search } from 'lucide-react'
import { getAllUsers, type User } from '@/services/userServices'

export const Route = createFileRoute('/_auth/users')({
  component: UsersPage,
})

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

// UserCard component
interface UserCardProps {
  user: User
}

function UserCard({ user }: UserCardProps) {
  const [avatarColor] = useState(() => getRandomColor())
  const initials = getInitials(user.full_name)
  const roleDisplay = user.role === 'admin' ? 'Administrador' : 'Usuario'

  return (
    <Card className="flex flex-row items-center gap-4 p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200"
        style={{ backgroundColor: avatarColor }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <CardTitle className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {user.full_name}
            
          </CardTitle>
          <Badge 
            variant={user.role === 'admin' ? 'default' : 'secondary'} 
            className="flex-shrink-0"
          >
            {roleDisplay}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground truncate pb-1 -mt-1">{user.email}</p>
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground truncate">
            {user.affiliation || 'Sin afiliación'}
          </p>
        </div>
      </div>
    </Card>
  )
}

// Main page component
function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getAllUsers()
        setUsers(data)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Error al cargar los usuarios. Por favor, intenta nuevamente.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filter users based on search query (client-side)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return users
    }

    const query = searchQuery.toLowerCase().trim()
    return users.filter((user) => {
      const fullName = user.full_name.toLowerCase()
      const affiliation = (user.affiliation || '').toLowerCase()
      const role = user.role === 'admin' ? 'administrador' : 'usuario'
      
      return (
        fullName.includes(query) ||
        affiliation.includes(query) ||
        role.includes(query)
      )
    })
  }, [users, searchQuery])

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
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Usuarios Registrados</h1>
          <p className="text-muted-foreground mb-6">
            {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
          
          {/* Search Input */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="search"
              placeholder="Buscar por nombre, afiliación o rol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>

        {users.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No hay usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No se encontraron usuarios registrados.</p>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>No se encontraron resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No hay usuarios que coincidan con "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mb-4">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </p>
            )}
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

