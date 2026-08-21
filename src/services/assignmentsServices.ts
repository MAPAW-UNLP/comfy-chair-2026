// src/services/assignmentsServices.ts
import api from '@/services/api';
import { getAllArticles, type Article } from '@/services/articleServices';

export interface AssignedArticle {
  id: number;
  title: string;
  /** UI lo puede hidratar con estado de revisión */
  reviewed?: boolean;
}

/**
 * Intenta traer artículos asignados del perfil de revisor:
 *   GET /api/reviewers/:reviewerId/
 *
 * El serializer puede exponer distintos nombres para la lista; se
 * normalizan aquí. Si no hay lista, se cae a un fallback inofensivo:
 * usa el listado general de artículos para que la UI no rompa.
 */
export async function fetchAssignedArticles(
  reviewerId: number | string,
  conferenceId?: number | string
): Promise<AssignedArticle[]> {
  try {
    // si se pasa conferenceId lo enviamos como query param (si el backend lo soporta)
    const params = conferenceId ? { conference: conferenceId } : undefined;
    const { data } = await api.get(`/api/reviewers/${reviewerId}/`, { params });

    // Posibles claves de serializers
    const list: any[] =
      data?.assigned_articles ??
      data?.assignedArticles ??
      data?.articles ??
      data?.assigned ??
      [];

    if (Array.isArray(list) && list.length > 0) {
      // Si el backend no filtra por conference y recibimos conferenceId,
      // intentamos filtrar cliente-side si los items contienen info de conferencia.
      let filtered = list;
      if (conferenceId) {
        filtered = list.filter(
          (a: any) =>
            // buscar campos comunes que puedan contener el id de conferencia
            Number(a.conference ?? a.conference_id ?? a.conferenceId) ===
              Number(conferenceId) ||
            // o artículos ya serializados con article.conference
            Number(a.article_conference ?? a.article?.conference) ===
              Number(conferenceId)
        );
        // si el filtro queda vacío, mantenemos la lista original para no romper la UI
        if (filtered.length === 0) filtered = list;
      }

      return filtered.map((a: any) => ({
        id: Number(a.article ?? a.id ?? a.article_id),
        title: a.title ?? a.titulo ?? 'Sin título',
      }));
    }
  } catch {
    // ignoramos y seguimos al fallback
  }

  // Fallback: no toca el back; se usa el listado general
  const arts: Article[] = await getAllArticles();
  return arts.map((a) => ({ id: a.id, title: a.title }));
}

/**
 * Variante estricta: intenta traer los artículos asignados, pero si ocurre
 * cualquier error o la lista es vacía devuelve array vacío en lugar de
 * caer al fallback que trae todos los artículos.
 */
export async function fetchAssignedArticlesStrict(
  reviewerId: number | string,
  conferenceId?: number | string
): Promise<AssignedArticle[]> {
  try {
    const params = conferenceId ? { conference: conferenceId } : undefined;
    const { data } = await api.get(`/api/reviewers/${reviewerId}/`, { params });

    const list: any[] =
      data?.assigned_articles ??
      data?.assignedArticles ??
      data?.articles ??
      data?.assigned ??
      [];

    if (Array.isArray(list) && list.length > 0) {
      let filtered = list;
      if (conferenceId) {
        filtered = list.filter(
          (a: any) =>
            Number(a.conference ?? a.conference_id ?? a.conferenceId) ===
              Number(conferenceId) ||
            Number(a.article_conference ?? a.article?.conference) ===
              Number(conferenceId)
        );
        if (filtered.length === 0) filtered = list;
      }

      return filtered.map((a: any) => ({
        id: Number(a.id ?? a.article ?? a.article_id),
        title: a.title ?? a.titulo ?? 'Sin título',
      }));
    }
    return [];
  } catch {
    return [];
  }
}

/** Alias con el mismo contrato; útil si tu UI espera “Flat” */
export async function fetchAssignedArticlesFlat(
  reviewerId: number,
  conferenceId?: number
): Promise<AssignedArticle[]> {
  return fetchAssignedArticles(reviewerId, conferenceId);
}
