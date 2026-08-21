// src/components/reviewer/Reviews.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getArticleById } from "@/services/articleServices";

type ReviewPublic = {
  id: number;
  reviewer_alias: string; // "Anónimo" u otro alias público
  score: number; // -3..+3
  comment: string;
  updated_at: string; // ISO o YYYY-MM-DD
};

type Article = {
  id: number;
  title: string;
  type: string | null;
  session?: string | null;
};

function scoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score > 0) return "default"; // verde por defecto del tema
  if (score === 0) return "secondary"; // neutro
  return "destructive"; // rojo
}

function formatDate(d: string) {
  try {
    const date = new Date(d);
    return date.toLocaleDateString();
  } catch {
    return d;
  }
}

// Fetch real de revisiones de otros revisores desde el backend
async function fetchOtherReviews(articleId: number): Promise<ReviewPublic[]> {
  if (!articleId) return [];
  const res = await fetch(`/api/articles/${articleId}/reviews/`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Error fetching reviews: ${res.status}`);
  }
  const data = await res.json();
  // Normalizar respuesta al shape ReviewPublic
  return (Array.isArray(data) ? data : data.results ?? []).map((r: any) => ({
    id: Number(r.id),
    reviewer_alias: r.reviewer_alias ?? r.reviewer?.alias ?? r.reviewer_name ?? "Anónimo",
    score: Number(r.score ?? r.rating ?? 0),
    comment: r.comment ?? r.opinion ?? r.body ?? "",
    updated_at: r.updated_at ?? r.updatedAt ?? r.created_at ?? "",
  }));
}

export default function OtherReviews() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { articleId?: string };

  const articleId = useMemo(
    () => Number(params?.articleId ?? 0),
    [params?.articleId]
  );

  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);
  const [rows, setRows] = useState<ReviewPublic[]>([]);
  const [err, setErr] = useState("");

  // Cargar info del artículo
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!articleId) return;
        const a = await getArticleById(articleId);
        if (!mounted) return;
        setArticle({
          id: a.id,
          title: a.title,
          type: a.type,
          session: (a as any).session || null,
        });
      } catch (e) {
        if (!mounted) return;
        // No bloquea la vista si falla; solo no muestra cabecera
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [articleId]);

  // Cargar revisiones de otros revisores
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const data = await fetchOtherReviews(articleId);
        if (!mounted) return;
        // Ordenar por fecha de actualización desc
        const sorted = [...data].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setRows(sorted);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "No se pudieron cargar las revisiones.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [articleId]);

  const avg = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, r) => acc + r.score, 0);
    return Math.round((sum / rows.length) * 100) / 100;
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-3xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" onClick={() => navigate({ to: "/reviewer" })}>
          ⬅ Volver
        </Button>
        <h1 className="text-xl font-semibold">Revisiones de otros revisores</h1>
      </div>

      {/* Info artículo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {article ? (
              <>
                <span className="block">{article.title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {article.type ? `Tipo: ${article.type}` : "Tipo: —"}
                  {article.session ? ` • Sesión: ${article.session}` : ""}
                </span>
              </>
            ) : (
              <Skeleton className="h-6 w-2/3" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Promedio de puntuaciones:</span>
            <Badge variant={avg > 0 ? "default" : avg === 0 ? "secondary" : "destructive"}>
              {avg > 0 ? `+${avg}` : avg}
            </Badge>
            <span className="text-muted-foreground">
              {rows.length ? ` • (${rows.map((r) => (r.score > 0 ? `+${r.score}` : r.score)).join(", ")})` : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Estado de carga / error */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {!!err && !loading && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-red-600">{err}</p>
          </CardContent>
        </Card>
      )}

      {/* Listado de revisiones */}
      {!loading && !err && (
        <div className="space-y-4">
          {rows.map((rev) => (
            <Card key={rev.id}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    🧑 {rev.reviewer_alias}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={scoreBadgeVariant(rev.score)}>
                      {rev.score > 0 ? `+${rev.score}` : rev.score}
                    </Badge>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-muted-foreground">
                      Última actualización: {formatDate(rev.updated_at)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm leading-relaxed">{rev.comment}</p>
              </CardContent>
            </Card>
          ))}

          {!rows.length && (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">
                  Aún no hay revisiones de otros revisores para este artículo.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => navigate({ to: "/reviewer" })}>
          ⬅ Volver a mis revisiones
        </Button>
      </div>
    </div>
  );
}
