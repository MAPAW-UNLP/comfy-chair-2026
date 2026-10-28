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
  conferenceId: string;
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

  // Definir la ruta según el rol o la landing de la conferencia
  const getConferenceHomeRoute = () => {
    const role = currentRole.toLowerCase().trim();
    if (role === 'autor') {
      return `/articles/${conferenceId}`;
    }
    if (role === 'revisor') {
      return '/reviewer';
    }
    // Enlace por defecto al dashboard o vista principal de la conferencia
    return `/articles/${conferenceId}`;
  };

  return (
    <div className="bg-black text-white px-6 py-2.5 flex justify-between items-center border-t border-slate-800 text-sm">
      {/* Izquierda: Nombre de la conferencia como enlace */}
      <Link 
        to={getConferenceHomeRoute()} 
        className="font-semibold text-base hover:underline focus:outline-none focus:ring-1 focus:ring-slate-400 rounded px-1 -ml-1 transition-all"
      >
        {title}
      </Link>

      {/* Derecha: Selector de Rol y enlaces */}
      <div className="flex items-center gap-4">
        {/* Selector Dropdown de Rol */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-slate-800 hover:text-white h-8 px-2 flex items-center gap-1.5 font-normal"
            >
              Rol: {formatRoleName(currentRole)} <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-white min-w-[160px]">
            {/* 📱 En Mobile: Opciones dentro del dropdown */}
            <div className="md:hidden">
              {opciones.map((link) => (
                <DropdownMenuItem key={link.to} asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
                  <Link to={link.to} className="w-full block">
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              
              {opciones.length > 0 && <DropdownMenuSeparator className="bg-slate-800" />}
              
              <DropdownMenuLabel className="text-xs text-slate-400 font-normal">
                Cambiar rol
              </DropdownMenuLabel>
            </div>

            {/* Listado de roles para cambiar */}
            {availableRoles.map((role) => {
              const formatted = formatRoleName(role);
              const isCurrent = role.toLowerCase() === currentRole.toLowerCase();
              return (
                <DropdownMenuItem 
                  key={role}
                  onClick={() => onSelectRole(role)}
                  className={`cursor-pointer focus:bg-slate-800 focus:text-white ${isCurrent ? 'bg-slate-800 font-medium' : ''}`}
                >
                  {formatted}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 🖥️ En Desktop: Opciones horizontales afuera del dropdown */}
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
      </div>
    </div>
  );
}