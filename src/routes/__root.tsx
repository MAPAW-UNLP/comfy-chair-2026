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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';

const RootLayoutContent = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { selectedRole, setSelectedRole, clearSelectedRole } = useRole();
  const navigate = useNavigate();

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
  const currentConferenceId = selectedRole?.conferenceId ?? (selectedRole as any)?.conference_id;

  const currentConferenceRoles = useMemo(() => {
    if (!conferences || !selectedRole?.conferenceId) return [selectedRole?.role].filter(Boolean) as string[];
    const conf = conferences.find((c) => c.conference_id === selectedRole.conferenceId);
    return conf ? conf.roles : [selectedRole.role];
  }, [conferences, selectedRole]);

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

  const roleRoutes: Record<string, { to: string; label: React.ReactNode }[]> = {
    revisor: [
      { to: '/reviewer/invitations', label: <InvitationsNavLabel /> },
      { to: '/reviewer/bidding', label: 'Bidding' },
      { to: '/reviewer/history', label: 'Historial' },
    ],
    autor: [
      { to: '/article/create', label: 'Crear articulo' },
    
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

  const links = useMemo(() => {
    if (!user) return [];
    const commonAuthLinks = [
      { to: '/conference/view', label: 'Conferencias' },
    ];
    if (user.role === 'admin') {
      return [...commonAuthLinks, { to: '/users', label: 'Usuarios' }];
    }
    return commonAuthLinks;
  }, [user]);

  // Color de fondo del header y del menú lateral basado en el rol de admin
  const headerBgClass = user?.role === 'admin' ? 'bg-teal-900' : 'bg-slate-900';

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar Superior Principal */}
      <header className={`${headerBgClass} text-white flex flex-col`}>
        <div className="px-6 py-4 flex justify-between items-center relative">
          {/* Izquierda: Botón menú móvil */}
          <div className="flex items-center gap-4 z-10">
            <button onClick={() => setIsOpen(true)} className="xl:hidden p-1 rounded hover:bg-black/20">
              <Menu className="h-6 w-6" />
            </button>

            <Link
              to={user ? "/dashboard" : "/"}
              className="hidden font-bold text-lg xl:flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400 mr-2"
            >
              ComfyChair
              <Armchair />
            </Link>

            <nav className="hidden xl:flex gap-2 items-center">
              {links.map((link) => (
                <Link 
                  key={link.to}
                  to={link.to}
                  className="inline-flex items-center justify-center px-3 py-1 rounded-md hover:bg-black/20 [&.active]:bg-black/40 [&.active]:text-white text-sm"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Logo centrado en móvil */}
          <Link
            to={user ? "/dashboard" : "/"}
            className="absolute left-1/2 -translate-x-1/2 font-bold text-lg flex xl:hidden items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            ComfyChair
            <Armchair />
          </Link>

          {/* Derecha en Escritorio */}
          <div className="hidden xl:flex items-center gap-4 z-10">
            {user ? (
              <>
                <Link to="/notifications" className="p-1.5 hover:bg-black/20 rounded-full relative transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost" 
                      size="sm" 
                      className="text-white hover:bg-black/20 hover:text-white h-8 px-2 flex items-center gap-1.5 font-normal"
                    >
                      Hola, {user.full_name}
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-900 border border-slate-800 text-white min-w-[160px] p-1 shadow-lg rounded-md z-50">
                    <DropdownMenuItem asChild>
                      <Link to='/profile' className='w-full block px-3 py-2 text-sm hover:bg-slate-800 rounded cursor-pointer'>
                        Mi perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-800 my-1" />
                    <DropdownMenuItem asChild>
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded cursor-pointer font-medium">
                        Cerrar sesión
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login" className="inline-flex items-center justify-center px-3 py-1.5 rounded-md hover:bg-black/20 text-sm">
                  Ingresar
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-black/20 hover:bg-black/40 text-sm font-medium">
                  Registrarse
                </Link>
              </>
            )}
          </div>
            
          {/* Derecha en Móvil */}
          <div className="xl:hidden flex items-center gap-2 z-10">
            {user && (
              <Link to="/notifications" className="p-1.5 hover:bg-black/20 rounded-full relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-4 text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Segundo Nav: Ahora visible SIEMPRE (tanto en Desktop como en Mobile) cuando hay rol/conferencia */}
        {roleKey && selectedRole?.conferenceName && (
          <div>
            <NavConference 
              title={selectedRole.conferenceName}
              conferenceId={currentConferenceId}
              currentRole={roleKey}
              availableRoles={currentConferenceRoles}
              opciones={roleRoutes[roleKey] ?? []}
              onSelectRole={handleRoleChange}
            />
          </div>
        )}
      </header>

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar menú hamburguesa (Mantiene SIEMPRE el menú del usuario) */}
        <aside className={`fixed z-50 top-0 left-0 h-full ${headerBgClass} text-white w-64 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:hidden flex flex-col shadow-2xl border-r border-black/20`}>
          <nav className="flex flex-col p-4 gap-2 flex-1 overflow-y-auto">
            {user ? (
              <>
                <div className="px-3 py-2 font-medium text-white border-b border-white/10 mb-2">
                  Hola, {user.full_name}
                </div>
                
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-2 rounded-md hover:bg-black/20 text-sm text-slate-100"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md hover:bg-black/20 text-sm text-slate-100"
                  onClick={() => setIsOpen(false)}
                >
                  Mi perfil
                </Link>

                <div className="pt-4 mt-auto">
                  <Button 
                    onClick={() => { setIsOpen(false); handleLogout(); }} 
                    variant="destructive" 
                    size="sm" 
                    className="w-full bg-red-500/90 hover:bg-red-600 text-white font-medium"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md hover:bg-black/20 text-sm text-slate-100"
                  onClick={() => setIsOpen(false)}
                >
                  Ingresar
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md hover:bg-black/20 text-sm text-slate-100"
                  onClick={() => setIsOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Backdrop para móvil */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 xl:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}

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
