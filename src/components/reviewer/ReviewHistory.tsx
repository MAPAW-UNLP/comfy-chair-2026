import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { getArticleById, type Article } from "@/services/articleServices";
import React from "react";
import ReviewDiffModal from "@/components/reviewer/ReviewDiffModal";
import { fetchReviewVersions } from "@/services/reviewerServices";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SCORE_DEFS } from "@/components/reviewer/ReviewArticle";

// --- Tipos base
type ArticleLite = {
  id: number;
  title: string;
  type?: "regular" | "poster";
  session_name?: string;
};

// Solo timestamps intermedios (desde la primer revisión hasta la última modif.)
type ReviewEditMeta = {
  edited_at: string; // ISO
};

// Solo la versión final conserva score + opinión
type LatestReview = {
  edited_at: string; // ISO
  score: number;     // -3..3
  opinion: string;
};

// Estructura final: enviado + última modif + versión final + timestamps previos
type ReviewWithHistory = {
  review_id: number;
  article: ArticleLite;
  sent_at: string;              // fecha/hora del envío
  last_modified_at?: string;    // fecha/hora de la última modificación (si hubo)
  latest: LatestReview;         // ÚNICA versión con score/opinion
  edits: ReviewEditMeta[];      // historial SOLO con fechas intermedias
};

type ReviewsResponse = ReviewWithHistory[];

// --- Helpers
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "-";

const scoreBadgeVariant = (score: number) => {
  if (score >= 2) return "default";
  if (score === 1) return "secondary";
  if (score === 0) return "outline";
  if (score === -1) return "secondary";
  return "destructive";
};

function scoreLabel(score?: number | null) {
  if (score === null || score === undefined) return "—";
  const found = SCORE_DEFS.find((s) => s.value === score);
  return found ? found.label : String(score);
}

