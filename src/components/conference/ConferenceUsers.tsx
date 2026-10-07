import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FilePenLine,
  Mail,
  RefreshCw,
  Search,
  Users,
  UserRoundCheck,
  X,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  getConferenceUsers,
  type ConferenceUser,
} from '@/services/userServices';

interface ConferenceUsersProps {
  conferenceId: number;
}

const PAGE_SIZE = 8;

const ROLES = [
  { value: '', label: 'Todos' },
  { value: 'conference_chair', label: 'Chairs' },
  { value: 'session_chair', label: 'Chairs de sesión' },
  { value: 'reviewer', label: 'Revisores' },
  { value: 'author', label: 'Autores' },
];

function getRoleLabel(role: string): string {
  switch (role) {
    case 'conference_chair':
      return 'Chair';

    case 'session_chair':
      return 'Chair de sesión';

    case 'reviewer':
      return 'Revisor';

    case 'author':
      return 'Autor';

    case 'admin':
      return 'Admin';

    default:
      return role;
  }
}

function getRoleClassName(role: string): string {
  switch (role) {
    case 'conference_chair':
      return 'bg-violet-50 text-violet-700 border-violet-200';

    case 'session_chair':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';

    case 'reviewer':
      return 'bg-sky-50 text-sky-700 border-sky-200';

    case 'author':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';

    case 'admin':
      return 'bg-slate-900 text-white border-slate-900';

    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'conference_chair':
      return <UserRoundCheck size={14} />;

    case 'session_chair':
      return <ClipboardCheck size={14} />;

    case 'reviewer':
      return <FilePenLine size={14} />;

    case 'author':
      return <BookOpen size={14} />;

    default:
      return null;
  }
}

