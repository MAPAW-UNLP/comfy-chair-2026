// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para la visualización de un artículo existente en detalle
//
// Funcionalidades principales:
//
// - Recuperar el artículo actual (según el parámetro "articleId" de la URL).
// - Mostrar un spinner de carga mientras se recuperan los datos necesarios.
// - Mostrar mensaje informativo si el articulo no existe.
// - Permite navegar a través de un breadcrumb hasta la conferencia asociada al artículo o al inicio del dashboard.
// - En caso de éxito, renderiza el componente "ArticleDetail" y le envía como prop
//   el articulo actual.
//
// -------------------------------------------------------------------------------------- 

import Breadcrumb from '@/components/ui/Breadcrumb';
import ArticleDetail from '@/components/article/ArticleDetail';
import { useFetchArticle } from "@/hooks/Grupo1/useFetchArticle";
import { createFileRoute, useParams } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/article/detail/$articleId')({
  component: RouteComponent,
})

function RouteComponent() {

  // Parametros de entrada (articleId)
  const { articleId } = useParams({ from: '/_auth/article/detail/$articleId' });
  const id = Number(articleId);

  // Hooks 
  const { article, loading: loadingArticle } = useFetchArticle(id);

  // Estado de carga
  const loading = loadingArticle;

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
  
  // Cuerpo del componente
  return (
    <div className="mx-4 my-4 flex flex-col items-center gap-4">
       
      {/* Breadcrumb para la navegación */}
      <div className="flex justify-center w-full">
        <Breadcrumb
          items={[
            { label: 'Inicio', to: '/dashboard' },
            { label: article?.session?.conference?.title ?? 'Conferencia', to: `/articles/${article?.session?.conference?.id}` },
            { label: article?.title ?? 'Artículo' },
          ]}
        />
      </div>

      {/* Contenido Detallado del Articulo */}
      <div className="flex flex-wrap gap-4 justify-center">
          {/* Le envío al componente el articulo actual */}
          <ArticleDetail article={article} />
      </div>
      
    </div>
  );

}