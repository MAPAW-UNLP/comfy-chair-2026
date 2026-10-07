// GRUPO 1: botón "Aceptar" con diálogo de confirmación
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { acceptInvitation } from '@/services/reviewerServices';
import {
  handleInvitationActionError,
  INVITATIONS_QUERY_KEY,
  REVIEWER_CONFERENCES_QUERY_KEY,
} from './invitationActionErrors';

// Botón que abre el diálogo: mismo estilo que "Rechazar", en verde
const TRIGGER_CLASSES = 'border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800';
// Botón de confirmación dentro del diálogo
const CONFIRM_CLASSES = 'bg-green-600 font-medium text-white hover:bg-green-700';

interface Props {
  invitationId: number;
  conferenceTitle: string;
  disabled?: boolean;
  onAccepted?: () => void;
  className?: string;
}

export function AcceptInvitationButton({ invitationId, conferenceTitle, disabled, onAccepted, className }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => acceptInvitation(invitationId),
    onSuccess: async () => {
      setOpen(false);
      toast.success('Invitación aceptada');
      // Las conferencias del revisor se refrescan para que el conmutador (3.3-FE) muestre la nueva
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: REVIEWER_CONFERENCES_QUERY_KEY }),
      ]);
      onAccepted?.();
    },
    onError: (error) => {
      setOpen(false);
      handleInvitationActionError(error, {
        queryClient,
        goToList: () => navigate({ to: '/reviewer/invitations' }),
      });
    },
  });

  const spinnerOr = (icon: React.ReactNode) => (mutation.isPending ? <Loader2 className="animate-spin" /> : icon);

  return (
    <AlertDialog open={open} onOpenChange={(next) => !mutation.isPending && setOpen(next)}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(TRIGGER_CLASSES, className)}
          disabled={disabled || mutation.isPending}
        >
          {spinnerOr(<Check />)}
          Aceptar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Aceptar la invitación?</AlertDialogTitle>
          <AlertDialogDescription>
            Vas a formar parte del comité de revisores de <strong>{conferenceTitle}</strong>. Después vas a
            poder participar del bidding de sus artículos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <Button className={CONFIRM_CLASSES} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {spinnerOr(<Check />)}
            Aceptar invitación
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
