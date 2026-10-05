// GRUPO 1: botón "Rechazar" con diálogo y motivo opcional (lo ve el chair)
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { rejectInvitationSchema } from '@/lib/validations';
import { rejectInvitation } from '@/services/reviewerServices';
import { handleInvitationActionError, INVITATIONS_QUERY_KEY } from './invitationActionErrors';

const MAX_REASON_LENGTH = 500;

interface Props {
  invitationId: number;
  conferenceTitle: string;
  disabled?: boolean;
  onRejected?: () => void;
  className?: string;
}

export function RejectInvitationButton({ invitationId, conferenceTitle, disabled, onRejected, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (validReason?: string) => rejectInvitation(invitationId, validReason),
    onSuccess: async () => {
      closeDialog();
      toast.success('Invitación rechazada');
      await queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY });
      onRejected?.();
    },
    onError: (error) => {
      let isReasonError = false;
      handleInvitationActionError(error, {
        queryClient,
        goToList: () => navigate({ to: '/reviewer/invitations' }),
        onInvalidReason: (message) => {
          isReasonError = true;
          setReasonError(message);
        },
      });
      // Si el error es del motivo, el diálogo queda abierto para corregirlo
      if (!isReasonError) closeDialog();
    },
  });

  function closeDialog() {
    setOpen(false);
    setReason('');
    setReasonError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = rejectInvitationSchema.safeParse({ reason });
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? 'Motivo inválido');
      return;
    }
    setReasonError(null);
    mutation.mutate(parsed.data.reason || undefined);
  }

  const atLimit = reason.length >= MAX_REASON_LENGTH;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : !mutation.isPending && closeDialog())}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn('border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800', className)}
          disabled={disabled || mutation.isPending}
        >
          {mutation.isPending ? <Loader2 className="animate-spin" /> : <X />}
          Rechazar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <DialogHeader>
            <DialogTitle>¿Rechazar la invitación?</DialogTitle>
            <DialogDescription>
              No vas a formar parte del comité de revisores de <strong>{conferenceTitle}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-2">
            <Label htmlFor={`reject-reason-${invitationId}`}>Motivo (opcional)</Label>
            <Textarea
              id={`reject-reason-${invitationId}`}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              placeholder="Por ejemplo: no tengo disponibilidad en esas fechas"
              rows={4}
              maxLength={MAX_REASON_LENGTH}
              // Ancho fijo: el texto baja de línea (incluso palabras largas) y scrollea en vez de agrandar el diálogo
              className="field-sizing-fixed h-28 resize-none overflow-y-auto wrap-anywhere"
              aria-invalid={reasonError ? true : undefined}
              aria-describedby={`reject-reason-help-${invitationId}`}
              disabled={mutation.isPending}
            />
            <div id={`reject-reason-help-${invitationId}`} className="flex justify-between gap-2 text-xs">
              <span className="text-destructive">{reasonError}</span>
              <span className={cn('shrink-0 text-muted-foreground', atLimit && 'font-medium text-amber-700')}>
                {reason.length}/{MAX_REASON_LENGTH}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">El motivo lo ven los chairs de la conferencia.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog} disabled={mutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="animate-spin" />}
              Rechazar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
