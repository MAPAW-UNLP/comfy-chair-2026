"use client"

import { Route as ReviewDetailRoute } from "@/routes/_auth/review/chair/$id"
import { useEffect, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  getReviewedArticles,
  type ReviewedArticle,
} from "@/services/reviewedArticlesServices"

export const ReviewedArticlesList = () => {
  const [articles, setArticles] = useState<ReviewedArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const sessionId = localStorage.getItem("selectedSession")

        if (!sessionId) {
          setArticles([])
          return
        }

        const data = await getReviewedArticles(sessionId)
        setArticles(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="p-10 text-center text-lg font-semibold">
        Cargando artículos revisados...
      </div>
    )
  }

  return (
    <div className="mx-auto">
      <div className="text-white py-4 px-6 text-center bg-gray-700 -t-lg"
        style={{ backgroundColor: "#555353ff" }}>
        <h2 className="text-xl font-semibold">Artículos con revisiones</h2>
      </div>

      {articles.length === 0 ? (
        <p className="text-center text-gray-600 mt-4">
          No hay artículos revisados para esta sesión.
        </p>
      ) : (
        <div className="divide-y divide-gray-300 border border-gray-300 rounded-b-lg">
          {articles.map((a) => (
            <Link
              key={a.id}
              to={ReviewDetailRoute.to}
              params={{ id: String(a.id) }}
              className="flex items-center justify-between px-6 py-5 hover:bg-gray-100 transition cursor-pointer gap-x-4"
            >
              <div className="flex-1 text-center">
                <p className="text-base text-gray-900 leading-tight">{a.title}</p>
              </div>

              {/* BOTÓN */}
              <div className="flex flex-col items-center justify-center 
                px-2 py-1 rounded-lg bg-gray-700 text-white 
                font-semibold hover:bg-gray-800 transition"
                style={{ backgroundColor: "#70b144ff" }}>
                <div>Ver</div>
                <div>revisiones</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
