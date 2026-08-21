/* Componente para dar de alta una sesión en una conferencia */
import { useState } from 'react';
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
import { createSession } from '@/services/sessionServices';
import type { Conference } from './ConferenceApp';
import { useAuth } from '@/contexts/AuthContext';

type AltaSessionProps = {
  conference: Conference;
  onSessionCreated?: () => void;
  trigger?: React.ReactNode;
};

export default function AltaSession({
  conference,
  onSessionCreated,
  trigger,
}: AltaSessionProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {user}= useAuth()

  const handleSubmit = async (data: SessionFormData) => {
    setIsLoading(true);
    try {
      // Preparar los datos para enviar al backend
      const sessionData = {
        title: data.title,
        deadline: data.deadline?.toISOString().split('T')[0], // Solo la fecha (YYYY-MM-DD)
        capacity: data.capacity,
        chairs: data.chairs.map((ch) => ch.id), // Enviar solo los IDs de los chairs
        threshold_percentage:
          data.selectionMethod === 'corte_fijo' ? data.percentage : undefined,
        improvement_threshold:
          data.selectionMethod === 'mejores' ? data.threshold : undefined,
      };
      console.log('Creating session with data:', sessionData);
      await createSession(sessionData, Number(conference.id), user!.id);

      toast.success('Sesión creada exitosamente');
      setOpen(false);
      onSessionCreated?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Alta Sesión</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] md:max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Alta Sesión</DialogTitle>
        </DialogHeader>
        <SessionForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitButtonText="Guardar"
          conference={conference}
        />
      </DialogContent>
    </Dialog>
  );
}
