import type { ArticleHistoryItem as ArticleHistoryType } from "@/services/articleServices";
import { ItemGroup, ItemSeparator } from "@/components/ui/item";
import { ArticleLog } from "./ArticleLog";

interface ArticleHistoryProps {
  history: ArticleHistoryType[];
  articleTitle?: string;
}

export function ArticleHistory({ history, articleTitle }: ArticleHistoryProps) {

  return (
    <section className="mx-auto w-full max-w-md px-4 py-6 md:max-w-3xl lg:max-w-4xl">
      {/* Encabezado */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Historial del Artículo
        </h1>
        {articleTitle && (
          <p className="text-sm font-medium text-slate-600 sm:text-base">
            {articleTitle}
          </p>
        )}
      </div>

      {/* Línea Separadora */}
      <ItemSeparator className="my-4 bg-slate-300" />
      
      {/* Lista de Registros */}
      {history && history.length > 0 ? (
        <ItemGroup className="gap-3.5">
          <ArticleLog 
              key={0} 
              log={{
                event_type: "draft_created",
                created_at: history[0].created_at,
              }} 
            />
          {history.map((logItem, index) => (
            <ArticleLog 
              key={`${logItem.created_at}-${index}`}
              log={logItem} 
            />
          ))}
        </ItemGroup>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No hay eventos registrados en el historial.
        </p>
      )}
    </section>
  );
}
