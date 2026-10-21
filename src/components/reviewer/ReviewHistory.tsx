import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { getArticleById, type Article } from "@/services/articleServices";
import ReviewDiffModal from "@/components/reviewer/ReviewDiffModal";
import ReviewerConferenceSwitcher from "@/components/reviewer/ReviewerConferenceSwitcher";
import {
  fetchReviewVersions,
  getBackendErrorMessage,
  getMyReviewHistory,
} from "@/services/reviewerServices";

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
  score: number; // -3..3
  opinion: string;
};

// Estructura final: enviado + última modif + versión final + timestamps previos
type ReviewWithHistory = {
  review_id: number;
  article: ArticleLite;
  sent_at: string; // fecha/hora del envío
  last_modified_at?: string; // fecha/hora de la última modificación (si hubo)
  latest: LatestReview; // ÚNICA versión con score/opinion
  edits: ReviewEditMeta[]; // historial SOLO con fechas intermedias
};

type RawVersion = {
  version_number?: number;
  created_at?: string;
  updated_at?: string;
  score?: number | null;
  opinion?: string | null;
};

type TypeFilter = "all" | "regular" | "poster";

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

// Mensaje de estado (sin conferencia, vacío, error).
function StateMessage(props: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  const color = props.tone === "error" ? "text-rose-700" : "text-muted-foreground";
  return <div className={`p-8 text-center ${color}`}>{props.children}</div>;
}

// Trae las reviews enviadas de la conferencia y las enriquece con versiones y
// datos del artículo. Un 404 del backend (sin resultados) llega como lista vacía.
async function loadHistory(
  reviewerId: number,
  conferenceId: number
): Promise<ReviewWithHistory[]> {
  const list = await getMyReviewHistory(reviewerId, conferenceId);
  const articleCache = new Map<number, Article>();

  const fetchArticleCached = async (articleId: number): Promise<Article | null> => {
    const cached = articleCache.get(articleId);
    if (cached) return cached;
    try {
      const art = await getArticleById(articleId);
      articleCache.set(articleId, art);
      return art;
    } catch {
      return null;
    }
  };

  const histories = await Promise.all(
    list.map(async (rev): Promise<ReviewWithHistory> => {
      // Traer versiones para reconstruir historial
      const versionsRes = await api.get(`/api/reviews/${rev.id}/versions/`, {
        validateStatus: () => true,
      });
      const body = versionsRes.data;
      const versions: RawVersion[] = Array.isArray(body)
        ? body
        : Array.isArray(body?.results)
          ? body.results
          : [];

      const sorted = [...versions].sort(
        (a, b) => Number(a.version_number ?? 0) - Number(b.version_number ?? 0)
      );
      const lastVersion = sorted[sorted.length - 1];
      const edits = sorted.slice(0, -1).map((v) => ({
        edited_at: v.created_at ?? v.updated_at ?? "",
      }));

      const sent_at = lastVersion?.created_at ?? rev.created_at ?? "";
      const last_modified_at =
        sorted.length > 1
          ? lastVersion?.created_at ?? ""
          : rev.updated_at && rev.created_at && rev.updated_at > rev.created_at
            ? rev.updated_at
            : undefined;

      const article = await fetchArticleCached(Number(rev.article));
      const sessionTitle = (
        article as unknown as { session?: { title?: string } | null } | null
      )?.session?.title;

      return {
        review_id: rev.id,
        article: {
          id: Number(rev.article),
          title: article?.title ?? "Artículo",
          type:
            article?.type === "regular" || article?.type === "poster"
              ? article.type
              : undefined,
          session_name: sessionTitle ?? undefined,
        },
        sent_at,
        last_modified_at,
        latest: {
          edited_at: lastVersion?.created_at ?? sent_at,
          score: Number(lastVersion?.score ?? rev.score ?? 0),
          opinion: lastVersion?.opinion ?? rev.opinion ?? "",
        },
        edits,
      };
    })
  );

  const onlySent = histories.filter((r) => !!r.sent_at);
  onlySent.sort((a, b) => {
    const la = new Date(a.last_modified_at ?? a.sent_at).getTime();
    const lb = new Date(b.last_modified_at ?? b.sent_at).getTime();
    return lb - la;
  });
  return onlySent;
}

