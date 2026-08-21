// src/services/reviewsForArticleService.ts
import api from "./api"

export interface ReviewItem {
  review_id: number
  score: number
  opinion: string
  reviewer: {
    id: number
    full_name: string
    email: string
  }
}

export interface ArticleReviewsResponse {
  article_title: string
  reviews: ReviewItem[]
}

export async function getReviewsForArticle(
  articleId: number
): Promise<ArticleReviewsResponse> {
  const { data } = await api.get(`/api/chair/articles/${articleId}/reviews/`)

  if (data.message) {
    return {
      article_title: data.article_title,
      reviews: []
    }
  }

  return {
    article_title: data.article_title,
    reviews: data.reviews ?? []
  }
}
