import { createRootRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoleProvider, useRole } from '@/contexts/RoleContext';
import { Armchair, Bell, Menu, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { InvitationsNavLabel } from '@/components/reviewer/invitations/InvitationsNavLabel';
import { Button } from '@/components/ui/button';
import { NavConference } from '@/components/conference/NavConference';
import { useQuery } from '@tanstack/react-query';
import { getAllNotifications, getUserFullData } from '@/services/userServices';

const RootLayoutContent = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { selectedRole, setSelectedRole, clearSelectedRole } = useRole();
  const navigate = useNavigate();
 
  // Obtener conferencias y roles completos del usuario para el selector de roles en NavConference
  const { data: conferences } = useQuery({
    queryKey: ['user-full-data'],
    queryFn: getUserFullData,
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getAllNotifications,
    enabled: !!user,
  });
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleLogout = () => {
    try {
      clearSelectedRole();
    } catch {}
    logout();
    navigate({ to: '/login', search: { redirect: undefined, registered: undefined } });
  };

  const roleKey = String(selectedRole?.role ?? "").toLowerCase().trim();

  // Extraer el ID soportando ambas nomenclaturas
  const currentConferenceId = selectedRole?.conferenceId ?? (selectedRole as any)?.conference_id;

  // Encontrar los roles disponibles para la conferencia seleccionada actual
  const currentConferenceRoles = useMemo(() => {
    if (!conferences || !selectedRole?.conferenceId) return [selectedRole?.role].filter(Boolean) as string[];
    const conf = conferences.find((c) => c.conference_id === selectedRole.conferenceId);
    return conf ? conf.roles : [selectedRole.role];
  }, [conferences, selectedRole]);

  // Manejar el cambio de rol desde el menú desplegable del NavConference
  const handleRoleChange = (newRole: string) => {
    if (!selectedRole) return;
    const normalizedRole = newRole.toLowerCase().trim();
    setSelectedRole({
      ...selectedRole,
      role: normalizedRole,
    });

    if (normalizedRole === 'autor') {
      navigate({ to: `/articles/${selectedRole.conferenceId}`, replace: true });
    } else if (normalizedRole === 'revisor') {
      navigate({ to: '/reviewer' });
    }
  };

  // Mapa de rutas según el rol
  const roleRoutes: Record<string, { to: string; label: React.ReactNode }[]> = {
    revisor: [
      { to: '/reviewer/', label: 'Revisor' },
      { to: '/reviewer/invitations', label: <InvitationsNavLabel /> },
      { to: '/reviewer/bidding', label: 'Bidding' },
      { to: '/reviewer/history', label: 'Historial' },
    ],
    autor: [
      { to: '/article/create', label: 'Mis artículos' },
    ],
    chair: [
      { to: '/article/select', label: 'Artículos' },
      { to: '/review/chair/reviewed', label: 'Revisores' },
    ],
    admin: [
      { to: '/reviewer/', label: 'Revisor' },
      { to: '/reviewer/invitations', label: <InvitationsNavLabel /> },
      { to: '/users', label: 'Usuarios' },
      { to: '/article/create', label: 'Artículos' },
      { to: '/chairs/select-session', label: 'Sesiones' },
    ],
    users: [
      { to: '/users', label: 'Ver usuarios' }
    ]
  };

  // Enlaces principales del navbar superior
  const links = useMemo(() => {
    if (!user) {
      return [
        { to: '/login', label: 'Ingresar' },
        { to: '/register', label: 'Registrarse' },
      ];
    }

    const commonAuthLinks = [
      {
        to: '/notifications',
        label: (
          <>
            <span className="relative inline-flex">
              <Bell aria-hidden="true" />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </span>
            <span className="sr-only">
              Notificaciones{unreadCount > 0 ? `, ${unreadCount} sin leer` : ''}
            </span>
          </>
        ),
      },
      { to: '/conference/view', label: 'Conferencias' },
    ];

    if (user.role === 'admin') {
      return [...commonAuthLinks, { to: '/users', label: 'Usuarios' }];
    }

    return commonAuthLinks;
  }, [user, unreadCount]);

  const normalize = (p: string) => (p ? p.replace(/\/+$/, '') || '/' : '/');
  const current = normalize(location?.pathname ?? '/');

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar Superior Principal (Slate 900) */}
      <header className="bg-slate-900 text-white flex flex-col">
        <div className="px-6 py-4 flex justify-between items-center">
          <nav className="hidden xl:flex gap-2 items-center">
            <Link
              to={user ? "/dashboard" : "/"}
              className="font-bold text-lg flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 mr-4"
            >
              ComfyChair
              <Armchair />
            </Link>
            {links.map((link) => (
              <Link 
                key={link.to}
                to={link.to}
                className="inline-flex items-center justify-center px-3 py-1 rounded-md hover:bg-gray-800 [&.active]:bg-slate-700 [&.active]:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Botón menú móvil */}
          <button onClick={() => setIsOpen(true)} className="xl:hidden p-1 rounded hover:bg-gray-800 order-0">
            <Menu />
          </button>

          <div className="flex items-center gap-3">
            {user && (
              <Button onClick={handleLogout} variant="destructive" size="sm" className="hidden xl:inline self-center">
                Cerrar Sesión
              </Button>
            )}
            
            <Link
              to={user ? "/dashboard" : "/"}
              className="xl:hidden self-end font-bold text-lg flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              ComfyChair
              <Armchair />
            </Link>
          </div>
        </div>

        {/* Segundo Nivel (Barra Negra): Se muestra únicamente cuando hay un rol/conferencia seleccionado */}
        {roleKey && selectedRole?.conferenceName && (
          <NavConference 
            title={selectedRole.conferenceName}
            conferenceId={currentConferenceId}
            currentRole={roleKey}
            availableRoles={currentConferenceRoles}
            opciones={roleRoutes[roleKey] ?? []}
            onSelectRole={handleRoleChange}
          />
        )}
      </header>

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar móvil */}
        <aside className={`fixed z-20 top-0 left-0 h-full bg-slate-900 text-white w-64 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:hidden`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={() => setIsOpen(false)}>
              <X />
            </button>
          </div>

          <nav className="flex flex-col mt-4 gap-2">
            {links.map((link) => {
              const isActive = normalize(link.to) === current;
              const base = 'px-4 mx-2 py-2 rounded-md hover:bg-gray-800';
              const activeCls = isActive ? 'bg-slate-700 text-white' : '';
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`${base} ${activeCls}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            
            {/* Si hay rol seleccionado en móvil, mostrar enlaces del rol actual en el menú */}
            {roleKey && roleRoutes[roleKey] && (
              <div className="border-t border-slate-800 my-2 pt-2 px-2">
                <p className="text-xs text-slate-400 px-2 mb-1 uppercase tracking-wider">
                  Rol: {roleKey} ({selectedRole?.conferenceName})
                </p>
                {roleRoutes[roleKey].map((subLink) => (
                  <Link
                    key={subLink.to}
                    to={subLink.to}
                    className="block px-4 py-2 rounded-md hover:bg-gray-800 text-sm text-slate-200"
                    onClick={() => setIsOpen(false)}
                  >
                    {subLink.label}
                  </Link>
                ))}
              </div>
            )}

            {user && (
              <Button onClick={handleLogout} variant="destructive" size="sm" className="px-4 mx-2 mt-4">
                Cerrar Sesión
              </Button>
            )}
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <TanStackRouterDevtools />
      <Toaster position='top-right' />
    </div>
  );
};

const RootLayout = () => {
  return (
    <AuthProvider>
      <RoleProvider>
        <RootLayoutContent />
      </RoleProvider>
    </AuthProvider>
  );
};

export const Route = createRootRoute({ component: RootLayout });
