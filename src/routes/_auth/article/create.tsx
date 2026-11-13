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

import { useRouteContext } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import ArticleForm from '@/components/article/ArticleForm';
import Breadcrumb from '@/components/ui/breadcrumb';
import { useFetchUsers } from '@/hooks/Grupo1/useFetchUsers';
import { useFetchConferences } from '@/hooks/Grupo1/useFetchConferences';

type SearchParams = {
  conferenceId?: number;
};

export const Route = createFileRoute('/_auth/article/create')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    conferenceId: search.conferenceId ? Number(search.conferenceId) : undefined,
  }),
})

function RouteComponent() {

  // Usuario Actual
  const { user } = useRouteContext({ from: '/_auth/article/create' });
  const { conferenceId } = Route.useSearch();

  // Hooks
  const { userList, loadingUsers } = useFetchUsers();
  const { conferenceList, loadingConferences } = useFetchConferences();

  // Estado de carga
  const loading = loadingUsers || loadingConferences;

  // Spinner de carga
  if (loading) {
    return (
      <div className="grid place-items-center w-full min-h-[calc(100dvh-64px)]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Conferencia desde la que se crea el submission (para volver a su listado)
  const conference = conferenceList.find((c) => c.id === conferenceId);

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

      {/* Le envío al form la lista de conferencias y la lista de usuarios */}
      <div className="flex flex-wrap gap-4 justify-center w-full">
        <ArticleForm conferences={conferenceList} users={userList} userId={Number(user.id)} fixedConferenceId={conferenceId} />
      </div>
    </div>
  );

}
