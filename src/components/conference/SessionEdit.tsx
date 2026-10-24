/* Componente para editar una sesión existente */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import SessionForm, { type SessionFormData } from './SessionForm';
import { toast } from 'sonner';
import { updateSession, type Session } from '@/services/sessionServices';
import { Edit } from 'lucide-react';
import { getCommonUsers, type User } from '@/services/userServices';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from '@tanstack/react-router';

type EditarSessionProps = {
  session: Session;
  onSessionUpdated?: () => void | Promise<void>;
  trigger?: React.ReactNode;
  initiallyOpen?: boolean;
  returnToUserId?: string;
};

export default function EditarSession({
  session,
  onSessionUpdated,
  trigger,
  initiallyOpen = false,
  returnToUserId,
}: EditarSessionProps) {
  const [open, setOpen] = useState(initiallyOpen);
  const [isLoading, setIsLoading] = useState(false);
  const [chairs, setChairs] = useState<User[] | []>([]);
  const {user}= useAuth()
  const navigate = useNavigate()


  // Datos iniciales del formulario
  const initialData: Partial<SessionFormData> = {
    title: session.title,
    deadline: session.deadline ? new Date(session.deadline) : undefined,
    capacity: session.capacity,
    selectionMethod: session.threshold_percentage ? 'corte_fijo' : 'mejores',
    percentage: session.threshold_percentage ?? undefined,
    threshold: session.improvement_threshold ?? undefined,
    chairs: chairs, 
  };

  const handleSubmit = async (data: SessionFormData) => {
    setIsLoading(true);
    try {
      // Preparar los datos para enviar al backend
      const sessionData = {
        title: data.title,
        deadline: data.deadline?.toISOString().split('T')[0], // Solo la fecha (YYYY-MM-DD)
        capacity: data.capacity,
        conference_id: session.conference?.id,
        chairs: data.chairs.map((ch) => ch.id), // Enviar solo los IDs de los chairs
        threshold_percentage: data.selectionMethod === 'corte_fijo' ? data.percentage : undefined,
        improvement_threshold: data.selectionMethod === 'mejores' ? data.threshold : undefined,
      };

      await updateSession(session.id.toString(), sessionData, session.conference!.id.toString(), user!.id.toString());

      toast.success('Sesión actualizada exitosamente');
      setOpen(false);
      await onSessionUpdated?.();
      if (returnToUserId) {
        navigate({
          to: '/users',
          search: { deshabilitar: returnToUserId },
        });
      }
    } catch (error: unknown) {
      console.error('Error al actualizar la sesión:', error);
      toast.error(
        error instanceof Error ? error.message : 'Error al actualizar la sesión'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

    useEffect(() => {
      const fetchChairs = async () => {
        const data = await getCommonUsers();
        setChairs(data.filter((user) => session.chairs?.includes(user.id)));
      };
      fetchChairs();

    }, [session]);

  return (
    <Dialog open={open} onOpenChange={setOpen} >
      {/* Trigger del modal */}
      <DialogTrigger asChild >
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={(e) => e.stopPropagation()} // evita que el click del botón abra redirect
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      {/* Contenido del modal */}
      <DialogContent
        className="max-w-[90vw] sm:max-w-[90vw] md:max-w-[90vw]"
        onClick={(e) => e.stopPropagation()} // evita que clicks dentro del modal disparen redirect
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Editar Sesión</DialogTitle>
        </DialogHeader>
        <SessionForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitButtonText="Guardar"
          conference={session.conference!}
        />
      </DialogContent>
    </Dialog>
  );
}
