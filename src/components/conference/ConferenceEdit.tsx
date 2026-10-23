import { Route } from '@/routes/_auth/conference/edit/$id';
import { updateConference } from '@/services/conferenceServices';
import { useNavigate } from '@tanstack/react-router';
import ConferenceForm from './ConferenceForm';
import type { ChairSummary } from '@/services/userServices';
import type { Conference } from './ConferenceApp';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

function ConferenceEdit() {
  const conferenciaInicial = Route.useLoaderData() as Conference;
  const navigate = useNavigate();
  const { deshabilitar } = Route.useSearch();
  const {user}= useAuth()

  const handleSubmit = async (conf: Omit<Conference, 'id'>, chairs: ChairSummary[]) => {
    const updatedConf = { ...conf };

    if (updatedConf.start_date === conferenciaInicial.start_date) {
      delete updatedConf.start_date;
    }
    if (updatedConf.end_date === conferenciaInicial.end_date) {
      delete updatedConf.end_date;
    }
    try {
      await updateConference(String(conferenciaInicial.id), updatedConf, chairs, user!.id);
      toast.success('Conferencia actualizada correctamente');
      if (deshabilitar) {
        navigate({
          to: '/users',
          search: { deshabilitar },
        });
        return;
      }
      navigate({ to: `/conference/${conferenciaInicial.id}` });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar la conferencia.');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start gap-4 mt-3">
      <ConferenceForm
        handleSubmit={handleSubmit}
        valorConferencia={conferenciaInicial}
        valorChairs={conferenciaInicial.chairs_detail}
      />
    </div>
  );
}

export default ConferenceEdit;
