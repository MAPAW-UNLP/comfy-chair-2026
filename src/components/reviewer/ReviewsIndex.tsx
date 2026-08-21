// ./reviewer/ReviewsIndex.tsx
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "@tanstack/react-router";

import { getAllArticles, type Article } from "@/services/articleServices";
import { getBidsByReviewer } from "@/services/biddingServices";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useCountdown } from "@/utils/useCountdown";
import {
  fetchAssignedArticles,
  type AssignedArticle,
} from "@/services/assignmentsServices";
import {
  hasPublishedReview,
  getOwnReviewByArticle,
} from "@/services/reviewerServices";
import { Button } from "../ui/button";

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

/* =============================== Componente =============================== */

export default function ReviewsIndex() {
  const navigate = useNavigate();
  const auth = useAuth();
  const reviewerId = Number(auth.user?.id ?? 1);
  const { selectedRole } = useRole();

  // normalizar rol y obtener conferenceId si el rol seleccionado es reviewer/revisor
  const roleKey = String(selectedRole?.role ?? "").toLowerCase().trim();
  const isReviewerRole =
    roleKey === "reviewer" || roleKey === "revisor" || roleKey.startsWith("rev");
  const selectedConferenceId = isReviewerRole ? selectedRole?.conferenceId : undefined;

  const phase = getPhase(new Date());

  const biddingCountdown = useCountdown(BIDDING_END || undefined);
  const reviewCountdown = useCountdown(REVIEW_END || undefined);

  const biddingDhm = `${pad(biddingCountdown.days)}:${pad(
    biddingCountdown.hours
  )}:${pad(biddingCountdown.minutes)}`;
  const reviewDhm = `${pad(reviewCountdown.days)}:${pad(
    reviewCountdown.hours
  )}:${pad(reviewCountdown.minutes)}`;

  const [articulos, setArticulos] = useState<Article[]>([]);
  const [articulosLoaded, setArticulosLoaded] = useState(false);
  const [bids, setBids] = useState<{ article: number; choice?: string }[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [assigned, setAssigned] = useState<AssignedArticle[] | null>(null);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [reviewedMap, setReviewedMap] = useState<Record<number, boolean>>({});

  const total = articulos.length;
  const completados = useMemo(
    () => bids.filter((b) => !!(b.choice && String(b.choice).trim())).length,
    [bids]
  );

  /* ---- Carga de datos ---- */

  useEffect(() => {
    (async () => {
      try {
        const arts = await getAllArticles();
        const userBids = auth.user ? await getBidsByReviewer(reviewerId) : [];
        setArticulos(arts);
        setBids(userBids);
        // marcar que ya cargamos los artículos (aunque sean 0)
        setArticulosLoaded(true);
        setErr(null);
      } catch {
        setErr("No se pudieron cargar los datos.");
        setArticulosLoaded(true); // evitar bloquear otros efectos en caso de error
      }
    })();
  }, [auth.user, reviewerId]);


  /**
   * Intenta obtener el id de la conferencia desde un Article (session -> conference).
   * Devuelve null si no se puede determinar.
   */
  function getArticleConferenceId(a: Article): number | null {
    // @ts-ignore
    const session = a?.session;
    if (!session) return null;

    // session puede venir como id (number/string) o como objeto
    if (typeof session === "number" || typeof session === "string") {
      // si session es solo un id no tenemos la info de conference aquí
      return null;
    }

    // session es objeto: buscar conference como id, string, o como objeto con id
    // @ts-ignore
    const conf = session.conference ?? session.conference_id ?? session.conferenceId ?? null;
    if (!conf) return null;

    if (typeof conf === "number") return conf;
    if (typeof conf === "string" && /^\d+$/.test(conf)) return Number(conf);

    // conf puede ser objeto { id: X, ... }
    if (typeof conf === "object" && conf !== null) {
      const id = conf.id ?? conf.pk ?? conf.conference_id ?? null;
      if (typeof id === "number") return id;
      if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
    }

    return null;
  }

  const lastFetchKey = React.useRef<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      // Esperar que la lista de artículos esté cargada para poder filtrar por sesión->conferencia
      if (!articulosLoaded) return;

      // Si el rol es revisor pero aún no tenemos conferenceId, no hagas la petición
      if (isReviewerRole && (selectedConferenceId === undefined || selectedConferenceId === null))
        return;

      // Construimos una "clave" para evitar refetches redundantes (misma conferencia / mismo reviewer / misma fase)
      const fetchKey = `${String(selectedConferenceId ?? "all")}:${String(reviewerId)}:${phase}`;
      if (lastFetchKey.current === fetchKey) return;
      lastFetchKey.current = fetchKey;

      // Si no estamos en fase / user -> limpiar y salir
      if (phase !== "review" || !auth.user) {
        if (alive) {
          setAssigned(null);
          setData([]);
          setReviewedMap({});
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        // 1) traer asignaciones (backend puede filtrar por conferenceId)
        const rows = await fetchAssignedArticles(reviewerId, selectedConferenceId);

        // 2) filtrar por conferencia usando la metadata de articulos.session -> conference
        let filtered = rows;
        if (selectedConferenceId && articulos.length > 0) {
          const articMap = new Map<number, Article>();
          for (const a of articulos) articMap.set(a.id, a);

          const tmp = rows.filter((r) => {
            const aid = Number(r.id);
            const art = articMap.get(aid);
            if (!art) return false;
            const confId = getArticleConferenceId(art);
            if (confId === null) return false;
            return Number(confId) === Number(selectedConferenceId);
          });

          // si queda vacío por inconsistencia, fallback a rows (evita mostrar vacío por error del mapper)
          if (tmp.length > 0) filtered = tmp;
        }

        // 3) calcular estado y reviewedMap en paralelo (Promise.all)
        const enriched = await Promise.all(
          filtered.map(async (a) => {
            const own = await getOwnReviewByArticle(a.id, reviewerId);
            const status: ReviewStatus = own?.is_published
              ? "completed"
              : own
              ? "draft"
              : "pending";
            return {
              id: a.id,
              title: a.title,
              status,
              ownPublished: Boolean(own?.is_published),
            };
          })
        );

        if (!alive) return;

        // 4) actualizar estados de una sola vez para evitar re-renders intermedios
        setAssigned(filtered);
        setData(enriched.map((e) => ({ id: e.id, title: e.title, status: e.status })));
        const map: Record<number, boolean> = {};
        enriched.forEach((e) => (map[e.id] = e.ownPublished));
        setReviewedMap(map);
      } catch (e) {
        setAssigned([]);
        setData([]);
        setReviewedMap({});
        // eslint-disable-next-line no-console
        console.error("Error cargando artículos asignados:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [articulosLoaded, reviewerId, phase, selectedConferenceId, auth.user]);

  const reviewedCount = useMemo(
    () => Object.values(reviewedMap).filter(Boolean).length,
    [reviewedMap]
  );

  /* ------------------- Datos para el listado en fase de review ------------------- */

  const [data, setData] = useState<UiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);

  // Estado por artículo basado en TU review
  const computeStatusFor = useCallback(
    async (articleId: number): Promise<ReviewStatus> => {
      try {
        const own = await getOwnReviewByArticle(articleId, reviewerId);

        if (own?.is_published) return "completed"; // tu review enviada
        if (own) return "draft";                   // tenés borrador
        return "pending";                          // no empezaste nada
      } catch {
        return "pending";
      }
    },
    [reviewerId]
  );

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
    if (!data.length) return <p className="text-slate-600">Sin asignar aún…</p>;

    return (
      <div className="space-y-3">
        {data.map((a) => (
          <ArticleCard
            key={a.id}
            article={a}
            onAction={handleAction}
            selected={selectedId === a.id}
            flashing={flashId === a.id}
          />
        ))}
      </div>
    );
  }, [data, loading, handleAction, selectedId, flashId]);

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
                  {reviewedCount}/{assigned?.length ?? 0}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Artículos revisados
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
