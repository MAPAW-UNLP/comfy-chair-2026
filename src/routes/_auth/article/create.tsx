// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para el alta de un articulo en una conferencia específica
//
// Funcionalidades principales:
//
// - Obtener la lista completa de conferencias activas.
// - Obtener la lista completa de usuarios registrados.
// - Mostrar un spinner de carga mientras se recuperan los datos necesarios.
// - Renderiza el componente "ArticleForm" y le envía como props la lista de usuarios y 
//   la lista de conferencias activas.
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from 'react';
import { useNavigate, useRouteContext } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import ArticleForm from '@/components/article/ArticleForm';
import Breadcrumb from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ConferenceCombobox } from '@/components/combobox/ConferenceCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFetchUsers } from '@/hooks/Grupo1/useFetchUsers';
import { useConferenceSessions } from '@/hooks/useConferenceSessions';
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus';
import { getAllConferences } from '@/services/conferenceServices';

type SearchParams = {
  conferenceId?: number;
};

export const Route = createFileRoute('/_auth/article/create')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    conferenceId: search.conferenceId && Number.isSafeInteger(Number(search.conferenceId)) && Number(search.conferenceId) > 0 ? Number(search.conferenceId) : undefined,
  }),
})

function RouteComponent() {

  // Usuario Actual
  const { user } = useRouteContext({ from: '/_auth/article/create' });
  const { conferenceId } = Route.useSearch();
  const navigate = useNavigate();
  const [chosenConferenceId, setChosenConferenceId] = useState<number | null>(null);
  const [chosenSessionId, setChosenSessionId] = useState<number | null>(null);
  const [enteredSessionId, setEnteredSessionId] = useState<number | null>(null);
  const activeConferenceId = conferenceId ?? chosenConferenceId;

  const { userList, loadingUsers } = useFetchUsers();
  const conferencesQuery = useQuery({ queryKey: ['conferences', 'article-create'], queryFn: getAllConferences, staleTime: 30_000, retry: false });
  const sessionsQuery = useConferenceSessions(activeConferenceId);
  const sessions = (sessionsQuery.data ?? []).filter((session) => session.conference?.id === activeConferenceId);
  const sessionId = conferenceId ? sessions[0]?.id : sessions.find((session) => session.id === chosenSessionId)?.id;
  const periodQuery = useSubmissionStatus(sessionId);
  const periodOpen = Boolean(sessionsQuery.isSuccess && !sessionsQuery.isFetching && periodQuery.isSuccess && periodQuery.data?.submission_open && !periodQuery.isFetching);
  const showForm = Boolean(sessionId && (periodOpen || enteredSessionId === sessionId));

  useEffect(() => {
    if (!activeConferenceId || !sessionId || !periodQuery.isSuccess || periodQuery.isFetching) return;
    if (periodQuery.data.submission_open) {
      setEnteredSessionId(sessionId);
    } else if (enteredSessionId !== sessionId) {
      toast.error('El período de submissions de esta conferencia está cerrado. No podés crear artículos ahora.');
      navigate({ to: `/articles/${activeConferenceId}`, replace: true });
    }
  }, [activeConferenceId, sessionId, enteredSessionId, periodQuery.isSuccess, periodQuery.isFetching, periodQuery.data, navigate]);

  // Estado de carga
  const loading = loadingUsers || conferencesQuery.isPending;

  // Spinner de carga
  if (loading) {
    return (
      <div className="grid place-items-center w-full min-h-[calc(100dvh-64px)]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Conferencia desde la que se crea el submission (para volver a su listado)
  const conferenceList = conferencesQuery.data ?? [];
  const conference = conferenceList.find((c) => c.id === activeConferenceId);

  //Cuerpo del Componente
  return (
    <div className="mx-4 my-4 flex flex-col items-center gap-4">

      {/* Breadcrumb para la navegación */}
      <div className="flex justify-center w-full">
        <Breadcrumb
          items={[
            { label: 'Inicio', to: '/dashboard' },
            ...(conference ? [{ label: conference.title, to: `/articles/${conference.id}` }] : []),
            { label: 'Nuevo submission' },
          ]}
        />
      </div>

      {conferencesQuery.isError && <div role="alert">No se pudieron cargar las conferencias. <Button onClick={() => void conferencesQuery.refetch()}>Reintentar</Button></div>}
      {!conferenceId && enteredSessionId === null && !conferencesQuery.isError && (
        <div className="w-full max-w-3xl rounded-2xl border bg-white p-4 flex flex-col gap-3">
          <h2 className="font-semibold">Elegí una conferencia y una sesión para comenzar</h2>
          <Label>Conferencia</Label>
          <ConferenceCombobox value={chosenConferenceId} onValueChange={(id) => { setChosenConferenceId(id); setChosenSessionId(null); }} conferences={conferenceList} />
          <Label>Sesión</Label>
          <Select value={chosenSessionId ? String(chosenSessionId) : ''} onValueChange={(value) => setChosenSessionId(Number(value))} disabled={!activeConferenceId || sessionsQuery.isFetching || sessionsQuery.isError}>
            <SelectTrigger><SelectValue placeholder="Seleccioná una sesión" /></SelectTrigger>
            <SelectContent>{sessions.map((session) => <SelectItem key={session.id} value={String(session.id)}>{session.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {activeConferenceId && sessionsQuery.isFetching && <p>Consultando sesiones...</p>}
      {activeConferenceId && sessionsQuery.isError && <div role="alert">No se pudieron cargar las sesiones. <Button onClick={() => void sessionsQuery.refetch()}>Reintentar</Button></div>}
      {activeConferenceId && sessionsQuery.isSuccess && sessions.length === 0 && <p>No hay sesiones disponibles para esta conferencia.</p>}
      {sessionId && periodQuery.isFetching && <p>Comprobando el período de submissions...</p>}
      {sessionId && periodQuery.isError && <div role="alert">No se pudo consultar el período de submissions. <Button onClick={() => void periodQuery.refetch()}>Reintentar</Button></div>}
      {showForm && activeConferenceId && sessionId && (
        <div className="flex flex-wrap gap-4 justify-center w-full">
          <ArticleForm key={`${activeConferenceId}-${sessionId}`} conferences={conferenceList} users={userList} userId={Number(user.id)} fixedConferenceId={conferenceId} initialConferenceId={activeConferenceId} initialSessionId={sessionId} />
        </div>
      )}
    </div>
  );

}
