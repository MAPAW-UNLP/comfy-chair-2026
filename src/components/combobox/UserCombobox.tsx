// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para mostrar y permitir seleccionar usuarios autores en un articulo.
// También fue adaptado por el grupo 3 para permitir mostrar usuarios chairs en una conferencia o sesión.
//
// -------------------------------------------------------------------------------------- 

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { type User } from "@/services/userServices";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Lo que espera recibir el componente
type UserComboboxProps = {
  users: User[];
  onValueChange?: (userId: number) => void;
  isChair?: boolean;
  backgroundWhite?: boolean;
};

// Cuerpo del componente
export function UserCombobox({ users, onValueChange, isChair = false, backgroundWhite = false } : UserComboboxProps) {
  
  // Estados internos del componente
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const selectedUser = users.find((u) => u.id === selectedUserId) || null;
  const filteredUsers = users.filter((user) => user.full_name.toLowerCase().includes(query.toLowerCase()));

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal text-sm",
            !selectedUser ? "text-gray-500" : "text-gray-900",
            backgroundWhite && "bg-white hover:bg-gray-50"
          )}
        >
          {selectedUser
            ? `${selectedUser.full_name} `
            : isChair
            ? "Seleccione al menos un chair..."
            : "Agregar autores a la lista..."}
          <ChevronsUpDown className="opacity-25" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-sm p-0">
        <Command>
          <CommandInput
            placeholder="Buscar usuarios..."
            className="h-9"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No hay usuarios...</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.full_name}`}
                  onSelect={() => {
                    setSelectedUserId(null);
                    setOpen(false);
                    if (onValueChange) onValueChange(user.id);
                  }}
                >
                  {user.full_name} ({user.email})
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedUserId === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
