// --------------------------------------------------------------------------------------
//
// Pantalla de subida de camera-ready.
//
// Guardas (mismo patrón que article/edit/$articleId.tsx): solo se muestra si el
// artículo existe y está accepted; si no, se redirige al detalle con un mensaje.
// El chequeo de "es autor" se resuelve dentro de CameraReadyForm (el mockup no
// redirige a un no-autor, le muestra el mismo formulario deshabilitado).
//
// --------------------------------------------------------------------------------------

import { useEffect } from 'react';
import { useRouteContext, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { CameraReadyForm } from '@/components/article/CameraReadyForm';
import Breadcrumb from '@/components/ui/breadcrumb';
import { useFetchArticle } from "@/hooks/Grupo1/useFetchArticle";
import { createFileRoute, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/article/camera-ready/$articleId')({
  component: RouteComponent,
})

function RouteComponent() {

  // Usuario Actual
  const { user } = useRouteContext({ from: '/_auth/article/camera-ready/$articleId' });

  // Parametros de entrada (articleId)
  const { articleId } = useParams({ from: '/_auth/article/camera-ready/$articleId' });
  const id = Number(articleId);

  const navigate = useNavigate();
  const { article, loading } = useFetchArticle(id);

  // Solo los artículos accepted llegan a esta pantalla; el resto se redirige al detalle
  const isAccepted = article?.status === 'accepted';
  const today = new Date().toISOString().slice(0, 10);
  const deadlineVencido = Boolean(article?.camera_ready_deadline && article.camera_ready_deadline < today);
  const dentroDelDeadline = Boolean(article?.camera_ready_deadline) && !deadlineVencido;

  useEffect(() => {
    if (loading) return;
    if (!article) {
      toast.error("El artículo no existe.");
      navigate({ to: '/dashboard', replace: true });
      return;
    }
    if (!isAccepted) {
      toast.error("El artículo no está aceptado.");
      navigate({ to: `/article/detail/${id}`, replace: true });
      return;
    }
    if (!dentroDelDeadline) {
      toast.error(
        article.camera_ready_deadline
          ? "El deadline de camera-ready ya venció."
          : "Todavía no hay un deadline de camera-ready configurado."
      );
      navigate({ to: `/article/detail/${id}`, replace: true });
    }
  }, [loading, article, isAccepted, dentroDelDeadline, id, navigate]);

  // Spinner de carga
  if (loading || !article || !isAccepted || !dentroDelDeadline) {
    return (
      <div className="grid place-items-center w-full min-h-[calc(100dvh-64px)]">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="mx-4 my-4 flex flex-col items-center gap-4">

      {/* Breadcrumb para la navegación */}
      <div className="flex justify-center w-full">
        <Breadcrumb
          items={[
            { label: 'Inicio', to: '/dashboard' },
            { label: article.session?.conference?.title ?? 'Conferencia', to: `/articles/${article.session?.conference?.id}` },
            { label: article.title, to: `/article/detail/${id}` },
            { label: 'Subir camera-ready' },
          ]}
        />
      </div>

      <div className="flex flex-wrap gap-4 justify-center w-full">
        <CameraReadyForm article={article} userId={Number(user.id)} />
      </div>
    </div>
  );
}
