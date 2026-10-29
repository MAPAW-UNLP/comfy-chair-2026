import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Loader2, Plus, Trash2, UserRoundCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getArticlesByConferenceId, type Article } from '@/services/articleServices';
import { getSessionsByConference, type Session } from '@/services/sessionServices';
import {
  getCommonUsers,
  getReviewerAssignedArticleIds,
  updateConferenceUserRole,
  type ConferenceUser,
  type UpdateConferenceUserRolePayload,
  type User,
} from '@/services/userServices';

interface ConferenceUserRoleEditorProps {
  conferenceId: number;
  user: ConferenceUser;
  isAdmin: boolean;
  onUpdated: () => Promise<void>;
}

type ChairReplacement =
  | { role: 'conference_chair' }
  | { role: 'session_chair'; session: Session };

function getErrorDetails(error: unknown): { code?: string; message: string } {
  if (axios.isAxiosError<{ code?: string; detail?: string }>(error)) {
    return {
      code: error.response?.data?.code,
      message: error.response?.data?.detail || error.message,
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
  };
}

export default function ConferenceUserRoleEditor({
  conferenceId,
  user,
  isAdmin,
  onUpdated,
}: ConferenceUserRoleEditorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [reviewerArticleIds, setReviewerArticleIds] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [replacementUserId, setReplacementUserId] = useState('');
  const [chairReplacement, setChairReplacement] = useState<ChairReplacement | null>(null);
  const isReviewer = user.roles.includes('reviewer');

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [conferenceSessions, conferenceArticles, commonUsers, assignedArticleIds] = await Promise.all([
        getSessionsByConference(conferenceId),
        getArticlesByConferenceId(conferenceId),
        getCommonUsers(),
        isReviewer ? getReviewerAssignedArticleIds(user.id) : Promise.resolve([]),
      ]);
      setSessions(conferenceSessions);
      setArticles(conferenceArticles);
      setReviewerArticleIds(assignedArticleIds);
      setAvailableUsers(commonUsers.filter((candidate) => candidate.id !== user.id));
    } catch (error) {
      console.error('Error loading conference role editor data:', error);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar las sesiones, artículos y usuarios disponibles.'
      );
    } finally {
      setLoading(false);
    }
  }, [conferenceId, isReviewer, user.id]);

  useEffect(() => {
    if (open) void loadResources();
  }, [open, loadResources]);

  const performRoleUpdate = async (
    payload: UpdateConferenceUserRolePayload,
    successMessage: string
  ): Promise<boolean> => {
    try {
      setSaving(true);
      const response = await updateConferenceUserRole(conferenceId, user.id, payload);
      if (response.changed === false) {
        toast.info(response.detail || 'La persona ya tenía ese rol asignado.');
      } else {
        toast.success(successMessage);
      }
      await Promise.all([onUpdated(), loadResources()]);
      return true;
    } catch (error) {
      const details = getErrorDetails(error);
      if (
        details.code === 'last_session_chair' &&
        payload.role === 'session_chair' &&
        payload.action === 'remove' &&
        payload.session_id !== undefined
      ) {
        const session = sessions.find((item) => item.id === payload.session_id);
        if (session) {
          setChairReplacement({ role: 'session_chair', session });
          setReplacementUserId('');
          return false;
        }
      }
      if (
        details.code === 'last_conference_chair' &&
        payload.role === 'conference_chair' &&
        payload.action === 'remove'
      ) {
        setChairReplacement({ role: 'conference_chair' });
        setReplacementUserId('');
        return false;
      }
      console.error('Error updating conference user role:', error);
      toast.error(details.message || 'No se pudo actualizar el rol.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceChair = async () => {
    if (!chairReplacement || !replacementUserId) return;
    const replacementId = Number(replacementUserId);
    const addPayload: UpdateConferenceUserRolePayload = {
      role: chairReplacement.role,
      action: 'add',
      ...(chairReplacement.role === 'session_chair'
        ? { session_id: chairReplacement.session.id }
        : {}),
    };
    const removePayload: UpdateConferenceUserRolePayload = {
      ...addPayload,
      action: 'remove',
    };

    try {
      setSaving(true);
      await updateConferenceUserRole(conferenceId, replacementId, addPayload);
      try {
        await updateConferenceUserRole(conferenceId, user.id, removePayload);
        toast.success('Se asignó el chair reemplazante y se quitó el anterior.');
      } catch (removeError) {
        const details = getErrorDetails(removeError);
        console.error('Replacement was assigned, but previous chair removal failed:', removeError);
        toast.error(
          `El nuevo chair quedó asignado, pero no se pudo quitar el anterior: ${details.message}`
        );
      }
      setChairReplacement(null);
      setReplacementUserId('');
      await Promise.all([onUpdated(), loadResources()]);
    } catch (error) {
      console.error('Error assigning replacement chair:', error);
      toast.error(getErrorDetails(error).message || 'No se pudo asignar el chair reemplazante.');
    } finally {
      setSaving(false);
    }
  };

  const isConferenceChair = user.roles.includes('conference_chair');
  const userSessionChairIds = sessions
    .filter((session) => session.chairs?.includes(user.id))
    .map((session) => session.id);
  const articlesByReviewer = articles.filter((article) =>
    reviewerArticleIds.includes(article.id)
  );
  const availableReviewerArticles = articles.filter(
    (article) => !reviewerArticleIds.includes(article.id)
  );
  const sessionsWhereReviewerAssigned = sessions
    .map((session) => ({
      session,
      assignedArticles: articlesByReviewer.filter(
        (article) => article.session?.id === session.id
      ),
    }))
    .filter(({ assignedArticles }) => assignedArticles.length > 0);
  const reviewerArticlesWithoutSession = articlesByReviewer.filter(
    (article) => !article.session
  );
  const activeReplacementCandidates = availableUsers.filter(
    (candidate) =>
      !chairReplacement ||
      chairReplacement.role !== 'session_chair' ||
      !chairReplacement.session.chairs?.includes(candidate.id)
  );

  const addSessionChair = async (session: Session) => {
    await performRoleUpdate(
      { role: 'session_chair', action: 'add', session_id: session.id },
      `Se asignó a ${user.full_name} como chair de sesión.`
    );
  };

  const removeSessionChair = async (session: Session) => {
    await performRoleUpdate(
      { role: 'session_chair', action: 'remove', session_id: session.id },
      `Se quitó a ${user.full_name} como chair de sesión.`
    );
  };

  const addReviewer = async () => {
    if (!selectedArticleId) return;
    if (reviewerArticleIds.includes(Number(selectedArticleId))) {
      setSelectedArticleId('');
      toast.info('Este artículo ya está asignado a este revisor.');
      return;
    }

    const success = await performRoleUpdate(
      {
        role: 'reviewer',
        action: 'add',
        article_id: Number(selectedArticleId),
      },
      `Se asignó a ${user.full_name} como revisor del artículo.`
    );
    if (success) setSelectedArticleId('');
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="shrink-0"
        aria-label={`Editar roles de ${user.full_name}`}
      >
        <Edit size={15} />
        <span className="hidden sm:inline">Editar roles</span>
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setChairReplacement(null);
        }}
      >
        <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:max-w-2xl sm:p-6">
          <DialogHeader>
            <DialogTitle>Roles de {user.full_name}</DialogTitle>
            <DialogDescription>
              Administrá los roles de esta persona dentro de la conferencia.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando sesiones, artículos y usuarios...
            </div>
          )}

          {loadError && !loading && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p>{loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadResources()}
                className="mt-3"
              >
                Reintentar
              </Button>
            </div>
          )}

          {!loading && !loadError && (
            <div className="flex flex-col gap-5">
              {isAdmin && (
                <section className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">Chair de conferencia</h3>
                      <p className="text-sm text-muted-foreground">
                        {isConferenceChair
                          ? 'La persona tiene este rol para toda la conferencia.'
                          : 'La persona no tiene este rol.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isConferenceChair ? 'destructive' : 'default'}
                      disabled={saving}
                      onClick={() =>
                        void performRoleUpdate(
                          {
                            role: 'conference_chair',
                            action: isConferenceChair ? 'remove' : 'add',
                          },
                          isConferenceChair
                            ? 'Se quitó el rol de chair de conferencia.'
                            : 'Se asignó el rol de chair de conferencia.'
                        )
                      }
                    >
                      {isConferenceChair ? <Trash2 size={15} /> : <Plus size={15} />}
                      {isConferenceChair ? 'Quitar rol' : 'Asignar rol'}
                    </Button>
                  </div>
                </section>
              )}

              <section className="rounded-lg border p-4">
                <div className="mb-3">
                  <h3 className="font-semibold">Chair de sesión</h3>
                  <p className="text-sm text-muted-foreground">
                    Asigná o quitá el rol por sesión. Una sesión no puede quedar sin chair activo.
                  </p>
                </div>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Esta conferencia todavía no tiene sesiones.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y">
                    {sessions.map((session) => {
                      const assigned = userSessionChairIds.includes(session.id);
                      return (
                        <div
                          key={session.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{session.title}</p>
                            <p
                              className={`text-xs ${
                                assigned ? 'text-emerald-700' : 'text-muted-foreground'
                              }`}
                            >
                              {assigned ? 'Tiene rol de chair en esta sesión' : 'No es chair de esta sesión'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant={assigned ? 'outline' : 'default'}
                            disabled={saving}
                            onClick={() =>
                              void (assigned
                                ? removeSessionChair(session)
                                : addSessionChair(session))
                            }
                          >
                            {assigned ? <Trash2 size={15} /> : <Plus size={15} />}
                            {assigned ? 'Quitar' : 'Asignar'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-lg border p-4">
                <div className="mb-3">
                  <h3 className="font-semibold">Revisor</h3>
                  <p className="text-sm text-muted-foreground">
                    {isReviewer
                      ? 'Podés asignar revisiones de otros artículos. Al quitar el rol se eliminan todas sus asignaciones de revisión en la conferencia.'
                      : 'Para asignar el rol, elegí un artículo de esta conferencia.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={selectedArticleId}
                    onValueChange={setSelectedArticleId}
                    disabled={saving || availableReviewerArticles.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccioná un artículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableReviewerArticles.map((article) => (
                        <SelectItem key={article.id} value={String(article.id)}>
                          {article.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    disabled={
                      saving ||
                      !selectedArticleId ||
                      reviewerArticleIds.includes(Number(selectedArticleId))
                    }
                    onClick={() => void addReviewer()}
                  >
                    <Plus size={15} />
                    Asignar artículo
                  </Button>
                </div>
                {isReviewer && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={saving}
                    onClick={() =>
                      void performRoleUpdate(
                        { role: 'reviewer', action: 'remove' },
                        'Se quitó el rol de revisor y sus asignaciones de esta conferencia.'
                      )
                    }
                    className="mt-3"
                  >
                    <Trash2 size={15} />
                    Quitar todas las asignaciones
                  </Button>
                )}
                {availableReviewerArticles.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {articles.length === 0
                      ? 'No hay artículos disponibles para asignar como revisión.'
                      : 'Este usuario ya tiene asignados todos los artículos de la conferencia.'}
                  </p>
                )}
                {isReviewer && (
                  <div className="mt-4 border-t pt-3">
                    <h4 className="text-sm font-semibold">Sesiones donde revisa</h4>
                    {sessionsWhereReviewerAssigned.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-3">
                        {sessionsWhereReviewerAssigned.map(({ session, assignedArticles }) => (
                          <li key={session.id} className="rounded-md bg-muted/50 p-3">
                            <p className="text-sm font-medium">{session.title}</p>
                            <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                              {assignedArticles.map((article) => (
                                <li key={article.id}>{article.title}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        No tiene artículos asignados en sesiones de esta conferencia.
                      </p>
                    )}
                    {reviewerArticlesWithoutSession.length > 0 && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        También tiene {reviewerArticlesWithoutSession.length}{' '}
                        {reviewerArticlesWithoutSession.length === 1
                          ? 'artículo asignado sin sesión'
                          : 'artículos asignados sin sesión'}.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {chairReplacement && (
                <section className="rounded-lg border-2 border-amber-400 bg-amber-50 p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <UserRoundCheck className="mt-0.5 size-5 shrink-0 text-amber-800" />
                    <div>
                      <h3 className="font-semibold text-amber-950">
                        Asigná un chair reemplazante
                      </h3>
                      <p className="text-sm text-amber-900">
                        {chairReplacement.role === 'session_chair'
                          ? `No se puede quitar a ${user.full_name} porque es el único chair activo de “${chairReplacement.session.title}”. Elegí primero a quién asignar esa sesión.`
                          : `No se puede quitar a ${user.full_name} porque es el único chair activo de la conferencia. Elegí primero a quién asignar como chair.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Select
                      value={replacementUserId}
                      onValueChange={setReplacementUserId}
                      disabled={saving || activeReplacementCandidates.length === 0}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="Seleccioná un reemplazante" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeReplacementCandidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={String(candidate.id)}>
                            {candidate.full_name} ({candidate.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      disabled={saving || !replacementUserId}
                      onClick={() => void handleReplaceChair()}
                    >
                      {saving && <Loader2 className="size-4 animate-spin" />}
                      Asignar y quitar anterior
                    </Button>
                  </div>
                  {activeReplacementCandidates.length === 0 && (
                    <p className="mt-2 text-sm text-amber-900">
                      No hay otros usuarios habilitados disponibles para asignar como chair.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={saving}
                    onClick={() => setChairReplacement(null)}
                    className="mt-2"
                  >
                    Cancelar resolución
                  </Button>
                </section>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
