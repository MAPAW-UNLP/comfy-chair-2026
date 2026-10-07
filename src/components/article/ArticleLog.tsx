import type { ArticleHistory as ArticleHistoryType, EventTypeChoices } from "@/services/articleServices";
import { Item, ItemContent, ItemHeader, ItemTitle, ItemDescription } from "@/components/ui/item";

// Textos descriptivos para replicar el diseño de la imagen según el evento
const EVENT_CONFIG: Record<EventTypeChoices, { title: string; defaultDescription: string }> = {
  draft_created: {
    title: "Borrador creado",
    defaultDescription: "Se creó un nuevo borrador del artículo.",
  },
  submitted: {
    title: "Artículo enviado a revisión",
    defaultDescription: "Se envió el artículo a revisión.",
  },
  reviewer_assigned: {
    title: "Revisor asignado",
    defaultDescription: "Se ha asignado un revisor para el artículo.",
  },
  review_received: {
    title: "Dictamen recibido",
    defaultDescription: "Se ha recibido un dictamen del artículo.",
  },
  final_verdict: {
    title: "Veredicto final registrado",
    defaultDescription: "Se ha registrado el veredicto final del artículo.",
  },
};

// Formateador de fechas similar al mockup (ej: 20 Ago 2025, 09:30)
function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(".", "");
}

interface ArticleLogProps {
  log: ArticleHistoryType;
}

export function ArticleLog({ log }: ArticleLogProps) {
  const config = EVENT_CONFIG[log.event_type] || {
    title: log.event_type,
    defaultDescription: "Evento de artículo registrado.",
  };

  return (
    <Item variant="muted" className="border border-slate-200/80 bg-[#f1f5f9]/60 p-4 shadow-sm">
      <ItemContent className="gap-2">
        <ItemHeader className="items-start justify-between gap-2">
          <ItemTitle className="text-base font-bold text-slate-900">
            {config.title}
          </ItemTitle>
          <span className="shrink-0 text-xs text-slate-500 sm:text-sm">
            {formatDate(log.created_at)}
          </span>
        </ItemHeader>
        <ItemDescription className="text-sm font-medium text-slate-600">
          {config.defaultDescription}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}