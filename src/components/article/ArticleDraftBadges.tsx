// --------------------------------------------------------------------------------------
//
// Grupo 2 - Badges y banners que se muestran en un artículo en borrador:
// estado ("Borrador"), completitud ("Faltan N campos" / "Listo para subir") y deadline.
//
// --------------------------------------------------------------------------------------

import { useState } from "react";
import { AlarmClockIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { completenessLabels, getDeadlineInfo, type CompletenessField } from "@/lib/articleDraft";

const pillBase = "flex-1 flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm";

// Badge de estado borrador (o "Sin guardar" si todavía no se guardó nunca)
export function DraftStatusBadge({ label = "Borrador", className }: { label?: string; className?: string }) {
  return (
    <span className={cn(pillBase, "border-dashed border-amber-400 bg-amber-100 text-amber-900", className)}>
      {label}
    </span>
  );
}

// Badge de completitud: cuántos campos faltan para poder subir.
// Al tocarlo (o pasar el mouse) muestra cuáles son.
export function CompletenessBadge({ missing, className }: { missing: CompletenessField[]; className?: string }) {
  const [open, setOpen] = useState<boolean>(false);

  if (missing.length === 0) {
    return (
      <span className={cn(pillBase, "border-green-300 bg-green-50 text-green-800", className)}>
        <CheckIcon className="size-4" /> Listo para subir
      </span>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Hover solo con mouse: en pantallas táctiles el toque ya abre/cierra el popover
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          className={cn(pillBase, "cursor-pointer border-orange-300 bg-orange-50 text-orange-800", className)}
        >
          {missing.length === 1 ? "Falta 1 para subir" : `Faltan ${missing.length} para subir`}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-64 text-sm">
        <p className="font-semibold">Para subir, completá:</p>
        <ul className="list-disc pl-5">
          {missing.map((field) => <li key={field}>{completenessLabels[field]}</li>)}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

// Banner con el deadline de la sesión: normal, "vence pronto" o vencido
export function DeadlineBanner({ deadline, className }: { deadline?: string | null; className?: string }) {
  const info = getDeadlineInfo(deadline);
  if (info.state === "none") return null;

  if (info.state === "expired") {
    return (
      <div className={cn("rounded-md border border-zinc-300 bg-zinc-200 px-3 py-2 text-sm text-zinc-700", className)}>
        Deadline vencido: {info.label}
      </div>
    );
  }
  if (info.state === "soon") {
    return (
      <div className={cn("flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700", className)}>
        <AlarmClockIcon className="size-4" /> Deadline: {info.label} · vence pronto
      </div>
    );
  }
  return (
    <div className={cn("rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-900", className)}>
      Deadline: {info.label}
    </div>
  );
}
