import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { Link } from "@tanstack/react-router";
import { getUserFullData, type ProcessedConference } from "@/services/userServices";

type NavConferenceProps = {
    title: string;
    roles: string[];
    opciones: { to: string; label: React.ReactNode }[];
}
export function NavConference({title, roles, opciones}: NavConferenceProps){
    // Fetch user conferences and roles
  const { data: conferences, isLoading, isError } = useQuery({
    queryKey: ['user-full-data'],
    queryFn: getUserFullData,
  })
    return (
        <div className="flex gap-4 m-4">
            <h3>{title}</h3>
            <DropdownMenu>
                <DropdownMenuTrigger>Cambiar rol</DropdownMenuTrigger>
            {conferences.roles.map((rol) => (
                    <DropdownMenuItem>{rol}</DropdownMenuItem>
                )
            )}
            </DropdownMenu>
            {opciones.map((link) => (
                        <Link 
                          key={link.to}
                          to={link.to}
                          className="px-3 py-1 rounded-md hover:bg-gray-400 [&.active]:bg-slate-400 [&.active]:text-white"
                        >
                          {link.label}
                        </Link>
                      ))}
        </div>
    );
}