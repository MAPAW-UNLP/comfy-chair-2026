import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { getSession, type Session } from '@/services/sessionServices';
import { updateConferencePeriods } from '@/services/conferenceServices';
import { Button } from '@/components/ui/button';
import CustomCalendar from '@/components/conference/CustomCalendar';
import { useAuth } from '@/contexts/AuthContext';

type Periods = {
  submission_start: string;
  submission_end: string;
  review_start: string;
  review_end: string;
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
  const [session, setSession] = useState<Session | null>(null);
  const [submissionStart, setSubmissionStart] = useState<Date>();
  const [submissionEnd, setSubmissionEnd] = useState<Date>();
  const [reviewStart, setReviewStart] = useState<Date>();
  const [reviewEnd, setReviewEnd] = useState<Date>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const selectedSession = localStorage.getItem('selectedSession');
    if (!selectedSession) {
      navigate({ to: '/chairs/select-session' });
      return;
    }

    getSession(selectedSession)
      .then((data) => {
        setSession(data);
        const conference = data.conference;
        setSubmissionStart(parseDate(conference?.submission_start));
        setSubmissionEnd(parseDate(conference?.submission_end));
        setReviewStart(parseDate(conference?.review_start));
        setReviewEnd(parseDate(conference?.review_end));
      })
      .catch(() => toast.error('No se pudo cargar la conferencia.'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.conference?.id) return;
    if (!user?.id) {
      toast.error('No se pudo identificar al usuario.');
      return;
    }

    const periods: Periods = {
      submission_start: formatDate(submissionStart),
      submission_end: formatDate(submissionEnd),
      review_start: formatDate(reviewStart),
      review_end: formatDate(reviewEnd),
    };

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

    setSaving(true);
    try {
      await updateConferencePeriods(session.conference.id, periods, String(user.id));
      toast.success('Configuración guardada.');
      navigate({ to: '/chairs/panel-session' });
    } catch {
      toast.error('No se pudo guardar la configuración.');
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

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => navigate({ to: '/chairs/panel-session' })}>Cancelar</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
      </div>
    </form>
  );
}