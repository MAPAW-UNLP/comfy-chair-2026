"use client"

import { useEffect, useState } from "react"
import { useParams } from "@tanstack/react-router"
import { ReviewerItem } from "./ReviewerItem"
import {
  getReviewersByArticle,
  assignReviewerToArticle,
  removeReviewerFromArticle,
  type ReviewerInfo,
} from "@/services/reviewerServices"
import { getArticleById, type Article } from "@/services/articleServices"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

type CompleteReviewerInfo = Omit<ReviewerInfo, "email" | "interest"> & {
  email: string
  interest: "interesado" | "quizas" | "no_interesado" | "ninguno"
  assigned?: boolean
}

export const ReviewerApp = () => {
  const { id } = useParams({ from: "/_auth/article/assign/$id" })

  const [reviewers, setReviewers] = useState<CompleteReviewerInfo[]>([])
  const [article, setArticle] = useState<Article | null>(null)
  const [assignedCount, setAssignedCount] = useState<number>(0)
  const [loadingReviewers, setLoadingReviewers] = useState(true)
  const [loadingArticle, setLoadingArticle] = useState(true)
  const [showMaxDialog, setShowMaxDialog] = useState(false)

  const maxAssigned = 3

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(reviewers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const visibleReviewers = reviewers.slice(startIndex, startIndex + itemsPerPage)

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1)
  }

  const previousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        setLoadingReviewers(true)
        const data = await getReviewersByArticle(Number(id))

        const reviewersWithAssigned = (data ?? []).map((rev) => ({
          ...rev,
          assigned: rev.assigned ?? false,
        })) as CompleteReviewerInfo[]

        reviewersWithAssigned.sort((a, b) => Number(b.assigned) - Number(a.assigned))
        setReviewers(reviewersWithAssigned)
        setAssignedCount(reviewersWithAssigned.filter((r) => r.assigned).length)
      } catch (error) {
        console.error("Error fetching reviewers:", error)
        setReviewers([])
      } finally {
        setLoadingReviewers(false)
      }
    }

    fetchReviewers()
  }, [id])

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoadingArticle(true)
        const data = await getArticleById(Number(id))
        setArticle(data)
      } catch (error) {
        console.error("Error fetching article:", error)
        setArticle(null)
      } finally {
        setLoadingArticle(false)
      }
    }

    fetchArticle()
  }, [id])

  const handleAssign = async (reviewerId: number) => {
    if (assignedCount >= maxAssigned) {
      setShowMaxDialog(true)
      return false
    }
    try {
      await assignReviewerToArticle(reviewerId, Number(id))
      setReviewers((prev) =>
        prev.map((r) => (r.id === reviewerId ? { ...r, assigned: true } : r))
      )
      setAssignedCount((prev) => prev + 1)
      return true
    } catch (error) {
      console.error("Error assigning reviewer:", error)
      return false
    }
  }

  const handleRemove = async (reviewerId: number) => {
    try {
      await removeReviewerFromArticle(reviewerId, Number(id))
      setReviewers((prev) =>
        prev.map((r) => (r.id === reviewerId ? { ...r, assigned: false } : r))
      )
      setAssignedCount((prev) => Math.max(prev - 1, 0))
    } catch (error) {
      console.error("Error removing reviewer:", error)
    }
  }

  if (loadingReviewers || loadingArticle) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-gray-700 font-semibold text-lg">Cargando datos...</p>
      </div>
    )
  }

  if (reviewers.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen w-full"
        style={{ backgroundColor: "hsl(0 0% 75.1%)" }}
      >
        <div className="flex flex-col items-center gap-4 bg-white border-2 border-gray-300 rounded-xl p-8 shadow-lg">
          <p className="text-lg font-bold">No hay revisores disponibles</p>
          <p className="text-sm text-gray-500 text-center">
            Parece que aún no se han registrado revisores.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-200">
      <div
        className="text-white py-4 px-6 flex-shrink-0 text-center"
        style={{ backgroundColor: "#555353ff" }}
      >
        <h2 className="text-xl font-semibold">
          {article?.title || "Artículo sin título"}
        </h2>
      </div>

      <div className="flex-1 px-4">
        {visibleReviewers.map((rev) => (
          <ReviewerItem
            key={rev.id}
            reviewer={rev}
            assigned={rev.assigned}
            onAssign={() => handleAssign(rev.id)}
            onRemove={() => handleRemove(rev.id)}
          />
        ))}
      </div>

      <div className="bg-slate-800 text-white py-4 px-6 flex-shrink-0 sticky bottom-0">
        <div className="flex justify-center items-center gap-4">
          {totalPages > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={currentPage === 1}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}

          <p className="text-sm">
            Mostrando {startIndex + visibleReviewers.length} revisores de {reviewers.length}
          </p>

          {totalPages > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-2 text-center text-sm opacity-80">
          Revisores asignados: {assignedCount} de {maxAssigned}
        </div>
      </div>

      <Dialog open={showMaxDialog} onOpenChange={setShowMaxDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              No se pueden asignar más revisores
            </DialogTitle>
            <DialogDescription>
              El máximo permitido es <b>{maxAssigned}</b> revisores.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
