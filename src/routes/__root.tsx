import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoleProvider, useRole } from '@/contexts/RoleContext';

import { Armchair, Menu, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { Toaster } from '@/components/ui/sonner';

// Componente interno que usa el contexto de autenticación
const RootLayoutContent = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const { user } = useAuth();
  const { selectedRole } = useRole();

  const roleKey = String(selectedRole?.role ?? "").toLowerCase().trim();

  // Mapa estático fuera del render/efectos para evitar recreaciones e inmutabilidad
  const roleRoutes: Record<string, { to: string; label: string }[]> = {
    revisor: [
      { to: '/reviewer/', label: 'Revisor' },
      { to: '/reviewer/bidding', label: 'Bidding' },
      { to: '/reviewer/history', label: 'Historial' },
    ],
    autor: [
      { to: '/dashboard', label: 'Inicio' },
      { to: '/article/view', label: 'Articulos' },
    ],
    chair: [
      { to: '/article/select', label: 'Articulos a Asignar' },
      { to: '/review/chair/reviewed', label: 'Articulos Revisados' },
      { to: '/chairs/selection/selection-method', label: 'Seleccionar Corte de Sesión' },
    ],
    admin: [
      { to: '/conference/view', label: 'Conferencias' },
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
      
      { to: '/notifications', label: 'Notificaciones' }
    ];

    // Si está autenticado pero todavia no selecionó un rol, mostrar todas las rutas posibles
    if (!roleKey) {
      return [
        { to: '/dashboard', label: 'Inicio' },
        { to: '/reviewer/', label: 'Revisor' },
        { to: '/users', label: 'Usuarios'},
        { to: '/conference/view', label: 'Conferencias' },
        { to: '/article/select', label: 'Articulos' },
        { to: '/chairs/select-session', label: 'Chair' },
        { to: '/reviewer/bidding', label: 'Bidding' },
        ...commonAuthLinks,
      ];
    }

    // Si tiene un rol seleccionado
    const roleSpecific = roleRoutes[roleKey] ?? [];
    return [...roleSpecific, ...commonAuthLinks];
  }, [user, roleKey]);

  // Normalización de rutas para el active state
  const normalize = (p: string) => (p ? p.replace(/\/+$/, '') || '/' : '/');
  const current = normalize(location?.pathname ?? '/');

  return (
    <div className="flex flex-col h-screen">

      {/* Navbar superior */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        
        {/* Navegación visible en pantallas grandes */}
        <nav className="hidden xl:flex gap-2 order-1 xl:order-1">
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

        {/* Brand Link */}
        <Link
          to="/"
          className="font-bold text-lg order-2 xl:order-2 ml-auto flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          ComfyChair
          <Armchair />
        </Link>

        {/* Botón menú móvil */}
        <button onClick={() => setIsOpen(true)} className="xl:hidden p-1 rounded hover:bg-gray-700 order-0">
          <Menu />
        </button>

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

export const Route = createRootRoute({ component: RootLayout });