import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { getConferenceById, updateConferencePeriods, type Conference } from '@/services/conferenceServices';
import { Button } from '@/components/ui/button';
import CustomCalendar from '@/components/conference/CustomCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { canManageSessions } from '@/components/conference/sessionPermissions';

type Periods = {
  submission_start: string;
  submission_end: string;
  review_start: string;
  review_end: string;
  bidding_start: string;
  bidding_end: string;
  camera_ready_deadline: string;
};

function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value?: Date): string {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ConferencePeriodsConfig() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conferenceId } = useSearch({ from: '/_auth/chairs/configuration' });
  const [conference, setConference] = useState<Conference | null>(null);
  const [submissionStart, setSubmissionStart] = useState<Date>();
  const [submissionEnd, setSubmissionEnd] = useState<Date>();
  const [reviewStart, setReviewStart] = useState<Date>();
  const [reviewEnd, setReviewEnd] = useState<Date>();
  const [biddingStart, setBiddingStart] = useState<Date>();
  const [biddingEnd, setBiddingEnd] = useState<Date>();
  const [cameraReadyDeadline, setCameraReadyDeadline] = useState<Date>();
  const [cameraReadyDeadlineError, setCameraReadyDeadlineError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const goToSessions = (id: string) => {
    navigate({
      to: '/chairs/conference/$conferenceId/sessions',
      params: { conferenceId: id },
    });
  };

  useEffect(() => {
    if (!conferenceId) {
      navigate({ to: '/chairs/select-session' });
      return;
    }

    getConferenceById(Number(conferenceId))
      .then((data) => {
        if (!data) {
          toast.error('No se pudo cargar la conferencia.');
          navigate({ to: '/chairs/select-session' });
          return;
        }
        if (!canManageSessions(user, data)) {
          toast.error('No tenés permiso para configurar las fechas de esta conferencia.');
          navigate({
            to: '/chairs/conference/$conferenceId/sessions',
            params: { conferenceId: String(data.id) },
          });
          return;
        }
        setConference(data);
        setSubmissionStart(parseDate(data.submission_start));
        setSubmissionEnd(parseDate(data.submission_end));
        setReviewStart(parseDate(data.review_start));
        setReviewEnd(parseDate(data.review_end));
        setBiddingStart(parseDate(data.bidding_start));
        setBiddingEnd(parseDate(data.bidding_end));
        setCameraReadyDeadline(parseDate(data.camera_ready_deadline));
      })
      .catch((err) => {
        if (err?.response?.status === 404) {
          toast.error('Conferencia no encontrada.');
          navigate({ to: '/chairs/select-session' });
        } else {
          toast.error('No se pudo cargar la conferencia.');
        }
      })
      .finally(() => setLoading(false));
  }, [conferenceId, navigate, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!conference?.id) return;
    if (!user?.id) {
      toast.error('No se pudo identificar al usuario.');
      return;
    }

    setCameraReadyDeadlineError(null);

    const periods: Periods = {
      submission_start: formatDate(submissionStart),
      submission_end: formatDate(submissionEnd),
      review_start: formatDate(reviewStart),
      review_end: formatDate(reviewEnd),
      bidding_start: formatDate(biddingStart),
      bidding_end: formatDate(biddingEnd),
      camera_ready_deadline: formatDate(cameraReadyDeadline),
    };

    if (
      periods.camera_ready_deadline &&
      periods.review_end &&
      periods.camera_ready_deadline < periods.review_end
    ) {
      setCameraReadyDeadlineError('El deadline de camera-ready no puede ser anterior al cierre de revisión.');
      return;
    }
    if (
      periods.camera_ready_deadline &&
      conference.end_date &&
      periods.camera_ready_deadline > conference.end_date
    ) {
      setCameraReadyDeadlineError('El deadline de camera-ready no puede ser posterior a la fecha de fin de la conferencia.');
      return;
    }
    if (!periods.camera_ready_deadline) {
      toast.warning('Los autores no podrán subir camera-ready sin un deadline configurado.');
    }

    if (
      periods.submission_start &&
      periods.submission_end &&
      periods.submission_end < periods.submission_start
    ) {
      toast.error('El cierre de envío no puede ser anterior al inicio.');
      return;
    }
    if (
      periods.review_start &&
      periods.review_end &&
      periods.review_end < periods.review_start
    ) {
      toast.error('El cierre de revisión no puede ser anterior al inicio.');
      return;
    }
    if (
      periods.bidding_start &&
      periods.bidding_end &&
      periods.bidding_end < periods.bidding_start
    ) {
      toast.error('El cierre de bidding no puede ser anterior al inicio.');
      return;
    }

    setSaving(true);
    try {
      await updateConferencePeriods(conference.id, periods, String(user.id));
      toast.success('Configuración guardada.');
      goToSessions(String(conference.id));
    } catch (err: unknown) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const data = isAxiosError(err) ? err.response?.data : undefined;
      if (status === 400) {
        const fieldError = data?.camera_ready_deadline;
        if (fieldError) {
          setCameraReadyDeadlineError(Array.isArray(fieldError) ? fieldError[0] : String(fieldError));
        } else {
          toast.error(data?.detail || 'No se pudo guardar la configuración.');
        }
      } else if (status === 403) {
        toast.error('Solo los chairs pueden configurar las fechas de esta conferencia.');
      } else if (status === 404) {
        toast.error('Conferencia no encontrada.');
      } else {
        toast.error('No se pudo guardar la configuración.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="mx-auto max-w-2xl p-6">Cargando...</p>;

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración de fechas</h1>
        <p className="text-sm text-gray-500">Configurá las ventanas de la conferencia.</p>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-gray-300 p-5">
        <legend className="px-1 font-semibold">Ventana de envío de artículos</legend>
        <label className="flex flex-col gap-1">
          Inicio
          <CustomCalendar date={submissionStart} setDate={setSubmissionStart} />
        </label>
        <label className="flex flex-col gap-1">
          Cierre
          <CustomCalendar date={submissionEnd} setDate={setSubmissionEnd} />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-gray-300 p-5">
        <legend className="px-1 font-semibold">Ventana de bidding</legend>
        <label className="flex flex-col gap-1">
          Inicio
          <CustomCalendar date={biddingStart} setDate={setBiddingStart} />
        </label>
        <label className="flex flex-col gap-1">
          Cierre
          <CustomCalendar date={biddingEnd} setDate={setBiddingEnd} />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-gray-300 p-5">
        <legend className="px-1 font-semibold">Ventana de revisión</legend>
        <label className="flex flex-col gap-1">
          Inicio
          <CustomCalendar date={reviewStart} setDate={setReviewStart} />
        </label>
        <label className="flex flex-col gap-1">
          Cierre
          <CustomCalendar date={reviewEnd} setDate={setReviewEnd} />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-xl border border-gray-300 p-5">
        <legend className="px-1 font-semibold">Deadline de camera-ready</legend>
        <label className="flex flex-col gap-1">
          Fecha límite
          <CustomCalendar
            date={cameraReadyDeadline}
            setDate={(value) => {
              setCameraReadyDeadlineError(null);
              setCameraReadyDeadline(value);
            }}
          />
        </label>
        {cameraReadyDeadlineError && (
          <p className="text-sm text-red-600">{cameraReadyDeadlineError}</p>
        )}
        {!cameraReadyDeadline && !cameraReadyDeadlineError && (
          <p className="text-sm text-amber-600">
            Los autores no podrán subir camera-ready sin esta fecha configurada.
          </p>
        )}
      </fieldset>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!conference?.id) {
              navigate({ to: '/chairs/select-session' });
              return;
            }
            goToSessions(String(conference.id));
          }}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}
