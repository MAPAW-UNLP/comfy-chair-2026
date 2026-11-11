import { useEffect, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import {
  ClipboardCheck,
  UserSearch,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"

import { getSession, type Session } from "@/services/sessionServices"
import {
  getArticleBySessionId,
  type Article,
} from "@/services/articleServices"

import {
  getReviewersByArticle,
  assignReviewerToArticle,
  removeReviewerFromArticle,
  type ReviewerInfo,
} from "@/services/reviewerServices"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

type CompleteReviewerInfo = Omit<ReviewerInfo, "email" | "interest"> & {
  email: string
  interest: "interesado" | "quizas" | "no_interesado" | "ninguno"
  assigned?: boolean
}

const ITEMS_PER_PAGE = 5

const interestLabels: Record<CompleteReviewerInfo["interest"], string> = {
  interesado: "Interesado",
  quizas: "Quizás",
  no_interesado: "No interesado",
  ninguno: "No indicó",
}

const interestColors: Record<CompleteReviewerInfo["interest"], string> = {
  interesado: "bg-green-100 text-green-800 border-green-300",
  quizas: "bg-yellow-100 text-yellow-800 border-yellow-300",
  no_interesado: "bg-red-100 text-red-800 border-red-300",
  ninguno: "bg-gray-100 text-gray-700 border-gray-300",
}

export function PanelSessionChair() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [sessionTitle, setSessionTitle] = useState("Panel del Chair")
  const [sessionId, setSessionId] = useState("ID de sesión")
  const [loadingTitle, setLoadingTitle] = useState(true)

  const [articles, setArticles] = useState<Article[]>([])
  const [loadingArticles, setLoadingArticles] = useState(true)

  // Estado del modal de asignación
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [reviewers, setReviewers] = useState<CompleteReviewerInfo[]>([])
  const [loadingReviewers, setLoadingReviewers] = useState(false)
  const [processingReviewerId, setProcessingReviewerId] = useState<number | null>(
    null,
  )
  const [currentPage, setCurrentPage] = useState(1)

  const assignedCount = reviewers.filter((reviewer) => reviewer.assigned).length

  const totalPages = Math.ceil(reviewers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE

  const visibleReviewers = reviewers.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  )

  useEffect(() => {
    const fetchSessionData = async () => {
      const sessionIdString = localStorage.getItem("selectedSession")

      if (!sessionIdString) {
        navigate({ to: "/chairs/select-session" })
        return
      }

      try {
        const sessionData: Session = await getSession(sessionIdString)

        setSessionTitle(sessionData.title)
        setSessionId(sessionData.id.toString())

        const articlesData = await getArticleBySessionId(sessionData.id)
        setArticles(articlesData)
      } catch (error) {
        console.error("Error fetching session data:", error)
        toast.error("No se pudieron cargar los datos de la sesión.")
      } finally {
        setLoadingTitle(false)
        setLoadingArticles(false)
      }
    }

    fetchSessionData()
  }, [navigate])

  // Abre el modal y carga los revisores del artículo seleccionado
  const handleOpenAssignment = async (article: Article) => {
    setSelectedArticle(article)
    setReviewers([])
    setCurrentPage(1)
    setLoadingReviewers(true)

    try {
      const data = await getReviewersByArticle(Number(article.id))

      const reviewersWithAssigned = (data ?? []).map((reviewer) => ({
        ...reviewer,
        assigned: reviewer.assigned ?? false,
      })) as CompleteReviewerInfo[]

      reviewersWithAssigned.sort(
        (a, b) => Number(b.assigned) - Number(a.assigned),
      )

      setReviewers(reviewersWithAssigned)
    } catch (error) {
      console.error("Error fetching reviewers:", error)
      toast.error("No se pudieron cargar los revisores.")
      setReviewers([])
    } finally {
      setLoadingReviewers(false)
    }
  }

  const handleCloseAssignment = (open: boolean) => {
    if (!open && processingReviewerId === null) {
      setSelectedArticle(null)
      setReviewers([])
      setCurrentPage(1)
    }
  }

  // Asigna un revisor al artículo seleccionado
  const handleAssign = async (reviewerId: number) => {
    if (!selectedArticle || processingReviewerId !== null) {
      return
    }

    if (!user) {
      toast.error("No se pudo identificar al usuario autenticado.")
      return
    }

    setProcessingReviewerId(reviewerId)

    try {
      await assignReviewerToArticle(
        reviewerId,
        Number(selectedArticle.id),
        Number(user.id),
      )

      setReviewers((previous) =>
        previous.map((reviewer) =>
          reviewer.id === reviewerId
            ? { ...reviewer, assigned: true }
            : reviewer,
        ),
      )

      toast.success("Revisor asignado correctamente.")
    } catch (error) {
      console.error("Error assigning reviewer:", error)
      toast.error("No se pudo asignar el revisor.")
    } finally {
      setProcessingReviewerId(null)
    }
  }

  // Quita la asignación de un revisor
  const handleRemove = async (reviewerId: number) => {
    if (!selectedArticle || processingReviewerId !== null) {
      return
    }

    setProcessingReviewerId(reviewerId)

    try {
      await removeReviewerFromArticle(
        reviewerId,
        Number(selectedArticle.id),
      )

      setReviewers((previous) =>
        previous.map((reviewer) =>
          reviewer.id === reviewerId
            ? { ...reviewer, assigned: false }
            : reviewer,
        ),
      )

      toast.success("Asignación eliminada correctamente.")
    } catch (error) {
      console.error("Error removing reviewer:", error)
      toast.error("No se pudo quitar la asignación.")
    } finally {
      setProcessingReviewerId(null)
    }
  }

  const handlePreviousPage = () => {
    setCurrentPage((page) => Math.max(page - 1, 1))
  }

  const handleNextPage = () => {
    setCurrentPage((page) => Math.min(page + 1, totalPages))
  }

  if (loadingTitle) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-10 text-gray-400 animate-pulse">
          Cargando...
        </h1>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-10">
        Sesión #{sessionId}:<br />
        {sessionTitle}
      </h1>

      {/* Acciones de la sesión */}
      <div className="flex flex-col gap-4 mb-10">
        {/* Corte de sesión */}
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <ClipboardCheck size={32} className="text-gray-700" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Corte de sesión
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Definí el criterio de corte para esta sesión.
              </p>
            </div>
          </div>

          <Link
            to="/chairs/selection/selection-method"
            search={{ method: "cutoff", value: "" }}
            className="shrink-0 bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition"
          >
            Seleccionar corte
          </Link>
        </div>

        {/* Revisores de la sesión */}
        <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 rounded-lg p-3">
              <UserSearch size={32} className="text-gray-700" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Revisores de la sesión
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Consultá y buscá el padrón de revisores disponibles.
              </p>
            </div>
          </div>

          <Link
            to="/chairs/reviewers"
            className="shrink-0 bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-700 transition"
          >
            Ver revisores
          </Link>
        </div>
      </div>

      {/* Tabla de artículos */}
      <div>
        <h2 className="text-2xl font-bold mb-4">
          Artículos de la sesión
        </h2>

        {loadingArticles ? (
          <p className="text-gray-500">Cargando artículos...</p>
        ) : articles.length === 0 ? (
          <p className="text-gray-500">No hay artículos en esta sesión.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm">
            <table className="w-full bg-white">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Artículo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Tipo
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">
                    Autores
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody>
                {articles.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">
                        {article.title}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {article.type}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {article.status}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {article.authors
                        .map((author) => author.full_name)
                        .join(", ")}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                        onClick={() => handleOpenAssignment(article)}
                      >
                        Asignar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal de asignación de revisores */}
      <Dialog
        open={selectedArticle !== null}
        onOpenChange={handleCloseAssignment}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0 rounded-2xl border border-gray-200 shadow-2xl">

          {/* Encabezado */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-5 pr-12">
            <DialogHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-800 text-white shadow-sm">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight text-gray-900">
                    Asignación de revisores
                  </DialogTitle>

                  <p className="mt-1 text-sm text-gray-500">
                    Administrá los revisores de este artículo.
                  </p>
                </div>
              </div>

              <DialogDescription className="pt-2 text-sm leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-800">
                  Artículo:
                </span>{" "}
                {selectedArticle?.title}
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Contenido desplazable */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* Resumen de asignaciones */}
            <div className="mb-7">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  Revisores asignados
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-gray-900">
                    {assignedCount}
                  </span>

                  <span className="text-sm text-gray-400">
                    {assignedCount === 1 ? "revisor asignado" : "revisores asignados"}
                  </span>
                </div>
              </div>
            </div>

            {/* Título de la lista */}
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Lista de revisores
                </h3>

                <p className="mt-0.5 text-sm text-gray-500">
                  Seleccioná quiénes revisarán el artículo.
                </p>
              </div>

              {!loadingReviewers && (
                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                  {reviewers.length}{" "}
                  {reviewers.length === 1 ? "revisor" : "revisores"}
                </span>
              )}
            </div>

            {/* Cargando */}
            {loadingReviewers ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 py-12">
                <LoaderCircle className="h-8 w-8 animate-spin text-gray-500" />

                <p className="text-sm text-gray-500">
                  Cargando revisores...
                </p>
              </div>
            ) : reviewers.length === 0 ? (
              /* Sin revisores */
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-200">
                  <Users className="h-6 w-6 text-gray-500" />
                </div>

                <p className="font-semibold text-gray-800">
                  No hay revisores disponibles
                </p>

                <p className="mt-1 max-w-xs text-sm text-gray-500">
                  No se encontraron revisores para este artículo.
                </p>
              </div>
            ) : (
              /* Lista */
              <div className="overflow-hidden rounded-xl border border-gray-200">
                {visibleReviewers.map((reviewer, index) => {
                  const isAssigned = Boolean(reviewer.assigned)
                  const isProcessing =
                    processingReviewerId === reviewer.id

                  return (
                    <div
                      key={reviewer.id}
                      className={`flex items-center justify-between gap-3 p-4 transition-colors ${index !== visibleReviewers.length - 1
                        ? "border-b border-gray-100"
                        : ""
                        } ${isAssigned
                          ? "bg-gray-50/70"
                          : "bg-white hover:bg-gray-50"
                        }`}
                    >
                      {/* Datos del revisor */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${isAssigned
                            ? "bg-gray-800 text-white"
                            : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {reviewer.full_name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {reviewer.full_name}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${interestColors[reviewer.interest] ??
                                interestColors.ninguno
                                }`}
                            >
                              {interestLabels[reviewer.interest] ??
                                "No indicó"}
                            </span>

                            {isAssigned && (
                              <span className="text-xs font-medium text-gray-500">
                                Asignado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acción */}
                      <Button
                        type="button"
                        variant={isAssigned ? "outline" : "default"}
                        size="sm"
                        disabled={processingReviewerId !== null}
                        onClick={() =>
                          isAssigned
                            ? handleRemove(reviewer.id)
                            : handleAssign(reviewer.id)
                        }
                        className={`shrink-0 transition-colors ${isAssigned
                          ? "border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                          }`}
                      >
                        {isProcessing ? (
                          <LoaderCircle className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : isAssigned ? (
                          <Trash2 className="mr-1.5 h-4 w-4" />
                        ) : (
                          <Plus className="mr-1.5 h-4 w-4" />
                        )}

                        {isProcessing
                          ? "Procesando"
                          : isAssigned
                            ? "Quitar"
                            : "Asignar"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Paginación */}
            {!loadingReviewers && totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="border-gray-200"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>

                <span className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">
                    {currentPage}
                  </span>{" "}
                  de {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="border-gray-200"
                >
                  Siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}

            {!loadingReviewers && reviewers.length > 0 && (
              <p className="mt-3 text-center text-xs text-gray-400">
                Mostrando {startIndex + 1}–
                {Math.min(startIndex + ITEMS_PER_PAGE, reviewers.length)} de{" "}
                {reviewers.length} revisores
              </p>
            )}
          </div>

          {/* Pie del modal */}
          <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <p className="hidden text-xs text-gray-500 sm:block">
              Gestioná los revisores asignados a este artículo.
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleCloseAssignment(false)}
              disabled={processingReviewerId !== null}
              className="ml-auto border-gray-300 bg-white px-5 hover:bg-gray-100"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}