function RoleBadges({ roles }: { roles: string[] }) {
  return (
    <>
      {roles.map((role) => (
        <span
          key={role}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getRoleClassName(
            role
          )}`}
        >
          {getRoleIcon(role)}
          {getRoleLabel(role)}
        </span>
      ))}
    </>
  );
}

function getInitials(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getUserAvatarClassName(userId: number): string {
  const colors = [
    'bg-slate-900 border-slate-900',
    'bg-violet-500 border-violet-500',
    'bg-sky-600 border-sky-600',
    'bg-emerald-600 border-emerald-600',
    'bg-rose-500 border-rose-500',
    'bg-orange-600 border-orange-600',
    'bg-indigo-600 border-indigo-600',
    'bg-teal-600 border-teal-600',
  ];

  return `${colors[userId % colors.length]} text-white`;
}

function getRoleCount(
  users: ConferenceUser[],
  role: string
): number {
  if (role === '') {
    return users.length;
  }

  return users.filter((user) =>
    user.roles.includes(role)
  ).length;
}

export default function ConferenceUsers({
  conferenceId,
}: ConferenceUsersProps) {
  const [users, setUsers] = useState<ConferenceUser[]>([]);
  const [allUsers, setAllUsers] = useState<ConferenceUser[]>([]);

  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadAllUsers = useCallback(async () => {
    try {
      const data = await getConferenceUsers(conferenceId);

      setAllUsers(data.users);
    } catch (err) {
      console.error(
        'Error al cargar todos los usuarios de la conferencia:',
        err
      );
    }
  }, [conferenceId]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);

      const data = await getConferenceUsers(conferenceId, {
        search,
        role: selectedRole,
      });

      setUsers(data.users);
    } catch (err) {
      console.error(
        'Error al cargar los usuarios de la conferencia:',
        err
      );

      setError(true);
    } finally {
      setLoading(false);
    }
  }, [conferenceId, search, selectedRole]);

  useEffect(() => {
    loadAllUsers();
  }, [loadAllUsers]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 300);

    return () => clearTimeout(timeout);
  }, [loadUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedRole]);

  const roleCounts = useMemo(() => {
    return {
      '': allUsers.length,

      conference_chair: getRoleCount(
        allUsers,
        'conference_chair'
      ),

      session_chair: getRoleCount(
        allUsers,
        'session_chair'
      ),

      reviewer: getRoleCount(
        allUsers,
        'reviewer'
      ),

      author: getRoleCount(
        allUsers,
        'author'
      ),

    };
  }, [allUsers]);

  const totalPages = Math.ceil(
    users.length / PAGE_SIZE
  );

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;

    return users.slice(start, end);
  }, [users, currentPage]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white">
              <Users size={20} />
            </span>

            <h2 className="text-xl font-bold">
              Usuarios de la conferencia
            </h2>
          </div>

          {!error && (
            <span
              className="text-sm text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {loading
                ? 'Actualizando usuarios…'
                : `${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'}`}
            </span>
          )}
        </div>

        <p className="hidden text-sm text-muted-foreground sm:block">
           Usuarios que participan en esta conferencia.
        </p>
      </div>

      <div className="relative">
        <Search
          size={18}
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="conference-user-search"
          aria-label="Buscar usuarios por nombre o correo electrónico"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Buscar por nombre o correo electrónico..."
          className="pl-10 pr-10"
        />
        {search && (
          <button
            type="button"
            aria-label="Limpiar búsqueda"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {ROLES.map((role) => {
          const active = selectedRole === role.value;
          return (
            <Button
              key={role.value || 'all'}
              type="button"
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                setSelectedRole(role.value)
              }
              aria-pressed={active}
              className="min-h-9 shrink-0 cursor-pointer"
            >
              <span>{role.label}</span>
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none ${
                  active
                    ? 'bg-white/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {roleCounts[
                  role.value as keyof typeof roleCounts
                ]}
              </span>
            </Button>
          );
        })}
      </div>

      {error && (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded border border-red-200 bg-red-50 p-8 text-center">
          <AlertCircle
            className="text-red-600"
            size={28}
          />
          <div>
            <p className="font-semibold text-red-700">
              No se pudieron cargar los usuarios
            </p>

            <p className="text-sm text-red-600">
              Ocurrió un error al consultar los usuarios.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={loadUsers}
            className="cursor-pointer"
          >
            <RefreshCw size={16} />
            Reintentar
          </Button>
        </div>
      )}

      {!error && (
        <div className="relative min-h-[420px]">

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-background/60 backdrop-blur-[1px]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />

                Actualizando...
              </div>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded border border-gray-200 p-8 text-center">
              <Users
                size={36}
                className="mb-3 text-muted-foreground"
              />

              <p className="font-medium">
                {search || selectedRole
                  ? 'No hay resultados para la búsqueda realizada'
                  : 'Todavía no hay usuarios'}
              </p>

              {!search && !selectedRole && (
                <p className="max-w-sm text-sm text-muted-foreground">
                  Los usuarios de esta conferencia aparecerán acá.
                </p>
              )}
            </div>
          )}

          {users.length > 0 && (
            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {paginatedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-sm font-semibold shadow-sm ${getUserAvatarClassName(
                        user.id
                      )}`}
                    >
                      {getInitials(user.full_name)}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="font-semibold">
                        {user.full_name}
                      </span>

                      {user.email && (
                        <a
                          href={`mailto:${user.email}`}
                          className="flex min-w-0 items-center gap-2 text-sm text-slate-500 transition-colors hover:text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Mail size={14} className="shrink-0" />

                          <span className="truncate">
                            {user.email}
                          </span>
                        </a>
                      )}

                      <div className="flex flex-wrap gap-1 sm:hidden">
                        <RoleBadges roles={user.roles} />
                      </div>

                      {user.affiliation && (
                        <div className="hidden items-start gap-2 text-sm text-slate-500 sm:flex">
                          <Building2 size={14} className="shrink-0" />

                          <span className="break-words">
                            {user.affiliation}
                          </span>
                        </div>
                      )}

                      {user.roles.length > 1 && (
                        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>
                            Tiene {user.roles.length} roles en esta conferencia
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hidden shrink-0 flex-wrap justify-end gap-2 pt-1 sm:flex">
                    <RoleBadges roles={user.roles} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {!error && users.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <nav
            aria-label="Paginación de usuarios"
            className="mx-auto flex items-center justify-center gap-2"
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((page) => page - 1)
              }
              aria-label="Página anterior"
              className="cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <span
              className="min-w-[90px] text-center text-sm text-muted-foreground"
              aria-label={`Página ${currentPage} de ${totalPages}`}
            >
              Página {currentPage} de {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => page + 1)
              }
              aria-label="Página siguiente"
              className="cursor-pointer"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight size={16} />
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}