// --- UI principal
export default function ReviewHistoryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>("");
  const [rows, setRows] = useState<ReviewsResponse>([]);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "poster">(
    "all"
  );

  // Modal simple
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ReviewWithHistory | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffVersions, setDiffVersions] = useState<any[]>([]);

  const reviewerId = useMemo(() => {
    if (user?.id != null) return Number(user.id);
    const stored =
      localStorage.getItem("cc_user_id") || sessionStorage.getItem("cc_user_id");
    return stored ? Number(stored) : NaN;
  }, [user?.id]);

  const fetchArticleCached = async (
    articleId: number,
    cache: Map<number, Article>
  ): Promise<Article | null> => {
    if (cache.has(articleId)) return cache.get(articleId) as Article;
    try {
      const art = await getArticleById(articleId);
      cache.set(articleId, art);
      return art;
    } catch {
      return null;
    }
  };

  const fetchReviewsWithHistory = async (
    reviewer: number
  ): Promise<ReviewsResponse> => {
    const res = await api.get(`/api/reviews/reviewer/${reviewer}/`, {
      validateStatus: () => true,
    });
    if (res.status === 404) return [];
    const list = Array.isArray(res.data)
      ? res.data
      : Array.isArray((res.data as any)?.results)
        ? (res.data as any).results
        : [];

    const articleCache = new Map<number, Article>();

    const histories = await Promise.all(
      list.map(async (rev: any) => {
        // Traer versiones para reconstruir historial
        const versionsRes = await api.get(`/api/reviews/${rev.id}/versions/`, {
          validateStatus: () => true,
        });
        const versions = Array.isArray(versionsRes.data)
          ? versionsRes.data
          : Array.isArray((versionsRes.data as any)?.results)
            ? (versionsRes.data as any).results
            : [];

        const sorted = [...versions].sort(
          (a: any, b: any) => Number(a?.version_number ?? 0) - Number(b?.version_number ?? 0)
        );
        const latest = sorted[sorted.length - 1] ?? rev;
        const edits = sorted.slice(0, -1).map((v: any) => ({
          edited_at: v?.created_at ?? v?.updated_at ?? "",
        }));

        const sent_at = latest?.created_at ?? rev?.created_at ?? "";
        const last_modified_at =
          sorted.length > 1
            ? sorted[sorted.length - 1]?.created_at ?? ""
            : rev?.updated_at && rev?.created_at && rev.updated_at > rev.created_at
              ? rev.updated_at
              : undefined;

        const article = await fetchArticleCached(Number(rev.article), articleCache);

        return {
          review_id: rev.id,
          article: {
            id: Number(rev.article),
            title: article?.title ?? "Artículo",
            type: (article?.type as any) ?? undefined,
            session_name: (article as any)?.session?.title ?? undefined,
          },
          sent_at,
          last_modified_at,
          latest: {
            edited_at: latest?.created_at ?? sent_at ?? "",
            score: Number(latest?.score ?? rev?.score ?? 0),
            opinion: latest?.opinion ?? rev?.opinion ?? "",
          },
          edits,
        } as ReviewWithHistory;
      })
    );

    return histories;
  };

  useEffect(() => {
    if (!Number.isFinite(reviewerId)) {
      setErr("No se pudo identificar al revisor.");
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await fetchReviewsWithHistory(reviewerId);
        const onlySent = (data ?? []).filter((r) => !!r.sent_at);
        onlySent.sort((a, b) => {
          const la = new Date(a.last_modified_at ?? a.sent_at).getTime();
          const lb = new Date(b.last_modified_at ?? b.sent_at).getTime();
          return lb - la;
        });
        setRows(onlySent);
      } catch {
        setErr("No se pudo obtener el historial.");
      } finally {
        setLoading(false);
      }
    })();
  }, [reviewerId]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchQ =
        !q ||
        r.article.title.toLowerCase().includes(q.toLowerCase()) ||
        (r.article.session_name ?? "")
          .toLowerCase()
          .includes(q.toLowerCase());
      const matchType =
        typeFilter === "all" || r.article.type === typeFilter;
      return matchQ && matchType;
    });
  }, [rows, q, typeFilter]);

  const openHistory = (r: ReviewWithHistory) => {
    setCurrent(r);
    setOpen(true);
  };

  const closeHistory = () => {
    setOpen(false);
    setCurrent(null);
  };

  const handleShowDiff = async (reviewId: number) => {
    const versions = await fetchReviewVersions(reviewId);
    // asegurar orden por numero de versión o fecha
    const sorted = versions.slice().sort((a,b) => (a.version_number ?? 0) - (b.version_number ?? 0));
    setDiffVersions(sorted);
    setDiffOpen(true);
  };

  return (
    <section className="container mx-auto p-4 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Historial de revisiones enviadas</h1>
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar por título o sesión…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={typeFilter}
            onValueChange={(v: any) => setTypeFilter(v)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="poster">Poster</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-3">
        {loading ? (
          <div className="p-8 text-center">Cargando…</div>
        ) : err ? (
          <div className="p-6 text-center text-red-500">{err}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No hay revisiones enviadas.
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((r) => {
              const sentDate = r.sent_at;
              const lastMod = r.last_modified_at;
              return (
                <div
                  key={r.review_id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.article.title}</span>
                      {r.article.type && (
                        <Badge variant="outline">{r.article.type}</Badge>
                      )}
                      {r.article.session_name && (
                        <Badge variant="secondary">
                          {r.article.session_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 space-x-1">
                      <span>Enviado:</span>
                      <span>{formatDate(sentDate)}</span>
                      {lastMod && (
                        <>
                          <span>• Última modificación:</span>
                          <span>{formatDate(lastMod)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Acción: sin score en la lista; botón full width en mobile */}
                  <div className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto" onClick={() => openHistory(r)}>
                      Ver detalle
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal de detalle (con score de la versión final) */}
      <Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-3xl px-6 sm:px-10">
    <DialogHeader>
      <DialogTitle>Detalle de revisión</DialogTitle>
      <DialogDescription>
        {current?.article?.title ?? "-"}
      </DialogDescription>
    </DialogHeader>

    {!current ? null : (
      <div className="space-y-6">
        <Card className="p-5 sm:p-6">
          <div className="text-sm font-medium mb-2">Fechas</div>
          <ul className="text-sm space-y-1">
            <li>
              <span className="text-muted-foreground">Envío: </span>
              {formatDate(current.sent_at)}
            </li>
            {current.edits.map((e, idx) => (
              <li key={idx}>
                <span className="text-muted-foreground">Edición {idx + 1}: </span>
                {formatDate(e.edited_at)}
              </li>
            ))}
            {current.last_modified_at && (
              <li>
                <span className="text-muted-foreground">Última modificación: </span>
                {formatDate(current.last_modified_at)}
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="text-sm font-medium mb-2">Versión final</div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={scoreBadgeVariant(current.latest.score)}>
              {scoreLabel(current.latest.score)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(current.latest.edited_at)}
            </span>
          </div>
          <p className="text-sm leading-relaxed">{current.latest.opinion}</p>
        </Card>

        <div className="flex justify-end">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // cerrar detalle y abrir modal de diff
                setOpen(false);
                if (current && current.review_id) {
                  handleShowDiff(current.review_id);
                }
              }}
            >
              Ver modificaciones
            </Button>

            <Button variant="secondary" onClick={closeHistory}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* Diff Modal */}
      <ReviewDiffModal open={diffOpen} onClose={() => setDiffOpen(false)} versions={diffVersions} />

    </section>
  );
}
