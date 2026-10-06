// ./reviewer/ReviewsIndex.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useCountdown } from "@/utils/useCountdown";
import {
  getMyAssignments,
  type ReviewStatus,
} from "@/services/reviewerServices";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

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

// Porcentaje para el Progress. Con total = 0 devuelve 0 (evita dividir por cero).
function toPercent(published: number, total: number): number {
  return total > 0 ? Math.round((published / total) * 100) : 0;
}

/* ====================== Bloque de artículos asignados ====================== */

interface UiRow {
  id: number;
  title: string;
  status: ReviewStatus;
  sessionId: number | null;
}

interface ArticleCardProps {
  article: UiRow;
  onAction?: (article: UiRow) => void;
  selected?: boolean;
  flashing?: boolean;
}

// Las claves coinciden con review_status del backend.
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
  published: {
    label: "Enviada",
    badgeClass:
      "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/30 dark:ring-emerald-800",
    cta: "Ver/editar revisión" as const,
  },
} as const;

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
      <div className="flex flex-wrap items-center justify-between gap-2">
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

/* ----------------------- Progreso por sesión ----------------------- */

interface SessionSection {
  key: string;
  title: string;
  total: number;
  published: number;
  rows: UiRow[];
}

function SessionBlock(props: {
  section: SessionSection;
  onAction: (article: UiRow) => void;
  selectedId: number | null;
  flashId: number | null;
}) {
  const { section, onAction, selectedId, flashId } = props;

  return (
    <section className="space-y-3">
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {section.title}
          </h3>
          <span className="shrink-0 text-sm text-slate-600 dark:text-slate-300">
            {section.published}/{section.total} enviadas
          </span>
        </div>
        <Progress
          value={toPercent(section.published, section.total)}
          className="h-2"
          aria-label={`Progreso de ${section.title}`}
        />
      </div>

      <div className="space-y-3">
        {section.rows.map((a) => (
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
    isError,
  } = useQuery({
    queryKey: ["reviewer", "assignments", selectedConferenceId],
    queryFn: () => getMyAssignments({ conferenceId: selectedConferenceId }),
    enabled: queryEnabled,
    // Al volver desde el formulario de revisión siempre se actualiza el estado.
    refetchOnMount: "always",
  });

  const loading = queryEnabled && isLoading;

  const data: UiRow[] = useMemo(
    () =>
      (assignmentsData?.results ?? []).map((r) => ({
        id: r.article.id,
        title: r.article.title,
        status: r.review_status,
        sessionId: r.session?.id ?? null,
      })),
    [assignmentsData]
  );

  // Contadores globales: salen tal cual de stats, sin recalcular en el cliente.
  const stats = assignmentsData?.stats;
  const publishedCount = stats?.published ?? 0;
  const totalCount = stats?.total ?? 0;
  const draftCount = stats?.draft ?? 0;
  const pendingCount = stats?.pending ?? 0;

  // Una sección por cada entrada de stats.by_session. Los artículos sin sesión
  // (o con una sesión que by_session no informa) van a un bloque "Sin sesión"
  // al final. Ese bloque no tiene entrada en stats, así que es el único
  // contador que se calcula acá.
  const sections: SessionSection[] = useMemo(() => {
    if (!stats) return [];

    const known = new Set(stats.by_session.map((s) => s.session_id));
    const grouped = new Map<number, UiRow[]>();
    const orphans: UiRow[] = [];

    for (const row of data) {
      if (row.sessionId != null && known.has(row.sessionId)) {
        const list = grouped.get(row.sessionId) ?? [];
        list.push(row);
        grouped.set(row.sessionId, list);
      } else {
        orphans.push(row);
      }
    }

    const result: SessionSection[] = stats.by_session.map((s) => ({
      key: `session-${s.session_id}`,
      title: s.title,
      total: s.total,
      published: s.published,
      rows: grouped.get(s.session_id) ?? [],
    }));

    if (orphans.length > 0) {
      result.push({
        key: "no-session",
        title: "Sin sesión",
        total: orphans.length,
        published: orphans.filter((r) => r.status === "published").length,
        rows: orphans,
      });
    }

    return result;
  }, [stats, data]);

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
    if (loading) return <p className="text-slate-600">Cargando…</p>;
    // Si falla la carga se muestra el error: nunca una lista de reemplazo.
    if (isError)
      return (
        <p className="text-rose-700">No se pudieron cargar tus artículos.</p>
      );
    if (!data.length) return <p className="text-slate-600">Sin asignar aún…</p>;

    return (
      <div className="space-y-8">
        {sections.map((section) => (
          <SessionBlock
            key={section.key}
            section={section}
            onAction={handleAction}
            selectedId={selectedId}
            flashId={flashId}
          />
        ))}
      </div>
    );
  }, [data, sections, loading, isError, handleAction, selectedId, flashId]);

  /* ============================ Render principal ============================ */

  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 md:max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bienvenido, Revisor</h1>
        <Button
          onClick={() => navigate({ to: "/reviewer/history" })}
          className="bg-slate-700 hover:bg-slate-600 text-white font-medium"
        >
          Ver historial
        </Button>
      </div>

      {phase === "review" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            {/* Resumen de la conferencia */}
            <SoftCard>
              <div className="flex h-full flex-col justify-center gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-3xl font-semibold tracking-tight">
                    {publishedCount}/{totalCount}
                  </div>
                  <div className="text-sm text-slate-600">
                    Revisiones enviadas
                  </div>
                </div>
                <Progress
                  value={toPercent(publishedCount, totalCount)}
                  className="h-2"
                  aria-label="Progreso de la conferencia"
                />
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Pendientes: {pendingCount}</span>
                  <span>Borradores: {draftCount}</span>
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
