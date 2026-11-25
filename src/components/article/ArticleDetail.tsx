// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para mostrar todos los campos completos de un articulo.
//
// -------------------------------------------------------------------------------------- 

// Importaciones
import { Button } from "../ui/button";
import { useEffect, useState } from 'react';
import ReviewBox from "@/components/reviews/ReviewBox";
import { useArticleFiles } from "@/hooks/Grupo1/useArticleFiles";
import { useFetchReviewCounts } from "@/hooks/Grupo1/useFetchReviewCounts";
import { getReviewsByArticle } from '@/services/reviewerServices';
import type { ReviewsByArticleId } from '@/services/reviewerServices';
import type { Article, Status, Type } from "@/services/articleServices";
import { downloadMainFile, downloadSourceFile, downloadFileByUrl } from "@/services/articleServices";
import { Clock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

// Lo que espera recibir el componente
export interface ArticleDetailProps {
  article: Article;
  /** Id del usuario logueado, para saber si puede subir/reemplazar el camera-ready */
  currentUserId?: number;
}

// Textos asociados a cada tipo
const tipoTexto: Record<Type, string> = {
  regular: "Regular",
  poster: "Poster",
};

// Textos asociados a cada estado
const estadoTexto: Record<Status, string> = {
  draft: "Borrador",
  accepted: "Aceptado",
  reception: "Recibido",
  bidding: "Bidding",
  assignment: "Asignación",
  review: "Revisión",
  selection: "Selección",
  rejected: "Rechazado",
};

//Cuerpo del Componente
const ArticleDetail : React.FC<ArticleDetailProps> = ({ article, currentUserId }) => {

  // Hook custom para el manejo de archivos
  const { mainFileName, sourceFileName, cameraReadyName, cameraReadyUrl } = useArticleFiles(article);

  // Estado y carga de reviews
  const [reviews, setReviews] = useState<ReviewsByArticleId>();
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);
  const navigate = useNavigate();

  // Conteo de revisiones: mismo hook que el listado, para que coincida con la card
  const conferenceId = article.session?.conference?.id;
  const { getReviewCount } = useFetchReviewCounts(conferenceId ?? 0, conferenceId !== undefined);
  const reviewCount = getReviewCount(article.id);

  useEffect(() => {
    let mounted = true;
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const data = await getReviewsByArticle(article.id);
        if (mounted) setReviews(data ?? []);
      } catch (e) {
        console.error('Error fetching reviews', e);
      } finally {
        if (mounted) setLoadingReviews(false);
      }
    };

    if (article.status === 'accepted' || article.status === 'rejected') {
      fetchReviews();
    }

    return () => { mounted = false };
  }, [article.id, article.status]);

  const irArticleHistoryPage = () => {
    navigate({ to: `/article/history/${article.id}` });
  }

  const irCameraReadyPage = () => {
    navigate({ to: `/article/camera-ready/${article.id}` });
  }

  // Camera-ready: solo tiene sentido una vez que el artículo fue aceptado.
  // Autor = está en `authors` o es el corresponding_author (igual que el back, ver is_article_author).
  const esAutor =
    article.authors?.some((a) => a.id === currentUserId) ||
    article.corresponding_author?.id === currentUserId;

  const today = new Date().toISOString().slice(0, 10);
  const deadlineVencido = Boolean(article.camera_ready_deadline && article.camera_ready_deadline < today);
  const puedeSubir = esAutor && Boolean(article.camera_ready_deadline) && !deadlineVencido;

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="flex flex-col items-start gap-4 max-w-5xl w-full">

      {/* Card con los detalles del articulo */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full">
        <div className="text-start flex flex-col gap-2">
          <div className="flex justify-between items-center gap-2">
            
            {/* Titulo de la card */}
            <h2 className="text-lg font-bold italic text-slate-500 text-center">
              Detalle del Articulo
            </h2>
            <button
            onClick={irArticleHistoryPage}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
            title="Ver historial del artículo"
          >
            <Clock className="w-4 h-4 cursor-pointer" />
          </button>
          </div>
          <hr className="bg-slate-100" />

          {/* Detalles del Artículo */}
          <p><b>Título:</b> {article?.title}</p>
          <p><b>Tipo:</b> {tipoTexto[article?.type!] ?? "Desconocido"}</p>
          <p><b>Sesión:</b> {article?.session?.title}</p>
          <p><b>Conferencia:</b> {article?.session?.conference?.title}</p>
          <p><b>Estado:</b> {estadoTexto[article?.status!] ?? "Desconocido"}</p>
          <p><b>Autor de Notificación:</b> {article?.corresponding_author?.email}</p>
          <p>
            <b>Autores:</b>{" "}
            {article?.authors?.map((author, index) => (
              <span key={index}>
                {author?.email}
                {index < article.authors.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
          <p><b>Abstract:</b> {article?.abstract}</p>
          <p>
            <b>Revisiones completadas:</b>{" "}
            {reviewCount.status === "loading" && "Cargando…"}
            {reviewCount.status === "error" && "No disponible"}
            {reviewCount.status === "success" && reviewCount.count}
          </p>

          {/* Botones de Archivos */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            
            {/* Archivo Principal Descargable*/}
            {mainFileName && (
              <div className="flex-1 grid items-start">
                <p><b>Articulo</b></p>
                <Button
                  variant="outline"
                  onClick={() => downloadMainFile(article.id, mainFileName!)}
                  className="w-full text-white bg-green-900 hover:cursor-pointer"
                >
                  Descargar Artículo
                </Button>
              </div>
            )}

            {/* Archivo de Fuentes Descargable*/}
            {sourceFileName && (
              <div className="flex-1 grid items-start">
                <p><b>Fuentes</b></p>
                <Button
                  variant="outline"
                  onClick={() => downloadSourceFile(article.id, sourceFileName!)}
                  className="w-full text-white bg-green-900 hover:cursor-pointer"
                >
                  Descargar Fuentes
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Card de Camera-ready: solo para artículos aceptados */}
      {article.status === "accepted" && (
        <div className="bg-white shadow-lg rounded-2xl p-6 w-full">
          <div className="text-start flex flex-col gap-2">
            <h3 className="text-lg font-bold italic text-slate-500 text-center">Camera-ready</h3>
            <hr className="bg-slate-100" />

            <p>
              <b>Archivo inicial:</b>{" "}
              {mainFileName ? (
                <Button
                  variant="link"
                  className="p-0 m-0 h-auto align-baseline leading-none text-sky-600 hover:underline"
                  onClick={() => downloadMainFile(article.id, mainFileName)}
                >
                  {mainFileName}
                </Button>
              ) : (
                "—"
              )}
            </p>
            <p>
              <b>Camera-ready:</b>{" "}
              {cameraReadyName && cameraReadyUrl ? (
                <Button
                  variant="link"
                  className="p-0 m-0 h-auto align-baseline leading-none text-sky-600 hover:underline"
                  onClick={() => downloadFileByUrl(cameraReadyUrl, cameraReadyName)}
                >
                  {cameraReadyName}
                </Button>
              ) : (
                "Sin subir"
              )}
            </p>
            <p><b>Fecha de subida:</b> {article.camera_ready?.uploaded_at ? new Date(article.camera_ready.uploaded_at).toLocaleDateString("es-AR") : "—"}</p>

            {currentUserId !== undefined && !esAutor && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p className="font-semibold">Sin permisos</p>
                <p>Solo los autores del artículo pueden subir el camera-ready.</p>
              </div>
            )}

            {esAutor && !article.camera_ready_deadline && (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <p className="font-semibold">Todavía no hay un deadline configurado</p>
                <p>Los chairs de la conferencia tienen que configurarlo antes de que puedas subir el camera-ready.</p>
              </div>
            )}

            {esAutor && article.camera_ready_deadline && deadlineVencido && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                <p className="font-semibold">El deadline venció</p>
                <p>Ya no se puede subir ni reemplazar el camera-ready.</p>
              </div>
            )}

            {puedeSubir && (
              <Button
                variant="outline"
                onClick={irCameraReadyPage}
                className="w-full text-white bg-slate-900 hover:bg-slate-800 hover:cursor-pointer"
              >
                {cameraReadyName ? "Reemplazar" : "Subir camera-ready"}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Card de Reviews si el artículo está aceptado o rechazado
      No tiene sentido mostrar esto
      {(article.status === "accepted" || article.status === "rejected") && !loadingReviews && reviews && (
        <ReviewBox reviews={reviews} />
      )}
        */}
    </div>
  );
};

export default ArticleDetail;