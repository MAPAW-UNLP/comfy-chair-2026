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
import { getReviewsByArticle } from '@/services/reviewerServices';
import type { ReviewsByArticleId } from '@/services/reviewerServices';
import type { Article, Status, Type } from "@/services/articleServices";
import { downloadMainFile, downloadSourceFile } from "@/services/articleServices";

// Lo que espera recibir el componente
export interface ArticleDetailProps {
  article: Article;
}

// Textos asociados a cada tipo
const tipoTexto: Record<Type, string> = {
  regular: "Regular",
  poster: "Poster",
};

// Textos asociados a cada estado
const estadoTexto: Record<Status, string> = {
  accepted: "Aceptado",
  reception: "Recibido",
  bidding: "Bidding",
  assignment: "Asignación",
  review: "Revisión",
  selection: "Selección",
  rejected: "Rechazado",
};

//Cuerpo del Componente
const ArticleDetail : React.FC<ArticleDetailProps> = ({ article }) => {

  // Hook custom para el manejo de archivos
  const { mainFileName, sourceFileName } = useArticleFiles(article);

  // Estado y carga de reviews
  const [reviews, setReviews] = useState<ReviewsByArticleId>();
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

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

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="flex flex-col items-start gap-4 max-w-5xl w-full">

      {/* Card con los detalles del articulo */}
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full">
        <div className="text-start flex flex-col gap-2">

          {/* Titulo de la card */}
          <h2 className="text-lg font-bold italic text-slate-500 text-center">
            Detalle del Articulo
          </h2>

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

          {/* Botones de Archivos */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            
            {/* Archivo Principal Descargable*/}
            {mainFileName && (
              <div className="flex-1 grid items-start">
                <p><b>Articulo</b></p>
                <Button
                  variant="outline"
                  onClick={() => downloadMainFile(article.id, mainFileName!)}
                  className="w-full text-white bg-slate-900"
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
                  className="w-full text-white bg-slate-900"
                >
                  Descargar Fuentes
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Card de Reviews si el artículo está aceptado o rechazado */}
      {(article.status === "accepted" || article.status === "rejected") && !loadingReviews && reviews && (
        <ReviewBox reviews={reviews} />
      )}

    </div>
  );
};

export default ArticleDetail;