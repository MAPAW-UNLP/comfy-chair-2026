// -------------------------------------------------------------------------------------- 
//
// Grupo 1 - Componente para mostrar las reviews de un artículo
//
// -------------------------------------------------------------------------------------- 

// Importaciones
import React from "react";
import type { ReviewsByArticleId } from "@/services/reviewerServices";

// Lo que espera recibir el componente
interface ReviewBoxProps {
  reviews: ReviewsByArticleId;
}

// Cuerpo del componente
const ReviewBox: React.FC<ReviewBoxProps> = ({ reviews }) => {
  
  const publishedReviews = reviews.reviews?.filter(r => r.is_published) || [];

  if (publishedReviews.length === 0) return null;

  //------------------------------------------------------------
  // Renderizado del componente
  //------------------------------------------------------------
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 w-full mt-2">
      <div className="text-start flex flex-col gap-2">

        <h2 className="text-lg font-bold italic text-slate-500 text-center">
          Reviews 
        </h2>

        <hr className="bg-slate-100" />

        <div className="space-y-2">

          {publishedReviews.map((r, index) => (
            <div key={r.id} className="p-3 border rounded">
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <b className="italic">Review</b> #{index + 1}
                </div>
                <div className="text-sm">
                  <b className="italic">Revisor:</b> {String(r.reviewer)}
                </div>
                <div className="text-sm">
                  <b className="italic">Puntaje:</b> {r.score}
                </div>
              </div>
              <div className="mt-2 text-sm">{r.opinion}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ReviewBox;
