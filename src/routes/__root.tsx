import { createRootRoute, Link, Outlet, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { RoleProvider, useRole } from '@/contexts/RoleContext';

import { Armchair, Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';

// Componente interno que usa el contexto de autenticación
const RootLayoutContent = () => {
  const location = useLocation();
  // Estado para controlar si el menú lateral móvil está abierto o cerrado
  const [isOpen, setIsOpen] = useState(false);
  
  // Obtener el estado de autenticación
  const { user } = useAuth();

  // Obtener rol seleccionado (si existe)
  const { selectedRole } = useRole();

  // Lista de páginas principales de la aplicación (común para todos)
  const commonLinks: { to: string; label: string }[] = [];

  // Links que siempre deben mostrarse cuando el usuario está autenticado
  const commonAuthLinks = [
    { to: '/notifications', label: 'Notificaciones' },
    { to: '/dashboard', label: 'Panel' },
  ];

  // normalizar rol
  const roleKey = String(selectedRole?.role ?? "").toLowerCase().trim();

  // Mapa de rutas por rol (mantiene la cobertura de main + la selección por rol de HEAD)
  const roleRoutes: Record<string, { to: string; label: string }[]> = {
    revisor: [
      { to: '/reviewer/', label: 'Revisor' },
      { to: '/reviewer/bidding', label: 'Bidding' },
      { to: '/reviewer/history', label: 'Historial' },
    ],
    autor: [
      { to: '/article/view', label: 'Articulos' },
    ],
    chair: [
      { to: '/article/select', label: 'Articulos a Asignar' },
      { to: '/review/chair/reviewed', label: 'Articulos Revisados' },
      { to: '/chairs/selection/selection-method', label: 'Seleccionar Corte de Sesión' },
    ],
    admin: [
      { to: '/conference/view', label: 'Conferencias' },
    ]
  };

  // Si no hay rol seleccionado: mostrar lo mismo que main (inicio + accesos), pero sin perder
  // el comportamiento de HEAD (Panel/Notificaciones)
  let authLinks: { to: string; label: string }[] = [];

  if (!user) {
    authLinks = [
      { to: '/login', label: 'Ingresar' },
      { to: '/register', label: 'Registrarse' },
    ];
  } else if (!roleKey) {
    // main tenía un menú "completo" sin depender de rol
    authLinks = [
      { to: '/dashboard', label: 'Inicio' },
      { to: '/reviewer/', label: 'Revisor' },
      { to: '/conference/view', label: 'Conferencias' },
      { to: '/article/view', label: 'Articulos' },
      { to: '/chairs/select-session', label: 'Chair' },
      { to: '/reviewer/bidding', label: 'Bidding' },
      ...commonAuthLinks,
    ];
  } else {
    const roleSpecific = roleRoutes[roleKey] ?? [];
    authLinks = [...roleSpecific, ...commonAuthLinks];
  }

  // Combinar todos los enlaces
  const links = [...commonLinks, ...authLinks];

  // Navegación escritorio
  const pathname =
    typeof window !== 'undefined' && window.location && window.location.pathname
      ? window.location.pathname
      : '/';
  const normalize = (p: string) => (p ? p.replace(/\/+$/, '') || '/' : '/');
  const current = normalize(location?.pathname ?? '/');

  return (
    <div className="flex flex-col h-screen">

      {/* Navbar superior */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">

        {/* Navegación visible solo en pantallas medianas en adelante */}
        <nav className="hidden xl:flex gap-2 order-1 xl:order-1">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="px-3 py-1 rounded-md hover:bg-gray-400 [&.active]:bg-slate-400 [&.active]:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Nombre de la app + ícono, ahora enlaza al landing page */}
        <Link
          to="/"
          className="font-bold text-lg order-2 xl:order-2 ml-auto flex items-center gap-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          ComfyChair
          <Armchair />
        </Link>

        {/* Botón colapsable (solo se muestra en móvil) */}
        <button onClick={() => setIsOpen(true)} className="xl:hidden p-1 rounded hover:bg-gray-700 order-0"> {/*abre el sidebar móvil*/}
          <Menu />
        </button>

      </header>

      {/* Cuerpo principal de la aplicación */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar móvil (se desliza desde la izquierda) */}
        <aside className={`fixed z-20 top-0 left-0 h-full bg-slate-900 text-white w-64 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} xl:hidden`}>

          {/* Encabezado del menú móvil */}
          <div className="flex items-center justify-between p-4">
            <span className="font-bold text-lg">Menu</span>
            
            {/* Botón para cerrar el menú */}
            <button onClick={() => setIsOpen(false)}>
              <X />
            </button>
          </div>

          {/* Lista de enlaces de navegación (en columna) */}
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

        {/* Área principal donde se renderizan las páginas hijas */}
        <main className="flex-1 overflow-auto">
          <Outlet /> {/* Outlet es el "espacio" donde TanStack Router inyecta la página actual */}
        </main>

      </div>

      {/* Herramientas de desarrollo del router (solo útiles en dev) */}
      <TanStackRouterDevtools />

      {/* Componente global de notificaciones tipo toast */}
      <Toaster position='top-right' />

    </div>
  );
};

// Definición del componente principal (layout raíz) con los providers
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