// --- UI principal
export default function ReviewHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedRole } = useRole();

  // Conferencia activa: solo cuenta si el rol elegido es de revisor.
  const isReviewerRole = String(selectedRole?.role ?? "")
    .toLowerCase()
    .trim()
    .startsWith("rev");
  const selectedConferenceId = isReviewerRole
    ? selectedRole?.conferenceId
    : undefined;
  const conferenceName = isReviewerRole ? selectedRole?.conferenceName : undefined;

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  // Modal simple
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ReviewWithHistory | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [diffVersions, setDiffVersions] = useState<any[]>([]);

  const reviewerId = useMemo(() => {
    if (user?.id != null) return Number(user.id);
    const stored =
      localStorage.getItem("cc_user_id") || sessionStorage.getItem("cc_user_id");
    return stored ? Number(stored) : NaN;
  }, [user?.id]);

  // La clave incluye la conferencia: al cambiarla se vuelve a pedir el historial.
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reviewer", "history", selectedConferenceId, reviewerId],
    queryFn: () => loadHistory(reviewerId, selectedConferenceId as number),
    enabled: Number.isFinite(reviewerId) && selectedConferenceId != null,
    // 400/403/404 no se arreglan reintentando.
    retry: (failureCount, err) => {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 400 || status === 403 || status === 404) return false;
      return failureCount < 2;
    },
  });

  // 403: sin permiso, vuelve al dashboard. Otros errores: toast con el mensaje
  // del backend (el 404 ya llegó como lista vacía).
  useEffect(() => {
    if (!isError) return;
    if (isAxiosError(error) && error.response?.status === 403) {
      toast.error("No tenés permiso para ver este historial");
      navigate({ to: "/reviewer" });
      return;
    }
    toast.error(getBackendErrorMessage(error) ?? "No se pudo obtener el historial.");
  }, [isError, error, navigate]);

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      const matchQ =
        !q ||
        r.article.title.toLowerCase().includes(q.toLowerCase()) ||
        (r.article.session_name ?? "").toLowerCase().includes(q.toLowerCase());
      const matchType = typeFilter === "all" || r.article.type === typeFilter;
      return matchQ && matchType;
    });
  }, [data, q, typeFilter]);

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
    const sorted = versions
      .slice()
      .sort((a, b) => (a.version_number ?? 0) - (b.version_number ?? 0));
    setDiffVersions(sorted);
    setDiffOpen(true);
  };

  // Qué se muestra dentro de la tarjeta principal.
  const body = (() => {
    if (selectedConferenceId == null)
      return (
        <StateMessage>
          Elegí una conferencia en el selector para ver tu historial.
        </StateMessage>
      );
    if (!Number.isFinite(reviewerId))
      return <StateMessage tone="error">No se pudo identificar al revisor.</StateMessage>;
    if (isLoading) return <StateMessage>Cargando…</StateMessage>;
    if (isError)
      return (
        <StateMessage tone="error">
          <p>No se pudo obtener el historial.</p>
          <div className="mt-3 flex justify-center">
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Reintentando…" : "Reintentar"}
            </Button>
          </div>
        </StateMessage>
      );
    if ((data ?? []).length === 0)
      return (
        <StateMessage>
          No enviaste revisiones en {conferenceName ?? "esta conferencia"} todavía.
        </StateMessage>
      );
    if (filtered.length === 0)
      return (
        <StateMessage>No hay revisiones que coincidan con la búsqueda.</StateMessage>
      );

    return (
      <div className="divide-y">
        {filtered.map((r) => (
          <div
            key={r.review_id}
            className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.article.title}</span>
                {r.article.type && <Badge variant="outline">{r.article.type}</Badge>}
                {r.article.session_name && (
                  <Badge variant="secondary">{r.article.session_name}</Badge>
                )}
              </div>
              <div className="mt-1 space-x-1 text-sm text-muted-foreground">
                <span>Enviado:</span>
                <span>{formatDate(r.sent_at)}</span>
                {r.last_modified_at && (
                  <>
                    <span>• Última modificación:</span>
                    <span>{formatDate(r.last_modified_at)}</span>
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
        ))}
      </div>
    );
  })();

  return (
    <section className="container mx-auto space-y-4 p-4">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Historial de revisiones enviadas</h1>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ReviewerConferenceSwitcher />
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Buscar por título o sesión…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-64"
            />
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as TypeFilter)}
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
      </div>

      <Card className="p-3">{body}</Card>

      {/* Modal de detalle (con score de la versión final) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl px-6 sm:px-10">
          <DialogHeader>
            <DialogTitle>Detalle de revisión</DialogTitle>
            <DialogDescription>{current?.article?.title ?? "-"}</DialogDescription>
          </DialogHeader>

          {!current ? null : (
            <div className="space-y-6">
              <Card className="p-5 sm:p-6">
                <div className="mb-2 text-sm font-medium">Fechas</div>
                <ul className="space-y-1 text-sm">
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
                <div className="mb-2 text-sm font-medium">Versión final</div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
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
                      if (current.review_id) {
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
      <ReviewDiffModal
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        versions={diffVersions}
      />
    </section>
  );
}
