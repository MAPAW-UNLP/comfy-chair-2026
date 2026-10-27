import { createRootRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoleProvider, useRole } from '@/contexts/RoleContext';
import { Armchair, Menu, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { InvitationsNavLabel } from '@/components/reviewer/invitations/InvitationsNavLabel';
import { Button } from '@/components/ui/button'
import { NavConference } from '@/components/conference/NavConference';

// Componente interno que usa el contexto de autenticación
const RootLayoutContent = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const { selectedRole, clearSelectedRole } = useRole();
  const { logout } = useAuth()
  const navigate = useNavigate()
 
  const handleLogout = () => {
      // limpiar la selección de rol al cerrar sesión (grupo4)
      try {
        clearSelectedRole()
      } catch {}
  
      logout()
      navigate({ to: '/login', search: { redirect: undefined, registered: undefined } })
    }

  const roleKey = String(selectedRole?.role ?? "").toLowerCase().trim();

  // Mapa estático fuera del render/efectos para evitar recreaciones e inmutabilidad
  const roleRoutes: Record<string, { to: string; label: React.ReactNode }[]> = {
    revisor: [
      { to: '/reviewer/', label: 'Revisor' },
      { to: '/reviewer/invitations', label: <InvitationsNavLabel /> }, // GRUPO 1
      { to: '/reviewer/bidding', label: 'Bidding' },
      { to: '/reviewer/history', label: 'Historial' },
    ],
    autor: [
      { to: '/article/create', label: 'Articulos' },
    ],
    chair: [
      { to: '/article/select', label: 'Articulos a Asignar' },
      { to: '/review/chair/reviewed', label: 'Articulos Revisados' },
      { to: '/chairs/selection/selection-method', label: 'Seleccionar Corte de Sesión' },
    ],
    admin: [
        { to: '/reviewer/', label: 'Revisor' },
        { to: '/reviewer/invitations', label: <InvitationsNavLabel /> }, // GRUPO 1
        { to: '/users', label: 'Usuarios'},
        { to: '/article/create', label: 'Articulos' },
        { to: '/chairs/select-session', label: 'Chair' },
        { to: '/reviewer/bidding', label: 'Bidding' },
    ],
    users: [
      { to: '/users', label: 'Ver usuarios'}
    ]
  };

  // Calcular la lista final de links con useMemo para prevenir duplicaciones o empujes múltiples
  const links = useMemo(() => {
    // Si no está autenticado
    if (!user) {
      return [
        { to: '/login', label: 'Ingresar' },
        { to: '/register', label: 'Registrarse' },
      ];
    }

    const commonAuthLinks = [
      { to: '/notifications', label: 'Notificaciones' },
      { to: '/conference/view', label: 'Conferencias' },
    ];

    if (user.role === 'admin'){
      const roleSpecific = roleRoutes['admin'];
      return [...commonAuthLinks, ...roleSpecific];
    }

    // Si está autenticado pero todavia no selecionó un rol, mostrar todas las rutas posibles
    if (!roleKey) {
      return [
        ...commonAuthLinks,
      ];
    }

    // Si tiene un rol seleccionado
    const roleSpecific = roleRoutes[roleKey] ?? [];
    return [...commonAuthLinks, ...roleSpecific];
  }, [user, roleKey]);

  // Normalización de rutas para el active state
  const normalize = (p: string) => (p ? p.replace(/\/+$/, '') || '/' : '/');
  const current = normalize(location?.pathname ?? '/');

  function isLogged(){
    if (user){
      return true;
    } else {
      return false;
    }
  }
  return (
    <div className="flex flex-col h-screen">


        {/* Navegación visible en pantallas grandes */}
      {/* Navbar superior */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
        
        <nav className="hidden xl:flex gap-2 items-center">
        {/* Brand Link */}
        <Link
          to={user ? "/dashboard" : "/"}
          className="font-bold text-lg  flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          ComfyChair
          <Armchair />
        </Link>
          {links.map((link) => (
            <Link 
              key={link.to}
              to={link.to}
              className="px-3 py-1 rounded-md hover:bg-gray-400 [&.active]:bg-slate-400 [&.active]:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        

        {/* Botón menú móvil */}
        <button onClick={() => setIsOpen(true)} className="xl:hidden p-1 rounded hover:bg-gray-700 order-0">
          <Menu />
        </button>
        <div className='flex'>

        
        {
          isLogged() && <Button onClick={handleLogout} variant="destructive" size="sm" className="hidden xl:inline self-end mt-2">
                  Cerrar Sesión
                </Button>
        }
         
        <Link
          to={user ? "/dashboard" : "/"}
          className="xl:hidden self-end font-bold text-lg  flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400"

        >
          ComfyChair
          <Armchair />
        </Link>
        </div>  

        {roleKey && (
          <NavConference opciones={roleRoutes[roleKey]} roles={} title={selectedRole?.conferenceName}/>
        )}
      </header>

      {/* Cuerpo principal */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar móvil */}
        <aside className={`fixed z-20 top-0 left-0 h-full bg-slate-900 text-white w-64 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:hidden`}>

          <div className="flex items-center justify-between p-4">
            <span className="font-bold text-lg">Menu</span>
            <button onClick={() => setIsOpen(false)}>
              <X />
            </button>
          </div>

          <nav className="flex flex-col mt-4 gap-2">
            {links.map((link) => {
              const isActive = normalize(link.to) === current;
              const base = 'px-4 mx-2 py-2 rounded-md hover:bg-gray-700';
              const activeCls = isActive ? 'bg-slate-400 text-white' : '';
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
            {
          isLogged() && <Button onClick={handleLogout} variant="destructive" size="sm" className="px-4 mx-2">
                  Cerrar Sesión
                </Button>
        }
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

// Layout principal
const RootLayout = () => {
  return (
    <AuthProvider>
      <RoleProvider>
        <RootLayoutContent />
      </RoleProvider>
    </AuthProvider>
  );
};

// Exportamos la ruta raíz del enrutador, usando este layout como componente principal
export const Route = createRootRoute({ component: RootLayout });
