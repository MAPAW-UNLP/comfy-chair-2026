import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Plus, Trash2, UserRoundCheck } from 'lucide-react';
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
import { getSession, type Session } from '@/services/sessionServices';
import {
  getCommonUsers,
  updateConferenceUserRole,
  type ChairSummary,
  type User,
} from '@/services/userServices';

interface ResolveSessionChairDialogProps {
  sessionId: number;
  onComplete: () => void;
  onClose: () => void;
}

function getErrorDetails(error: unknown): { code?: string; message: string } {
  if (axios.isAxiosError<{ code?: string; detail?: string; error?: string }>(error)) {
    return {
      code: error.response?.data?.code,
      message:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
  };
}

export default function ResolveSessionChairDialog({
  sessionId,
  onComplete,
  onClose,
}: ResolveSessionChairDialogProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [commonUsers, setCommonUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [replacingChair, setReplacingChair] = useState<ChairSummary | null>(null);
  const [replacementUserId, setReplacementUserId] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [sessionData, users] = await Promise.all([
        getSession(String(sessionId)),
        getCommonUsers(),
      ]);
      setSession(sessionData);
      setCommonUsers(users);
    } catch (error) {
      console.error('Error loading session chair resolution data:', error);
      setLoadError(getErrorDetails(error).message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const conferenceId = session?.conference?.id;
  const conferenceTitle = session?.conference?.title ?? 'Conferencia';
  const currentChairs = session?.chairs_detail ?? [];
  const currentChairIds = new Set(currentChairs.map((chair) => chair.id));
  const availableUsersToAdd = commonUsers.filter((candidate) => !currentChairIds.has(candidate.id));
  const replacementCandidates = commonUsers.filter(
    (candidate) =>
      candidate.id !== replacingChair?.id && !currentChairIds.has(candidate.id)
  );

  const handleAddChair = async () => {
    if (!selectedUserId || !session || conferenceId === undefined) return;
    setSaving(true);
    try {
      await updateConferenceUserRole(conferenceId, Number(selectedUserId), {
        role: 'session_chair',
        action: 'add',
        session_id: session.id,
      });
      setSelectedUserId('');
      toast.success('Se asignó el nuevo chair a la sesión.');
      onComplete();
      await loadData();
    } catch (error) {
      console.error('Error adding session chair:', error);
      toast.error(getErrorDetails(error).message || 'No se pudo asignar el chair.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveChair = async (chair: ChairSummary) => {
    if (!session || conferenceId === undefined) return;
    setSaving(true);
    try {
      await updateConferenceUserRole(conferenceId, chair.id, {
        role: 'session_chair',
        action: 'remove',
        session_id: session.id,
      });
      setReplacingChair(null);
      setReplacementUserId('');
      toast.success(`Se quitó a ${chair.full_name} como chair de la sesión.`);
      await loadData();
    } catch (error) {
      const details = getErrorDetails(error);
      if (details.code === 'last_session_chair') {
        setReplacingChair(chair);
        setReplacementUserId('');
        return;
      }
      console.error('Error removing session chair:', error);
      toast.error(details.message || 'No se pudo quitar el chair de la sesión.');
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceChair = async () => {
    if (!replacingChair || !replacementUserId || !session || conferenceId === undefined) return;
    const nextChairId = Number(replacementUserId);
    setSaving(true);
    try {
      await updateConferenceUserRole(conferenceId, nextChairId, {
        role: 'session_chair',
        action: 'add',
        session_id: session.id,
      });
      try {
        await updateConferenceUserRole(conferenceId, replacingChair.id, {
          role: 'session_chair',
          action: 'remove',
          session_id: session.id,
        });
        toast.success('Se asignó el chair reemplazante y se quitó el anterior.');
      } catch (removeError) {
        const details = getErrorDetails(removeError);
        console.error('Replacement assigned, but removing previous chair failed:', removeError);
        toast.error(
          `El nuevo chair quedó asignado, pero no se pudo quitar el anterior: ${details.message}`
        );
      }
      setReplacingChair(null);
      setReplacementUserId('');
      onComplete();
      await loadData();
    } catch (error) {
      console.error('Error replacing session chair:', error);
      toast.error(getErrorDetails(error).message || 'No se pudo asignar el chair reemplazante.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !saving) onClose(); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:max-w-xl sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {session ? `Chairs de la sesión “${session.title}”` : 'Resolver chair de sesión'}
          </DialogTitle>
          <DialogDescription>
            {session
              ? `Conferencia “${conferenceTitle}”. Administrá únicamente el rol de chair de esta sesión.`
              : 'Cargando información de la sesión...'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando chairs y usuarios disponibles...
          </div>
        )}

        {loadError && !loading && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p>{loadError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadData()}
              className="mt-3"
            >
              Reintentar
            </Button>
          </div>
        )}

        {!loading && !loadError && session && (
          <div className="flex flex-col gap-4">
            <section className="rounded-lg border p-4">
              <h3 className="font-semibold">Chairs actuales</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                La sesión debe mantener al menos un chair activo en todo momento.
              </p>

              {currentChairs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Esta sesión no tiene chairs asignados actualmente.
                </p>
              ) : (
                <div className="flex flex-col divide-y">
                  {currentChairs.map((chair) => {
                    const isReplacingThis = replacingChair?.id === chair.id;
                    return (
                      <div key={chair.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{chair.full_name}</p>
                            <p className="text-xs text-muted-foreground">{chair.email}</p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={saving}
                            onClick={() => void handleRemoveChair(chair)}
                          >
                            <Trash2 size={15} />
                            Quitar rol
                          </Button>
                        </div>

                        {isReplacingThis && (
                          <div
                            role="alert"
                            className="mt-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-4 animate-in fade-in-0 slide-in-from-top-1 duration-200"
                          >
                            <div className="mb-3 flex items-start gap-2">
                              <UserRoundCheck className="mt-0.5 size-5 shrink-0 text-amber-800" />
                              <div>
                                <h4 className="font-semibold text-amber-950">
                                  Asigná un chair reemplazante
                                </h4>
                                <p className="text-sm text-amber-900">
                                  No se puede quitar a {chair.full_name} porque es el único chair activo de “{session.title}”. Elegí primero a quién asignar esa sesión.
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Select
                                value={replacementUserId}
                                onValueChange={setReplacementUserId}
                                disabled={saving || replacementCandidates.length === 0}
                              >
                                <SelectTrigger className="w-full bg-white">
                                  <SelectValue placeholder="Seleccioná un reemplazante" />
                                </SelectTrigger>
                                <SelectContent>
                                  {replacementCandidates.map((candidate) => (
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
                            {replacementCandidates.length === 0 && (
                              <p className="mt-2 text-sm text-amber-900">
                                No hay otros usuarios habilitados disponibles para asignar como chair.
                              </p>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={saving}
                              onClick={() => {
                                setReplacingChair(null);
                                setReplacementUserId('');
                              }}
                              className="mt-2"
                            >
                              Cancelar resolución
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-lg border p-4">
              <h3 className="font-semibold">Agregar chair a la sesión</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                Sumá un usuario habilitado como chair de esta sesión sin quitar a los actuales.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={saving || availableUsersToAdd.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccioná un usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsersToAdd.map((candidate) => (
                      <SelectItem key={candidate.id} value={String(candidate.id)}>
                        {candidate.full_name} ({candidate.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  disabled={saving || !selectedUserId}
                  onClick={() => void handleAddChair()}
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus size={15} />}
                  Asignar chair
                </Button>
              </div>
              {availableUsersToAdd.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  No hay más usuarios habilitados disponibles para sumar.
                </p>
              )}
            </section>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
