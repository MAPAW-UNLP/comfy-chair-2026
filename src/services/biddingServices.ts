// src/services/biddingService.ts
import api from '@/services/api';

export type Interes = 'Interesado' | 'Quizás' | 'No Interesado' | 'No_select';

export interface BiddingPreference {
  id: number;
  reviewer: number;
  article: number;
  choice: Interes; // siempre uno válido
}

export interface BidDto {
  id: number;
  reviewer: number;
  article: number;
  choice: string | null;
}

// --- normalización: backend -> frontend ---
const norm = (x: string | null | undefined): Interes => {
  const v = (x ?? '').toLowerCase();
  if (v.includes('quiz')) return 'Quizás';
  if (v === 'no_select' || v.includes('no_select')) return 'No_select';
  if (v.includes('no')) return 'No Interesado';
  if (v.includes('interes')) return 'Interesado';
  return 'No_select';
};

const toPreference = (b: BidDto): BiddingPreference => ({ ...b, choice: norm(b.choice) });

// --- reads ---
export async function getBidsByReviewer(reviewerId: number): Promise<BiddingPreference[]> {
  const { data } = await api.get<BidDto[]>('/api/bids/', { params: { reviewerId } }); // DRF: trailing slash
  return data.map(toPreference);
}

export async function getMyBids(p: { conferenceId?: number; sessionId?: number }): Promise<BiddingPreference[]> {
  const { data } = await api.get<BidDto[]>('/api/bids/', {
    params: { conference_id: p.conferenceId, session_id: p.sessionId },
  });
  return data.map(toPreference);
}

export async function saveBid(p: { article: number; value: Interes }): Promise<BiddingPreference> {
  const { data } = await api.post<BidDto>('/api/bidding/', { article: p.article, choice: p.value });
  return toPreference(data);
}
