import api from '@/services/api';

//------------------------------------------------------------
// GRUPO 1: Requerido para cargas las reviws por artículo
//------------------------------------------------------------
export interface ReviewsByArticleId {
  articleId: number;
  count: number;
  reviews: Review[];
}

export interface Review {
  id: number;
  article: number;
  reviewer: number;
  opinion: string;
  score: number;
  is_published?: boolean;
  is_edited?: boolean;
}

export interface ReviewerInfo {
  id: number
  full_name: string
  email?: string
  interest?: 'interesado' | 'quizas' | 'no_interesado' | 'ninguno'
  assigned?: boolean
  assigned_count?: number
}

export interface ReviewVersion {
  id: number;
  version_number?: number;
  created_at?: string | null;
  score?: number | null;
  opinion?: string | null;
}

export type CreateReviewPayload = {
  article: number;
  reviewer: number;
  opinion: string;
  score: number;
};

export type UpdateReviewPayload = {
  opinion?: string;
  score?: number;
};

export type Type = "regular" | "poster";

// Helper para traer assignments / artículos asignados al revisor,
// opcionalmente filtrando por conference id.
export async function fetchAssignedArticles({ conferenceId }: { conferenceId?: number } = {}) {
  const q = conferenceId ? `?conference=${encodeURIComponent(String(conferenceId))}` : "";
  const res = await fetch(`/api/reviewer/assignments/${q}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Error fetching assignments: ${res.status}`);
  }
  return res.json();
}

function isFilledReview(r: Partial<Review> | null | undefined) {
  return !!(r && typeof r.score === 'number' && String(r.opinion ?? '').trim());
}

/**
 * Trae la review propia del revisor para un artículo.
 * Backend: GET /api/reviews/{articleId}/{reviewerId}/
 *  - 200 → objeto Review
 *  - 404 → no existe (null)
 *  - 401/otros → null (se loguea error para depurar)
 */
export async function getOwnReviewByArticle(
  articleId: number,
  reviewerId: number
): Promise<Review | null> {
  try {
    const res = await api.get(`/api/reviews/${articleId}/${reviewerId}/`, {
      validateStatus: () => true, // manejamos manualmente
    });
    if (res.status === 200) return res.data as Review;
    if (res.status === 404) return null;
    console.error('getOwnReviewByArticle unexpected status', res.status, { articleId, reviewerId });
    return null;
  } catch (e) {
    console.error('getOwnReviewByArticle error', e);
    return null;
  }
}

/**
 * ¿El revisor ya dejó una review (aunque no esté publicada)?
 */
export async function hasOwnReview(articleId: number, reviewerId: number): Promise<boolean> {
  const r = await getOwnReviewByArticle(articleId, reviewerId);
  return isFilledReview(r);
}

/**
 * Crea una review (del revisor actual para un artículo)
 * Backend: POST /api/reviews/
 */
export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  const { data } = await api.post(`/api/reviews/`, payload);
  return data as Review;
}

/**
 * Actualiza una review existente en estado BORRADOR
 * Backend: PUT /api/reviews/{id}/updateDraft/
 */
export async function updateReview(id: number, payload: UpdateReviewPayload): Promise<Review> {
  const { data } = await api.put(`/api/reviews/${id}/updateDraft/`, payload);
  return data as Review;
}

/**
 * Actualiza una review ya PUBLICADA (crea nueva versión)
 * Backend: PUT /api/reviews/{id}/updatePublished/
 */
export async function updatePublishedReview(
  id: number,
  payload: UpdateReviewPayload
): Promise<Review> {
  const { data } = await api.put(`/api/reviews/${id}/updatePublished/`, payload);
  return data as Review;
}

/**
 * Publica una review
 * Backend: PUT /api/reviews/{id}/publish/
 */
export async function publishReview(id: number): Promise<Review> {
  const { data } = await api.put(`/api/reviews/${id}/publish/`);
  return data as Review;
}

/**
 * ✅ Criterio unificado “Completada”:
 * Al menos 1 review publicada del artículo
 * Backend: GET /api/article/{articleId}/reviews/ → { count: number }
 */
export async function hasPublishedReview(articleId: number): Promise<boolean> {
  try {
    const { data } = await api.get(`/api/article/${articleId}/reviews/`, {
      validateStatus: () => true,
    });
    return Number(data?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * (Opcional) Cantidad de reviews publicadas del artículo
 */
export async function getPublishedReviewsCount(articleId: number): Promise<number> {
  try {
    const { data } = await api.get(`/api/article/${articleId}/reviews/`, {
      validateStatus: () => true,
    });
    return Number(data?.count ?? 0);
  } catch {
    return 0;
  }
}

export const getReviewersByArticle = async (
  articuloId: number
): Promise<ReviewerInfo[]> => {
  const response = await api.get(`/api/chair/articles/${articuloId}/available-reviewers/`);
  return response.data;
};

export const assignReviewerToArticle = async (reviewerId: number, articleId: number) => {
  const response = await api.post('/api/chair/new/', {
    reviewer: reviewerId,
    article: articleId,
    reviewed: false,
  })
  return response.data
}

export const removeReviewerFromArticle = async (reviewerId: number, articleId: number) => {
  const response = await api.delete(`/api/chair/${reviewerId}/${articleId}/delete/`)
  return response.data
}

export async function fetchReviewVersions(reviewId: number | string): Promise<ReviewVersion[]> {
  try {
    const res = await api.get(`/api/reviews/${reviewId}/versions/`);
    return res?.data ?? [];
  } catch (err) {
    console.error("Error fetching review versions:", err);
    return [];
  }
}
//------------------------------------------------------------
// GRUPO 1: Obtener todas las reviews de un artículo
//------------------------------------------------------------
export const getReviewsByArticle = async (articleId: number): Promise<ReviewsByArticleId> => {
  try {
    const response = await api.get(`/api/article/${articleId}/reviews`, {
      validateStatus: () => true,
    });
    
    // Si el estado es 200 y la data es un objeto válido (el tipo ReviewsByArticleId)
    if (response.status === 200 && response.data) {
      // Devolvemos el objeto completo
      return response.data as ReviewsByArticleId; 
    }
    
    // Si falla o no hay data, devolvemos un objeto ReviewsByArticleId vacío
    return { articleId, count: 0, reviews: [] };
    
  } catch (e) {
    console.error('getReviewsByArticle error', e);
    return { articleId, count: 0, reviews: [] };
  }
};
