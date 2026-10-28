// --------------------------------------------------------------------------------------
//
// Grupo 2 - Badges y banners que se muestran en un artículo en borrador:
// estado ("Borrador") y deadline.
//
// --------------------------------------------------------------------------------------

import { AlarmClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDeadlineInfo } from "@/lib/articleDraft";

const pillBase = "flex-1 flex items-center justify-center gap-1 rounded-md border px-3 py-2 text-sm";

// Badge de estado borrador (o "Sin guardar" si todavía no se guardó nunca)
export function DraftStatusBadge({ label = "Borrador", className }: { label?: string; className?: string }) {
  return (
    <span className={cn(pillBase, "border-dashed border-amber-400 bg-amber-100 text-amber-900", className)}>
      {label}
    </span>
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
