import { axiosInstance as api } from './api';

interface ArticleResult {
  id: number;
  title: string;
  avg_score: number | null;
  status: 'accepted' | 'rejected';
}

export const executeCutoffSelection = async (
  sessionId: number,
  percentage: number
) => {
  const response = await api.post(`/api/selection/cut-off/${sessionId}/`, {
    percentage: percentage,
  });
  return response.data;
};

export const executeScoreThresholdSelection = async (
  sessionId: number,
  cutoffScore: number
) => {
  const response = await api.post(
    `/api/selection/score-threshold/${sessionId}/`,
    {
      cutoff_score: cutoffScore,
    }
  );
  return response.data;
};

export const getSessionById = async (id: number) => {
  const response = await api.get(`/api/session/${id}/`);
  return response.data;
};

export const getArticlesBySessionAndStatus = async (
  // Lista de artículos de una sesión filtrados por su estado (accepted o rejected)
  sessionId: number,
  status: 'accepted' | 'rejected'
): Promise<ArticleResult[]> => {
  // Si falla el error se propaga al componente que llama
  const response = await api.get(
    `/api/selection/session/${sessionId}/articles/`, // Mapea a ReviewedArticlesAPI
    {
      params: { status: status }, // Esto genera ?status=accepted o ?status=rejected
    }
  );
  return response.data;
};

// Selección definitiva de una sesión
export const lockSelection = async (
  sessionId: number,
  typeSelection: 'ScoreThresholdSelection' | 'CutoffSelection'
) => {
  const response = await api.post(
    `/api/session/${sessionId}/lock-selection/`,
    {
      type_selection: typeSelection,
    }
  );
  return response.data;
};