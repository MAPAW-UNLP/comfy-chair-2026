import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  getArticleBySessionId,
  getArticlesByConferenceId,
} from "@/services/articleServices";
import { getMyBids, saveBid } from "@/services/biddingServices";
import { getSessionsByConference } from "@/services/sessionServices";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCountdown } from "@/utils/useCountdown";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";

type InteresLocal = "interesado" | "quizas" | "no" | "no_select";

// Fechas desde .env
const BIDDING_START = import.meta.env
  .VITE_BIDDING_START as string | undefined;
const BIDDING_END = import.meta.env
  .VITE_BIDDING_END as string | undefined;

function formatDMY(iso?: string) {
  if (!iso) return "xx-xx-20xx";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "xx-xx-20xx";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

// Backend -> UI
function mapChoiceToLocal(v?: string): InteresLocal {
  const s = (v ?? "").toLowerCase();
  if (s.includes("quiz")) return "quizas";
  if (s === "no_select" || s.includes("no_select")) return "no_select";
  if (s.includes("no")) return "no";
  if (s.includes("interes")) return "interesado";
  return "no_select"; // default inicial
}

// UI -> Backend
function mapLocalToChoice(
  v: InteresLocal
): "Interesado" | "Quizás" | "No Interesado" | "No_select" {
  if (v === "interesado") return "Interesado";
  if (v === "quizas") return "Quizás";
  if (v === "no") return "No Interesado";
  return "No_select";
}

function errorDelBackend(e: unknown, porDefecto: string): string {
  return (
    (isAxiosError<{ error?: string }>(e) && e.response?.data?.error) ||
    porDefecto
  );
}

export default function BiddingPage() {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [seleccion, setSeleccion] = useState<Record<number, InteresLocal>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});

  // 🔢 paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const navigate = useNavigate();
  const auth = useAuth();
  const reviewerId = auth.user ? Number(auth.user.id) : null;

  const search = useSearch({ from: "/_auth/reviewer/bidding" });
  const { selectedRole } = useRole();
  const conferenceId =
    search.conferenceId ??
    (selectedRole?.role === "revisor" ? selectedRole.conferenceId : undefined);
  const sessionId = search.sessionId;

  const articlesQuery = useQuery({
    queryKey: ["reviewer", "articles", conferenceId, sessionId],
    queryFn: () =>
      sessionId
        ? getArticleBySessionId(sessionId)
        : getArticlesByConferenceId(conferenceId!),
    enabled: !!conferenceId,
  });
  const bidsQuery = useQuery({
    queryKey: ["reviewer", "bids", conferenceId, sessionId],
    queryFn: () => getMyBids({ conferenceId, sessionId }),
    enabled: !!conferenceId,
  });
  const sessionsQuery = useQuery({
    queryKey: ["reviewer", "sessions", conferenceId],
    queryFn: () => getSessionsByConference(conferenceId!),
    enabled: !!conferenceId,
  });

  const articulos = useMemo(
    () => articlesQuery.data ?? [],
    [articlesQuery.data]
  );
  const sesiones = sessionsQuery.data ?? [];
  const bidPorArticulo = useMemo(
    () => new Map((bidsQuery.data ?? []).map((b) => [b.article, b.choice])),
    [bidsQuery.data]
  );
  const interesDe = (articleId: number): InteresLocal =>
    seleccion[articleId] ?? mapChoiceToLocal(bidPorArticulo.get(articleId));
  const isLoadingData = articlesQuery.isLoading || bidsQuery.isLoading;
  const loadError =
    articlesQuery.error ?? bidsQuery.error ?? sessionsQuery.error;
  const conferenceName =
    sesiones[0]?.conference?.title ??
    (selectedRole?.conferenceId === conferenceId
      ? selectedRole?.conferenceName
      : undefined);

  // ================== LÓGICA DE FECHAS (.env) ==================
  const biddingStartDate = BIDDING_START ? new Date(BIDDING_START) : null;
  const biddingEndDate = BIDDING_END ? new Date(BIDDING_END) : null;
  const hasBiddingWindow = !!biddingStartDate && !!biddingEndDate;

  // Cuenta regresiva hacia el fin del bidding
  const c = useCountdown(BIDDING_END || undefined);
  const now = new Date();

  const isEndReachedByMinute =
    c.isOver || (c.days === 0 && c.hours === 0 && c.minutes === 0);

  const isBeforeStart = hasBiddingWindow ? now < biddingStartDate! : false;
  const isOpen =
    hasBiddingWindow && !isEndReachedByMinute && now >= biddingStartDate!;
  const isClosed = hasBiddingWindow
    ? isEndReachedByMinute || now > biddingEndDate!
    : true;

  // Solo se puede editar si:
  //  - el bidding está abierto
  //  - y hay usuario autenticado
  const isEditable = isOpen && !!reviewerId;
  // ============================================================

  useEffect(() => {
    if (loadError) {
      toast.error(
        errorDelBackend(loadError, "No se pudieron cargar los artículos.")
      );
    }
  }, [loadError]);

  // Si cambia la cantidad de artículos o el pageSize, volver a página 1
  useEffect(() => {
    setPage(1);
  }, [articulos, pageSize]);

  // Si el bidding no está abierto, colapsar todo
  useEffect(() => {
    if (!isOpen) setExpanded({});
  }, [isOpen]);

  const totalPages = Math.max(1, Math.ceil(articulos.length / pageSize));
  const pageStart = (page - 1) * pageSize;
  const pageEnd = pageStart + pageSize;

  const currentItems = useMemo(
    () => articulos.slice(pageStart, pageEnd),
    [articulos, pageStart, pageEnd]
  );

  const goToPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    // scroll suave al top del listado
    requestAnimationFrame(() => {
      const el = document.getElementById("bidding-list-top");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleExpand = (id: number) =>
    setExpanded((s) => ({ ...s, [id]: !s[id] }));

  const handleChoose = async (articleId: number, value: InteresLocal) => {
    // Solo se puede editar si hay revisor logueado y el período está abierto
    if (!isEditable || !reviewerId) return;

    const current = interesDe(articleId);

    // toggle: misma opción -> No_select
    const nextLocal: InteresLocal = current === value ? "no_select" : value;
    const backendChoice = mapLocalToChoice(nextLocal);

    // update optimista para evitar “titilar”
    setSeleccion((s) =>
      s[articleId] === nextLocal ? s : { ...s, [articleId]: nextLocal }
    );
    setSaving((s) => ({ ...s, [articleId]: true }));
    try {
      await saveBid({
        article: articleId,
        value: backendChoice,
      });
    } catch (e) {
      toast.error(errorDelBackend(e, "No se pudo guardar el bid."));
      // rollback
      setSeleccion((s) => ({ ...s, [articleId]: current }));
    } finally {
      setSaving((s) => ({ ...s, [articleId]: false }));
    }
  };

  // Auth en carga
  if (auth.isLoading) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <p className="text-slate-600">Verificando usuario…</p>
      </div>
    );
  }

  // Caso: sin usuario logueado
  if (!auth.user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-slate-800">
          Debes iniciar sesión
        </h1>
        <p className="text-slate-600">
          Inicia sesión como revisor para poder completar el bidding de
          artículos.
        </p>
        <div className="mt-8 space-y-3">
          <Button
            className="w-full py-3 text-base"
            onClick={() =>
              navigate({
                to: "/login",
                search: { redirect: undefined, registered: undefined },
              })
            }
          >
            Ir a Iniciar Sesión
          </Button>
          <Button
            variant="outline"
            className="w-full py-3 text-base"
            onClick={() => navigate({ to: "/reviewer" })}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // ================== VISTAS SEGÚN FECHAS ==================

  // Caso: fechas mal configuradas
  if (!hasBiddingWindow) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-slate-800">
          Bidding no disponible
        </h1>
        <p className="text-slate-600">
          El período de bidding no está configurado correctamente.
        </p>
        <Button
          className="mt-8 w-full py-6 text-base"
          onClick={() => navigate({ to: "/reviewer" })}
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  // Antes de que arranque el bidding
  if (!isOpen && isBeforeStart) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-slate-800">
          Bidding aún no comenzó
        </h1>
        <p className="text-slate-600">
          El período de bidding estará disponible desde el{" "}
          <strong>{formatDMY(BIDDING_START)}</strong> hasta el{" "}
          <strong>{formatDMY(BIDDING_END)}</strong>.
        </p>
        <Button
          className="mt-8 w-full py-6 text-base"
          onClick={() => navigate({ to: "/reviewer" })}
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  // Después de que termine el bidding
  if (!isOpen && isClosed && !isBeforeStart) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-slate-800">
          Bidding finalizado
        </h1>
        <p className="text-slate-600">
          El período de bidding estuvo disponible hasta el{" "}
          <strong>{formatDMY(BIDDING_END)}</strong>. No es posible modificar tus
          preferencias en este momento.
        </p>
        <Button
          className="mt-8 w-full py-6 text-base"
          onClick={() => navigate({ to: "/reviewer" })}
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (!conferenceId) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-semibold text-slate-800">
          Elegí una conferencia
        </h1>
        <Button
          className="mt-8 w-full py-6 text-base"
          onClick={() => navigate({ to: "/reviewer" })}
        >
          Volver al inicio
        </Button>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
        <p className="text-slate-600">Cargando artículos…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="p-4 text-red-600">
        {errorDelBackend(loadError, "No se pudieron cargar los artículos.")}
      </p>
    );
  }

  // ================== VISTA NORMAL (BIDDING ABIERTO) ==================

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Bidding</h1>
      {conferenceName && (
        <p className="mt-1 text-base font-medium">{conferenceName}</p>
      )}
      <p className="mt-1 text-sm text-slate-600">
        Período: <strong>{formatDMY(BIDDING_START)}</strong> →{" "}
        <strong>{formatDMY(BIDDING_END)}</strong>
      </p>

      <Select
        value={sessionId ? String(sessionId) : "todas"}
        onValueChange={(v) =>
          navigate({
            to: "/reviewer/bidding",
            search: {
              conferenceId,
              sessionId: v === "todas" ? undefined : Number(v),
            },
          })
        }
      >
        <SelectTrigger className="mt-4 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas las sesiones</SelectItem>
          {sesiones.map((s) => (
            <SelectItem key={s.id} value={String(s.id)}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {articulos.length === 0 && (
        <p className="mt-6 text-center text-slate-600">
          Esta conferencia no tiene artículos para ofertar
        </p>
      )}

      {/* Controles de paginado (top) */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Resumen (oculto en mobile) */}
        <div className="hidden text-sm text-slate-600 sm:block">
          Mostrando{" "}
          <span className="font-medium">
            {articulos.length === 0 ? 0 : pageStart + 1}
          </span>
          –
          <span className="font-medium">
            {Math.min(pageEnd, articulos.length)}
          </span>{" "}
          de <span className="font-medium">{articulos.length}</span>
        </div>

        <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
          {/* Selector por página (oculto en mobile) */}
          <div className="hidden items-center gap-2 sm:flex">
            <label className="text-sm text-slate-600">Por página</label>
            <select
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>

          {/* Navegación */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              Anterior
            </Button>

            {/* Números de página (oculto en mobile) */}
            <div className="no-scrollbar hidden max-w-[280px] gap-1 overflow-x-auto px-1 sm:flex">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (Math.abs(p - page) > 3 && p !== 1 && p !== totalPages)
                  return null;
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      <div id="bidding-list-top" className="mt-6 space-y-6">
        {currentItems.map((a) => {
          const isOpenCard = !!expanded[a.id];
          const interes = interesDe(a.id);

          return (
            <article
              key={a.id}
              className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <header className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold leading-6">
                  {a.title}
                </h2>
                <button
                  type="button"
                  className="rounded p-1 hover:bg-gray-100"
                  aria-label={
                    isOpenCard ? "Ocultar descripción" : "Mostrar descripción"
                  }
                  onClick={() => toggleExpand(a.id)}
                >
                  {isOpenCard ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </header>

              <hr className="my-3 border-gray-200" />

              {isOpenCard && (
                <p className="mb-4 text-sm leading-6 text-gray-700">
                  {a.abstract?.trim() ||
                    "Descripción no disponible por el momento."}
                </p>
              )}

              {/* Botones mutuamente excluyentes; toggle → No_select */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!saving[a.id] || !isEditable}
                  aria-pressed={interes === "interesado"}
                  className={cn(
                    "min-w-[100px] justify-center transition-colors",
                    interes === "interesado" &&
                      "border-transparent bg-slate-900 text-white hover:bg-gray-400"
                  )}
                  onClick={() => handleChoose(a.id, "interesado")}
                >
                  Interesado
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!saving[a.id] || !isEditable}
                  aria-pressed={interes === "quizas"}
                  className={cn(
                    "min-w-[100px] justify-center transition-colors",
                    interes === "quizas" &&
                      "border-transparent bg-slate-900 text-white hover:bg-gray-400"
                  )}
                  onClick={() => handleChoose(a.id, "quizas")}
                >
                  Quizás
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!saving[a.id] || !isEditable}
                  aria-pressed={interes === "no"}
                  className={cn(
                    "min-w-[100px] justify-center transition-colors",
                    interes === "no" &&
                      "border-transparent bg-slate-900 text-white hover:bg-gray-400"
                  )}
                  onClick={() => handleChoose(a.id, "no")}
                >
                  No interesado
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Paginado inferior (no flotante) */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          Página <span className="font-medium">{page}</span> de{" "}
          <span className="font-medium">{totalPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <div className="sticky bottom-4 mt-8">
        <Button
          className="w-full py-6 text-base hover:bg-gray-600"
          onClick={() => navigate({ to: "/reviewer" })}
        >
          Salir
        </Button>
      </div>
    </div>
  );
}
