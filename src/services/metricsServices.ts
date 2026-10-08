import { axiosInstance as api } from './api';

export interface MetricsArticle {
  id: number;
  title: string;
  status: string;
  type: string;
}

export interface MetricsReview {
  id: number;
  score: number;
  opinion: string;
}

export interface GeneralMetrics {
  total_users: number;
  total_articles: number;
  total_reviews: number;
  total_bids: number;
  articles: MetricsArticle[];
  reviews: MetricsReview[];
}

export const getGeneralMetrics = async (): Promise<GeneralMetrics> => {
  const response = await api.get<GeneralMetrics>('/user/general-metrics/');
  return response.data;
};