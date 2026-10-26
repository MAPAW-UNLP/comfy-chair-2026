// --------------------------------------------------------------------------------------
//
// Grupo 1 - Hook para leer los conteos de revisiones completadas de los artículos de un listado.
// Hace una única consulta agregada (sin contenido de reviews) y distingue carga, error y éxito.
//
// --------------------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { getReviewedArticles } from "@/services/reviewedArticlesServices";

export type ReviewCountState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; count: number };

type CountsState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; counts: Map<number, number> };

// `enabled` evita consultar antes de que el listado de artículos esté disponible
export function useFetchReviewCounts(conferenceId: number, enabled: boolean) {
  const [state, setState] = useState<CountsState>({ status: "loading" });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function fetch() {
      try {
        const data: unknown = await getReviewedArticles();
        if (!Array.isArray(data)) throw new Error("Respuesta inválida");

        // Solo se conservan id y review_count; title se descarta
        const counts = new Map<number, number>();
        for (const item of data) {
          if (
            typeof item?.id !== "number" ||
            typeof item?.review_count !== "number" ||
            !Number.isFinite(item.review_count)
          ) {
            throw new Error("Respuesta inválida");
          }
          counts.set(item.id, item.review_count);
        }

        if (!cancelled) setState({ status: "success", counts });
      } catch {
        console.error("Error al obtener el conteo de revisiones");
        if (!cancelled) setState({ status: "error" });
      }
    }

    setState({ status: "loading" });
    fetch();
    return () => { cancelled = true; };
  }, [conferenceId, enabled]);

  // Estado por artículo: ID ausente en una respuesta exitosa equivale a 0
  const getReviewCount = (articleId: number): ReviewCountState =>
    state.status === "success"
      ? { status: "success", count: state.counts.get(articleId) ?? 0 }
      : { status: state.status };

  return { getReviewCount };
}
