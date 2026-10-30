import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Loader2, Settings, Users } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { getConferenceById, type Conference } from '@/services/conferenceServices';
import { getSessionsByConference, type Session } from '@/services/sessionServices';
import { useAuth } from '@/contexts/AuthContext';
import { canManageSessions } from '@/components/conference/sessionPermissions';

export function ChairConferenceSessions() {
  const { conferenceId } = useParams({ strict: false });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conference, setConference] = useState<Conference | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!conferenceId) return;

    Promise.all([
      getConferenceById(Number(conferenceId)),
      getSessionsByConference(Number(conferenceId)),
    ])
      .then(([conferenceData, sessionData]) => {
        setConference(conferenceData);
        setSessions(sessionData);
      })
      .catch(() => setError('No se pudieron cargar las sesiones.'))
      .finally(() => setLoading(false));
  }, [conferenceId]);

  const canConfigurePeriods = canManageSessions(user, conference);

  const selectSession = (sessionId: number) => {
    localStorage.setItem('selectedSession', String(sessionId));
    navigate({ to: '/chairs/panel-session' });
  };

  const openConfiguration = () => {
    if (!conferenceId) return;
    navigate({ to: '/chairs/configuration', search: { conferenceId } });
  };

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50">
      <main className="mx-auto max-w-5xl px-6 py-8 md:px-12">
        <button
          type="button"
          onClick={() => navigate({ to: '/chairs/select-session' })}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a conferencias
        </button>
        <div className="mb-8 flex items-start justify-between gap-4 rounded-2xl bg-slate-900 p-8 text-white">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-300">
              Sesiones de la conferencia
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {conference?.title ?? 'Conferencia'}
            </h1>
            <p className="mt-3 text-slate-300">
              Seleccioná una sesión para abrir su panel de configuración.
            </p>
          </div>
          {canConfigurePeriods && (
            <button
              type="button"
              aria-label="Configurar fechas"
              title="Configurar fechas"
              onClick={openConfiguration}
              className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            >
              <Settings className="h-6 w-6" />
            </button>
          )}
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </p>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No hay sesiones creadas para esta conferencia.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => selectSession(session.id)}
                className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                      Sesión
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {session.title}
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-100 p-3 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                    <Users className="h-5 w-5" />
                  </span>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Deadline: {session.deadline || 'Sin definir'}
                  </span>
                  <span className="font-semibold text-slate-700">
                    Cupo {session.capacity}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
