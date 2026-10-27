import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getArticleBySessionId, type Article } from '@/services/articleServices';
import {
  assignReviewerToArticle,
  getReviewersByArticle,
  type ReviewerInfo,
} from '@/services/reviewerServices';

interface ResolveReviewerAssignmentsDialogProps {
  sessionId: number;
  sessionTitle: string;
  conferenceTitle: string;
  assignedById: number;
  onClose: () => void;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string; error?: string }>(error)) {
    return error.response?.data?.detail || error.response?.data?.error || error.message;
  }
  return error instanceof Error ? error.message : 'No se pudo completar la asignación.';
}

export default function ResolveReviewerAssignmentsDialog({
  sessionId,
  sessionTitle,
  conferenceTitle,
  assignedById,
  onClose,
}: ResolveReviewerAssignmentsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [reviewersByArticle, setReviewersByArticle] = useState<Record<number, ReviewerInfo[]>>({});
  const [selectedReviewerByArticle, setSelectedReviewerByArticle] = useState<Record<number, string>>({});
  const [savingArticleId, setSavingArticleId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const sessionArticles = await getArticleBySessionId(sessionId);
        const reviewerLists = await Promise.all(
          sessionArticles.map(async (article) => [
            article.id,
            await getReviewersByArticle(article.id),
          ] as const)
        );
        if (!active) return;
        setArticles(sessionArticles);
        setReviewersByArticle(Object.fromEntries(reviewerLists));
      } catch (error) {
        if (!active) return;
        console.error('Error loading reviewers for session reassignment:', error);
        setLoadError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadAssignments();
    return () => {
      active = false;
    };
  }, [sessionId]);

  const handleAssign = async (article: Article) => {
    const reviewerId = Number(selectedReviewerByArticle[article.id]);
    if (!Number.isInteger(reviewerId) || reviewerId <= 0) return;

    setSavingArticleId(article.id);
    try {
      await assignReviewerToArticle(reviewerId, article.id, assignedById);
      setReviewersByArticle((current) => ({
        ...current,
        [article.id]: (current[article.id] ?? []).map((reviewer) =>
          reviewer.id === reviewerId ? { ...reviewer, assigned: true } : reviewer
        ),
      }));
      setSelectedReviewerByArticle((current) => ({ ...current, [article.id]: '' }));
      toast.success(`Se asignó un nuevo revisor al artículo "${article.title}".`);
    } catch (error) {
      console.error('Error assigning replacement reviewer:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setSavingArticleId(null);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Reasignar revisiones pendientes</DialogTitle>
          <DialogDescription>
            Sesión “{sessionTitle}” · Conferencia “{conferenceTitle}”. Elegí nuevos revisores para los artículos indicados en la notificación.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando artículos y revisores disponibles...
          </div>
        )}

        {loadError && !loading && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p>{loadError}</p>
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="mt-3">
              Cerrar
            </Button>
          </div>
        )}

        {!loading && !loadError && articles.length === 0 && (
          <p className="py-6 text-sm text-muted-foreground">
            No hay artículos asociados a esta sesión.
          </p>
        )}

        {!loading && !loadError && articles.length > 0 && (
          <div className="flex flex-col gap-3">
            {articles.map((article) => {
              const eligibleReviewers = (reviewersByArticle[article.id] ?? []).filter(
                (reviewer) =>
                  !reviewer.assigned &&
                  !article.authors.some((author) => author.id === reviewer.id)
              );
              const selectedReviewer = selectedReviewerByArticle[article.id] ?? '';

              return (
                <section key={article.id} className="rounded-md border p-3">
                  <h3 className="font-medium">{article.title}</h3>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={selectedReviewer}
                      onValueChange={(value) =>
                        setSelectedReviewerByArticle((current) => ({
                          ...current,
                          [article.id]: value,
                        }))
                      }
                      disabled={savingArticleId !== null || eligibleReviewers.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccioná un revisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleReviewers.map((reviewer) => (
                          <SelectItem key={reviewer.id} value={String(reviewer.id)}>
                            {reviewer.full_name} ({reviewer.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      disabled={!selectedReviewer || savingArticleId !== null}
                      onClick={() => void handleAssign(article)}
                    >
                      {savingArticleId === article.id && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      Asignar revisor
                    </Button>
                  </div>
                  {eligibleReviewers.length === 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay revisores habilitados sin asignar disponibles para este artículo.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
