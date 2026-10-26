// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para la visualización de artículos de una conferencia específica
//
// Funcionalidades principales:
//
// - Recuperar la conferencia actual (según el parámetro "conferenceId" de la URL).
// - Obtener la lista completa de artículos asociados a la conferencia actual.
// - Mostrar un spinner de carga mientras se recuperan los datos necesarios.
// - Mostrar mensajes informativos si:
//     • La conferencia no existe.
//     • No hay artículos disponibles para mostrar.
// - Permite navegar a través de un breadcrumb al inicio del dashboard.
// - En caso de éxito, renderiza cada articulo como un componente "ArticleCard" y le envía
//   como prop a cada uno el articulo actual.
//
// -------------------------------------------------------------------------------------- 

import Breadcrumb from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/button';
import { ClipboardPenLineIcon, PlusIcon } from 'lucide-react';
import { useNavigate, useRouteContext } from '@tanstack/react-router';
import ArticleCard from '@/components/article/ArticleCard';
import ArticleDraftCard from '@/components/article/ArticleDraftCard';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { useFetchConference } from "@/hooks/Grupo1/useFetchConference";
import { useFetchConferenceArticles } from "@/hooks/Grupo1/useFetchConferenceArticles";
import { useFetchReviewCounts } from "@/hooks/Grupo1/useFetchReviewCounts";

export const Route = createFileRoute('/_auth/articles/$conferenceId')({
  component: RouteComponent,
})

function RouteComponent() {

  // Usuario Actual
  const { user } = useRouteContext({ from: '/_auth/articles/$conferenceId' });
  const navigate = useNavigate();

  // Parametros de entrada (conferenceId)
  const { conferenceId } = useParams({ from: '/_auth/articles/$conferenceId' });
  const id = Number(conferenceId);

  //Hooks
  const { conference, loadingConference } = useFetchConference(id);
  const { articles, loadingArticles, setArticles } = useFetchConferenceArticles(id, user.email);

  // Conteo de revisiones: una sola consulta por listado, no bloquea el spinner
  const { getReviewCount } = useFetchReviewCounts(id, !loadingArticles);

  // Estado de carga
  const loading = loadingConference || loadingArticles;

  // Spinner de carga
  if (loading) {
      return (
          <div className="grid place-items-center w-full min-h-[calc(100dvh-64px)]">
              <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  // Mensaje si la conferencia no existe
  if (!conference) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[calc(100dvh-64px)]">
        <h1 className="text-2xl font-bold italic text-slate-500 text-center">
          No se encontró la conferencia solicitada...
        </h1>
      </div>
    );
  }

  //Cuerpo del Componente
  return (
    <div className="mx-4 my-4 flex flex-col items-center gap-4">
      
      {/* Breadcrumb para la navegación */}
      <div className="flex justify-center w-full">
        <Breadcrumb items={[{ label: 'Inicio', to: '/dashboard' }, { label: conference.title }]} />
      </div>
      
      {/* Si no hay articulos muestra un mensaje, si hay entonces mapea cada uno como una card */}
      {articles.length === 0 ? (
        <div className="w-full max-w-md rounded-2xl shadow-md border p-6 bg-white flex flex-col items-center gap-3 text-center">
          <div className="grid place-items-center size-12 rounded-full bg-slate-100">
            <ClipboardPenLineIcon className="size-6 text-slate-700" />
          </div>
          <h1 className="font-bold text-slate-900">Todavía no tenés artículos</h1>
          <p className="text-sm text-slate-500">
            Empezá a cargar uno. Podés guardarlo como borrador, completarlo cuando quieras y subirlo antes del deadline de la sesión.
          </p>
          <Button variant="outline" className="w-full bg-slate-900 text-white" onClick={() => navigate({ to: '/article/create', search: { conferenceId: id } })}>
            <PlusIcon /> Nuevo artículo
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap w-full gap-4 justify-center">
          {/* Le envío a cada card el id del articulo y el objeto articulo correspondiente; los borradores usan su propia card */}
          {articles.map((a) => a.status === "draft" ? (
            <ArticleDraftCard key={a.id} article={a} />
          ) : (
            <ArticleCard key={a.id} article={a} reviewCount={getReviewCount(a.id)} onDeleted={(id) => setArticles((prev) => prev.filter((art) => art.id !== id))}/>
          ))}
        </div>
      )}
    </div>
  );

}