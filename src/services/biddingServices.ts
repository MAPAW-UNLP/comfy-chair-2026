// src/services/biddingService.ts
import api from '@/services/api';

export type Interes = 'Interesado' | 'Quizás' | 'No Interesado' | 'No_select';

export interface BiddingPreference {
  id: number;
  reviewer: number;
  article: number;
  choice: Interes; // siempre uno válido
}

// --- normalización: backend -> frontend ---
const norm = (x: any): Interes => {
  const v = (x ?? '').toString().toLowerCase();
  if (v.includes('quiz')) return 'Quizás';
  if (v === 'no_select' || v.includes('no_select')) return 'No_select';
  if (v.includes('no')) return 'No Interesado';
  if (v.includes('interes')) return 'Interesado';
  return 'No_select';
};

// --- utils ---
function dedupeByArticle(rows: any[]): BiddingPreference[] {
  // conserva el registro con mayor id por artículo
  const byArticle = new Map<number, any>();
  for (const r of rows ?? []) {
    const prev = byArticle.get(r.article);
    if (!prev || r.id > prev.id) byArticle.set(r.article, r);
  }
  return [...byArticle.values()].map((b: any) => ({ ...b, choice: norm(b.choice) }));
}

// --- reads ---
export async function getBidsByReviewer(reviewerId: number): Promise<BiddingPreference[]> {
  const { data } = await api.get('/api/bids/', { params: { reviewerId } }); // DRF: trailing slash
  return dedupeByArticle(data ?? []);
}

// --- writes (primitivos) ---
export async function upsertBid(p: { reviewer: number; article: number; value: Interes }) {
  const payload = { reviewer: p.reviewer, article: p.article, choice: p.value };
  const { data } = await api.post('/api/bidding/', payload); // POST crea o tu view hace upsert
  return { ...data, choice: norm(data.choice) } as BiddingPreference;
}

export async function updateBid(id: number, value: Interes) {
  const { data } = await api.put(`/api/bidding/${id}/`, { choice: value });
  return { ...data, choice: norm(data.choice) } as BiddingPreference;
}

/**
 * Guardado seguro (PUT si existe / POST si no).
 * Permite también "deseleccionar" usando 'No_select'.
 * Devuelve el bid vigente normalizado.
 */
export async function saveBid(params: {
  reviewer: number;
  article: number;
  value: Interes; // incluye 'No_select'
}): Promise<BiddingPreference> {
  const current = await getBidsByReviewer(params.reviewer);
  const existing = current.find((b) => b.article === params.article);
  if (existing) {
    return updateBid(existing.id, params.value);
  }
  return upsertBid(params);
}

/** Helper opcional: deseleccionar explícitamente un artículo */
export async function clearBid(reviewer: number, article: number) {
  return saveBid({ reviewer, article, value: 'No_select' });
}
