import api from "./api"

export interface ReviewedArticle {
  id: number
  title: string
  review_count: number
}

export const getReviewedArticles = async (sessionId?: string): Promise<ReviewedArticle[]> => {
  const response = await api.get("/api/chair/articles-reviewed/", {
    params: sessionId ? { session_id: sessionId } : {}
  });
  return response.data;
};
