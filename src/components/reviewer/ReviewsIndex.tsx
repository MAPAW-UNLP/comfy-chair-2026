// ./reviewer/ReviewsIndex.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useCountdown } from "@/utils/useCountdown";
import {
  getMyAssignments,
  type ReviewerAssignment,
} from "@/services/reviewerServices";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import ReviewerConferenceSwitcher from "./ReviewerConferenceSwitcher";

/* ====================== ENV + helpers de fechas ====================== */

const BIDDING_START =
  (import.meta.env.VITE_BIDDING_START as string | undefined) ?? null;
const BIDDING_END =
  (import.meta.env.VITE_BIDDING_END as string | undefined) ?? null;
const REVIEW_START =
  (import.meta.env.VITE_REVIEW_START as string | undefined) ?? null;
const REVIEW_END =
  (import.meta.env.VITE_REVIEW_END as string | undefined) ?? null;

const pad = (n: number) => String(n).padStart(2, "0");

function parseDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

const biddingStartDate = parseDate(BIDDING_START);
const biddingEndDate = parseDate(BIDDING_END);
const reviewStartDate = parseDate(REVIEW_START);
const reviewEndDate = parseDate(REVIEW_END);

type Phase =
  | "pre-bidding"
  | "bidding"
  | "between-bidding-review"
  | "review"
  | "post-review";

function getPhase(now: Date): Phase {
  if (
    !biddingStartDate ||
    !biddingEndDate ||
    !reviewStartDate ||
    !reviewEndDate
  ) {
    return "pre-bidding";
  }

  if (now < biddingStartDate) return "pre-bidding";
  if (now >= biddingStartDate && now <= biddingEndDate) return "bidding";
  if (now > biddingEndDate && now < reviewStartDate)
    return "between-bidding-review";
  if (now >= reviewStartDate && now <= reviewEndDate) return "review";

  return "post-review";
}

/* =========================== UI auxiliar =========================== */

function SoftCard(props: {
  children: React.ReactNode;
  className?: string;
}) {
  const base =
    "rounded-2xl bg-slate-100/70 px-5 py-4 shadow-sm ring-1 ring-black/5 transition";
  return (
    <div className={`${base} ${props.className ?? ""}`}>
      {props.children}
    </div>
  );
}

// Porcentaje para la barra. Con total 0 devuelve 0 (evita dividir por cero).
const percent = (done: number, total: number) =>
  total > 0 ? Math.round((done / total) * 100) : 0;

const LOAD_ERROR_TITLE = "No se pudieron cargar tus artículos.";

// Mensaje que manda el backend en { "error": "..." }. null si no hay uno
// (por ejemplo, si el backend está apagado o respondió con una página de error).
function backendErrorMessage(err: unknown): string | null {
  if (isAxiosError(err)) {
    const msg = (err.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return null;
}

// Tarjeta para los estados de la lista: sin conferencia, sin asignaciones y error.
function StateCard(props: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "default" | "error";
}) {
  const titleColor = props.tone === "error" ? "text-rose-700" : "text-slate-800";
  return (
    <div className="rounded-2xl bg-slate-50 px-6 py-8 text-center shadow-sm ring-1 ring-black/5">
      <p className={`text-base font-semibold ${titleColor}`}>{props.title}</p>
      {props.description && (
        <p className="mt-1 text-sm text-slate-500">{props.description}</p>
      )}
      {props.action && (
        <div className="mt-4 flex justify-center">{props.action}</div>
      )}
    </div>
  );
}

// Esqueleto de carga (no existe el componente ui/skeleton).
function ListSkeleton() {
  return (
    <div role="status" className="space-y-3">
      <span className="sr-only">Cargando artículos…</span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl bg-slate-200/70"
        />
      ))}
    </div>
  );
}

/* ====================== Bloque de artículos asignados ====================== */

type ReviewStatus = "pending" | "draft" | "completed";

interface UiRow {
  id: number;
  title: string;
  status: ReviewStatus;
}

