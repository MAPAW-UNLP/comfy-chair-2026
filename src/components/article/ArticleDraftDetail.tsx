// --------------------------------------------------------------------------------------
//
// Grupo 2 - Detalle de un artículo en borrador: muestra qué campos faltan completar y
// permite subirlo (draft -> reception) si está completo y el deadline no venció.
//
// --------------------------------------------------------------------------------------

// Importaciones
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from '@tanstack/react-query';
import { useArticleFiles } from "@/hooks/Grupo1/useArticleFiles";
import { completenessLabels, getArticleMissingFields, type CompletenessField } from "@/lib/articleDraft";
import { ApiError, downloadMainFile, isSubmissionPeriodClosed, submitArticle, type Article } from "@/services/articleServices";
import { DraftStatusBadge } from "./ArticleDraftBadges";
import { SubmitConfirmDialog } from "./ArticleDraftDialogs";
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus';

// Lo que espera recibir el componente
export interface ArticleDraftDetailProps {
  article: Article;
}

// Muestra el valor de un campo o "Sin completar" en rojo si falta
function DraftField({ label, value, missing }: { label: string; value?: string | null; missing: boolean }) {
  return (
    <p className={missing ? "text-red-600" : undefined}>
      <b>{label}:</b> {missing ? "Sin completar" : value}
    </p>
  );
}

//Cuerpo del Componente
const ArticleDraftDetail : React.FC<ArticleDraftDetailProps> = ({ article }) => {

  // Navegación
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const navigateEditArticle = () => navigate({ to: `/article/edit/${article.id}` });
  const navigateArticleList = () => navigate({ to: `/articles/${article.session?.conference?.id}`, replace: true });

  const { mainFileName } = useArticleFiles(article);
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const missingFields = getArticleMissingFields(article);
  const isMissing = (field: CompletenessField) => missingFields.includes(field);
  const periodQuery = useSubmissionStatus(article.session?.id);
  const periodOpen = Boolean(periodQuery.isSuccess && periodQuery.data?.submission_open && !periodQuery.isFetching);
  const canSubmit = missingFields.length === 0 && periodOpen;

  //------------------------------------------------------------
  // Envío del borrador
  //------------------------------------------------------------
  const handleSubmit = async () => {
    try {
      if (!canSubmit) return;
      const fresh = await periodQuery.refetch();
      if (fresh.isError) {
        toast.error('No se pudo comprobar el período. Revisá tu conexión e intentá de nuevo.');
        return;
      }
      if (!fresh.data?.submission_open) {
        toast.error('El período de submissions de esta conferencia está cerrado.');
        return;
      }
      setSubmitting(true);
      await submitArticle(article.id);
      toast.success("Artículo subido", { description: `"${article.title}" pasó a estado Recibido.`, duration: 5000 });
      navigateArticleList();
    } catch (error) {
      console.error("Error al subir el artículo: ", error);
      if (!(error instanceof ApiError)) {
        toast.error("No se pudo subir el artículo", { description: "Revisá tu conexión e intentá de nuevo." });
      } else if (error.status === 400) {
        // Campos faltantes según lo guardado en el backend.
        const fields = Object.keys(error.errors).filter((key) => key in completenessLabels) as CompletenessField[];
        toast.error("No se pudo subir el artículo", {
          description: fields.length > 0 ? `Falta completar: ${fields.map((f) => completenessLabels[f]).join(", ")}` : error.message,
        });
      } else if (isSubmissionPeriodClosed(error)) {
        void queryClient.invalidateQueries({ queryKey: ['submission-status'] });
        toast.error('El período de submissions está cerrado. El borrador sigue disponible para consulta.');
      } else if (error.status === 403) {
        toast.error("No tenés permiso sobre este artículo");
        navigateArticleList();
      } else if (error.status === 404) {
        toast.error("El artículo no existe");
        navigateArticleList();
      } else if (error.status === 409) {
        toast.error("Este artículo ya fue enviado");
        navigateArticleList();
      } else {
        toast.error("No se pudo subir el artículo", { description: error.message });
      }
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="flex flex-col items-start gap-4 max-w-5xl w-full">

      {/* Card con los detalles del borrador */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full">
        <div className="text-start flex flex-col gap-2">

          {/* Titulo de la card */}
          <h2 className="text-lg font-bold italic text-slate-500 text-center">
            Detalle del Borrador
          </h2>
          <hr className="bg-slate-100" />

          {/* Estado y deadline */}
          <div className="flex flex-row gap-2">
            <DraftStatusBadge />
          </div>
          {periodQuery.isFetching && <p className="text-sm text-muted-foreground">Comprobando el período de submissions...</p>}
          {!article.session && <p className="text-sm text-zinc-600">Este borrador no tiene una sesión válida. Podés consultarlo, pero no editarlo ni subirlo.</p>}
          {periodQuery.isError && <p role="alert" className="text-sm text-destructive">No se pudo consultar el período. <Button variant="link" onClick={() => void periodQuery.refetch()}>Reintentar</Button></p>}
          {periodQuery.isSuccess && !periodQuery.isFetching && !periodQuery.data.submission_open && <p className="text-sm text-zinc-600">El período de submissions está cerrado. Podés consultar el borrador, pero no editarlo ni subirlo.</p>}

          {/* Detalles del Borrador */}
          <DraftField label="Título" value={article.title} missing={isMissing("title")} />
          <p><b>Sesión:</b> {article.session?.title}</p>
          <p><b>Conferencia:</b> {article.session?.conference?.title}</p>
          <DraftField label="Tipo" value={article.type === "poster" ? "Poster" : "Regular"} missing={isMissing("type")} />
          <DraftField label="Autor de Notificación" value={article.corresponding_author?.email} missing={isMissing("corresponding_author_id")} />
          <DraftField label="Autores" value={article.authors?.map((a) => a.email).join(", ")} missing={isMissing("authors_ids")} />
          <DraftField label="Abstract" value={article.abstract} missing={isMissing("abstract")} />

          {/* Archivo principal: si no se subió, se muestra como campo sin completar */}
          {mainFileName ? (
            <div className="flex flex-col gap-1">
              <p><b>Artículo</b></p>
              <Button variant="outline" onClick={() => downloadMainFile(article.id, mainFileName)} className="w-full text-white bg-lime-900 hover:bg-lime-950 truncate">
                {mainFileName}
              </Button>
            </div>
          ) : (
            <DraftField label="Artículo" missing={true} />
          )}

          {/* Lista de lo que falta para poder subir */}
          {missingFields.length > 0 && (
            <div className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-800">
              <p className="font-semibold">Para subir, completá:</p>
              <ul className="list-disc pl-5">
                {missingFields.map((field) => <li key={field}>{completenessLabels[field]}</li>)}
              </ul>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-row gap-2 mt-2">
            {periodOpen && <Button variant="outline" onClick={navigateEditArticle} className="flex-1 bg-slate-900 text-white cursor-pointer">Continuar edición</Button>}
            <Button variant="outline" onClick={() => setShowSubmitDialog(true)} disabled={!canSubmit || submitting} className="flex-1 bg-slate-900 text-white cursor-pointer disabled:bg-zinc-400">
              {submitting ? "Subiendo..." : "Subir"}
            </Button>
          </div>


        </div>
      </div>

      {/* Confirmación de subida */}
      <SubmitConfirmDialog
        open={showSubmitDialog}
        deadlineLabel={undefined}
        loading={submitting}
        onCancel={() => setShowSubmitDialog(false)}
        onConfirm={handleSubmit}
      />
    </div>
  );
};

export default ArticleDraftDetail;
