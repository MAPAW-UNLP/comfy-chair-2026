import api from '@/services/api';
import { isAxiosError } from 'axios';

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
//export async function fetchAssignedArticles({ conferenceId }: { conferenceId?: number } = {}) {
  //const q = conferenceId ? `?conference=${encodeURIComponent(String(conferenceId))}` : "";
  //const res = await fetch(`/api/reviewer/assignments/${q}`, {
    //headers: { "Content-Type": "application/json" },
    //credentials: "include",
  //});
  //if (!res.ok) {
    //throw new Error(`Error fetching assignments: ${res.status}`);
  //}
  //return res.json();
//}

//------------------------------------------------------------
// Asignaciones del revisor por conferencia
// Backend: GET /api/reviewer/assignments/?conference_id=&session_id=
//------------------------------------------------------------
export type ReviewStatus = 'pending' | 'draft' | 'published';
 
export interface Period {
  start: string | null; // ISO 8601 UTC
  end: string | null; // ISO 8601 UTC
  is_open: boolean; // lo calcula el backend; el front solo lo muestra
}
 
export interface AssignmentArticle {
  id: number;
  title: string;
  type: string;
  // Otros grupos pueden agregar estados nuevos: no se asume una lista cerrada.
  status: string;
}
 
export interface AssignmentSession {
  id: number;
  title: string;
}
 
export interface AssignmentConference {
  id: number;
  title: string;
}
 
export interface ReviewerAssignment {
  article: AssignmentArticle;
  session: AssignmentSession | null; // null si el artículo no tiene sesión
  conference: AssignmentConference | null;
  review_id: number | null; // null si todavía no hay review
  review_status: ReviewStatus;
  review_period: Period;
}
 
export interface SessionProgress {
  session_id: number;
  title: string;
  total: number;
  published: number;
}
 
export interface AssignmentsStats {
  total: number;
  published: number;
  draft: number;
  pending: number;
  by_session: SessionProgress[];
}
 
export interface AssignmentsResponse {
  results: ReviewerAssignment[];
  stats: AssignmentsStats;
}
 
export interface AssignmentsFilters {
  conferenceId?: number;
  sessionId?: number;
}
 
/**
 * Artículos asignados al revisor logueado, con el estado de su review y
 * estadísticas, en un solo request. El revisor sale del token (no se manda).
 * Los filtros son opcionales; axios no envía los parámetros undefined.
 * Si el backend falla, el error se propaga: este servicio no devuelve datos
 * de reemplazo.
 */
