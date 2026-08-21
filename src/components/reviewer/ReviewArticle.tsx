// src/features/reviewer/ReviewArticle.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { getArticleById } from "@/services/articleServices";
import {
  getOwnReviewByArticle,
  createReview,
  updateReview,
  updatePublishedReview,
  publishReview,
  type Review as ReviewDTO,
} from "@/services/reviewerServices";
import api from "@/services/api";

type Author = { id: number; full_name?: string; email?: string };

type Article = {
  id: number;
  title: string;
  type: string | null;
  abstract: string | null;
  // pueden venir como string (URL) o como File según el servicio
  main_file?: string | File | null; // PDF principal
  source_file?: string | File | null; // adjunto extra (posters)
  authors?: Author[];
};

// Definición de scores con etiquetas (orden de mejor a peor)
export const SCORE_DEFS = [
  { value: 3, label: "Fuertemente aceptado" },
  { value: 2, label: "Aceptado" },
  { value: 1, label: "Debilmente aceptado" },
  { value: 0, label: "Dudoso" },
  { value: -1, label: "Debilmete rechazado" },
  { value: -2, label: "Rechazado" },
  { value: -3, label: "Fuertemente rechazado" },
];

// Base para armar hrefs absolutos cuando llegan paths relativos
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "";
function hrefFrom(path?: string | null) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${API_BASE}${path}`;
}

export default function ReviewArticle() {
  const navigate = useNavigate();
  const { articleId: articleIdParam } = useParams({
    from: "/_auth/reviewer/review/$articleId",
  });
  const articleId = Number(articleIdParam);

  const { user } = useAuth();

  // 🛟 Fallback para tener reviewerId aunque el AuthContext aún no esté hidratado
  const reviewerId = useMemo(() => {
    if (user?.id != null) return Number(user.id);
    const stored =
      localStorage.getItem("cc_user_id") ||
      sessionStorage.getItem("cc_user_id");
    return stored ? Number(stored) : NaN;
  }, [user?.id]);

  const [article, setArticle] = useState<Article | null>(null);
  const [review, setReview] = useState<ReviewDTO | null>(null);
  const [opinion, setOpinion] = useState("");
  const [score, setScore] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null); // solo la última edición (frontend)

  // 🔹 Revisión de otros revisores
  const [peerReviews, setPeerReviews] = useState<ReviewDTO[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(false);

  const otherReviews = useMemo(
    () => peerReviews.filter((r) => r.reviewer !== reviewerId),
    [peerReviews, reviewerId]
  );

  const isPoster = useMemo(
    () => (article?.type || "").toLowerCase() === "poster",
    [article?.type]
  );

  // Estado derivado para badge global de la review
  const derivedState = useMemo(() => {
    if (!review) return { key: "pending" as const, label: "Pendiente" };
    if (review.is_published) {
      return review.is_edited
        ? { key: "sent_edited" as const, label: "Enviada (editada)" }
        : { key: "sent" as const, label: "Enviada" };
    }
    return { key: "draft" as const, label: "Borrador" };
  }, [review]);

  // Info visual para el score seleccionado (chip + colores)
  const scoreInfo = useMemo(() => {
    if (score === "") return null;
    const v = Number(score);

    if (v >= 2) {
      return {
        tone: "positive-strong" as const,
        short: "Aceptado (fuerte)",
        chipClass:
          "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
        selectClass:
          "border-emerald-300 bg-emerald-50/40 dark:border-emerald-700 dark:bg-emerald-950/20",
      };
    }
    if (v === 1) {
      return {
        tone: "positive" as const,
        short: "Aceptado",
        chipClass:
          "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800",
        selectClass:
          "border-emerald-200 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-950/10",
      };
    }
    if (v === 0) {
      return {
        tone: "neutral" as const,
        short: "Sin recomendación",
        chipClass:
          "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-100 dark:border-slate-600",
        selectClass:
          "border-slate-300 bg-slate-50/60 dark:border-slate-600 dark:bg-slate-900/40",
      };
    }
    if (v === -1) {
      return {
        tone: "warn" as const,
        short: "Revisión menor",
        chipClass:
          "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800",
        selectClass:
          "border-amber-200 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/20",
      };
    }
    // -2 o -3
    return {
      tone: "negative" as const,
      short: v === -2 ? "Revisión mayor" : "Rechazado",
      chipClass:
        "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800",
      selectClass:
        "border-rose-200 bg-rose-50/40 dark:border-rose-700 dark:bg-rose-950/20",
    };
  }, [score]);

  // ---- Carga inicial ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        const art = (await getArticleById(articleId)) as Article;
        if (!alive) return;
        setArticle(art);

        if (!Number.isFinite(reviewerId)) return; // no precargamos si no hay id

        const r = await getOwnReviewByArticle(articleId, reviewerId);
        if (!alive) return;

        setReview(r);
        if (r) {
          setOpinion(r.opinion ?? "");
          setScore(String(r.score ?? ""));
        }
      } catch (e) {
        console.error("Error cargando artículo/revisión:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [articleId, reviewerId]);

  // ---- Carga de revisiones publicadas de este artículo (otras personas) ----
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoadingPeers(true);

        const res = await api.get(`/api/article/${articleId}/reviews/`, {
          validateStatus: () => true,
        });

        if (!alive) return;

        // Soportamos varias formas de respuesta: {reviews: []}, [] o {results: []}
        const raw = (res.data && (res.data.reviews ?? res.data)) ?? [];
        if (Array.isArray(raw)) {
          setPeerReviews(raw as ReviewDTO[]);
        } else if (Array.isArray((res.data as any)?.results)) {
          setPeerReviews((res.data as any).results as ReviewDTO[]);
        } else {
          setPeerReviews([]);
        }
      } catch (e) {
        console.error("Error cargando revisiones publicadas:", e);
        setPeerReviews([]);
      } finally {
        if (alive) setLoadingPeers(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [articleId]);

  // ---- Acciones ----
  const ensureFields = () => {
    if (!opinion.trim() || score === "") {
      alert("Completá la opinión y la puntuación.");
      return false;
    }
    if (!Number.isFinite(reviewerId)) {
      alert("No se pudo identificar al revisor. Iniciá sesión nuevamente.");
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    opinion: opinion.trim(),
    score: Number(score),
  });

  // Guardar como borrador (NO publica, queda local al revisor)
  const handleSaveDraft = async () => {
    if (!ensureFields()) return;

    try {
      setSaving(true);
      let saved: ReviewDTO;

      const payload = buildPayload();

      if (review) {
        // Si ya está publicada, igual permitimos sobrescribir contenido,
        // pero sigue siendo una review publicada (no se vuelve a "borrador" en el back).
        if (review.is_published) {
          saved = await updatePublishedReview(review.id, payload);
        } else {
          saved = await updateReview(review.id, payload);
        }
      } else {
        // No existía review: creamos una nueva (queda como borrador en backend)
        saved = await createReview({
          article: articleId,
          reviewer: reviewerId,
          ...payload,
        });
      }

      setReview(saved);
      const stamp = new Date().toLocaleString();
      setLastUpdated(stamp);

      // notificar AssignedArticles / Index
      window.dispatchEvent(
        new CustomEvent("review-updated", {
          detail: {
            articleId,
            state: saved.is_published ? "sent" : "draft",
          },
        })
      );

      // Volver al índice con scroll al artículo
      navigate({
        to: "/reviewer",
        search: { selected: String(articleId) },
      });
    } catch (e) {
      console.error("Error al guardar borrador:", e);
      alert("Ocurrió un error al guardar el borrador.");
    } finally {
      setSaving(false);
    }
  };

  // Enviar (publicar)
  const handleSend = async () => {
    if (!ensureFields()) return;

    try {
      setSaving(true);
      let saved: ReviewDTO;
      const payload = buildPayload();
      const wasAlreadyPublished = !!review?.is_published;

      if (review) {
        if (review.is_published) {
          // Ya está publicada → actualizamos review publicada (nueva versión)
          saved = await updatePublishedReview(review.id, payload);
        } else {
          // Es borrador → primero actualizamos, luego publicamos
          const updated = await updateReview(review.id, payload);
          setReview(updated);
          saved = await publishReview(updated.id);
        }
      } else {
        // No existía review → creamos y publicamos
        const created = await createReview({
          article: articleId,
          reviewer: reviewerId,
          ...payload,
        });
        setReview(created);
        saved = await publishReview(created.id);
      }

      setReview(saved);
      const stamp = new Date().toLocaleString();
      setLastUpdated(stamp);

      window.dispatchEvent(
        new CustomEvent("review-updated", {
          detail: {
            articleId,
            state: saved.is_published
              ? wasAlreadyPublished
                ? "sent_edited"
                : "sent"
              : "draft",
          },
        })
      );

      // Volver al índice resaltando este artículo
      navigate({
        to: "/reviewer",
        search: { selected: String(articleId) },
      });
    } catch (e: any) {
      console.error("Error al enviar la revisión:", e);
      console.error("Detalle backend:", e?.response?.data);
      alert(
        e?.response?.data?.error ??
          "Ocurrió un error al enviar la revisión."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---- Render ----
  if (loading) {
    return (
      <p className="px-6 py-8 text-slate-600 dark:text-slate-300">
        Cargando artículo…
      </p>
    );
  }

  if (!article) {
    return (
      <p className="px-6 py-8 text-red-600">No se encontró el artículo.</p>
    );
  }

  const isPublished = !!review?.is_published;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      {/* Encabezado */}
      <div className="mb-2">
        {/* Fila 1: estado, alineado a la derecha */}
        <div className="flex justify-end">
          <span
            className={[
              "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
              derivedState.key === "pending" && "bg-slate-200 text-slate-800",
              derivedState.key === "draft" && "bg-amber-200 text-amber-900",
              (derivedState.key === "sent" ||
                derivedState.key === "sent_edited") &&
                "bg-emerald-200 text-emerald-900",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {derivedState.label}
          </span>
        </div>

        {/* Fila 2: título usando todo el ancho */}
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
          {article.title}
        </h1>
      </div>

      {lastUpdated && (
        <p className="mt-1 text-xs text-slate-500">
          Última actualización: {lastUpdated}
        </p>
      )}

      {/* Datos del artículo */}
      <div className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
        <p>
          <span className="font-semibold">Tipo:</span>{" "}
          {article.type || "No especificado"}
        </p>
        <p>
          <span className="font-semibold">Autores:</span>{" "}
          {article.authors?.length
            ? article.authors
                .map((a) => a.full_name || a.email || "Autor")
                .join(", ")
            : "Desconocidos"}
        </p>
      </div>

      {/* Abstract */}
      <p className="mt-4 text-slate-700 dark:text-slate-300">
        {article.abstract || "Sin resumen disponible."}
      </p>

      {/* Descargas */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        {article.main_file && typeof article.main_file === "string" && (
          <a
            href={hrefFrom(article.main_file)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
            download
          >
            Descargar artículo principal
          </a>
        )}
        {isPoster &&
          article.source_file &&
          typeof article.source_file === "string" && (
            <a
              href={hrefFrom(article.source_file)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
              download
            >
              Descargar información adicional (poster)
            </a>
          )}
      </div>

      {/* Aviso de login si no hay id */}
      {!Number.isFinite(reviewerId) && (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-800">
          No se pudo identificar tu usuario. Iniciá sesión para guardar/editar
          la revisión.
        </div>
      )}

      {/* Formulario */}
      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Opinión
          </label>
          <textarea
            rows={7}
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            placeholder="Escribí aquí tu revisión…"
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Bloque de puntuación con estilos mejorados */}
        <div className="rounded-2xl bg-slate-50/70 p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/40 dark:ring-slate-700">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Puntuación
            </label>
          </div>

          <select
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className={[
              "w-full max-w-xs rounded-xl border bg-white p-2.5 text-sm text-slate-900 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-sky-400",
              "dark:bg-slate-900 dark:text-slate-100",
              scoreInfo?.selectClass ??
                "border-slate-300 dark:border-slate-600",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <option value="" disabled>
              Seleccionar puntuación…
            </option>
            {SCORE_DEFS.map(({ value, label }) => (
              <option key={value} value={String(value)}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          {/* Si está enviada, NO mostramos el botón de guardar borrador */}
          {!isPublished && (
            <Button
              onClick={handleSaveDraft}
              disabled={
                saving ||
                !opinion.trim() ||
                score === "" ||
                !Number.isFinite(reviewerId)
              }
              className="rounded-lg bg-slate-700 px-6 py-2 font-semibold text-white hover:bg-slate-600"
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </Button>
          )}

          <Button
            onClick={handleSend}
            disabled={
              saving ||
              !opinion.trim() ||
              score === "" ||
              !Number.isFinite(reviewerId)
            }
            className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-500"
          >
            {saving
              ? "Enviando…"
              : isPublished
              ? "Actualizar y enviar"
              : "Enviar"}
          </Button>
        </div>
      </div>

      {/* 🔽 Otras revisiones publicadas: solo cuando tu review está enviada/completa 🔽 */}
      {isPublished && (
        <section className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Otras revisiones publicadas
          </h2>

          {loadingPeers ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Cargando revisiones…
            </p>
          ) : !otherReviews.length ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Todavía no hay revisiones publicadas de otros revisores para este
              artículo.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {otherReviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      Revisor #{r.reviewer}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-300">
                      Puntuación: {r.score}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                    {r.opinion}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
