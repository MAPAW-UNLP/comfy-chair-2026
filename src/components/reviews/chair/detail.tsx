"use client"

import { useEffect, useState } from "react"
import {
  getReviewsForArticle,
  type ArticleReviewsResponse,
} from "@/services/reviewsForArticleServices"

export const ArticleReviewsDetail = ({ articleId }: { articleId: number }) => {
  const [data, setData] = useState<ArticleReviewsResponse>({
    article_title: "",
    reviews: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getReviewsForArticle(articleId)
        setData(res)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [articleId])

  if (loading) {
    return (
      <div className="p-10 text-center text-lg font-semibold">
        Cargando revisiones...
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* 🔹 TÍTULO A TODO ANCHO, SIN p-6 */}
      <div
        className="text-white py-4 px-6 flex-shrink-0 text-center w-full"
        style={{ backgroundColor: "#555353ff" }}
      >
        <h2 className="text-xl font-semibold">
          {data.article_title || "Artículo sin título"}
        </h2>
      </div>

      {/* 🔹 CONTENEDOR SOLO PARA LAS REVIEWS (p-6) */}
      <div className="p-6 max-w-3xl mx-auto">
        {data.reviews.length === 0 ? (
          <p className="text-center text-gray-600 mt-6">
            Este artículo aún no tiene revisiones publicadas.
          </p>
        ) : (
          <div className="space-y-4 mt-6">
            {data.reviews.map((rev) => (
              <div
                key={rev.review_id}
                className="border p-4 rounded-lg shadow bg-white"
              >
                <div className="flex justify-between mb-2">
                  <strong>{rev.reviewer.full_name}</strong>
                  <span className="font-bold">{rev.score}/3</span>
                </div>

                <p className="text-sm text-gray-800 italic">
                  {rev.reviewer.email}
                </p>
                <p className="mt-3">{rev.opinion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
