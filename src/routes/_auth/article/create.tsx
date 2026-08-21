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
import { useFetchUsers } from '@/hooks/Grupo1/useFetchUsers';
import { useFetchConferences } from '@/hooks/Grupo1/useFetchConferences';

export const Route = createFileRoute('/_auth/article/create')({
  component: RouteComponent,
})

function RouteComponent() {

  // Usuario Actual
  const { user } = useRouteContext({ from: '/_auth/article/create' });

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

  //Cuerpo del Componente
  return (
    <div className="flex flex-wrap gap-4 mx-4 my-4 justify-center">
      {/* Le envío al form la lista de conferencias y la lista de usuarios */}
      <ArticleForm conferences={conferenceList} users={userList} userId={Number(user.id)} />
    </div>
  );

}
