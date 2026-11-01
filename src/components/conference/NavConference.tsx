// src/components/conference/NavConference.tsx

import { Link } from '@tanstack/react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

type NavConferenceProps = {
  title: string;
  conferenceId: number;
  currentRole: string;
  availableRoles: string[];
  opciones: { to: string; label: React.ReactNode }[];
  onSelectRole: (role: string) => void;
};

export function NavConference({
  title,
  conferenceId,
  currentRole,
  availableRoles,
  opciones,
  onSelectRole
}: NavConferenceProps) {
  const formatRoleName = (role: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const getConferenceHomeRoute = () => {
    const role = currentRole.toLowerCase().trim();
    if (role === 'autor') {
      return `/articles/${conferenceId}`;
    }
    if (role === 'revisor') {
      return '/reviewer';
    }
    return `/articles/${conferenceId}`;
  };

  // Filtrar los otros roles disponibles para cambiar
  const otherRoles = availableRoles.filter(
    (r) => r.toLowerCase().trim() !== currentRole.toLowerCase().trim()
  );

  return (
    <div className="bg-slate-950 text-white px-4 md:px-6 py-2 flex justify-between items-center border-t border-slate-800 text-sm">
      {/* Izquierda: Nombre de la conferencia */}
      <Link
        to={getConferenceHomeRoute()}
        className="font-semibold text-sm md:text-base hover:underline focus:outline-none focus:ring-1 focus:ring-slate-400 rounded px-1 -ml-1 transition-all"
      >
        {title}
      </Link>

      {/* Derecha: Opciones y Selector de Rol */}
      <div className="flex items-center gap-4">
        {/* En Desktop: Links horizontales visibles */}
        <div className="hidden md:flex items-center gap-2">
          {opciones.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-3 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors [&.active]:bg-slate-800 [&.active]:text-white font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Dropdown de Rol (Visible tanto en Desktop como Mobile) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-slate-800 hover:text-white h-8 px-2 flex items-center gap-1.5 font-normal text-xs md:text-sm"
            >
              Rol: {formatRoleName(currentRole)} <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white min-w-[160px] z-50">
            {/* Opciones propias del rol (ej: Mis artículos) */}
            {opciones.map((link) => (
              <DropdownMenuItem key={link.to} asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                <Link to={link.to} className="w-full block px-2 py-1.5 text-sm">
                  {link.label}
                </Link>
              </DropdownMenuItem>
            ))}

            {opciones.length > 0 && <DropdownMenuSeparator className="bg-slate-800" />}

            {/* Sección Cambiar rol */}
            {otherRoles.length > 0 && (
              <>
                <DropdownMenuLabel className="text-xs text-slate-400 font-normal px-2 py-1">
                  Cambiar rol
                </DropdownMenuLabel>

                {otherRoles.map((role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => onSelectRole(role)}
                    className="cursor-pointer focus:bg-slate-800 focus:text-white px-2 py-1.5 text-sm"
                  >
                    {formatRoleName(role)}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}