export async function getMyAssignments({
  conferenceId,
  sessionId,
}: AssignmentsFilters = {}): Promise<AssignmentsResponse> {
  const { data } = await api.get<AssignmentsResponse>('/api/reviewer/assignments/', {
    params: { conference_id: conferenceId, session_id: sessionId },
  });
  return data;
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

//------------------------------------------------------------
// GRUPO 1: Invitaciones a revisar (invitación al comité de una conferencia)
// Los errores (400, 403, 404, 409) no se capturan: se propagan a quien llama.
// El 401 lo maneja el interceptor de api.
//------------------------------------------------------------
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type BlindKind = 'single blind' | 'double blind' | 'completo';

export interface Invitation {
  id: number;
  status: InvitationStatus;
  conference: { id: number; title: string };
  invited_by: { id: number; full_name: string } | null;
  sent_at: string;
  expires_at: string | null; // null = no vence
  responded_at: string | null;
  rejection_reason: string; // "" si no se rechazó o se rechazó sin motivo
}

export interface InvitationDetail extends Omit<Invitation, 'conference'> {
  conference: {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    blind_kind: BlindKind;
  };
}

export interface ReviewerConference {
  id: number;
  title: string;
  has_assignments: boolean;
}

/**
 * Invitaciones del usuario logueado, opcionalmente filtradas por estado.
 * Backend: GET /api/reviewer/invitations/?status=
 */
export async function getMyInvitations(status?: InvitationStatus): Promise<Invitation[]> {
  const { data } = await api.get<{ results: Invitation[] }>('/api/reviewer/invitations/', {
    params: status ? { status } : undefined,
  });
  return data.results;
}

/**
 * Detalle de una invitación del usuario logueado.
 * Backend: GET /api/reviewer/invitations/{id}/
 */
export async function getInvitation(id: number): Promise<InvitationDetail> {
  const { data } = await api.get<InvitationDetail>(`/api/reviewer/invitations/${id}/`);
  return data;
}

/**
 * Acepta una invitación. Devuelve la invitación actualizada.
 * Backend: POST /api/reviewer/invitations/{id}/accept/
 */
export async function acceptInvitation(id: number): Promise<InvitationDetail> {
  const { data } = await api.post<InvitationDetail>(`/api/reviewer/invitations/${id}/accept/`);
  return data;
}

/**
 * Rechaza una invitación, con motivo opcional. Devuelve la invitación actualizada.
 * Backend: POST /api/reviewer/invitations/{id}/reject/
 */
export async function rejectInvitation(id: number, reason?: string): Promise<InvitationDetail> {
  const { data } = await api.post<InvitationDetail>(
    `/api/reviewer/invitations/${id}/reject/`,
    reason ? { reason } : {}
  );
  return data;
}

/**
 * Conferencias donde el usuario es revisor (invitación aceptada o con asignaciones).
 * Backend: GET /api/reviewer/conferences/
 */
export async function getMyReviewerConferences(): Promise<ReviewerConference[]> {
  const { data } = await api.get<{ results: ReviewerConference[] }>('/api/reviewer/conferences/');
  return data.results;
}

/** Notificación que corresponde a una invitación (para aceptar/rechazar desde Notificaciones) */
export interface InvitationNotificationLink {
  notification: number;
  invitation: number;
  status: InvitationStatus;
  conference_title: string;
}

/**
 * Qué notificaciones del usuario son de invitaciones y el estado de cada una.
 * Backend: GET /api/reviewer/invitation-notifications/
 */
export async function getMyInvitationNotifications(): Promise<InvitationNotificationLink[]> {
  const { data } = await api.get<{ results: InvitationNotificationLink[] }>(
    '/api/reviewer/invitation-notifications/'
  );
  return data.results;
}

//------------------------------------------------------------
// GRUPO 1: acceso al formulario de revisión
//------------------------------------------------------------
/**
 * Verifica que el usuario logueado tenga una asignación vigente sobre el artículo.
 * Backend: GET /api/reviewer/articles/{articleId}/assignment/
 *  - 200 → puede revisar
 *  - 403 → no está asignado; 404 → el artículo no existe (el error se propaga)
 */
export async function checkReviewAssignment(articleId: number): Promise<void> {
  await api.get(`/api/reviewer/articles/${articleId}/assignment/`);
}

//export async function getMyReviewHistory(
//  reviewerId: number,
//  conferenceId: number
//) {
//  const { data } = await api.get(
//    `/api/reviews/reviewer/`,
//    {7
//      params: {
//        reviewer_id: reviewerId,
//        conference_id: conferenceId,
//      },
//    }
//  );
//
//  return data;
//}

export interface ReviewerReviewHistoryItem {
  id: number;
  article: number;
  reviewer: number;
  opinion: string;
  score: number;
  created_at?: string;
  updated_at?: string;
  is_published?: boolean;
  is_edited?: boolean;
}

export async function getMyReviewHistory(
  reviewerId: number,
  conferenceId: number
): Promise<ReviewerReviewHistoryItem[]> {
  const { data } = await api.get<ReviewerReviewHistoryItem[]>(
    `/api/reviews/reviewer/`,
    {
      params: {
        reviewer_id: reviewerId,
        conference_id: conferenceId,
      },
    }
  );

  return data;
}

export function getBackendErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) {
    return null;
  }

  const data = error.response?.data;

  if (typeof data?.error === "string") {
    return data.error;
  }

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  return null;
}