interface ArticleCardProps {
  article: UiRow;
  onAction?: (article: UiRow) => void;
  selected?: boolean;
  flashing?: boolean;
}

const STATUS_UI = {
  pending: {
    label: "Pendiente",
    badgeClass:
      "text-rose-700 bg-rose-50 ring-1 ring-rose-200 dark:text-rose-200 dark:bg-rose-900/30 dark:ring-rose-800",
    cta: "Revisar" as const,
  },
  draft: {
    label: "Borrador",
    badgeClass:
      "text-amber-700 bg-amber-50 ring-1 ring-amber-200 dark:text-amber-200 dark:bg-amber-900/30 dark:ring-amber-800",
    cta: "Editar borrador" as const,
  },
  completed: {
    label: "Completado",
    badgeClass:
      "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-800",
    cta: "Ver revisiones" as const,
  },
} as const;

// El backend informa "published"; esta pantalla lo muestra como "completed".
const STATUS_FROM_API: Record<ReviewerAssignment["review_status"], ReviewStatus> = {
  pending: "pending",
  draft: "draft",
  published: "completed",
};

const toRow = (r: ReviewerAssignment): UiRow => ({
  id: r.article.id,
  title: r.article.title,
  status: STATUS_FROM_API[r.review_status],
});

/* -------------- ArticleCard con badge + botón alineados -------------- */

function ArticleCard({
  article,
  onAction,
  selected,
  flashing,
}: ArticleCardProps) {
  const conf = STATUS_UI[article.status];

  return (
    <div
      id={`art-${article.id}`}
      tabIndex={-1}
      className={[
        "rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 md:p-5 transition-all duration-500 ease-out flex flex-col gap-4",
        selected ? "ring-2 ring-sky-400 ring-offset-2" : "ring-1 ring-transparent",
        flashing ? "bg-sky-50/70 shadow-md scale-[1.01]" : "",
      ].join(" ")}
    >
      {/* Título arriba */}
      <h3 className="text-slate-900 dark:text-slate-100 font-semibold leading-snug">
        {article.title}
      </h3>

      {/* FILA: estado + botón */}
      <div className="flex items-center justify-between">
        <span
          className={
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium " +
            conf.badgeClass
          }
        >
          {conf.label}
        </span>

        <Button
          onClick={() => onAction?.(article)}
          className="h-full min-w-[150px] justify-center rounded-md px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950"
        >
          {conf.cta}
        </Button>
      </div>
    </div>
  );
}

/* -------------- Sección de una sesión: título, progreso y tarjetas -------------- */

interface SessionSectionProps {
  title: string;
  // Sin "progress" no se dibuja la barra (grupo de artículos sin sesión).
  progress?: { published: number; total: number };
  rows: UiRow[];
  onAction: (article: UiRow) => void;
  selectedId: number | null;
  flashId: number | null;
}

function SessionSection({
  title,
  progress,
  rows,
  onAction,
  selectedId,
  flashId,
}: SessionSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        {progress && (
          <span className="shrink-0 text-sm text-slate-600">
            {progress.published}/{progress.total} revisados
          </span>
        )}
      </div>

      {progress && (
        <Progress
          value={percent(progress.published, progress.total)}
          aria-label={`Progreso de ${title}`}
        />
      )}

      <div className="space-y-3">
        {rows.map((a) => (
          <ArticleCard
            key={a.id}
            article={a}
            onAction={onAction}
            selected={selectedId === a.id}
            flashing={flashId === a.id}
          />
        ))}
      </div>
    </section>
  );
}

/* =============================== Componente =============================== */

