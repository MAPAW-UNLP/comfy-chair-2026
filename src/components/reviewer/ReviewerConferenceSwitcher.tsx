// src/components/reviewer/ReviewerConferenceSwitcher.tsx
import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useRole } from "@/contexts/RoleContext";
import {
  getBackendErrorMessage,
  getMyReviewerConferences,
} from "@/services/reviewerServices";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LOAD_ERROR = "No se pudieron cargar tus conferencias.";

interface Props {
  className?: string;
}

/**
 * Selector de la conferencia activa del revisor. Lista las conferencias donde
 * el usuario es revisor (invitación aceptada o asignación) y fija la elegida en
 * el RoleContext, que se persiste en localStorage. No autoselecciona nada.
 */
export default function ReviewerConferenceSwitcher({ className }: Props) {
  const { selectedRole, setSelectedRole } = useRole();

  const {
    data: conferences,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["reviewer", "conferences"],
    queryFn: getMyReviewerConferences,
  });

  useEffect(() => {
    if (isError) toast.error(getBackendErrorMessage(error) ?? LOAD_ERROR);
  }, [isError, error]);

  // La conferencia activa solo cuenta si el rol elegido es de revisor y la
  // conferencia sigue en la lista; si no, se muestra el placeholder.
  const isReviewerRole = String(selectedRole?.role ?? "")
    .toLowerCase()
    .trim()
    .startsWith("rev");
  const activeId = isReviewerRole ? selectedRole?.conferenceId : undefined;
  const value =
    activeId != null && conferences?.some((c) => c.id === activeId)
      ? String(activeId)
      : "";

  const handleChange = (id: string) => {
    const conf = conferences?.find((c) => String(c.id) === id);
    if (!conf) return;
    setSelectedRole({
      role: "revisor",
      conferenceId: conf.id,
      conferenceName: conf.title,
    });
  };

  let control: ReactNode;

  if (isError) {
    control = (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-rose-700">{LOAD_ERROR}</span>
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          {isFetching ? "Reintentando…" : "Reintentar"}
        </Button>
      </div>
    );
  } else if (!isLoading && conferences && conferences.length === 0) {
    control = (
      <span className="text-sm text-slate-500">
        Todavía no sos revisor de ninguna conferencia.
      </span>
    );
  } else {
    control = (
      <Select value={value} onValueChange={handleChange} disabled={isLoading}>
        <SelectTrigger
          aria-label="Conferencia activa"
          className="w-full bg-white sm:w-72"
        >
          <SelectValue
            placeholder={isLoading ? "Cargando…" : "Elegí una conferencia"}
          />
        </SelectTrigger>
        <SelectContent>
          {(conferences ?? []).map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}
    >
      <span className="text-sm font-medium text-slate-600">Conferencia</span>
      {control}
    </div>
  );
}
