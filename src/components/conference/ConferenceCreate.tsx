import { createConference } from '@/services/conferenceServices';
import { useNavigate } from '@tanstack/react-router';
import type { Conference } from './ConferenceApp';
import ConferenceForm from './ConferenceForm';
import type { User } from '@/services/userServices';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

function ConferenceCreate() {
  const navigate = useNavigate();
  const {user}= useAuth()

  const handleSubmit = async (conf: Omit<Conference, 'id'>, chairs: User[]) => {
    try {
      const data = await createConference(conf, chairs, user!.id);
      toast.success('Conferencia creada correctamente');
      navigate({ to: `/conference/${data.id}` });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4 mt-3">
      <ConferenceForm handleSubmit={handleSubmit} />
    </div>
  );
}

export default ConferenceCreate;
