// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para mostrar y permitir seleccionar conferencias en un articulo.
//
// -------------------------------------------------------------------------------------- 

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { type Conference } from '@/components/conference/ConferenceApp';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Lo que espera recibir el componente
type ConferenceComboboxProps = {
    conferences: Conference[];
    onValueChange?: (conferenceId: number | null) => void;
    value?: number | null;
    disabled?: boolean;  
};

// Cuerpo del componente
export function ConferenceCombobox({ conferences, onValueChange, value, disabled } : ConferenceComboboxProps) {
    
    // Estados internos del componente
    const [open, setOpen] = useState(false);
    const [selectedConferenceId, setSelectedConferenceId] = useState<number | null>(null);
    const [query, setQuery] = useState("");
    const selectedConference = conferences.find((c) => c.id === selectedConferenceId) || null;
    const filteredConferences = conferences.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()));

    //------------------------------------------------------------
    // Efecto para seleccionar la conferencia actual (modo edición del form de articulos)
    //------------------------------------------------------------
    useEffect(() => {
      if (typeof value !== 'undefined') {
        setSelectedConferenceId(value ?? null);
      }
    }, [value]);

    //------------------------------------------------------------
    // Renderizado del componente
    //------------------------------------------------------------
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button disabled={disabled} variant="outline" role="combobox" aria-expanded={open} className={cn("justify-between bg-white font-normal", !selectedConference ? "text-gray-500" : "text-gray-900")}>
                    {selectedConference ? `${selectedConference.title}` : "Seleccione una conferencia..."}
                    <ChevronsUpDown className="opacity-25" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto max-w-sm p-0">
                <Command>
                    <CommandInput placeholder="Buscar conferencias..." className="h-9" value={query} onValueChange={setQuery} />
                    <CommandList>
                        <CommandEmpty>No hay conferencias...</CommandEmpty>
                        <CommandGroup>
                            {filteredConferences.map((c) => (
                                <CommandItem key={c.id} value={`${c.title}`}
                                onSelect={() => {
                                    const idNum = Number(c.id);
                                    setSelectedConferenceId(idNum);
                                    setOpen(false);
                                    if (onValueChange) onValueChange(idNum);
                                }}
                                >
                                    {c.title}
                                    <Check className={cn("ml-auto", selectedConferenceId === c.id ? "opacity-100" : "opacity-0")}/>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}