export default function ReviewsIndex() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { selectedRole } = useRole();

  // normalizar rol y obtener conferenceId si el rol seleccionado es reviewer/revisor
  const roleKey = String(selectedRole?.role ?? "").toLowerCase().trim();
  const isReviewerRole =
    roleKey === "reviewer" || roleKey === "revisor" || roleKey.startsWith("rev");
  const selectedConferenceId = isReviewerRole ? selectedRole?.conferenceId : undefined;
  const conferenceName = isReviewerRole ? selectedRole?.conferenceName : undefined;

  const phase = getPhase(new Date());

  const reviewCountdown = useCountdown(REVIEW_END || undefined);

  const reviewDhm = `${pad(reviewCountdown.days)}:${pad(
    reviewCountdown.hours
  )}:${pad(reviewCountdown.minutes)}`;

  /* ---- Carga de datos: un solo request al backend ---- */

  // Las asignaciones se piden solo con usuario, fase de revisión y conferencia
  // elegida. Al cambiar la conferencia cambia la queryKey y se vuelve a pedir.
  // El revisor lo identifica el backend por el token: no se manda su id.
  const queryEnabled =
    !!auth.user && phase === "review" && selectedConferenceId != null;

  const {
    data: assignmentsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["reviewer", "assignments", selectedConferenceId],
    queryFn: () => getMyAssignments({ conferenceId: selectedConferenceId }),
    enabled: queryEnabled,
    // Al volver desde el formulario de revisión siempre se actualiza el estado.
    refetchOnMount: "always",
  });

  const loading = queryEnabled && isLoading;

  // Un toast por cada fallo de carga (React Query ya agotó sus reintentos).
  useEffect(() => {
    if (isError) toast.error(backendErrorMessage(error) ?? LOAD_ERROR_TITLE);
  }, [isError, error]);

  // Lista plana: se usa para saber si hay algo que mostrar.
  const data: UiRow[] = useMemo(
    () => (assignmentsData?.results ?? []).map(toRow),
    [assignmentsData]
  );

  // Agrupa las tarjetas por sesión. Los totales de cada barra vienen del
  // backend (stats.by_session); acá solo se reparten los artículos.
  const groups = useMemo(() => {
    const bySession = new Map<number, UiRow[]>();
    const withoutSession: UiRow[] = [];

    for (const r of assignmentsData?.results ?? []) {
      if (!r.session) {
        withoutSession.push(toRow(r));
        continue;
      }
      const list = bySession.get(r.session.id) ?? [];
      list.push(toRow(r));
      bySession.set(r.session.id, list);
    }

    const sessions = (assignmentsData?.stats.by_session ?? []).map((s) => ({
      id: s.session_id,
      title: s.title,
      published: s.published,
      total: s.total,
      rows: bySession.get(s.session_id) ?? [],
    }));

    return { sessions, withoutSession };
  }, [assignmentsData]);

  const reviewedCount = assignmentsData?.stats.published ?? 0;
  const assignedCount = assignmentsData?.stats.total ?? 0;
  const pendingCount = assignmentsData?.stats.pending ?? 0;
  const draftCount = assignmentsData?.stats.draft ?? 0;

  /* ------------------- Resaltado del artículo al volver del formulario ------------------- */

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get("selected");
    const id = v ? Number(v) : null;
    setSelectedId(id);
    setFlashId(id);
  }, []);

  useEffect(() => {
    if (!flashId) return;
    const t = setTimeout(() => setFlashId(null), 1200);
    return () => clearTimeout(t);
  }, [flashId]);

  useEffect(() => {
    if (loading || !selectedId) return;
    const el = document.getElementById(`art-${selectedId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, selectedId]);

  const handleAction = useCallback(
    (article: UiRow) => {
      navigate({
        to: "/reviewer/review/$articleId",
        params: { articleId: String(article.id) },
      });
    },
    [navigate]
  );

  const content = useMemo(() => {
    // 1) Sin conferencia elegida: todavía no hay nada que pedir.
    if (selectedConferenceId == null)
      return (
        <StateCard
          title="Elegí una conferencia para ver tus artículos."
          description="Seleccioná tu rol de revisor en una conferencia desde tu panel."
          action={
            <Button
              onClick={() => navigate({ to: "/dashboard" })}
              className="bg-slate-900 text-white font-medium hover:bg-slate-800"
            >
              Ir a mi panel
            </Button>
          }
        />
      );

    // 2) Cargando.
    if (loading) return <ListSkeleton />;

    // 3) Error de carga: nunca se muestra una lista de reemplazo.
    if (isError)
      return (
        <StateCard
          tone="error"
          title={LOAD_ERROR_TITLE}
          description={backendErrorMessage(error) ?? undefined}
          action={
            <Button
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-slate-900 text-white font-medium hover:bg-slate-800"
            >
              {isFetching ? "Reintentando…" : "Reintentar"}
            </Button>
          }
        />
      );

    // 4) Conferencia elegida pero sin artículos asignados.
    if (!data.length)
      return (
        <StateCard
          title={`Todavía no tenés artículos asignados${
            conferenceName ? ` en ${conferenceName}` : ""
          }.`}
          description="Cuando el chair te asigne artículos, van a aparecer acá."
        />
      );

    // 5) Lista agrupada por sesión.
    return (
      <div className="space-y-8">
        {groups.sessions.map((g) => (
          <SessionSection
            key={g.id}
            title={g.title}
            progress={{ published: g.published, total: g.total }}
            rows={g.rows}
            onAction={handleAction}
            selectedId={selectedId}
            flashId={flashId}
          />
        ))}

        {groups.withoutSession.length > 0 && (
          <SessionSection
            title="Sin sesión"
            rows={groups.withoutSession}
            onAction={handleAction}
            selectedId={selectedId}
            flashId={flashId}
          />
        )}
      </div>
    );
  }, [
    selectedConferenceId,
    conferenceName,
    data,
    groups,
    loading,
    isError,
    isFetching,
    error,
    refetch,
    navigate,
    handleAction,
    selectedId,
    flashId,
  ]);

  /* ============================ Render principal ============================ */

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 md:max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bienvenido, Revisor</h1>
        <div className="mt-2">
          <ReviewerConferenceSwitcher />
        </div>
        <Button
          onClick={() => navigate({ to: "/reviewer/history" })}
          className="bg-slate-700 hover:bg-slate-600 text-white font-medium"
        >
          Ver historial
        </Button>
      </div>

      {phase === "review" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {/* No clickable */}
            <SoftCard>
              <div className="flex h-full flex-col items-center justify-center">
                <div className="text-3xl font-semibold tracking-tight">
                  {reviewDhm}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Días | Horas | Minutos
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Para finalizar revisión
                </div>
              </div>
            </SoftCard>

            <SoftCard>
              <div className="flex h-full flex-col items-center justify-center">
                <div className="text-3xl font-semibold tracking-tight">
                  {reviewedCount}/{assignedCount}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Artículos revisados
                </div>
                <Progress
                  className="mt-3"
                  value={percent(reviewedCount, assignedCount)}
                  aria-label="Progreso de la conferencia"
                />
                <div className="mt-2 text-center text-xs text-slate-500">
                  Pendientes: {pendingCount} · Borradores: {draftCount}
                </div>
              </div>
            </SoftCard>
          </div>

          <section className="mt-8">
            <h2 className="mb-4 text-2xl font-semibold">Tus Artículos</h2>
            <hr className="mb-4 border-slate-200" />

            {auth.isLoading ? (
              <p className="text-slate-600">Verificando usuario…</p>
            ) : !auth.user ? (
              <p>Debes iniciar sesión.</p>
            ) : (
              content
            )}
          </section>
        </>
      ) : null}

      {phase !== "review" &&
        phase !== "bidding" &&
        phase !== "between-bidding-review" && (
          <div className="mt-10 rounded-2xl bg-slate-50 px-6 py-8 text-center text-slate-700 shadow-sm">
            <p className="text-lg font-semibold">
              No hay nada para hacer por ahora…
            </p>
            <p className="text-sm text-slate-500">
              Cuando se habilite un nuevo ciclo, tus artículos aparecerán aquí.
            </p>
          </div>
        )}
    </div>
  );
}
