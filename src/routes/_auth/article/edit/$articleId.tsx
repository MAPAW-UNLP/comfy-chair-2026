// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para la edición de un articulo existente
//
// Funcionalidades principales:
//
// - Recuperar el artículo actual (según el parámetro "articleId" de la URL).
// - Obtener la lista completa de conferencias activas.
// - Obtener la lista completa de usuarios registrados.
// - Mostrar un spinner de carga mientras se recuperan los datos necesarios.
// - Mostrar mensajes informativos si:
//     • El artículo no existe.
//     • El artículo ya no puede editarse (ya pasó la deadilne). Los borradores siempre se pueden editar.
//     • El usuario no tiene permiso para editar el articulo (no es autor).
// - Permite navegar hacia la pantalla de visualizacion de artículos de la conferencia actual (al cancelar o editar un articulo).
// - En caso de éxito, renderiza el componente "ArticleForm" y le envía como props 
//   la lista de usuarios, la lista de conferencias activas, el articulo actual y una
//   flag para indicar que el componente se encuentra en modo edicion.
//
// -------------------------------------------------------------------------------------- 

import { useEffect, useState } from 'react';
import { useRouteContext } from '@tanstack/react-router';
import ArticleForm from '@/components/article/ArticleForm';
import Breadcrumb from '@/components/ui/breadcrumb';
import { useFetchUsers } from "@/hooks/Grupo1/useFetchUsers";
import { useFetchArticle } from "@/hooks/Grupo1/useFetchArticle";
import { createFileRoute, useParams } from '@tanstack/react-router'
import { useFetchConferences } from "@/hooks/Grupo1/useFetchConferences";
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_auth/article/edit/$articleId')({
  component: RouteComponent,
})

function RouteComponent() {

  // Usuario Actual
  const { user } = useRouteContext({ from: '/_auth/article/edit/$articleId' });

  // Parametros de entrada (articleId)
  const { articleId } = useParams({ from: '/_auth/article/edit/$articleId' });
  const id = Number(articleId);

  // Hooks 
  const { userList, loadingUsers } = useFetchUsers();
  const { article, loading: loadingArticle } = useFetchArticle(id);
  const { conferenceList, loadingConferences } = useFetchConferences();
  const periodQuery = useSubmissionStatus(article?.session?.id);
  const [enteredArticleId, setEnteredArticleId] = useState<number | null>(null);

  useEffect(() => {
    if (article && periodQuery.isSuccess && periodQuery.data?.submission_open && !periodQuery.isFetching) setEnteredArticleId(article.id);
  }, [article, periodQuery.isSuccess, periodQuery.data, periodQuery.isFetching]);

  // Estado de carga
  const loading = loadingArticle || loadingUsers || loadingConferences;

  // Spinner de carga
  if (loading) {
    return (
      <div className="grid place-items-center w-full min-h-[calc(100dvh-64px)]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mensaje si el articulo no existe
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-64px)]">
        <h1 className="text-2xl font-bold italic text-slate-500 text-center">
          No se encontró el artículo solicitado...
        </h1>
      </div>
    );
  }

  // Los estados editables conservan su regla existente; el período lo decide el backend.
  const isDraft = article.status === "draft";
  if (!isDraft && article.status !== "reception") {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-64px)]">
        <h1 className="text-2xl font-bold italic text-slate-500 text-center">
          No se admite la edicion de este articulo...
        </h1>
      </div>
    );
  }

  // Feature de Seguridad - Mensaje si el usuario no es autor del artículo
  const esAutor = article.authors?.some(a => a.email === user.email);
  if (!esAutor) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-64px)]">
        <h1 className="text-2xl font-bold italic text-slate-500 text-center">
          No tienes permiso para editar este artículo...
        </h1>
      </div>
    );
  }

  if (!article.session) {
    return <p className="p-6 text-center">Este artículo no tiene una sesión válida para editarlo.</p>;
  }

  const entered = enteredArticleId === article.id || Boolean(periodQuery.isSuccess && periodQuery.data?.submission_open && !periodQuery.isFetching);
  if (!entered && periodQuery.isFetching) {
    return <div className="grid place-items-center w-full min-h-[calc(100dvh-64px)]">Comprobando el período de submissions...</div>;
  }
  if (!entered && periodQuery.isError) {
    return <div role="alert" className="p-6 text-center">No se pudo consultar el período de submissions. <Button onClick={() => void periodQuery.refetch()}>Reintentar</Button></div>;
  }
  if (!entered && !periodQuery.data?.submission_open) {
    return <div className="p-6 text-center">El período de submissions de esta conferencia está cerrado. Podés consultar el artículo desde su detalle.</div>;
  }

  //Cuerpo del Componente
  return (
    <div className="mx-4 my-4 flex flex-col items-center gap-4">

      {/* Breadcrumb para la navegación */}
      <div className="flex justify-center w-full">
        <Breadcrumb
          items={[
            { label: 'Inicio', to: '/dashboard' },
            { label: article.session?.conference?.title ?? 'Conferencia', to: `/articles/${article.session?.conference?.id}` },
            { label: isDraft ? 'Editar borrador' : 'Editar submission' },
          ]}
        />
      </div>

      {/* Le envío al form la conferencia actual, el articulo existente y los usuarios de la app */}
      <div className="flex flex-wrap gap-4 justify-center w-full">
        <ArticleForm key={article.id} conferences={conferenceList} users={userList} editMode={true} article={article} userId={Number(user.id)} />
      </div>
    </div>
  );

}
