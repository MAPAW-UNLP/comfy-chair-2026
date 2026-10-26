// --------------------------------------------------------------------------------------
//
// Grupo 2 - Helpers para borradores de artículos: completitud y estado del deadline.
//
// --------------------------------------------------------------------------------------

import type { Article } from "@/services/articleServices";

// Campos que el back exige para dejar de ser borrador (ver ArticleCompletenessValidator).
// La clave coincide con el nombre del campo en los errores 400 del back.
export type CompletenessField =
  | "title"
  | "abstract"
  | "main_file"
  | "type"
  | "authors_ids"
  | "corresponding_author_id"
  | "source_file";

export const completenessLabels: Record<CompletenessField, string> = {
  title: "Título",
  abstract: "Abstract",
  main_file: "Artículo (archivo PDF)",
  type: "Tipo",
  authors_ids: "Autores",
  corresponding_author_id: "Autor de Notificación",
  source_file: "Fuentes (poster)",
};

export interface CompletenessInput {
  title?: string | null;
  abstract?: string | null;
  hasMainFile: boolean;
  type?: string | null;
  authorsCount: number;
  hasCorrespondingAuthor: boolean;
  hasSources: boolean;
}

export function getMissingFields(input: CompletenessInput): CompletenessField[] {
  const missing: CompletenessField[] = [];
  if (!input.title?.trim()) missing.push("title");
  if (!input.abstract?.trim()) missing.push("abstract");
  if (!input.hasMainFile) missing.push("main_file");
  if (!input.type) missing.push("type");
  if (input.authorsCount === 0) missing.push("authors_ids");
  if (!input.hasCorrespondingAuthor) missing.push("corresponding_author_id");
  if (input.type === "poster" && !input.hasSources) missing.push("source_file");
  return missing;
}

export function getArticleMissingFields(article: Article): CompletenessField[] {
  return getMissingFields({
    title: article.title,
    abstract: article.abstract,
    hasMainFile: Boolean(article.main_file),
    type: article.type,
    authorsCount: article.authors?.length ?? 0,
    hasCorrespondingAuthor: Boolean(article.corresponding_author),
    hasSources: (article.sources?.length ?? 0) > 0,
  });
}

//------------------------------------------------------------
// Deadline de la sesión
//------------------------------------------------------------
export type DeadlineState = "open" | "soon" | "expired" | "none";

export interface DeadlineInfo {
  state: DeadlineState;
  label: string; // ej: "30/11/2026 23:59"
}

// Días antes del deadline a partir de los cuales se avisa "vence pronto"
const SOON_THRESHOLD_DAYS = 3;

// El deadline es una fecha (YYYY-MM-DD): el back permite enviar durante todo ese día.
export function getDeadlineInfo(deadline?: string | null): DeadlineInfo {
  if (!deadline) return { state: "none", label: "" };

  const [year, month, day] = deadline.slice(0, 10).split("-").map(Number);
  const end = new Date(year, month - 1, day, 23, 59, 59);
  if (Number.isNaN(end.getTime())) return { state: "none", label: "" };

  const label = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year} 23:59`;
  const msLeft = end.getTime() - Date.now();

  if (msLeft < 0) return { state: "expired", label };
  if (msLeft < SOON_THRESHOLD_DAYS * 24 * 60 * 60 * 1000) return { state: "soon", label };
  return { state: "open", label };
}
